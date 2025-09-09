package routes

import (
	"github.com/gorilla/mux"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/chat"
)

func RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/ws", chat.ServeWs)
	go chat.GetHub().Run()
}
