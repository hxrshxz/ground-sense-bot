package chat

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/models"
)

type Client struct {
	Conn     *websocket.Conn
	Username string
	Send     chan models.Message
}

type Hub struct {
	Clients    map[*Client]bool
	Broadcast  chan models.Message
	Register   chan *Client
	Unregister chan *Client
	mutex      sync.Mutex
}

var hub = Hub{
	Clients:    make(map[*Client]bool),
	Broadcast:  make(chan models.Message),
	Register:   make(chan *Client),
	Unregister: make(chan *Client),
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mutex.Lock()
			h.Clients[client] = true
			h.mutex.Unlock()
			log.Printf("Client %s connected", client.Username)
		case client := <-h.Unregister:
			h.mutex.Lock()
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)
				log.Printf("Client %s disconnected", client.Username)
			}
			h.mutex.Unlock()
		case message := <-h.Broadcast:
			h.mutex.Lock()
			for client := range h.Clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.Clients, client)
				}
			}
			h.mutex.Unlock()
		}
	}
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func ServeWs(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	// For simplicity, we'll use a query param for username. In a real app, you'd get this from the token.
	username := r.URL.Query().Get("username")
	if username == "" {
		username = "Anonymous"
	}

	client := &Client{Conn: conn, Username: username, Send: make(chan models.Message, 256)}
	hub.Register <- client

	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		hub.Unregister <- c
		c.Conn.Close()
	}()
	for {
		var msg models.Message
		if err := c.Conn.ReadJSON(&msg); err != nil {
			log.Println(err)
			break
		}
		msg.Username = c.Username
		hub.Broadcast <- msg
	}
}

func (c *Client) writePump() {
	defer c.Conn.Close()
	for message := range c.Send {
		if err := c.Conn.WriteJSON(message); err != nil {
			log.Println(err)
			return
		}
	}
}

func GetHub() *Hub {
	return &hub
}
