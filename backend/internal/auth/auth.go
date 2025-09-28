package auth

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/config"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserNotFound      = errors.New("user not found")
	ErrUserExists        = errors.New("user already exists")
	ErrInvalidToken      = errors.New("invalid token")
	ErrTokenExpired      = errors.New("token expired")
	ErrInvalidPassword   = errors.New("invalid password")
)

type Service struct {
	db     *sql.DB
	config *config.Config
}

type JWTClaims struct {
	UserID   uuid.UUID `json:"user_id"`
	Username string    `json:"username"`
	Email    string    `json:"email"`
	Role     string    `json:"role"`
	jwt.RegisteredClaims
}

type RefreshToken struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
	Revoked   bool      `json:"revoked"`
}

func NewService(db *sql.DB, cfg *config.Config) *Service {
	return &Service{
		db:     db,
		config: cfg,
	}
}

func (s *Service) Register(ctx context.Context, req models.RegisterRequest) (*models.AuthResponse, error) {
	// Check if user already exists
	var existingID uuid.UUID
	err := s.db.QueryRowContext(ctx, "SELECT id FROM users WHERE email = $1 OR username = $2",
		req.Email, req.Username).Scan(&existingID)
	if err == nil {
		return nil, ErrUserExists
	} else if err != sql.ErrNoRows {
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Hash password
	hashedPassword, err := s.hashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("password hashing error: %w", err)
	}

	// Create user
	userID := uuid.New()
	now := time.Now()

	user := &models.User{
		ID:            userID,
		Username:      req.Username,
		Email:         req.Email,
		Password:      hashedPassword,
		FirstName:     req.FirstName,
		LastName:      req.LastName,
		Phone:         req.Phone,
		Role:          models.RoleUser,
		Status:        models.StatusActive,
		EmailVerified: false,
		PhoneVerified: false,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	// Insert user
	_, err = s.db.ExecContext(ctx, `
		INSERT INTO users (id, username, email, password_hash, first_name, last_name, phone,
		                  role, status, email_verified, phone_verified, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
		user.ID, user.Username, user.Email, user.Password, user.FirstName, user.LastName, user.Phone,
		user.Role, user.Status, user.EmailVerified, user.PhoneVerified, user.CreatedAt, user.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("user creation error: %w", err)
	}

	// Generate tokens
	accessToken, refreshToken, err := s.generateTokens(user)
	if err != nil {
		return nil, fmt.Errorf("token generation error: %w", err)
	}

	// Store refresh token
	if err := s.storeRefreshToken(ctx, user.ID, refreshToken); err != nil {
		return nil, fmt.Errorf("refresh token storage error: %w", err)
	}

	userProfile := models.UserProfile{
		User:           *user,
		PostsCount:     0,
		FollowersCount: 0,
		FollowingCount: 0,
	}

	return &models.AuthResponse{
		User:  userProfile,
		Token: accessToken,
	}, nil
}

func (s *Service) Login(ctx context.Context, req models.LoginRequest) (*models.AuthResponse, error) {
	// Get user by email
	var user models.User
	var passwordHash string
	err := s.db.QueryRowContext(ctx, `
		SELECT id, username, email, password_hash, first_name, last_name, phone, role, status,
		       email_verified, phone_verified, last_login_at, created_at, updated_at
		FROM users WHERE email = $1 AND deleted_at IS NULL`, req.Email).Scan(
		&user.ID, &user.Username, &user.Email, &passwordHash, &user.FirstName, &user.LastName,
		&user.Phone, &user.Role, &user.Status, &user.EmailVerified, &user.PhoneVerified,
		&user.LastLoginAt, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrInvalidCredentials
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Check password
	if !s.checkPassword(req.Password, passwordHash) {
		return nil, ErrInvalidCredentials
	}

	// Check if user is active
	if user.Status != models.StatusActive {
		return nil, errors.New("account is not active")
	}

	// Update last login
	now := time.Now()
	_, err = s.db.ExecContext(ctx, "UPDATE users SET last_login_at = $1, updated_at = $2 WHERE id = $3",
		now, now, user.ID)
	if err != nil {
		return nil, fmt.Errorf("last login update error: %w", err)
	}

	user.LastLoginAt = &now
	user.UpdatedAt = now

	// Generate tokens
	accessToken, refreshToken, err := s.generateTokens(&user)
	if err != nil {
		return nil, fmt.Errorf("token generation error: %w", err)
	}

	// Store refresh token
	if err := s.storeRefreshToken(ctx, user.ID, refreshToken); err != nil {
		return nil, fmt.Errorf("refresh token storage error: %w", err)
	}

	userProfile := models.UserProfile{
		User:           user,
		PostsCount:     0, // TODO: Get actual counts
		FollowersCount: 0,
		FollowingCount: 0,
	}

	return &models.AuthResponse{
		User:  userProfile,
		Token: accessToken,
	}, nil
}

func (s *Service) RefreshToken(ctx context.Context, refreshTokenStr string) (*models.AuthResponse, error) {
	// Verify refresh token
	token, err := s.verifyRefreshToken(ctx, refreshTokenStr)
	if err != nil {
		return nil, err
	}

	// Get user
	var user models.User
	err = s.db.QueryRowContext(ctx, `
		SELECT id, username, email, first_name, last_name, phone, role, status
		FROM users WHERE id = $1 AND deleted_at IS NULL`, token.UserID).Scan(
		&user.ID, &user.Username, &user.Email, &user.FirstName, &user.LastName,
		&user.Phone, &user.Role, &user.Status)
	if err != nil {
		return nil, fmt.Errorf("user lookup error: %w", err)
	}

	// Generate new tokens
	accessToken, newRefreshToken, err := s.generateTokens(&user)
	if err != nil {
		return nil, fmt.Errorf("token generation error: %w", err)
	}

	// Revoke old refresh token
	if err := s.revokeRefreshToken(ctx, refreshTokenStr); err != nil {
		return nil, fmt.Errorf("token revocation error: %w", err)
	}

	// Store new refresh token
	if err := s.storeRefreshToken(ctx, user.ID, newRefreshToken); err != nil {
		return nil, fmt.Errorf("refresh token storage error: %w", err)
	}

	userProfile := models.UserProfile{
		User:           user,
		PostsCount:     0,
		FollowersCount: 0,
		FollowingCount: 0,
	}

	return &models.AuthResponse{
		User:  userProfile,
		Token: accessToken,
	}, nil
}

func (s *Service) ValidateToken(tokenStr string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.config.JWT.Secret), nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrTokenExpired
		}
		return nil, ErrInvalidToken
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, ErrInvalidToken
}

func (s *Service) Logout(ctx context.Context, refreshTokenStr string) error {
	return s.revokeRefreshToken(ctx, refreshTokenStr)
}

func (s *Service) hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func (s *Service) checkPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func (s *Service) generateTokens(user *models.User) (accessToken, refreshToken string, err error) {
	// Generate access token
	accessClaims := JWTClaims{
		UserID:   user.ID,
		Username: user.Username,
		Email:    user.Email,
		Role:     string(user.Role),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.config.JWT.ExpiryHour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "ground-sense-bot",
			Subject:   user.ID.String(),
		},
	}

	accessToken, err = jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString([]byte(s.config.JWT.Secret))
	if err != nil {
		return "", "", err
	}

	// Generate refresh token
	refreshTokenBytes := make([]byte, 32)
	if _, err := rand.Read(refreshTokenBytes); err != nil {
		return "", "", err
	}
	refreshToken = hex.EncodeToString(refreshTokenBytes)

	return accessToken, refreshToken, nil
}

func (s *Service) storeRefreshToken(ctx context.Context, userID uuid.UUID, token string) error {
	tokenID := uuid.New()
	expiresAt := time.Now().Add(7 * 24 * time.Hour) // 7 days

	_, err := s.db.ExecContext(ctx, `
		INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5)`,
		tokenID, userID, token, expiresAt, time.Now())
	return err
}

func (s *Service) verifyRefreshToken(ctx context.Context, token string) (*RefreshToken, error) {
	var rt RefreshToken
	err := s.db.QueryRowContext(ctx, `
		SELECT id, user_id, token, expires_at, created_at, revoked
		FROM refresh_tokens WHERE token = $1`, token).Scan(
		&rt.ID, &rt.UserID, &rt.Token, &rt.ExpiresAt, &rt.CreatedAt, &rt.Revoked)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrInvalidToken
		}
		return nil, err
	}

	if rt.Revoked || time.Now().After(rt.ExpiresAt) {
		return nil, ErrInvalidToken
	}

	return &rt, nil
}

func (s *Service) revokeRefreshToken(ctx context.Context, token string) error {
	_, err := s.db.ExecContext(ctx, "UPDATE refresh_tokens SET revoked = true WHERE token = $1", token)
	return err
}

func (s *Service) ChangePassword(ctx context.Context, userID uuid.UUID, req models.ChangePasswordRequest) error {
	// Get current password hash
	var currentHash string
	err := s.db.QueryRowContext(ctx, "SELECT password_hash FROM users WHERE id = $1", userID).Scan(&currentHash)
	if err != nil {
		return fmt.Errorf("user lookup error: %w", err)
	}

	// Verify current password
	if !s.checkPassword(req.CurrentPassword, currentHash) {
		return ErrInvalidPassword
	}

	// Hash new password
	newHash, err := s.hashPassword(req.NewPassword)
	if err != nil {
		return fmt.Errorf("password hashing error: %w", err)
	}

	// Update password
	_, err = s.db.ExecContext(ctx, "UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3",
		newHash, time.Now(), userID)
	return err
}

func (s *Service) RequestPasswordReset(ctx context.Context, email string) error {
	// Generate reset token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return err
	}
	token := hex.EncodeToString(tokenBytes)
	expiresAt := time.Now().Add(1 * time.Hour)

	// Store reset token
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO password_reset_tokens (email, token, expires_at, created_at)
		VALUES ($1, $2, $3, $4)`, email, token, expiresAt, time.Now())
	if err != nil {
		return err
	}

	// TODO: Send email with reset link
	// For now, just log the token
	fmt.Printf("Password reset token for %s: %s\n", email, token)
	return nil
}

func (s *Service) ResetPassword(ctx context.Context, req models.PasswordResetConfirm) error {
	// Verify token
	var email string
	var expiresAt time.Time
	err := s.db.QueryRowContext(ctx, `
		SELECT email, expires_at FROM password_reset_tokens
		WHERE token = $1 AND used = false`, req.Token).Scan(&email, &expiresAt)
	if err != nil {
		return ErrInvalidToken
	}

	if time.Now().After(expiresAt) {
		return ErrTokenExpired
	}

	// Hash new password
	hash, err := s.hashPassword(req.Password)
	if err != nil {
		return err
	}

	// Update password
	_, err = s.db.ExecContext(ctx, "UPDATE users SET password_hash = $1, updated_at = $2 WHERE email = $3",
		hash, time.Now(), email)
	if err != nil {
		return err
	}

	// Mark token as used
	_, err = s.db.ExecContext(ctx, "UPDATE password_reset_tokens SET used = true WHERE token = $1", req.Token)
	return err
}
