package controllers

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/services"
	"github.com/sirupsen/logrus"
)

type IngresController struct {
	service *services.IngresService
	logger  *logrus.Logger
}

func NewIngresController(service *services.IngresService, logger *logrus.Logger) *IngresController {
	return &IngresController{service: service, logger: logger}
}

func (c *IngresController) GetStates(w http.ResponseWriter, r *http.Request) {
	c.enableCors(w)
	if r.Method != http.MethodGet {
		c.respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	states, err := c.service.GetStates(r.Context())
	if err != nil {
		c.logger.Errorf("Failed to get states: %v", err)
		c.respondError(w, http.StatusInternalServerError, "Failed to fetch states")
		return
	}

	c.respondJSON(w, http.StatusOK, states)
}

func (c *IngresController) GetDistricts(w http.ResponseWriter, r *http.Request) {
	c.enableCors(w)
	if r.Method != http.MethodGet {
		c.respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	stateUUIDStr := r.URL.Query().Get("state_uuid")
	if stateUUIDStr == "" {
		c.respondError(w, http.StatusBadRequest, "state_uuid is required")
		return
	}

	stateUUID, err := uuid.Parse(stateUUIDStr)
	if err != nil {
		c.respondError(w, http.StatusBadRequest, "Invalid state_uuid")
		return
	}

	districts, err := c.service.GetDistricts(r.Context(), stateUUID)
	if err != nil {
		c.logger.Errorf("Failed to get districts: %v", err)
		c.respondError(w, http.StatusInternalServerError, "Failed to fetch districts")
		return
	}

	c.respondJSON(w, http.StatusOK, districts)
}

func (c *IngresController) GetBlocks(w http.ResponseWriter, r *http.Request) {
	c.enableCors(w)
	if r.Method != http.MethodGet {
		c.respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	districtUUIDStr := r.URL.Query().Get("district_uuid")
	if districtUUIDStr == "" {
		c.respondError(w, http.StatusBadRequest, "district_uuid is required")
		return
	}

	districtUUID, err := uuid.Parse(districtUUIDStr)
	if err != nil {
		c.respondError(w, http.StatusBadRequest, "Invalid district_uuid")
		return
	}

	blocks, err := c.service.GetBlocks(r.Context(), districtUUID)
	if err != nil {
		c.logger.Errorf("Failed to get blocks: %v", err)
		c.respondError(w, http.StatusInternalServerError, "Failed to fetch blocks")
		return
	}

	c.respondJSON(w, http.StatusOK, blocks)
}

func (c *IngresController) GetBlockAssessment(w http.ResponseWriter, r *http.Request) {
	c.enableCors(w)
	if r.Method != http.MethodGet {
		c.respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	blockUUIDStr := r.URL.Query().Get("block_uuid")
	if blockUUIDStr == "" {
		c.respondError(w, http.StatusBadRequest, "block_uuid is required")
		return
	}

	blockUUID, err := uuid.Parse(blockUUIDStr)
	if err != nil {
		c.respondError(w, http.StatusBadRequest, "Invalid block_uuid")
		return
	}

	year := r.URL.Query().Get("year")
	if year == "" {
		year = "2024-2025" // Default
	}

	assessment, err := c.service.GetBlockAssessment(r.Context(), blockUUID, year)
	if err != nil {
		c.logger.Errorf("Failed to get assessment: %v", err)
		c.respondError(w, http.StatusInternalServerError, "Failed to fetch assessment")
		return
	}
	if assessment == nil {
		c.respondError(w, http.StatusNotFound, "Assessment not found")
		return
	}

	c.respondJSON(w, http.StatusOK, assessment)
}

func (c *IngresController) SearchBlocks(w http.ResponseWriter, r *http.Request) {
	c.enableCors(w)
	if r.Method != http.MethodGet {
		c.respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	query := r.URL.Query().Get("q")
	if query == "" {
		c.respondError(w, http.StatusBadRequest, "q parameter is required")
		return
	}

	blocks, err := c.service.SearchBlocks(r.Context(), query)
	if err != nil {
		c.logger.Errorf("Failed to search blocks: %v", err)
		c.respondError(w, http.StatusInternalServerError, "Failed to search blocks")
		return
	}

	c.respondJSON(w, http.StatusOK, blocks)
}

// Helpers

func (c *IngresController) enableCors(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func (c *IngresController) respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

func (c *IngresController) respondError(w http.ResponseWriter, status int, message string) {
	c.respondJSON(w, status, map[string]string{"error": message})
}
