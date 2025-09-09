package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/middleware"
	"github.com/sirupsen/logrus"
)

type FileHandler struct {
	logger      *logrus.Logger
	uploadPath  string
	maxFileSize int64
	allowedTypes map[string]bool
}

func NewFileHandler(logger *logrus.Logger) *FileHandler {
	// Create uploads directory if it doesn't exist
	uploadPath := "./uploads"
	if err := os.MkdirAll(uploadPath, 0755); err != nil {
		logger.WithError(err).Fatal("Failed to create uploads directory")
	}

	return &FileHandler{
		logger:      logger,
		uploadPath:  uploadPath,
		maxFileSize: 10 << 20, // 10MB
		allowedTypes: map[string]bool{
			"image/jpeg": true,
			"image/png":  true,
			"image/gif":  true,
			"application/pdf": true,
			"text/plain": true,
			"application/msword": true,
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
		},
	}
}

func (h *FileHandler) UploadFile(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	// Parse multipart form
	err := r.ParseMultipartForm(h.maxFileSize)
	if err != nil {
		h.respondWithError(w, http.StatusBadRequest, "Failed to parse form")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		h.respondWithError(w, http.StatusBadRequest, "No file provided")
		return
	}
	defer file.Close()

	// Validate file size
	if header.Size > h.maxFileSize {
		h.respondWithError(w, http.StatusBadRequest, "File too large")
		return
	}

	// Validate file type
	contentType := header.Header.Get("Content-Type")
	if !h.allowedTypes[contentType] {
		h.respondWithError(w, http.StatusBadRequest, "File type not allowed")
		return
	}

	// Generate unique filename
	fileID := uuid.New()
	ext := filepath.Ext(header.Filename)
	filename := fmt.Sprintf("%s%s", fileID.String(), ext)
	filePath := filepath.Join(h.uploadPath, filename)

	// Create destination file
	dst, err := os.Create(filePath)
	if err != nil {
		h.logger.WithError(err).Error("Failed to create file")
		h.respondWithError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}
	defer dst.Close()

	// Copy file content
	_, err = io.Copy(dst, file)
	if err != nil {
		h.logger.WithError(err).Error("Failed to copy file")
		h.respondWithError(w, http.StatusInternalServerError, "Failed to save file")
		return
	}

	// Return file info
	fileInfo := map[string]interface{}{
		"id":           fileID.String(),
		"filename":     header.Filename,
		"size":         header.Size,
		"content_type": contentType,
		"url":          fmt.Sprintf("/api/v1/files/%s", fileID.String()),
		"uploaded_by":  claims.UserID.String(),
		"uploaded_at":  time.Now(),
	}

	h.logger.WithFields(logrus.Fields{
		"user_id":  claims.UserID.String(),
		"file_id":  fileID.String(),
		"filename": header.Filename,
		"size":     header.Size,
	}).Info("File uploaded successfully")

	h.respondWithJSON(w, http.StatusCreated, fileInfo)
}

func (h *FileHandler) GetFile(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	fileID := vars["id"]

	if fileID == "" {
		h.respondWithError(w, http.StatusBadRequest, "File ID is required")
		return
	}

	// Find file by ID (this is a simplified version)
	// In production, you'd query the database for file metadata
	files, err := filepath.Glob(filepath.Join(h.uploadPath, fileID+"*"))
	if err != nil || len(files) == 0 {
		h.respondWithError(w, http.StatusNotFound, "File not found")
		return
	}

	filePath := files[0]

	// Open file
	file, err := os.Open(filePath)
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Failed to open file")
		return
	}
	defer file.Close()

	// Get file info
	stat, err := file.Stat()
	if err != nil {
		h.respondWithError(w, http.StatusInternalServerError, "Failed to get file info")
		return
	}

	// Detect content type
	ext := filepath.Ext(filePath)
	contentType := h.getContentType(ext)

	// Set headers
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Length", fmt.Sprintf("%d", stat.Size()))
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filepath.Base(filePath)))

	// Stream file
	io.Copy(w, file)
}

func (h *FileHandler) DeleteFile(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.GetUserFromContext(r.Context())
	if !ok {
		h.respondWithError(w, http.StatusUnauthorized, "User not authenticated")
		return
	}

	vars := mux.Vars(r)
	fileID := vars["id"]

	if fileID == "" {
		h.respondWithError(w, http.StatusBadRequest, "File ID is required")
		return
	}

	// Find and delete file
	files, err := filepath.Glob(filepath.Join(h.uploadPath, fileID+"*"))
	if err != nil || len(files) == 0 {
		h.respondWithError(w, http.StatusNotFound, "File not found")
		return
	}

	filePath := files[0]
	err = os.Remove(filePath)
	if err != nil {
		h.logger.WithError(err).Error("Failed to delete file")
		h.respondWithError(w, http.StatusInternalServerError, "Failed to delete file")
		return
	}

	h.logger.WithFields(logrus.Fields{
		"user_id": claims.UserID.String(),
		"file_id": fileID,
	}).Info("File deleted successfully")

	h.respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "File deleted successfully",
	})
}

func (h *FileHandler) getContentType(ext string) string {
	switch strings.ToLower(ext) {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".pdf":
		return "application/pdf"
	case ".txt":
		return "text/plain"
	case ".doc":
		return "application/msword"
	case ".docx":
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	default:
		return "application/octet-stream"
	}
}

func (h *FileHandler) respondWithJSON(w http.ResponseWriter, status int, payload interface{}) {
	response := map[string]interface{}{
		"success": true,
		"data":    payload,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(response)
}

func (h *FileHandler) respondWithError(w http.ResponseWriter, status int, message string) {
	response := map[string]interface{}{
		"success": false,
		"error":   message,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(response)
}
