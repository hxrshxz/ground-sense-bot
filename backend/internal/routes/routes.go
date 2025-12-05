package routes

import (
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

	// Initialize Chatbot components
	llmService, err := services.NewLLMService(cfg)
	if err != nil {
		logger.Warnf("Failed to initialize LLM Service: %v", err)
	}
	nlpService := services.NewNLPService(llmService)
	chatService := services.NewChatService(nlpService, ingresService)
	hub := chat.NewHub(chatService)
	go hub.Run()

	// WebSocket route
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		chat.ServeWs(hub, w, r)
	})

	// Register INGRES routes
	mux.HandleFunc("/api/states", ingresController.GetStates)
	mux.HandleFunc("/api/districts", ingresController.GetDistricts)
	mux.HandleFunc("/api/blocks", ingresController.GetBlocks)
	mux.HandleFunc("/api/assessment", ingresController.GetBlockAssessment)
	mux.HandleFunc("/api/search", ingresController.SearchBlocks)

	logger.Info("Routes registered successfully")
}
