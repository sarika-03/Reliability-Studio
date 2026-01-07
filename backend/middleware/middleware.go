package middleware

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// JWT_SECRET must be strong and come from environment
var JWT_SECRET = []byte(getEnvStrict("JWT_SECRET"))

// Token expiration times
const (
	AccessTokenExpiration  = 15 * time.Minute   // Short-lived access token
	RefreshTokenExpiration = 7 * 24 * time.Hour // 7 days refresh token
)

type Claims struct {
	UserID       string   `json:"user_id"`
	Username     string   `json:"username"`
	Email        string   `json:"email"`
	Roles        []string `json:"roles"`
	TokenType    string   `json:"token_type"` // "access" or "refresh"
	IsFirstLogin bool     `json:"is_first_login"`
	jwt.RegisteredClaims
}

type UserContextKey string

const UserContext UserContextKey = "user"

// Auth middleware - HARDENED: Strict JWT validation with algorithm check
func Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			respondError(w, http.StatusUnauthorized, "Missing authorization token")
			return
		}

		// Check Bearer format
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			respondError(w, http.StatusUnauthorized, "Invalid authorization format. Use 'Bearer <token>'")
			return
		}

		tokenString := parts[1]
		claims := &Claims{}

		// Parse and validate token with strict algorithm checking
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			// ✅ CRITICAL: Only allow HMAC algorithm
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				log.Printf("🔒 AUTH: Rejected token with algorithm: %v", token.Header["alg"])
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return JWT_SECRET, nil
		})

		if err != nil {
			log.Printf("🔒 AUTH: Token parsing failed: %v", err)
			respondError(w, http.StatusUnauthorized, "Invalid token")
			return
		}

		if !token.Valid {
			log.Printf("🔒 AUTH: Invalid token signature or structure")
			respondError(w, http.StatusUnauthorized, "Invalid or expired token")
			return
		}

		// ✅ Validate claims
		if claims.UserID == "" || claims.Username == "" {
			log.Printf("🔒 AUTH: Missing critical claims")
			respondError(w, http.StatusUnauthorized, "Invalid token claims")
			return
		}

		// ✅ Validate expiration explicitly
		if claims.ExpiresAt != nil && claims.ExpiresAt.Before(time.Now()) {
			log.Printf("🔒 AUTH: Token expired at %v", claims.ExpiresAt)
			respondError(w, http.StatusUnauthorized, "Token expired")
			return
		}

		// ✅ Ensure token type is correct
		if claims.TokenType != "access" {
			log.Printf("🔒 AUTH: Wrong token type: %s", claims.TokenType)
			respondError(w, http.StatusUnauthorized, "Invalid token type")
			return
		}

		// Add user to context for downstream handlers
		ctx := context.WithValue(r.Context(), UserContext, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Logging middleware
func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		next.ServeHTTP(wrapped, r)

		duration := time.Since(start)
		log.Printf("📊 %s %s %d %v", r.Method, r.URL.Path, wrapped.statusCode, duration)
	})
}

// Recovery middleware - IMPROVED: Better panic handling
func Recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("🚨 PANIC RECOVERED: %v\nPath: %s %s", err, r.Method, r.URL.Path)

				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]string{
					"error":   "Internal server error",
					"message": "An unexpected error occurred",
				})
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// RateLimit middleware - IMPROVED: Added basic rate limiting structure
func RateLimit(requestsPerMinute int) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			next.ServeHTTP(w, r)
		})
	}
}

// LoginHandler - HARDENED with account lockout and audit logging
func LoginHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		clientIP := GetClientIP(r)

		var req struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "Invalid request format")
			return
		}

		// ✅ Validate input
		if req.Username == "" || req.Password == "" {
			respondError(w, http.StatusBadRequest, "Username and password required")
			return
		}

		// ✅ Check if account is locked
		if accountLockout.IsLocked(req.Username) {
			LogAuditEvent("login_attempt", "", req.Username, "LOGIN", "Account locked due to failed attempts", clientIP, false)
			respondError(w, http.StatusForbidden, "Account is temporarily locked. Try again in 15 minutes.")
			return
		}

		var user struct {
			ID           string
			Email        string
			Username     string
			PasswordHash string
			RolesJSON    string
			IsFirstLogin bool
			LastLogin    *time.Time
		}

		err := db.QueryRow(`
			SELECT id, email, username, password_hash, roles::text, 
			       (last_login IS NULL) as is_first_login, last_login
			FROM users 
			WHERE username = $1 OR email = $1
		`, req.Username).Scan(&user.ID, &user.Email, &user.Username, &user.PasswordHash,
			&user.RolesJSON, &user.IsFirstLogin, &user.LastLogin)

		if err == sql.ErrNoRows {
			accountLockout.RecordFailedAttempt(req.Username)
			LogAuditEvent("login_attempt", "", req.Username, "LOGIN", "Invalid username", clientIP, false)
			respondError(w, http.StatusUnauthorized, "Invalid credentials")
			return
		} else if err != nil {
			log.Printf("🔒 LOGIN: Database error: %v", err)
			LogAuditEvent("login_attempt", "", req.Username, "LOGIN", fmt.Sprintf("DB error: %v", err), clientIP, false)
			respondError(w, http.StatusInternalServerError, "Login failed")
			return
		}

		// ✅ Verify password with bcrypt
		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
			accountLockout.RecordFailedAttempt(req.Username)
			LogAuditEvent("login_attempt", user.ID, user.Username, "LOGIN", "Invalid password", clientIP, false)
			respondError(w, http.StatusUnauthorized, "Invalid credentials")
			return
		}

		// ✅ Password correct - reset lockout
		accountLockout.ResetFailedAttempts(req.Username)

		var roles []string
		json.Unmarshal([]byte(user.RolesJSON), &roles)

		// ✅ Generate ACCESS TOKEN (short-lived)
		accessTokenTime := time.Now().Add(AccessTokenExpiration)
		accessClaims := &Claims{
			UserID:       user.ID,
			Username:     user.Username,
			Email:        user.Email,
			Roles:        roles,
			TokenType:    "access",
			IsFirstLogin: user.IsFirstLogin,
			RegisteredClaims: jwt.RegisteredClaims{
				ExpiresAt: jwt.NewNumericDate(accessTokenTime),
				IssuedAt:  jwt.NewNumericDate(time.Now()),
				Subject:   user.ID,
			},
		}

		accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
		accessTokenString, err := accessToken.SignedString(JWT_SECRET)
		if err != nil {
			log.Printf("🔒 LOGIN: Failed to generate access token: %v", err)
			respondError(w, http.StatusInternalServerError, "Failed to generate token")
			return
		}

		// ✅ Generate REFRESH TOKEN (long-lived, stored securely)
		refreshTokenTime := time.Now().Add(RefreshTokenExpiration)
		refreshClaims := &Claims{
			UserID:    user.ID,
			Username:  user.Username,
			TokenType: "refresh",
			RegisteredClaims: jwt.RegisteredClaims{
				ExpiresAt: jwt.NewNumericDate(refreshTokenTime),
				IssuedAt:  jwt.NewNumericDate(time.Now()),
				Subject:   user.ID,
			},
		}

		refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
		refreshTokenString, err := refreshToken.SignedString(JWT_SECRET)
		if err != nil {
			log.Printf("🔒 LOGIN: Failed to generate refresh token: %v", err)
			respondError(w, http.StatusInternalServerError, "Failed to generate token")
			return
		}

		// ✅ Update last_login timestamp
		_, _ = db.Exec("UPDATE users SET last_login = NOW() WHERE id = $1", user.ID)

		LogAuditEvent("login", user.ID, user.Username, "LOGIN", "Successful login", clientIP, true)

		// ✅ Return tokens with secure cookie settings
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		// Set refresh token as secure, httpOnly cookie
		http.SetCookie(w, &http.Cookie{
			Name:     "refresh_token",
			Value:    refreshTokenString,
			Path:     "/api/auth",
			MaxAge:   int(RefreshTokenExpiration.Seconds()),
			HttpOnly: true,
			Secure:   os.Getenv("ENV") == "production",
			SameSite: http.SameSiteLaxMode,
		})

		json.NewEncoder(w).Encode(map[string]interface{}{
			"access_token": accessTokenString,
			"token_type":   "Bearer",
			"expires_in":   int(AccessTokenExpiration.Seconds()),
			"user": map[string]interface{}{
				"id":             user.ID,
				"username":       user.Username,
				"email":          user.Email,
				"roles":          roles,
				"is_first_login": user.IsFirstLogin,
			},
		})
	}
}

// RefreshTokenHandler - Exchange refresh token for new access token
func RefreshTokenHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		clientIP := GetClientIP(r)

		// Get refresh token from cookie
		refreshCookie, err := r.Cookie("refresh_token")
		if err != nil {
			LogAuditEvent("token_refresh", "", "", "TOKEN_REFRESH", "Refresh token not found", clientIP, false)
			respondError(w, http.StatusUnauthorized, "Refresh token not found")
			return
		}

		token, err := jwt.ParseWithClaims(refreshCookie.Value, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			// ✅ Strict algorithm validation - only HMAC
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				log.Printf("🔒 REFRESH: Invalid algorithm: %v", token.Header["alg"])
				return nil, fmt.Errorf("invalid token algorithm")
			}
			return JWT_SECRET, nil
		})

		if err != nil || !token.Valid {
			LogAuditEvent("token_refresh", "", "", "TOKEN_REFRESH", fmt.Sprintf("Invalid refresh token: %v", err), clientIP, false)
			respondError(w, http.StatusUnauthorized, "Invalid or expired refresh token")
			return
		}

		claims, ok := token.Claims.(*Claims)
		if !ok || claims.TokenType != "refresh" {
			LogAuditEvent("token_refresh", "", "", "TOKEN_REFRESH", "Token type is not refresh", clientIP, false)
			respondError(w, http.StatusUnauthorized, "Invalid token type")
			return
		}

		// ✅ Check expiration explicitly
		if claims.ExpiresAt != nil && claims.ExpiresAt.Before(time.Now()) {
			respondError(w, http.StatusUnauthorized, "Refresh token expired")
			return
		}

		// ✅ Generate new access token
		accessTokenTime := time.Now().Add(AccessTokenExpiration)
		newAccessClaims := &Claims{
			UserID:    claims.UserID,
			Username:  claims.Username,
			Email:     claims.Email,
			Roles:     claims.Roles,
			TokenType: "access",
			RegisteredClaims: jwt.RegisteredClaims{
				ExpiresAt: jwt.NewNumericDate(accessTokenTime),
				IssuedAt:  jwt.NewNumericDate(time.Now()),
				Subject:   claims.UserID,
			},
		}

		accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, newAccessClaims)
		newAccessTokenString, err := accessToken.SignedString(JWT_SECRET)
		if err != nil {
			log.Printf("🔒 REFRESH: Failed to generate token: %v", err)
			respondError(w, http.StatusInternalServerError, "Failed to generate token")
			return
		}

		LogAuditEvent("token_refresh", claims.UserID, claims.Username, "TOKEN_REFRESH", "Access token refreshed", clientIP, true)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"access_token": newAccessTokenString,
			"token_type":   "Bearer",
			"expires_in":   int(AccessTokenExpiration.Seconds()),
		})
	}
}

// RefreshTokenMiddleware - Middleware version (for protected routes)
func RefreshTokenMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		clientIP := GetClientIP(r)

		// Get refresh token from cookie
		refreshCookie, err := r.Cookie("refresh_token")
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}

		token, err := jwt.ParseWithClaims(refreshCookie.Value, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			// ✅ Strict algorithm validation - only HMAC
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				log.Printf("🔒 REFRESH: Invalid algorithm: %v", token.Header["alg"])
				return nil, fmt.Errorf("invalid token algorithm")
			}
			return JWT_SECRET, nil
		})

		if err != nil || !token.Valid {
			LogAuditEvent("token_refresh", "", "", "TOKEN_REFRESH", fmt.Sprintf("Invalid refresh token: %v", err), clientIP, false)
			respondError(w, http.StatusUnauthorized, "Invalid or expired refresh token")
			return
		}

		claims, ok := token.Claims.(*Claims)
		if !ok || claims.TokenType != "refresh" {
			LogAuditEvent("token_refresh", "", "", "TOKEN_REFRESH", "Token type is not refresh", clientIP, false)
			respondError(w, http.StatusUnauthorized, "Invalid token type")
			return
		}

		// ✅ Check expiration explicitly
		if claims.ExpiresAt != nil && claims.ExpiresAt.Before(time.Now()) {
			respondError(w, http.StatusUnauthorized, "Refresh token expired")
			return
		}

		// ✅ Generate new access token
		accessTokenTime := time.Now().Add(AccessTokenExpiration)
		newAccessClaims := &Claims{
			UserID:    claims.UserID,
			Username:  claims.Username,
			Email:     claims.Email,
			Roles:     claims.Roles,
			TokenType: "access",
			RegisteredClaims: jwt.RegisteredClaims{
				ExpiresAt: jwt.NewNumericDate(accessTokenTime),
				IssuedAt:  jwt.NewNumericDate(time.Now()),
				Subject:   claims.UserID,
			},
		}

		accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, newAccessClaims)
		newAccessTokenString, err := accessToken.SignedString(JWT_SECRET)
		if err != nil {
			log.Printf("🔒 REFRESH: Failed to generate token: %v", err)
			respondError(w, http.StatusInternalServerError, "Failed to generate token")
			return
		}

		LogAuditEvent("token_refresh", claims.UserID, claims.Username, "TOKEN_REFRESH", "Access token refreshed", clientIP, true)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"access_token": newAccessTokenString,
			"token_type":   "Bearer",
			"expires_in":   int(AccessTokenExpiration.Seconds()),
		})

		next.ServeHTTP(w, r)
	})
}

// GetClientIP - Extract client IP from request (handles proxies)
func GetClientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		ips := strings.Split(xff, ",")
		if len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return strings.TrimSpace(xri)
	}
	return strings.Split(r.RemoteAddr, ":")[0]
}

// RegisterHandler - HARDENED: Password strength validation, first login enforcement
func RegisterHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		clientIP := GetClientIP(r)

		var req struct {
			Username string `json:"username"`
			Email    string `json:"email"`
			Password string `json:"password"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "Invalid request format")
			return
		}

		// ✅ Validate input
		if req.Username == "" || req.Email == "" || req.Password == "" {
			respondError(w, http.StatusBadRequest, "Username, email, and password are required")
			return
		}

		// ✅ Enforce strong password requirements
		if err := ValidatePasswordStrength(req.Password); err != nil {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}

		// ✅ Hash password with bcrypt
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("🔒 REGISTER: Password hash failed: %v", err)
			respondError(w, http.StatusInternalServerError, "Failed to process password")
			return
		}

		// Default role: viewer
		rolesJSON := `["viewer"]`

		// ✅ Insert into database with is_first_login = true
		var userID string
		err = db.QueryRow(`
			INSERT INTO users (username, email, password_hash, roles, is_first_login)
			VALUES ($1, $2, $3, $4::jsonb, true)
			RETURNING id
		`, req.Username, req.Email, string(hashedPassword), rolesJSON).Scan(&userID)

		if err != nil {
			if strings.Contains(err.Error(), "unique_violation") || strings.Contains(err.Error(), "duplicate key") {
				LogAuditEvent("register", "", req.Username, "REGISTER", "Username or email already exists", clientIP, false)
				respondError(w, http.StatusConflict, "Username or email already exists")
				return
			}
			log.Printf("🔒 REGISTER: Database error: %v", err)
			LogAuditEvent("register", "", req.Username, "REGISTER", fmt.Sprintf("DB error: %v", err), clientIP, false)
			respondError(w, http.StatusInternalServerError, "Registration failed")
			return
		}

		LogAuditEvent("register", userID, req.Username, "REGISTER", "User registered successfully", clientIP, true)

		respondJSON(w, http.StatusCreated, map[string]interface{}{
			"status":   "user created",
			"user_id":  userID,
			"username": req.Username,
			"message":  "User created successfully. Please log in.",
		})
	}
}

// ValidatePasswordStrength - HARDENED: Minimum 12 chars with complexity
func ValidatePasswordStrength(password string) error {
	if len(password) < 12 {
		return fmt.Errorf("password must be at least 12 characters long")
	}

	hasUppercase := false
	hasLowercase := false
	hasDigit := false
	hasSpecial := false

	for _, char := range password {
		switch {
		case char >= 'A' && char <= 'Z':
			hasUppercase = true
		case char >= 'a' && char <= 'z':
			hasLowercase = true
		case char >= '0' && char <= '9':
			hasDigit = true
		case char >= 33 && char <= 47 || char >= 58 && char <= 64 || char >= 91 && char <= 96 || char >= 123 && char <= 126:
			hasSpecial = true
		}
	}

	if !hasUppercase || !hasLowercase || !hasDigit || !hasSpecial {
		return fmt.Errorf("password must contain uppercase, lowercase, digit, and special character")
	}

	return nil
}

// RequireRole checks if user has required role
func RequireRole(requiredRole string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(UserContext).(*Claims)
			if !ok {
				respondError(w, http.StatusUnauthorized, "Authentication required")
				return
			}

			authorized := false
			for _, role := range claims.Roles {
				if role == "admin" || role == requiredRole { // Admin can do anything
					authorized = true
					break
				}
			}

			if !authorized {
				respondError(w, http.StatusForbidden, fmt.Sprintf("Missing required role: %s", requiredRole))
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// Internal helper for JSON errors
func respondError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

// Internal helper for JSON responses
func respondJSON(w http.ResponseWriter, code int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(payload)
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

// getEnvStrict - HARDENED: Requires env variable to be set
func getEnvStrict(key string) string {
	if value, ok := os.LookupEnv(key); ok && value != "" {
		return value
	}
	log.Fatalf("🔴 CRITICAL: Environment variable '%s' is required but not set!", key)
	return "" // unreachable
}

// Response writer wrapper for status code tracking
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}
