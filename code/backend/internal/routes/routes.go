package routes

import (
	"net/http"

	"github.com/didip/tollbooth"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/auth"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/chat"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/config"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/database"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/handlers"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/middleware"
	"github.com/sirupsen/logrus"
)

func RegisterRoutes(mux *http.ServeMux, cfg *config.Config, db *database.Service, logger *logrus.Logger) {
	// Initialize services
	authService := auth.NewService(db.DB, cfg)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService, logger)
	chatHandler := handlers.NewChatHandler(logger)
	userHandler := handlers.NewUserHandler(db, logger)
	healthHandler := handlers.NewHealthHandler(db, logger)

	// Rate limiter
	limiter := tollbooth.NewLimiter(float64(cfg.RateLimit.RequestsPerHour)/3600, nil)
	limiter.SetBurst(cfg.RateLimit.BurstSize)

	// Middleware chain
	commonMiddleware := []middleware.Middleware{
		middleware.RequestLogger(logger),
		middleware.Recovery(logger),
		middleware.CORS([]string{"*"}), // Configure allowed origins
		middleware.SecurityHeaders(),
		middleware.JSONContentType(),
		middleware.Metrics(),
		middleware.RateLimit(limiter),
	}

	// Health check (no auth required)
	mux.Handle("/api/v1/health", middleware.HealthCheck(db.DB))
	mux.Handle("/api/v1/metrics", middleware.MetricsHandler())

	// Authentication routes (no auth required)
	mux.HandleFunc("/api/v1/auth/register", authHandler.Register)
	mux.HandleFunc("/api/v1/auth/login", authHandler.Login)
	mux.HandleFunc("/api/v1/auth/refresh", authHandler.RefreshToken)
	mux.HandleFunc("/api/v1/auth/password-reset/request", authHandler.RequestPasswordReset)
	mux.HandleFunc("/api/v1/auth/password-reset/confirm", authHandler.ResetPassword)

	// Protected routes with authentication
	protectedMux := http.NewServeMux()

	// User routes
	protectedMux.HandleFunc("/api/v1/users/profile", userHandler.GetProfile)
	protectedMux.HandleFunc("/api/v1/users/change-password", userHandler.ChangePassword)
	protectedMux.HandleFunc("/api/v1/users/", userHandler.GetUser)

	// Chat routes
	protectedMux.HandleFunc("/api/v1/chat/conversations", chatHandler.GetConversations)
	protectedMux.HandleFunc("/api/v1/chat/conversations", chatHandler.CreateConversation)
	protectedMux.HandleFunc("/api/v1/chat/conversations/", chatHandler.GetConversation)
	protectedMux.HandleFunc("/api/v1/chat/conversations/", chatHandler.GetMessages)
	protectedMux.HandleFunc("/api/v1/chat/conversations/", chatHandler.SendMessage)
	protectedMux.HandleFunc("/api/v1/chat/conversations/", chatHandler.AddParticipant)
	protectedMux.HandleFunc("/api/v1/chat/conversations/", chatHandler.RemoveParticipant)

	// File upload routes
	fileHandler := handlers.NewFileHandler(logger)
	protectedMux.HandleFunc("/api/v1/files/upload", fileHandler.UploadFile)
	protectedMux.HandleFunc("/api/v1/files/", fileHandler.GetFile)
	protectedMux.HandleFunc("/api/v1/files/", fileHandler.DeleteFile)

	// Admin routes
	adminHandler := handlers.NewAdminHandler(db, logger)
	protectedMux.HandleFunc("/api/v1/admin/users", adminHandler.GetUsers)
	protectedMux.HandleFunc("/api/v1/admin/users/", adminHandler.UpdateUserStatus)
	protectedMux.HandleFunc("/api/v1/admin/stats", adminHandler.GetSystemStats)
	protectedMux.HandleFunc("/api/v1/admin/audit-logs", adminHandler.GetAuditLogs)

	// Apply authentication middleware to protected routes
	authMiddleware := middleware.Authenticate(authService)
	for pattern, handler := range map[string]http.Handler{
		"/api/v1/users/":     authMiddleware(protectedMux),
		"/api/v1/chat/":      authMiddleware(protectedMux),
		"/api/v1/files/":     authMiddleware(protectedMux),
		"/api/v1/admin/":     authMiddleware(protectedMux),
	} {
		mux.Handle(pattern, handler)
	}

	// WebSocket route (with optional auth)
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		// Optional auth for WebSocket connections
		ctx := r.Context()
		if claims, ok := middleware.GetUserFromContext(ctx); ok {
			// User is authenticated, proceed with user context
			chat.ServeWsWithUser(w, r, claims.UserID.String())
		} else {
			// Anonymous connection
			chat.ServeWs(w, r)
		}
	})

	// Start chat hub
	go chat.GetHub().Run()

	// API documentation
	mux.Handle("/docs/", http.StripPrefix("/docs/", http.FileServer(http.Dir("./docs/"))))

	logger.Info("Routes registered successfully")
}
	// Initialize services
	authService := auth.NewService(db.DB, cfg)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService, logger)
	chatHandler := handlers.NewChatHandler(logger)
	userHandler := handlers.NewUserHandler(db, logger)
	healthHandler := handlers.NewHealthHandler(db, logger)

	// Rate limiter
	limiter := tollbooth.NewLimiter(float64(cfg.RateLimit.RequestsPerHour)/3600, nil)
	limiter.SetBurst(cfg.RateLimit.BurstSize)

	// Middleware chain
	commonMiddleware := []middleware.Middleware{
		middleware.RequestLogger(logger),
		middleware.Recovery(logger),
		middleware.CORS([]string{"*"}), // Configure allowed origins
		middleware.SecurityHeaders(),
		middleware.JSONContentType(),
		middleware.Metrics(),
		middleware.RateLimit(limiter),
	}

	// API v1 routes
	api := r.PathPrefix("/api/v1").Subrouter()
	api.Use(middleware.Chain(nil, commonMiddleware...))

	// Health check (no auth required)
	api.Handle("/health", middleware.HealthCheck(db.DB)).Methods("GET")
	api.Handle("/metrics", middleware.MetricsHandler()).Methods("GET")

	// Authentication routes (no auth required)
	authRoutes := api.PathPrefix("/auth").Subrouter()
	authRoutes.HandleFunc("/register", authHandler.Register).Methods("POST")
	authRoutes.HandleFunc("/login", authHandler.Login).Methods("POST")
	authRoutes.HandleFunc("/refresh", authHandler.RefreshToken).Methods("POST")
	authRoutes.HandleFunc("/password-reset/request", authHandler.RequestPasswordReset).Methods("POST")
	authRoutes.HandleFunc("/password-reset/confirm", authHandler.ResetPassword).Methods("POST")

	// Protected routes
	
	protected := api.PathPrefix("").Subrouter()
	protected.Use(middleware.Authenticate(authService))

	// User routes
	userRoutes := protected.PathPrefix("/users").Subrouter()
	userRoutes.HandleFunc("/profile", userHandler.GetProfile).Methods("GET")
	userRoutes.HandleFunc("/profile", userHandler.UpdateProfile).Methods("PUT")
	userRoutes.HandleFunc("/change-password", userHandler.ChangePassword).Methods("POST")
	userRoutes.HandleFunc("/{id}", userHandler.GetUser).Methods("GET")

	// Chat routes
	chatRoutes := protected.PathPrefix("/chat").Subrouter()
	chatRoutes.HandleFunc("/conversations", chatHandler.GetConversations).Methods("GET")
	chatRoutes.HandleFunc("/conversations", chatHandler.CreateConversation).Methods("POST")
	chatRoutes.HandleFunc("/conversations/{id}", chatHandler.GetConversation).Methods("GET")
	chatRoutes.HandleFunc("/conversations/{id}/messages", chatHandler.GetMessages).Methods("GET")
	chatRoutes.HandleFunc("/conversations/{id}/messages", chatHandler.SendMessage).Methods("POST")
	chatRoutes.HandleFunc("/conversations/{id}/participants", chatHandler.AddParticipant).Methods("POST")
	chatRoutes.HandleFunc("/conversations/{id}/participants/{userId}", chatHandler.RemoveParticipant).Methods("DELETE")

	// WebSocket route (with optional auth)
	r.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		// Optional auth for WebSocket connections
		ctx := r.Context()
		if claims, ok := middleware.GetUserFromContext(ctx); ok {
			// User is authenticated, proceed with user context
			chat.ServeWsWithUser(w, r, claims.UserID.String())
		} else {
			// Anonymous connection
			chat.ServeWs(w, r)
		}
	})

	// Start chat hub
	go chat.GetHub().Run()

	// File upload routes
	fileRoutes := protected.PathPrefix("/files").Subrouter()
	fileRoutes.HandleFunc("/upload", handlers.NewFileHandler(logger).UploadFile).Methods("POST")
	fileRoutes.HandleFunc("/{id}", handlers.NewFileHandler(logger).GetFile).Methods("GET")
	fileRoutes.HandleFunc("/{id}", handlers.NewFileHandler(logger).DeleteFile).Methods("DELETE")

	// Admin routes (require admin role)
	adminRoutes := protected.PathPrefix("/admin").Subrouter()
	adminRoutes.Use(middleware.RequireRole("admin"))

	adminRoutes.HandleFunc("/users", handlers.NewAdminHandler(db, logger).GetUsers).Methods("GET")
	adminRoutes.HandleFunc("/users/{id}/status", handlers.NewAdminHandler(db, logger).UpdateUserStatus).Methods("PUT")
	adminRoutes.HandleFunc("/stats", handlers.NewAdminHandler(db, logger).GetSystemStats).Methods("GET")
	adminRoutes.HandleFunc("/audit-logs", handlers.NewAdminHandler(db, logger).GetAuditLogs).Methods("GET")

	// API documentation
	r.PathPrefix("/docs/").Handler(http.StripPrefix("/docs/", http.FileServer(http.Dir("./docs/"))))

	logger.Info("Routes registered successfully")
}
