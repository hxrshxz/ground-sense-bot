package routes

import (
	"encoding/json"
	"net/http"

	"github.com/hxrshxz/ground-sense-bot/backend/internal/chat"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/config"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/controllers"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/database"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/repositories"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/services"
	"github.com/sirupsen/logrus"
)

func RegisterRoutes(mux *http.ServeMux, cfg *config.Config, db *database.Service, logger *logrus.Logger) {
	// Health check
	mux.HandleFunc("/api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Initialize INGRES components
	ingresRepo := repositories.NewIngresRepository(db.DB)
	ingresService := services.NewIngresService(ingresRepo)
	ingresController := controllers.NewIngresController(ingresService, logger)

	// Initialize RAG components
	ragService := services.NewRAGService(db, cfg, logger)
	ragController := controllers.NewRAGController(ragService, logger)

	// Initialize Redis Cache Service
	cacheService := services.NewCacheService(cfg)
	logger.Info("✅ Redis Cache Service initialized")

	// Initialize Chatbot components
	llmService, err := services.NewLLMService(cfg)
	if err != nil {
		logger.Warnf("Failed to initialize LLM Service: %v", err)
	}
	nlpService := services.NewNLPService(llmService, cacheService) // Pass cache to NLP
	chatService := services.NewChatService(nlpService, ingresService, ragService, cacheService)
	hub := chat.NewHub(chatService)
	go hub.Run()

	// WebSocket route
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		chat.ServeWs(hub, w, r)
	})

	// Debug Route for Testing
	mux.HandleFunc("/api/debug/chat", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		var req struct {
			Message  string `json:"message"`
			Username string `json:"username"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		user := req.Username
		if user == "" {
			user = "debug_user"
		}
		resp, err := chatService.ProcessMessage(r.Context(), req.Message, user)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})

	// Register INGRES routes
	mux.HandleFunc("/api/states", ingresController.GetStates)
	mux.HandleFunc("/api/districts", ingresController.GetDistricts)
	mux.HandleFunc("/api/blocks", ingresController.GetBlocks)
	mux.HandleFunc("/api/assessment", ingresController.GetBlockAssessment)
	mux.HandleFunc("/api/search", ingresController.SearchBlocks)

	// Register Overview routes
	overviewController := controllers.NewOverviewController(ingresService, logger)
	mux.HandleFunc("/api/blocks/", overviewController.GetBlockOverview)
	mux.HandleFunc("/api/districts/", overviewController.GetDistrictOverview)

	// Register RAG routes
	mux.HandleFunc("/api/v1/rag/search", ragController.HybridSearch)
	mux.HandleFunc("/api/v1/rag/assessment", ragController.GetAssessment)

	logger.Info("Routes registered successfully")
}
