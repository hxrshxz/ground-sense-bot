package models

import (
	"time"
	"github.com/google/uuid"
)

type User struct {
	ID                uuid.UUID  `json:"id" db:"id"`
	Username          string     `json:"username" db:"username" validate:"required,min=3,max=50"`
	Email             string     `json:"email" db:"email" validate:"required,email"`
	Password          string     `json:"-" db:"password_hash" validate:"required,min=8"`
	FirstName         string     `json:"first_name,omitempty" db:"first_name"`
	LastName          string     `json:"last_name,omitempty" db:"last_name"`
	Phone             string     `json:"phone,omitempty" db:"phone"`
	AvatarURL         string     `json:"avatar_url,omitempty" db:"avatar_url"`
	Role              UserRole   `json:"role" db:"role"`
	Status            UserStatus `json:"status" db:"status"`
	EmailVerified     bool       `json:"email_verified" db:"email_verified"`
	PhoneVerified     bool       `json:"phone_verified" db:"phone_verified"`
	LastLoginAt       *time.Time `json:"last_login_at,omitempty" db:"last_login_at"`
	CreatedAt         time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt         *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

type UserRole string

const (
	RoleAdmin    UserRole = "admin"
	RoleModerator UserRole = "moderator"
	RoleUser     UserRole = "user"
	RoleGuest    UserRole = "guest"
)

type UserStatus string

const (
	StatusActive   UserStatus = "active"
	StatusInactive UserStatus = "inactive"
	StatusSuspended UserStatus = "suspended"
	StatusBanned   UserStatus = "banned"
)

type UserProfile struct {
	User
	PostsCount    int `json:"posts_count"`
	FollowersCount int `json:"followers_count"`
	FollowingCount int `json:"following_count"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type RegisterRequest struct {
	Username  string `json:"username" validate:"required,min=3,max=50"`
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required,min=8"`
	FirstName string `json:"first_name,omitempty"`
	LastName  string `json:"last_name,omitempty"`
	Phone     string `json:"phone,omitempty"`
}

type UpdateProfileRequest struct {
	FirstName string `json:"first_name,omitempty"`
	LastName  string `json:"last_name,omitempty"`
	Phone     string `json:"phone,omitempty"`
	AvatarURL string `json:"avatar_url,omitempty"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=8"`
	ConfirmPassword string `json:"confirm_password" validate:"required,eqfield=NewPassword"`
}

type AuthResponse struct {
	User  UserProfile `json:"user"`
	Token string      `json:"token"`
}

type PasswordResetRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type PasswordResetConfirm struct {
	Token    string `json:"token" validate:"required"`
	Password string `json:"password" validate:"required,min=8"`
}
