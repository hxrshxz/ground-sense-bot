package config

import (
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
	Redis    RedisConfig
	Email    EmailConfig
	Storage  StorageConfig
	RateLimit RateLimitConfig
}

type ServerConfig struct {
	Host         string
	Port         string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	IdleTimeout  time.Duration
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

type JWTConfig struct {
	Secret     string
	ExpiryHour time.Duration
}

type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

type EmailConfig struct {
	SMTPHost     string
	SMTPPort     int
	Username     string
	Password     string
	FromEmail    string
	FromName     string
}

type StorageConfig struct {
	Endpoint        string
	AccessKeyID     string
	SecretAccessKey string
	UseSSL          bool
	BucketName      string
}

type RateLimitConfig struct {
	RequestsPerHour int
	BurstSize       int
}

func Load() *Config {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	return &Config{
		Server: ServerConfig{
			Host:         getEnv("SERVER_HOST", "localhost"),
			Port:         getEnv("SERVER_PORT", "8080"),
			ReadTimeout:  getEnvAsDuration("SERVER_READ_TIMEOUT", 15*time.Second),
			WriteTimeout: getEnvAsDuration("SERVER_WRITE_TIMEOUT", 15*time.Second),
			IdleTimeout:  getEnvAsDuration("SERVER_IDLE_TIMEOUT", 60*time.Second),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", ""),
			DBName:   getEnv("DB_NAME", "ground_sense_bot"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		JWT: JWTConfig{
			Secret:     getEnv("JWT_SECRET", "your-secret-key"),
			ExpiryHour: getEnvAsDuration("JWT_EXPIRY_HOUR", 24*time.Hour),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnv("REDIS_PORT", "6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvAsInt("REDIS_DB", 0),
		},
		Email: EmailConfig{
			SMTPHost:  getEnv("SMTP_HOST", "smtp.gmail.com"),
			SMTPPort:  getEnvAsInt("SMTP_PORT", 587),
			Username:  getEnv("SMTP_USERNAME", ""),
			Password:  getEnv("SMTP_PASSWORD", ""),
			FromEmail: getEnv("FROM_EMAIL", ""),
			FromName:  getEnv("FROM_NAME", "Ground Sense Bot"),
		},
		Storage: StorageConfig{
			Endpoint:        getEnv("STORAGE_ENDPOINT", "localhost:9000"),
			AccessKeyID:     getEnv("STORAGE_ACCESS_KEY", ""),
			SecretAccessKey: getEnv("STORAGE_SECRET_KEY", ""),
			UseSSL:          getEnvAsBool("STORAGE_USE_SSL", false),
			BucketName:      getEnv("STORAGE_BUCKET", "ground-sense-uploads"),
		},
		RateLimit: RateLimitConfig{
			RequestsPerHour: getEnvAsInt("RATE_LIMIT_REQUESTS", 1000),
			BurstSize:       getEnvAsInt("RATE_LIMIT_BURST", 100),
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}

func getEnvAsDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}
