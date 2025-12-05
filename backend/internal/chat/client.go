package chat

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/models"
)

type Client struct {
	Hub      *Hub
	Conn     *websocket.Conn
	Username string
	Send     chan models.Message
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	// For simplicity, we'll use a query param for username.
	username := r.URL.Query().Get("username")
	if username == "" {
		username = "Anonymous"
	}

	client := &Client{Hub: hub, Conn: conn, Username: username, Send: make(chan models.Message, 256)}
	client.Hub.Register <- client

	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()
	for {
		var msg models.Message
		if err := c.Conn.ReadJSON(&msg); err != nil {
			log.Println(err)
			break
		}
		msg.Username = c.Username
		msg.Type = "text" // Ensure type is set
		c.Hub.Broadcast <- msg
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

