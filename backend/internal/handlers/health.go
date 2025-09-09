package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/hxrshxz/ground-sense-bot/backend/internal/database"
	"github.com/sirupsen/logrus"
)

type HealthHandler struct {
	db     *database.Service
	logger *logrus.Logger
}

func NewHealthHandler(db *database.Service, logger *logrus.Logger) *HealthHandler {
	return &HealthHandler{
		db:     db,
		logger: logger,
	}
}

func (h *HealthHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	health := map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now().UTC(),
		"version":   "1.0.0",
		"services": map[string]interface{}{
			"database": "unknown",
		},
	}

	// Check database connection
	if err := h.db.HealthCheck(r.Context()); err != nil {
		h.logger.WithError(err).Error("Database health check failed")
		health["status"] = "unhealthy"
		health.(map[string]interface{})["services"].(map[string]interface{})["database"] = "unhealthy"
		w.WriteHeader(http.StatusServiceUnavailable)
	} else {
		health.(map[string]interface{})["services"].(map[string]interface{})["database"] = "healthy"
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(health)
}
