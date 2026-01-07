# Reliability Studio

**Reliability Studio** is a production-ready Grafana App plugin that provides a unified workspace for SRE & DevOps teams to investigate incidents, track SLOs, and correlate metrics, logs, traces, and Kubernetes failures.

## Features

- **Incident Management** - Full lifecycle management from detection to resolution
- **SLO & Error Budget Tracking** - Monitor service level objectives with real-time error budget calculation
- **Kubernetes Integration** - Pod failures, deployment health, and cluster status
- **Correlation Engine** - Automatically correlate metrics, logs, traces, and K8s events
- **Timeline View** - Comprehensive incident timeline with all relevant telemetry
- **Multi-Source Integration** - Prometheus, Loki, Tempo, and Kubernetes support
- **Security Hardened** - Production-grade security with JWT, CSRF, rate limiting, and audit logging

## Project Structure

```
.
├── src/                    # React frontend (TypeScript)
│   ├── app/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── api/           # API clients
│   │   └── models/        # Data models
│   └── main.tsx           # Frontend entry point
├── backend/               # Go backend
│   ├── main.go           # Application entry point
│   ├── handlers/         # HTTP handlers
│   ├── middleware/       # Auth, CSRF, rate limiting, security
│   ├── services/         # Business logic (SLO, incident, correlation)
│   ├── clients/          # External service clients (Prometheus, Loki, K8s)
│   ├── correlation/      # Incident correlation engine
│   ├── database/         # Database schema and operations
│   ├── models/           # Data models
│   └── config/           # Configuration management
├── docker/               # Docker Compose setup
│   ├── docker-compose.yml
│   ├── prometheus.yml
│   ├── loki.yml
│   └── tempo.yml
└── docs/                 # Documentation
```

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for bundling
- Grafana UI components
- React Router for navigation

**Backend:**
- Go 1.21+
- PostgreSQL for data persistence
- Prometheus client library
- Kubernetes client library
- JWT for authentication

**Data Sources:**
- Prometheus (metrics)
- Loki (logs)
- Tempo (traces)
- Kubernetes API (cluster state)

## Local Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Go 1.21+

### Quick Start

```bash
# Clone the repository
git clone https://github.com/sarika2428/Reliability-Studio.git
cd Reliability-Studio

# Start services with Docker Compose
cd docker
docker compose up -d

# Install frontend dependencies
cd ..
npm install

# Install backend dependencies
cd backend
go mod download

# Run development server
npm run dev

# Run backend
cd backend
go run main.go
```

The application will be available at `http://localhost:3000`

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=reliability_studio

# JWT
JWT_SECRET=$(openssl rand -base64 32)

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Security
ENV=development
RATE_LIMIT_PER_MINUTE=100
```

### Prometheus, Loki, Tempo

Configuration files are provided in `docker/` directory:
- `prometheus.yml` - Prometheus scrape configuration
- `loki.yml` - Loki logging configuration
- `tempo.yml` - Tempo tracing configuration

## API Documentation

### Authentication Endpoints

```
POST   /api/auth/register    - Register new user
POST   /api/auth/login       - Login and get JWT tokens
POST   /api/auth/refresh     - Refresh access token
GET    /api/csrf-token       - Get CSRF token
```

### Incident Endpoints

```
GET    /api/incidents        - List all incidents
GET    /api/incidents/:id    - Get incident details
POST   /api/incidents        - Create incident
PUT    /api/incidents/:id    - Update incident
DELETE /api/incidents/:id    - Delete incident
GET    /api/incidents/:id/timeline - Get incident timeline
```

### SLO Endpoints

```
GET    /api/slos             - List all SLOs
GET    /api/slos/:id         - Get SLO details
POST   /api/slos             - Create SLO
PUT    /api/slos/:id         - Update SLO
DELETE /api/slos/:id         - Delete SLO
```

### Correlation Endpoints

```
POST   /api/correlations     - Correlate incident with telemetry
GET    /api/correlations/:id - Get correlation results
```

## Security Features

- [OK] JWT authentication with HMAC-SHA256
- [OK] Account lockout after 5 failed login attempts
- [OK] CSRF token validation on state-changing operations
- [OK] Rate limiting (100 requests/minute by default)
- [OK] Security headers (CSP, HSTS, X-Frame-Options, etc.)
- [OK] Password validation (12+ chars, mixed case, digits, special chars)
- [OK] Audit logging of all security events
- [OK] CORS hardening with environment-controlled origins
- [OK] Secure cookies with HttpOnly, Secure, SameSite flags
- [OK] No hardcoded secrets (all from environment variables)

See [SECURITY.md](https://github.com/sarika-03/Reliability-Studio/blob/main/SECURITY.md) for detailed security documentation.

## Production Deployment

### Pre-Deployment Checklist

- [ ] Set `ENV=production`
- [ ] Generate strong `JWT_SECRET` (minimum 32 characters)
- [ ] Configure PostgreSQL with strong credentials
- [ ] Set up HTTPS/TLS certificates
- [ ] Configure CORS_ALLOWED_ORIGINS for your domain
- [ ] Review and customize security headers
- [ ] Set up monitoring and alerting
- [ ] Run database migrations
- [ ] Test all authentication flows

### Docker Production Build

```bash
# Build production images
docker build -t reliability-studio-backend:latest ./backend
docker build -t reliability-studio-frontend:latest .

# Run with production environment
docker run -e ENV=production -e JWT_SECRET=<secret> reliability-studio-backend:latest
```

## Testing

### Frontend Tests

```bash
npm run test
npm run typecheck
```

### Backend Tests

```bash
cd backend
go test ./...
```

## Documentation

- [SECURITY.md](https://github.com/sarika-03/Reliability-Studio/blob/main/SECURITY.md) - Security implementation details
- [BACKEND_STABILITY_VERIFICATION.md](https://github.com/sarika-03/Reliability-Studio/blob/main/BACKEND_STABILITY_VERIFICATION.md) - Backend stability verification
- [PRODUCTION_OPTIMIZATIONS.md](https://github.com/sarika-03/Reliability-Studio/blob/main/PRODUCTION_OPTIMIZATIONS.md) - Production optimization guide

## Support & Contributing

For issues and feature requests, please open a GitHub issue.

For security vulnerabilities, please email security@yourdomain.com instead of using the issue tracker.

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Acknowledgments

Built for SRE teams who need unified incident investigation and SLO tracking.

---

**Status:** Production-Ready  
**Last Updated:** January 7, 2026
