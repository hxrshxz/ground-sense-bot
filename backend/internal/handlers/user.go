package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/gorilla/mux"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/database"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/middleware"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/models"
	"github.com/sirupsen/logrus"
)

type UserHandler struct {
	db       *database.Service
	logger   *logrus.Logger
	validate *validator.Validate
}

func NewUserHandler(db *database.Service, logger *logrus.Logger) *UserHandler {
	return &UserHandler{
		db:       db,
		logger:   logger,
		validate: validator.New(),
	}
}

func (h *UserHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	user, err := h.db.GetUserByID(r.Context(), claims.UserID.String())
	if err != nil {
		h.logger.WithError(err).Error("Failed to get user profile")
		h.respondWithError(w, http.StatusInternalServerError, "Failed to get profile")
		return
	}

	// Convert to UserProfile
	profile := models.UserProfile{
		User: models.User{
			ID:            user.ID,
			Username:      user.Username,
			Email:         user.Email,
			FirstName:     user.FirstName,
			LastName:      user.LastName,
			Phone:         user.Phone,
			AvatarURL:     user.AvatarURL,
			Role:          models.UserRole(user.Role),
			Status:        models.UserStatus(user.Status),
			EmailVerified: user.EmailVerified,
			PhoneVerified: user.PhoneVerified,
			LastLoginAt:   user.LastLoginAt,
			CreatedAt:     user.CreatedAt,
			UpdatedAt:     user.UpdatedAt,
		},
		PostsCount:     0, // TODO: Get actual counts
		FollowersCount: 0,
		FollowingCount: 0,
	}

	h.respondWithJSON(w, http.StatusOK, profile)
}

func (h *UserHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req models.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		h.respondWithValidationError(w, err)
		return
	}

	// Update user profile
	query := `
		UPDATE users
		SET first_name = COALESCE($1, first_name),
		    last_name = COALESCE($2, last_name),
		    phone = COALESCE($3, phone),
		    avatar_url = COALESCE($4, avatar_url),
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $5 AND deleted_at IS NULL`

	_, err := h.db.DB.ExecContext(r.Context(), query,
		req.FirstName, req.LastName, req.Phone, req.AvatarURL, claims.UserID)
	if err != nil {
		h.logger.WithError(err).Error("Failed to update profile")
		h.respondWithError(w, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	h.respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Profile updated successfully",
	})
}

func (h *UserHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req models.ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		h.respondWithValidationError(w, err)
		return
	}

	// Get auth service (this would need to be injected)
	// For now, we'll implement a simple password change
	h.respondWithError(w, http.StatusNotImplemented, "Password change not implemented")
}

func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["id"]

	if userID == "" {
		h.respondWithError(w, http.StatusBadRequest, "User ID is required")
		return
	}

	user, err := h.db.GetUserByID(r.Context(), userID)
	if err != nil {
		h.logger.WithError(err).WithField("user_id", userID).Error("Failed to get user")
		h.respondWithError(w, http.StatusNotFound, "User not found")
		return
	}

	// Return limited user info for public profile
	publicUser := map[string]interface{}{
		"id":         user.ID,
		"username":   user.Username,
		"first_name": user.FirstName,
		"last_name":  user.LastName,
		"avatar_url": user.AvatarURL,
		"created_at": user.CreatedAt,
	}

	h.respondWithJSON(w, http.StatusOK, publicUser)
}

func (h *UserHandler) respondWithJSON(w http.ResponseWriter, status int, payload interface{}) {
	response := map[string]interface{}{
		"success": true,
		"data":    payload,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(response)
}

func (h *UserHandler) respondWithError(w http.ResponseWriter, status int, message string) {
	response := map[string]interface{}{
		"success": false,
		"error":   message,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(response)
}

func (h *UserHandler) respondWithValidationError(w http.ResponseWriter, err error) {
	errors := make(map[string]string)

	for _, err := range err.(validator.ValidationErrors) {
		field := strings.ToLower(err.Field())
		switch err.Tag() {
		case "required":
			errors[field] = field + " is required"
		case "email":
			errors[field] = "invalid email format"
		case "min":
			errors[field] = field + " must be at least " + err.Param() + " characters"
		case "max":
			errors[field] = field + " must be at most " + err.Param() + " characters"
		default:
			errors[field] = "invalid " + field
		}
	}

	response := map[string]interface{}{
		"success": false,
		"error":   "Validation failed",
		"details": errors,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)
	json.NewEncoder(w).Encode(response)
}
