// Package websocket provides real-time incident updates via WebSocket
package websocket

import (
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Message represents a WebSocket message
type Message struct {
	Type    string      `json:"type"`    // "incident_created", "incident_updated", "correlation_found"
	Payload interface{} `json:"payload"`
	Timestamp int64    `json:"timestamp"`
}

// RealtimeServer manages WebSocket connections for real-time updates
type RealtimeServer struct {
	clients    map[*Client]bool
	broadcast  chan *Message
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
	logger     *log.Logger
}

// Client represents a WebSocket client
type Client struct {
	conn   *websocket.Conn
	send   chan *Message
	server *RealtimeServer
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// TODO: Validate origin in production
		return true
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// NewRealtimeServer creates a new WebSocket server
func NewRealtimeServer() *RealtimeServer {
	return &RealtimeServer{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan *Message, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		logger:     log.New(log.Writer(), "[WebSocket] ", log.LstdFlags),
	}
}

// Start begins the WebSocket server event loop
func (s *RealtimeServer) Start() {
	go func() {
		for {
			select {
			case client := <-s.register:
				s.mu.Lock()
				s.clients[client] = true
				s.mu.Unlock()
				s.logger.Printf("Client connected. Total: %d", len(s.clients))

			case client := <-s.unregister:
				s.mu.Lock()
				if _, ok := s.clients[client]; ok {
					delete(s.clients, client)
					close(client.send)
				}
				s.mu.Unlock()
				s.logger.Printf("Client disconnected. Total: %d", len(s.clients))

			case message := <-s.broadcast:
				s.mu.RLock()
				for client := range s.clients {
					select {
					case client.send <- message:
					default:
						// Client's send channel is full, close it
						close(client.send)
						delete(s.clients, client)
					}
				}
				s.mu.RUnlock()
			}
		}
	}()
}

// BroadcastIncidentCreated broadcasts a new incident to all clients
func (s *RealtimeServer) BroadcastIncidentCreated(incident interface{}) {
	s.broadcast <- &Message{
		Type:      "incident_created",
		Payload:   incident,
		Timestamp: getCurrentTimestamp(),
	}
}

// BroadcastIncidentUpdated broadcasts an incident update to all clients
func (s *RealtimeServer) BroadcastIncidentUpdated(incident interface{}) {
	s.broadcast <- &Message{
		Type:      "incident_updated",
		Payload:   incident,
		Timestamp: getCurrentTimestamp(),
	}
}

// BroadcastCorrelationFound broadcasts a new correlation to all clients
func (s *RealtimeServer) BroadcastCorrelationFound(data interface{}) {
	s.broadcast <- &Message{
		Type:      "correlation_found",
		Payload:   data,
		Timestamp: getCurrentTimestamp(),
	}
}

// BroadcastTimelineEvent broadcasts a new timeline event to all clients
func (s *RealtimeServer) BroadcastTimelineEvent(event interface{}) {
	s.broadcast <- &Message{
		Type:      "timeline_event",
		Payload:   event,
		Timestamp: getCurrentTimestamp(),
	}
}

// BroadcastARALog broadcasts an ARA log entry to all clients
func (s *RealtimeServer) BroadcastARALog(log interface{}) {
	s.broadcast <- &Message{
		Type:      "ara_log",
		Payload:   log,
		Timestamp: getCurrentTimestamp(),
	}
}

// BroadcastAlert broadcasts an alert to all clients
func (s *RealtimeServer) BroadcastAlert(alert interface{}) {
	s.broadcast <- &Message{
		Type:      "alert",
		Payload:   alert,
		Timestamp: getCurrentTimestamp(),
	}
}

// HandleWebSocket handles WebSocket connections
func (s *RealtimeServer) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		s.logger.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := &Client{
		conn:   conn,
		send:   make(chan *Message, 256),
		server: s,
	}

	s.register <- client

	// Start goroutines for reading and writing
	go client.writePump()
	go client.readPump()
}

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 512
)

// readPump reads messages from the client
func (c *Client) readPump() {
	defer func() {
		c.server.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		var msg Message
		err := c.conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				c.server.logger.Printf("WebSocket error: %v", err)
			}
			break
		}
	}
}

// writePump writes messages to the client
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The server closed the channel.
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.conn.WriteJSON(message); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// GetClientCount returns the number of connected clients
func (s *RealtimeServer) GetClientCount() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.clients)
}

// Helper functions
func getCurrentTimestamp() int64 {
	return time.Now().Unix()
}

func zeroTime() time.Time {
	return time.Time{} // Zero time means no deadline
}
