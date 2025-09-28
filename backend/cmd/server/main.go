package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/hxrshxz/ground-sense-bot/backend/internal/config"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/database"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/routes"
	"github.com/sirupsen/logrus"
)

func main() {
	// Initialize logger
	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: time.RFC3339,
	})
	logger.SetLevel(logrus.InfoLevel)

	// Load configuration
	cfg := config.Load()
	logger.WithField("config", cfg).Info("Configuration loaded")

	// Initialize database
	db, err := database.NewService(cfg, logger)
	if err != nil {
		logger.WithError(err).Fatal("Failed to initialize database")
	}
	defer db.Close()

	// Create HTTP server
	server := &http.Server{
		Addr:         cfg.Server.Host + ":" + cfg.Server.Port,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  cfg.Server.IdleTimeout,
	}

	// Register routes
	routes.RegisterRoutes(server.Handler.(*http.ServeMux), cfg, db, logger)

	// Start server in a goroutine
	go func() {
		logger.WithField("addr", server.Addr).Info("Server starting")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.WithError(err).Fatal("Server failed to start")
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Server shutting down...")

	// Give outstanding requests 30 seconds to complete
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.WithError(err).Fatal("Server forced to shutdown")
	}

	logger.Info("Server exited")
}
