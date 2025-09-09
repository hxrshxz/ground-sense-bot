package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/auth"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/middleware"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/models"
	"github.com/sirupsen/logrus"
)

type AuthHandler struct {
	authService *auth.Service
	logger      *logrus.Logger
	validate    *validator.Validate
}

func NewAuthHandler(authService *auth.Service, logger *logrus.Logger) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		logger:      logger,
		validate:    validator.New(),
	}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		h.respondWithValidationError(w, err)
		return
	}

	response, err := h.authService.Register(r.Context(), req)
	if err != nil {
		h.logger.WithError(err).Error("Registration failed")
		h.respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	h.logger.WithField("user_id", response.User.ID).Info("User registered successfully")
	h.respondWithJSON(w, http.StatusCreated, response)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		h.respondWithValidationError(w, err)
		return
	}

	response, err := h.authService.Login(r.Context(), req)
	if err != nil {
		h.logger.WithError(err).WithField("email", req.Email).Warn("Login failed")
		h.respondWithError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	h.logger.WithField("user_id", response.User.ID).Info("User logged in successfully")
	h.respondWithJSON(w, http.StatusOK, response)
}

func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	response, err := h.authService.RefreshToken(r.Context(), req.RefreshToken)
	if err != nil {
		h.logger.WithError(err).Warn("Token refresh failed")
		h.respondWithError(w, http.StatusUnauthorized, "Invalid refresh token")
		return
	}

	h.respondWithJSON(w, http.StatusOK, response)
}

func (h *AuthHandler) RequestPasswordReset(w http.ResponseWriter, r *http.Request) {
	var req models.PasswordResetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		h.respondWithValidationError(w, err)
		return
	}

	err := h.authService.RequestPasswordReset(r.Context(), req.Email)
	if err != nil {
		h.logger.WithError(err).Error("Password reset request failed")
		h.respondWithError(w, http.StatusInternalServerError, "Failed to process request")
		return
	}

	h.respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Password reset email sent",
	})
}

func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req models.PasswordResetConfirm
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		h.respondWithValidationError(w, err)
		return
	}

	err := h.authService.ResetPassword(r.Context(), req)
	if err != nil {
		h.logger.WithError(err).Error("Password reset failed")
		h.respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	h.respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Password reset successfully",
	})
}

func (h *AuthHandler) respondWithJSON(w http.ResponseWriter, status int, payload interface{}) {
	response := map[string]interface{}{
		"success": true,
		"data":    payload,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(response)
}

func (h *AuthHandler) respondWithError(w http.ResponseWriter, status int, message string) {
	response := map[string]interface{}{
		"success": false,
		"error":   message,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(response)
}

func (h *AuthHandler) respondWithValidationError(w http.ResponseWriter, err error) {
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
