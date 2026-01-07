package middleware

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"
)

// ==================== CSRF PROTECTION ====================

// CSRFToken generates a cryptographically secure CSRF token
func GenerateCSRFToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", fmt.Errorf("failed to generate CSRF token: %w", err)
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// CSRFMiddleware validates CSRF tokens for state-changing operations
func CSRFMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// CSRF protection only for state-changing methods
		if r.Method == "POST" || r.Method == "PUT" || r.Method == "PATCH" || r.Method == "DELETE" {
			// Get token from header or form
			tokenFromHeader := r.Header.Get("X-CSRF-Token")
			if tokenFromHeader == "" {
				tokenFromHeader = r.FormValue("csrf_token")
			}

			if tokenFromHeader == "" {
				log.Printf("🔒 CSRF protection: Missing token for %s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)
				respondError(w, http.StatusForbidden, "CSRF token required")
				return
			}

			// Validate token (should be stored in session/cookie)
			session, err := r.Cookie("_csrf_session")
			if err != nil {
				log.Printf("🔒 CSRF protection: Missing session for %s %s", r.Method, r.URL.Path)
				respondError(w, http.StatusForbidden, "Invalid session")
				return
			}

			if session.Value != tokenFromHeader {
				log.Printf("🔒 CSRF protection: Token mismatch for %s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)
				respondError(w, http.StatusForbidden, "Invalid CSRF token")
				return
			}
		}

		next.ServeHTTP(w, r)
	})
}

// CSRFTokenHandler returns a CSRF token for the client
func CSRFTokenHandler(w http.ResponseWriter, r *http.Request) {
	token, err := GenerateCSRFToken()
	if err != nil {
		log.Printf("🔒 CSRF: Failed to generate token: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	// Set secure cookie with CSRF token
	http.SetCookie(w, &http.Cookie{
		Name:     "_csrf_session",
		Value:    token,
		MaxAge:   3600, // 1 hour
		Path:     "/",
		HttpOnly: true,
		Secure:   os.Getenv("ENV") == "production", // HTTPS only in production
		SameSite: http.SameSiteLaxMode,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"csrf_token": token,
	})
}

// ==================== RATE LIMITING ====================

type RateLimiter struct {
	mu       sync.RWMutex
	requests map[string][]time.Time
	limit    int
	window   time.Duration
}

func NewRateLimiter(requestsPerMinute int) *RateLimiter {
	return &RateLimiter{
		requests: make(map[string][]time.Time),
		limit:    requestsPerMinute,
		window:   time.Minute,
	}
}

func (rl *RateLimiter) Allow(identifier string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	key := identifier

	// Clean old requests
	if times, exists := rl.requests[key]; exists {
		// Keep only requests within the window
		var filtered []time.Time
		for _, t := range times {
			if now.Sub(t) < rl.window {
				filtered = append(filtered, t)
			}
		}
		rl.requests[key] = filtered

		// Check if limit exceeded
		if len(filtered) >= rl.limit {
			return false
		}
	}

	// Add current request
	rl.requests[key] = append(rl.requests[key], now)
	return true
}

// RateLimitingMiddleware enforces per-IP rate limiting
var ipLimiter = NewRateLimiter(100) // 100 requests per minute per IP

func RateLimitingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get client IP
		clientIP := r.Header.Get("X-Forwarded-For")
		if clientIP == "" {
			clientIP = r.Header.Get("X-Real-IP")
		}
		if clientIP == "" {
			clientIP = r.RemoteAddr
		}

		// Check rate limit
		if !ipLimiter.Allow(clientIP) {
			log.Printf("⚠️  Rate limit exceeded for IP: %s", clientIP)
			w.Header().Set("Retry-After", "60")
			respondError(w, http.StatusTooManyRequests, "Rate limit exceeded. Please try again later.")
			return
		}

		next.ServeHTTP(w, r)
	})
}

// ==================== SECURITY HEADERS ====================

// SecurityHeadersMiddleware adds security headers to all responses
func SecurityHeadersMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Prevent MIME type sniffing
		w.Header().Set("X-Content-Type-Options", "nosniff")

		// Enable XSS protection
		w.Header().Set("X-XSS-Protection", "1; mode=block")

		// Clickjacking protection
		w.Header().Set("X-Frame-Options", "DENY")

		// Referrer policy
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")

		// Feature policy
		w.Header().Set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

		// HSTS for HTTPS
		if os.Getenv("ENV") == "production" {
			w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		}

		next.ServeHTTP(w, r)
	})
}

// ==================== ACCOUNT LOCKOUT ====================

type AccountLockout struct {
	mu           sync.RWMutex
	attempts     map[string][]time.Time
	maxAttempts  int
	lockDuration time.Duration
}

func NewAccountLockout(maxAttempts int, lockDuration time.Duration) *AccountLockout {
	return &AccountLockout{
		attempts:     make(map[string][]time.Time),
		maxAttempts:  maxAttempts,
		lockDuration: lockDuration,
	}
}

func (al *AccountLockout) RecordFailedAttempt(username string) {
	al.mu.Lock()
	defer al.mu.Unlock()

	al.attempts[username] = append(al.attempts[username], time.Now())
}

func (al *AccountLockout) IsLocked(username string) bool {
	al.mu.RLock()
	defer al.mu.RUnlock()

	attempts, exists := al.attempts[username]
	if !exists || len(attempts) < al.maxAttempts {
		return false
	}

	// Check if recent attempts exist
	now := time.Now()
	recentAttempts := 0
	for _, t := range attempts {
		if now.Sub(t) < al.lockDuration {
			recentAttempts++
		}
	}

	return recentAttempts >= al.maxAttempts
}

func (al *AccountLockout) ResetFailedAttempts(username string) {
	al.mu.Lock()
	defer al.mu.Unlock()

	delete(al.attempts, username)
}

var accountLockout = NewAccountLockout(5, 15*time.Minute) // Lock after 5 attempts for 15 minutes

// ==================== AUDIT LOGGING ====================

type AuditLog struct {
	Timestamp string `json:"timestamp"`
	EventType string `json:"event_type"` // login, logout, incident_edit, role_change
	UserID    string `json:"user_id"`
	Username  string `json:"username"`
	Action    string `json:"action"`
	Details   string `json:"details"`
	IPAddress string `json:"ip_address"`
	Success   bool   `json:"success"`
}

func LogAuditEvent(eventType, userID, username, action, details, ipAddress string, success bool) {
	// Log to stdout with structured format
	log.Printf("[AUDIT] %s | Event: %s | User: %s (%s) | Action: %s | IP: %s | Success: %v | Details: %s",
		time.Now().Format(time.RFC3339),
		eventType,
		username,
		userID,
		action,
		ipAddress,
		success,
		details,
	)
}
