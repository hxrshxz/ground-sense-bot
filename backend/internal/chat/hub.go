package chat

import (
	"context"
	"log"
	"sync"

	"github.com/hxrshxz/ground-sense-bot/backend/internal/models"
	"github.com/hxrshxz/ground-sense-bot/backend/internal/services"
)

type Hub struct {
	Clients     map[*Client]bool
	Broadcast   chan models.Message
	Register    chan *Client
	Unregister  chan *Client
	mutex       sync.Mutex
	chatService *services.ChatService
}

func NewHub(chatService *services.ChatService) *Hub {
	return &Hub{
		Clients:     make(map[*Client]bool),
		Broadcast:   make(chan models.Message),
		Register:    make(chan *Client),
		Unregister:  make(chan *Client),
		chatService: chatService,
	}
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
			// Process message with ChatService
			// We need to handle this asynchronously or synchronously?
			// For now, let's just process and broadcast the response back to the specific client (or all? Chat usually is 1-on-1 with bot)
			// Wait, the current implementation broadcasts to ALL clients.
			// If this is a chatbot, it should reply ONLY to the sender.
			// But the Hub structure implies a chatroom.
			// Let's assume for now we want to reply to the sender.
			// But the `Broadcast` channel loses the sender context.
			// We need to refactor `readPump` to send the client along with the message, or handle processing in `readPump`.
			
			// Let's modify the flow:
			// 1. Client sends message -> readPump
			// 2. readPump calls ChatService directly? Or sends to Hub?
			// If we want to keep Hub managing concurrency, we should send a struct {Client, Message} to a channel.
			
			// However, to keep it simple and compatible with the "Broadcast" name (even if it's a misnomer for a bot),
			// let's assume we broadcast user messages to everyone (chatroom style) AND bot responses to everyone.
			// OR, better: The bot replies to the room.
			
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

			// If the message is from a user, generate a bot response
			if message.Type == "text" && message.Username != "Bot" {
				go func(msg models.Message) {
					response, err := h.chatService.ProcessMessage(context.Background(), msg.Content, msg.Username)
					if err != nil {
						log.Printf("Error processing message: %v", err)
						return
					}
					
					// Debug: Log if chart is included
					if response.Chart != nil {
						log.Printf("DEBUG: Chart included in response - Type: %s, Title: %s, Series count: %d", 
							response.Chart.Type, response.Chart.Title, len(response.Chart.Series))
					} else {
						log.Printf("DEBUG: No chart in response")
					}
					
					// Wrap response in Message
					botMsg := models.Message{
						Username: "Bot",
						Type:     "response",
						Payload:  response,
						Content:  response.Text, // Fallback text
					}
					
					h.Broadcast <- botMsg
				}(message)
			}
		}
	}
}
