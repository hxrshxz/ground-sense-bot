package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/database"
	"github.com/sirupsen/logrus"
)

type AdminHandler struct {
	db     *database.Service
	logger *logrus.Logger
}

func NewAdminHandler(db *database.Service, logger *logrus.Logger) *AdminHandler {
	return &AdminHandler{
		db:     db,
		logger: logger,
	}
}

func (h *AdminHandler) GetUsers(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	page := 1
	limit := 20
	status := r.URL.Query().Get("status")
	role := r.URL.Query().Get("role")

	if p := r.URL.Query().Get("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	offset := (page - 1) * limit

	// Build query
	query := `
		SELECT id, username, email, first_name, last_name, phone, role, status,
		       email_verified, phone_verified, last_login_at, created_at, updated_at
		FROM users WHERE deleted_at IS NULL`

	args := []interface{}{}
	argCount := 0

	if status != "" {
		argCount++
		query += " AND status = $" + strconv.Itoa(argCount)
		args = append(args, status)
	}

	if role != "" {
		argCount++
		query += " AND role = $" + strconv.Itoa(argCount)
		args = append(args, role)
	}

	query += " ORDER BY created_at DESC LIMIT $" + strconv.Itoa(argCount+1) +
		" OFFSET $" + strconv.Itoa(argCount+2)
	args = append(args, limit, offset)

	rows, err := h.db.DB.QueryContext(r.Context(), query, args...)
	if err != nil {
		h.logger.WithError(err).Error("Failed to get users")
		h.respondWithError(w, http.StatusInternalServerError, "Failed to get users")
		return
	}
	defer rows.Close()

	var users []map[string]interface{}
	for rows.Next() {
		var user struct {
			ID            string `json:"id"`
			Username      string `json:"username"`
			Email         string `json:"email"`
			FirstName     *string `json:"first_name"`
			LastName      *string `json:"last_name"`
			Phone         *string `json:"phone"`
			Role          string `json:"role"`
			Status        string `json:"status"`
			EmailVerified bool   `json:"email_verified"`
			PhoneVerified bool   `json:"phone_verified"`
			LastLoginAt   *string `json:"last_login_at"`
			CreatedAt     string `json:"created_at"`
			UpdatedAt     string `json:"updated_at"`
		}

		err := rows.Scan(&user.ID, &user.Username, &user.Email, &user.FirstName,
			&user.LastName, &user.Phone, &user.Role, &user.Status,
			&user.EmailVerified, &user.PhoneVerified, &user.LastLoginAt,
			&user.CreatedAt, &user.UpdatedAt)
		if err != nil {
			h.logger.WithError(err).Error("Failed to scan user")
			continue
		}

		userMap := map[string]interface{}{
			"id":             user.ID,
			"username":       user.Username,
			"email":          user.Email,
			"first_name":     user.FirstName,
			"last_name":      user.LastName,
			"phone":          user.Phone,
			"role":           user.Role,
			"status":         user.Status,
			"email_verified": user.EmailVerified,
			"phone_verified": user.PhoneVerified,
			"last_login_at":  user.LastLoginAt,
			"created_at":     user.CreatedAt,
			"updated_at":     user.UpdatedAt,
		}
		users = append(users, userMap)
	}

	// Get total count
	countQuery := "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL"
	countArgs := []interface{}{}

	if status != "" {
		countQuery += " AND status = $1"
		countArgs = append(countArgs, status)
	}

	if role != "" {
		if len(countArgs) == 0 {
			countQuery += " AND role = $1"
		} else {
			countQuery += " AND role = $2"
		}
		countArgs = append(countArgs, role)
	}

	var total int
	err = h.db.DB.QueryRowContext(r.Context(), countQuery, countArgs...).Scan(&total)
	if err != nil {
		h.logger.WithError(err).Error("Failed to get user count")
		total = 0
	}

	response := map[string]interface{}{
		"users":      users,
		"pagination": map[string]interface{}{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + limit - 1) / limit,
		},
	}

	h.respondWithJSON(w, http.StatusOK, response)
}

func (h *AdminHandler) UpdateUserStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["id"]

	if userID == "" {
		h.respondWithError(w, http.StatusBadRequest, "User ID is required")
		return
	}

	var req struct {
		Status string `json:"status" validate:"required,oneof=active inactive suspended banned"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Update user status
	result, err := h.db.DB.ExecContext(r.Context(), `
		UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2 AND deleted_at IS NULL`, req.Status, userID)
	if err != nil {
		h.logger.WithError(err).Error("Failed to update user status")
		h.respondWithError(w, http.StatusInternalServerError, "Failed to update user status")
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		h.respondWithError(w, http.StatusNotFound, "User not found")
		return
	}

	h.logger.WithFields(logrus.Fields{
		"user_id": userID,
		"status":  req.Status,
	}).Info("User status updated")

	h.respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "User status updated successfully",
	})
}

func (h *AdminHandler) GetSystemStats(w http.ResponseWriter, r *http.Request) {
	stats := map[string]interface{}{}

	// User statistics
	var userStats struct {
		Total     int `json:"total"`
		Active    int `json:"active"`
		Inactive  int `json:"inactive"`
		Suspended int `json:"suspended"`
		Banned    int `json:"banned"`
	}

	err := h.db.DB.QueryRowContext(r.Context(), `
		SELECT
			COUNT(*) as total,
			COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
			COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
			COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended,
			COUNT(CASE WHEN status = 'banned' THEN 1 END) as banned
		FROM users WHERE deleted_at IS NULL`).Scan(
		&userStats.Total, &userStats.Active, &userStats.Inactive,
		&userStats.Suspended, &userStats.Banned)
	if err != nil {
		h.logger.WithError(err).Error("Failed to get user stats")
	} else {
		stats["users"] = userStats
	}

	// Message statistics
	var messageStats struct {
		Total     int `json:"total"`
		Today     int `json:"today"`
		ThisWeek  int `json:"this_week"`
		ThisMonth int `json:"this_month"`
	}

	err = h.db.DB.QueryRowContext(r.Context(), `
		SELECT
			COUNT(*) as total,
			COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today,
			COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as this_week,
			COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as this_month
		FROM messages`).Scan(
		&messageStats.Total, &messageStats.Today,
		&messageStats.ThisWeek, &messageStats.ThisMonth)
	if err != nil {
		h.logger.WithError(err).Error("Failed to get message stats")
	} else {
		stats["messages"] = messageStats
	}

	// Conversation statistics
	var conversationStats struct {
		Total    int `json:"total"`
		Direct   int `json:"direct"`
		Group    int `json:"group"`
		Channel  int `json:"channel"`
	}

	err = h.db.DB.QueryRowContext(r.Context(), `
		SELECT
			COUNT(*) as total,
			COUNT(CASE WHEN type = 'direct' THEN 1 END) as direct,
			COUNT(CASE WHEN type = 'group' THEN 1 END) as group,
			COUNT(CASE WHEN type = 'channel' THEN 1 END) as channel
		FROM conversations`).Scan(
		&conversationStats.Total, &conversationStats.Direct,
		&conversationStats.Group, &conversationStats.Channel)
	if err != nil {
		h.logger.WithError(err).Error("Failed to get conversation stats")
	} else {
		stats["conversations"] = conversationStats
	}

	h.respondWithJSON(w, http.StatusOK, stats)
}

func (h *AdminHandler) GetAuditLogs(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	page := 1
	limit := 50
	userID := r.URL.Query().Get("user_id")
	action := r.URL.Query().Get("action")

	if p := r.URL.Query().Get("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 200 {
			limit = parsed
		}
	}

	offset := (page - 1) * limit

	// Build query
	query := `
		SELECT id, user_id, action, resource_type, resource_id,
		       old_values, new_values, ip_address, user_agent, created_at
		FROM audit_logs WHERE 1=1`

	args := []interface{}{}
	argCount := 0

	if userID != "" {
		argCount++
		query += " AND user_id = $" + strconv.Itoa(argCount)
		args = append(args, userID)
	}

	if action != "" {
		argCount++
		query += " AND action = $" + strconv.Itoa(argCount)
		args = append(args, action)
	}

	query += " ORDER BY created_at DESC LIMIT $" + strconv.Itoa(argCount+1) +
		" OFFSET $" + strconv.Itoa(argCount+2)
	args = append(args, limit, offset)

	rows, err := h.db.DB.QueryContext(r.Context(), query, args...)
	if err != nil {
		h.logger.WithError(err).Error("Failed to get audit logs")
		h.respondWithError(w, http.StatusInternalServerError, "Failed to get audit logs")
		return
	}
	defer rows.Close()

	var logs []map[string]interface{}
	for rows.Next() {
		var log struct {
			ID           string `json:"id"`
			UserID       *string `json:"user_id"`
			Action       string `json:"action"`
			ResourceType string `json:"resource_type"`
			ResourceID   *string `json:"resource_id"`
			OldValues    *string `json:"old_values"`
			NewValues    *string `json:"new_values"`
			IPAddress    *string `json:"ip_address"`
			UserAgent    *string `json:"user_agent"`
			CreatedAt    string `json:"created_at"`
		}

		err := rows.Scan(&log.ID, &log.UserID, &log.Action, &log.ResourceType,
			&log.ResourceID, &log.OldValues, &log.NewValues, &log.IPAddress,
			&log.UserAgent, &log.CreatedAt)
		if err != nil {
			h.logger.WithError(err).Error("Failed to scan audit log")
			continue
		}

		logMap := map[string]interface{}{
			"id":            log.ID,
			"user_id":       log.UserID,
			"action":        log.Action,
			"resource_type": log.ResourceType,
			"resource_id":   log.ResourceID,
			"old_values":    log.OldValues,
			"new_values":    log.NewValues,
			"ip_address":    log.IPAddress,
			"user_agent":    log.UserAgent,
			"created_at":    log.CreatedAt,
		}
		logs = append(logs, logMap)
	}

	// Get total count
	countQuery := "SELECT COUNT(*) FROM audit_logs WHERE 1=1"
	countArgs := []interface{}{}

	if userID != "" {
		countQuery += " AND user_id = $1"
		countArgs = append(countArgs, userID)
	}

	if action != "" {
		if len(countArgs) == 0 {
			countQuery += " AND action = $1"
		} else {
			countQuery += " AND action = $2"
		}
		countArgs = append(countArgs, action)
	}

	var total int
	err = h.db.DB.QueryRowContext(r.Context(), countQuery, countArgs...).Scan(&total)
	if err != nil {
		h.logger.WithError(err).Error("Failed to get audit log count")
		total = 0
	}

	response := map[string]interface{}{
		"logs": logs,
		"pagination": map[string]interface{}{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (total + limit - 1) / limit,
		},
	}

	h.respondWithJSON(w, http.StatusOK, response)
}

func (h *AdminHandler) respondWithJSON(w http.ResponseWriter, status int, payload interface{}) {
	response := map[string]interface{}{
		"success": true,
		"data":    payload,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(response)
}

func (h *AdminHandler) respondWithError(w http.ResponseWriter, status int, message string) {
	response := map[string]interface{}{
		"success": false,
		"error":   message,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(response)
}
