package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/gorilla/mux"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/middleware"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/models"
	"github.com/sirupsen/logrus"
)

type ChatHandler struct {
	logger   *logrus.Logger
	validate *validator.Validate
}

func NewChatHandler(logger *logrus.Logger) *ChatHandler {
	return &ChatHandler{
		logger:   logger,
		validate: validator.New(),
	}
}

func (h *ChatHandler) GetConversations(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// TODO: Implement conversation retrieval from database
	// For now, return empty array
	conversations := []models.Conversation{}

	h.respondWithJSON(w, http.StatusOK, conversations)
}

func (h *ChatHandler) CreateConversation(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	var req models.CreateConversationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		h.respondWithValidationError(w, err)
		return
	}

	// TODO: Implement conversation creation
	conversation := models.Conversation{
		ID:        "temp-id", // Generate proper UUID
		Type:      req.Type,
		Name:      req.Name,
		CreatedBy: claims.UserID,
		IsGroup:   req.Type == models.ConversationTypeGroup,
	}

	h.respondWithJSON(w, http.StatusCreated, conversation)
}

func (h *ChatHandler) GetConversation(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	vars := mux.Vars(r)
	conversationID := vars["id"]

	if conversationID == "" {
		h.respondWithError(w, http.StatusBadRequest, "Conversation ID is required")
		return
	}

	// TODO: Implement conversation retrieval
	conversation := models.Conversation{
		ID:        conversationID,
		Type:      models.ConversationTypeDirect,
		CreatedBy: claims.UserID,
		IsGroup:   false,
	}

	h.respondWithJSON(w, http.StatusOK, conversation)
}

func (h *ChatHandler) GetMessages(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	vars := mux.Vars(r)
	conversationID := vars["id"]

	if conversationID == "" {
		h.respondWithError(w, http.StatusBadRequest, "Conversation ID is required")
		return
	}

	// TODO: Implement message retrieval with pagination
	messages := []models.Message{}

	h.respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"messages": messages,
		"has_more": false,
	})
}

func (h *ChatHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	vars := mux.Vars(r)
	conversationID := vars["id"]

	if conversationID == "" {
		h.respondWithError(w, http.StatusBadRequest, "Conversation ID is required")
		return
	}

	var req models.SendMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	req.ConversationID = conversationID // Override with path parameter

	if err := h.validate.Struct(req); err != nil {
		h.respondWithValidationError(w, err)
		return
	}

	// TODO: Implement message creation
	message := models.Message{
		ID:             "temp-id", // Generate proper UUID
		ConversationID: conversationID,
		SenderID:       claims.UserID,
		Content:        req.Content,
		MessageType:    req.MessageType,
		Status:         models.MessageStatusSent,
	}

	h.respondWithJSON(w, http.StatusCreated, message)
}

func (h *ChatHandler) AddParticipant(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	vars := mux.Vars(r)
	conversationID := vars["id"]

	if conversationID == "" {
		h.respondWithError(w, http.StatusBadRequest, "Conversation ID is required")
		return
	}

	var req struct {
		UserID string `json:"user_id" validate:"required"`
		Role   string `json:"role,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.validate.Struct(req); err != nil {
		h.respondWithValidationError(w, err)
		return
	}

	// TODO: Implement participant addition
	h.respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Participant added successfully",
	})
}

func (h *ChatHandler) RemoveParticipant(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	vars := mux.Vars(r)
	conversationID := vars["id"]
	userID := vars["userId"]

	if conversationID == "" || userID == "" {
		h.respondWithError(w, http.StatusBadRequest, "Conversation ID and User ID are required")
		return
	}

	// TODO: Implement participant removal
	h.respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Participant removed successfully",
	})
}

func (h *ChatHandler) respondWithJSON(w http.ResponseWriter, status int, payload interface{}) {
	response := map[string]interface{}{
		"success": true,
		"data":    payload,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(response)
}

func (h *ChatHandler) respondWithError(w http.ResponseWriter, status int, message string) {
	response := map[string]interface{}{
		"success": false,
		"error":   message,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(response)
}

func (h *ChatHandler) respondWithValidationError(w http.ResponseWriter, err error) {
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
