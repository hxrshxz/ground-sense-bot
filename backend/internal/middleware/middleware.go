package middleware

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/didip/tollbooth"
	"github.com/didip/tollbooth/limiter"
	"github.com/google/uuid"
	"github.com/gorilla/sessions"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/auth"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/config"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/models"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"
)

type contextKey string

const (
	UserContextKey contextKey = "user"
	LoggerContextKey contextKey = "logger"
	RequestIDContextKey contextKey = "request_id"
)

// Middleware represents a middleware function
type Middleware func(http.Handler) http.Handler

// Chain applies middlewares in order
func Chain(handler http.Handler, middlewares ...Middleware) http.Handler {
	for i := len(middlewares) - 1; i >= 0; i-- {
		handler = middlewares[i](handler)
	}
	return handler
}

// CORS middleware
func CORS(allowedOrigins []string) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")

			// Check if origin is allowed
			allowed := false
			for _, allowedOrigin := range allowedOrigins {
				if allowedOrigin == "*" || allowedOrigin == origin {
					allowed = true
					break
				}
			}

			if allowed {
				w.Header().Set("Access-Control-Allow-Origin", origin)
			}

			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Max-Age", "86400")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// Authentication middleware
func Authenticate(authService *auth.Service) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "Authorization header required", http.StatusUnauthorized)
				return
			}

			tokenString := strings.TrimPrefix(authHeader, "Bearer ")
			if tokenString == authHeader {
				http.Error(w, "Bearer token required", http.StatusUnauthorized)
				return
			}

			claims, err := authService.ValidateToken(tokenString)
			if err != nil {
				status := http.StatusUnauthorized
				if err == auth.ErrTokenExpired {
					status = http.StatusUnauthorized
				}
				http.Error(w, err.Error(), status)
				return
			}

			// Add user info to context
			ctx := context.WithValue(r.Context(), UserContextKey, claims)
			r = r.WithContext(ctx)

			next.ServeHTTP(w, r)
		})
	}
}

// Optional authentication middleware (doesn't fail if no token)
func OptionalAuth(authService *auth.Service) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader != "" {
				tokenString := strings.TrimPrefix(authHeader, "Bearer ")
				if tokenString != authHeader {
					claims, err := authService.ValidateToken(tokenString)
					if err == nil {
						// Add user info to context if token is valid
						ctx := context.WithValue(r.Context(), UserContextKey, claims)
						r = r.WithContext(ctx)
					}
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}

// Rate limiting middleware
func RateLimit(lmt *limiter.Limiter) Middleware {
	return func(next http.Handler) http.Handler {
		return tollbooth.LimitHandler(lmt, next)
	}
}

// Request logging middleware
func RequestLogger(logger *logrus.Logger) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			// Create a response writer wrapper to capture status code
			rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

			// Add request ID
			requestID := uuid.New().String()
			ctx := context.WithValue(r.Context(), RequestIDContextKey, requestID)
			r = r.WithContext(ctx)

			// Add logger to context
			entry := logger.WithFields(logrus.Fields{
				"request_id": requestID,
				"method":     r.Method,
				"path":       r.URL.Path,
				"remote_ip":  getClientIP(r),
				"user_agent": r.UserAgent(),
			})
			ctx = context.WithValue(ctx, LoggerContextKey, entry)
			r = r.WithContext(ctx)

			next.ServeHTTP(rw, r)

			// Log the request
			entry.WithFields(logrus.Fields{
				"status":     rw.statusCode,
				"duration":   time.Since(start),
				"size":       rw.size,
			}).Info("Request completed")
		})
	}
}

// Recovery middleware
func Recovery(logger *logrus.Logger) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					logger.WithFields(logrus.Fields{
						"error": err,
						"stack": string(stack()),
					}).Error("Panic recovered")

					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusInternalServerError)
					json.NewEncoder(w).Encode(map[string]string{
						"error": "Internal server error",
					})
				}
			}()

			next.ServeHTTP(w, r)
		})
	}
}

// Content type middleware
func ContentType(contentType string) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", contentType)
			next.ServeHTTP(w, r)
		})
	}
}

// JSON content type middleware
func JSONContentType() Middleware {
	return ContentType("application/json")
}

// Security headers middleware
func SecurityHeaders() Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("X-Content-Type-Options", "nosniff")
			w.Header().Set("X-Frame-Options", "DENY")
			w.Header().Set("X-XSS-Protection", "1; mode=block")
			w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
			w.Header().Set("Content-Security-Policy", "default-src 'self'")
			next.ServeHTTP(w, r)
		})
	}
}

// Session middleware
func Session(store sessions.Store) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			session, err := store.Get(r, "ground-sense-session")
			if err != nil {
				log.Printf("Session error: %v", err)
			}

			ctx := context.WithValue(r.Context(), "session", session)
			r = r.WithContext(ctx)

			next.ServeHTTP(w, r)
		})
	}
}

// Metrics middleware
func Metrics() Middleware {
	requestsTotal := prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "endpoint", "status"},
	)

	requestDuration := prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "HTTP request duration in seconds",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "endpoint"},
	)

	prometheus.MustRegister(requestsTotal, requestDuration)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

			next.ServeHTTP(rw, r)

			duration := time.Since(start).Seconds()
			status := fmt.Sprintf("%d", rw.statusCode)

			requestsTotal.WithLabelValues(r.Method, r.URL.Path, status).Inc()
			requestDuration.WithLabelValues(r.Method, r.URL.Path).Observe(duration)
		})
	}
}

// Health check middleware
func HealthCheck(db *sql.DB) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		health := map[string]interface{}{
			"status": "healthy",
			"timestamp": time.Now().UTC(),
			"services": map[string]interface{}{
				"database": "unknown",
			},
		}

		// Check database connection
		if err := db.Ping(); err != nil {
			health["status"] = "unhealthy"
			health.(map[string]interface{})["services"].(map[string]interface{})["database"] = "unhealthy"
			w.WriteHeader(http.StatusServiceUnavailable)
		} else {
			health.(map[string]interface{})["services"].(map[string]interface{})["database"] = "healthy"
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(health)
	})
}

// Prometheus metrics handler
func MetricsHandler() http.Handler {
	return promhttp.Handler()
}

// Helper functions

func GetUserFromContext(ctx context.Context) (*auth.JWTClaims, bool) {
	user, ok := ctx.Value(UserContextKey).(*auth.JWTClaims)
	return user, ok
}

func GetLoggerFromContext(ctx context.Context) (*logrus.Entry, bool) {
	logger, ok := ctx.Value(LoggerContextKey).(*logrus.Entry)
	return logger, ok
}

func GetRequestIDFromContext(ctx context.Context) (string, bool) {
	requestID, ok := ctx.Value(RequestIDContextKey).(string)
	return requestID, ok
}

func getClientIP(r *http.Request) string {
	// Check X-Forwarded-For header
	xForwardedFor := r.Header.Get("X-Forwarded-For")
	if xForwardedFor != "" {
		// Take the first IP if there are multiple
		ips := strings.Split(xForwardedFor, ",")
		return strings.TrimSpace(ips[0])
	}

	// Check X-Real-IP header
	xRealIP := r.Header.Get("X-Real-IP")
	if xRealIP != "" {
		return xRealIP
	}

	// Fall back to RemoteAddr
	ip := r.RemoteAddr
	if strings.Contains(ip, ":") {
		ip, _, _ = strings.Cut(ip, ":")
	}
	return ip
}

// responseWriter wraps http.ResponseWriter to capture status code and response size
type responseWriter struct {
	http.ResponseWriter
	statusCode int
	size       int64
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(data []byte) (int, error) {
	size, err := rw.ResponseWriter.Write(data)
	rw.size += int64(size)
	return size, err
}

// stack returns the stack trace as a byte slice
func stack() []byte {
	// This is a simplified version. In production, you'd use a proper stack trace library
	return []byte("stack trace not implemented")
}
