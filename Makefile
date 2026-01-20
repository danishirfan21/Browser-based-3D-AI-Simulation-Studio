.PHONY: help install dev build test clean docker-up docker-down docker-build

# Default target
help:
	@echo "Available commands:"
	@echo ""
	@echo "  Development:"
	@echo "    make install      - Install all dependencies"
	@echo "    make dev          - Start development servers"
	@echo "    make dev-backend  - Start backend only"
	@echo "    make dev-frontend - Start frontend only"
	@echo ""
	@echo "  Testing:"
	@echo "    make test         - Run all tests"
	@echo "    make test-backend - Run backend tests"
	@echo "    make lint         - Run linters"
	@echo ""
	@echo "  Build:"
	@echo "    make build        - Build for production"
	@echo "    make clean        - Clean build artifacts"
	@echo ""
	@echo "  Docker:"
	@echo "    make docker-up    - Start all services with Docker"
	@echo "    make docker-down  - Stop all Docker services"
	@echo "    make docker-build - Build Docker images"
	@echo "    make docker-logs  - View Docker logs"

# Install dependencies
install:
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Done!"

# Development servers
dev:
	@echo "Starting development servers..."
	$(MAKE) -j2 dev-backend dev-frontend

dev-backend:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm run dev

# Testing
test: test-backend

test-backend:
	cd backend && pytest -v

lint:
	cd frontend && npm run lint
	cd backend && python -m flake8 app --max-line-length=100 || true

# Build
build:
	@echo "Building frontend..."
	cd frontend && npm run build
	@echo "Build complete!"

clean:
	@echo "Cleaning build artifacts..."
	rm -rf frontend/dist
	rm -rf frontend/node_modules/.cache
	rm -rf backend/__pycache__
	rm -rf backend/.pytest_cache
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "Clean complete!"

# Docker commands
docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-build:
	docker-compose build

docker-logs:
	docker-compose logs -f

docker-restart:
	docker-compose restart

# Database
db-shell:
	docker-compose exec db psql -U postgres -d simulation_studio
