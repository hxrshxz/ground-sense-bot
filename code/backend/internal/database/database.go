package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/hxrshxz/ground-sense-bot/backend/internal/config"
	_ "github.com/lib/pq"
	"github.com/sirupsen/logrus"
)

type Service struct {
	DB     *sql.DB
	config *config.Config
	logger *logrus.Logger
}

func NewService(cfg *config.Config, logger *logrus.Logger) (*Service, error) {
	db, err := sql.Open("postgres", buildConnectionString(cfg.Database))
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	logger.Info("Database connection established successfully")

	service := &Service{
		DB:     db,
		config: cfg,
		logger: logger,
	}

	// Run migrations
	if err := service.runMigrations(ctx); err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	return service, nil
}

func (s *Service) Close() error {
	return s.DB.Close()
}

func (s *Service) HealthCheck(ctx context.Context) error {
	return s.DB.PingContext(ctx)
}

func buildConnectionString(dbConfig config.DatabaseConfig) string {
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		dbConfig.Host,
		dbConfig.Port,
		dbConfig.User,
		dbConfig.Password,
		dbConfig.DBName,
		dbConfig.SSLMode,
	)
}

func (s *Service) runMigrations(ctx context.Context) error {
	migrations := []string{
		// Users table
		`CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY,
			username VARCHAR(50) UNIQUE NOT NULL,
			email VARCHAR(255) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			first_name VARCHAR(100),
			last_name VARCHAR(100),
			phone VARCHAR(20),
			avatar_url TEXT,
			role VARCHAR(20) NOT NULL DEFAULT 'user',
			status VARCHAR(20) NOT NULL DEFAULT 'active',
			email_verified BOOLEAN NOT NULL DEFAULT FALSE,
			phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
			last_login_at TIMESTAMP,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			deleted_at TIMESTAMP
		)`,

		// Refresh tokens table
		`CREATE TABLE IF NOT EXISTS refresh_tokens (
			id UUID PRIMARY KEY,
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			token VARCHAR(255) UNIQUE NOT NULL,
			expires_at TIMESTAMP NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			revoked BOOLEAN NOT NULL DEFAULT FALSE
		)`,

		// Password reset tokens table
		`CREATE TABLE IF NOT EXISTS password_reset_tokens (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			email VARCHAR(255) NOT NULL,
			token VARCHAR(255) UNIQUE NOT NULL,
			expires_at TIMESTAMP NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			used BOOLEAN NOT NULL DEFAULT FALSE
		)`,

		// Conversations table
		`CREATE TABLE IF NOT EXISTS conversations (
			id UUID PRIMARY KEY,
			type VARCHAR(20) NOT NULL DEFAULT 'direct',
			name VARCHAR(255),
			description TEXT,
			avatar_url TEXT,
			created_by UUID NOT NULL REFERENCES users(id),
			is_group BOOLEAN NOT NULL DEFAULT FALSE,
			last_activity_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,

		// Conversation participants table
		`CREATE TABLE IF NOT EXISTS conversation_participants (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			role VARCHAR(20) NOT NULL DEFAULT 'member',
			joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			last_read_at TIMESTAMP,
			is_muted BOOLEAN NOT NULL DEFAULT FALSE,
			UNIQUE(conversation_id, user_id)
		)`,

		// Messages table
		`CREATE TABLE IF NOT EXISTS messages (
			id UUID PRIMARY KEY,
			conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
			sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			content TEXT NOT NULL,
			message_type VARCHAR(20) NOT NULL DEFAULT 'text',
			status VARCHAR(20) NOT NULL DEFAULT 'sent',
			reply_to_id UUID REFERENCES messages(id),
			metadata JSONB,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			deleted_at TIMESTAMP
		)`,

		// Message attachments table
		`CREATE TABLE IF NOT EXISTS message_attachments (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
			file_name VARCHAR(255) NOT NULL,
			file_size BIGINT NOT NULL,
			mime_type VARCHAR(100) NOT NULL,
			url TEXT NOT NULL,
			thumbnail_url TEXT,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,

		// Message reactions table
		`CREATE TABLE IF NOT EXISTS message_reactions (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			emoji VARCHAR(10) NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(message_id, user_id, emoji)
		)`,

		// User sessions table
		`CREATE TABLE IF NOT EXISTS user_sessions (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			session_token VARCHAR(255) UNIQUE NOT NULL,
			ip_address INET,
			user_agent TEXT,
			expires_at TIMESTAMP NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			last_activity_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,

		// API keys table
		`CREATE TABLE IF NOT EXISTS api_keys (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			name VARCHAR(100) NOT NULL,
			key_hash VARCHAR(255) UNIQUE NOT NULL,
			permissions JSONB NOT NULL DEFAULT '[]',
			last_used_at TIMESTAMP,
			expires_at TIMESTAMP,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			revoked BOOLEAN NOT NULL DEFAULT FALSE
		)`,

		// Audit log table
		`CREATE TABLE IF NOT EXISTS audit_logs (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID REFERENCES users(id),
			action VARCHAR(100) NOT NULL,
			resource_type VARCHAR(50) NOT NULL,
			resource_id UUID,
			old_values JSONB,
			new_values JSONB,
			ip_address INET,
			user_agent TEXT,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`,
	}

	for i, migration := range migrations {
		if _, err := s.DB.ExecContext(ctx, migration); err != nil {
			return fmt.Errorf("failed to run migration %d: %w", i+1, err)
		}
	}

	// Create indexes
	indexes := []string{
		`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
		`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
		`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token)`,
		`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token)`,
		`CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by)`,
		`CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id)`,
		`CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)`,
		`CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)`,
		`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)`,
		`CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id)`,
		`CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id)`,
		`CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token)`,
		`CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash)`,
		`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)`,
	}

	for i, index := range indexes {
		if _, err := s.DB.ExecContext(ctx, index); err != nil {
			s.logger.Warnf("Failed to create index %d: %v", i+1, err)
		}
	}

	s.logger.Info("Database migrations completed successfully")
	return nil
}

// Transaction helper
func (s *Service) WithTransaction(ctx context.Context, fn func(*sql.Tx) error) error {
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p)
		}
	}()

	if err := fn(tx); err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit()
}

// Query helpers
func (s *Service) GetUserByID(ctx context.Context, userID string) (*User, error) {
	var user User
	query := `
		SELECT id, username, email, first_name, last_name, phone, avatar_url,
		       role, status, email_verified, phone_verified, last_login_at,
		       created_at, updated_at
		FROM users WHERE id = $1 AND deleted_at IS NULL`

	err := s.DB.QueryRowContext(ctx, query, userID).Scan(
		&user.ID, &user.Username, &user.Email, &user.FirstName, &user.LastName,
		&user.Phone, &user.AvatarURL, &user.Role, &user.Status, &user.EmailVerified,
		&user.PhoneVerified, &user.LastLoginAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (s *Service) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	var user User
	query := `
		SELECT id, username, email, first_name, last_name, phone, avatar_url,
		       role, status, email_verified, phone_verified, last_login_at,
		       created_at, updated_at
		FROM users WHERE email = $1 AND deleted_at IS NULL`

	err := s.DB.QueryRowContext(ctx, query, email).Scan(
		&user.ID, &user.Username, &user.Email, &user.FirstName, &user.LastName,
		&user.Phone, &user.AvatarURL, &user.Role, &user.Status, &user.EmailVerified,
		&user.PhoneVerified, &user.LastLoginAt, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

// User represents the user model for database operations
type User struct {
	ID             string    `db:"id"`
	Username       string    `db:"username"`
	Email          string    `db:"email"`
	PasswordHash   string    `db:"password_hash"`
	FirstName      *string   `db:"first_name"`
	LastName       *string   `db:"last_name"`
	Phone          *string   `db:"phone"`
	AvatarURL      *string   `db:"avatar_url"`
	Role           string    `db:"role"`
	Status         string    `db:"status"`
	EmailVerified  bool      `db:"email_verified"`
	PhoneVerified  bool      `db:"phone_verified"`
	LastLoginAt    *time.Time `db:"last_login_at"`
	CreatedAt      time.Time `db:"created_at"`
	UpdatedAt      time.Time `db:"updated_at"`
}
