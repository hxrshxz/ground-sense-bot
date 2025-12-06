package controllers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/hxrshxz/ground-sense-bot/backend/internal/services"
	"github.com/sirupsen/logrus"
)

type RAGController struct {
	ragService *services.RAGService
	logger     *logrus.Logger
}

func NewRAGController(ragService *services.RAGService, logger *logrus.Logger) *RAGController {
	return &RAGController{
		ragService: ragService,
		logger:     logger,
	}
}

// HybridSearch handles hybrid search requests
func (c *RAGController) HybridSearch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req services.HybridSearchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		c.logger.Errorf("Failed to decode request: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Perform hybrid search
	results, err := c.ragService.HybridSearch(r.Context(), req)
	if err != nil {
		c.logger.Errorf("Hybrid search failed: %v", err)
		http.Error(w, "Search failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

// GetAssessment retrieves a specific assessment by ID
func (c *RAGController) GetAssessment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get assessment ID from query parameter
	assessmentIDStr := r.URL.Query().Get("id")
	if assessmentIDStr == "" {
		http.Error(w, "Missing assessment ID", http.StatusBadRequest)
		return
	}

	assessmentID, err := strconv.Atoi(assessmentIDStr)
	if err != nil {
		http.Error(w, "Invalid assessment ID", http.StatusBadRequest)
		return
	}

	// Get assessment
	result, err := c.ragService.GetAssessmentByID(r.Context(), assessmentID)
	if err != nil {
		c.logger.Errorf("Failed to get assessment: %v", err)
		http.Error(w, "Assessment not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}
