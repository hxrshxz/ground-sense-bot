package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/routes"
)

func main() {
	r := mux.NewRouter()
	routes.RegisterRoutes(r)

	log.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
