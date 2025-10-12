.PHONY: help up down restart build logs logs-backend logs-frontend logs-db clean test

# Colors for terminal output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Gitzen Development Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

up: ## Start all services
	@echo "$(BLUE)Starting Gitzen services...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✅ Services started!$(NC)"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend:  http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"

up-logs: ## Start all services with logs
	@echo "$(BLUE)Starting Gitzen services...$(NC)"
	docker-compose up

down: ## Stop all services
	@echo "$(BLUE)Stopping Gitzen services...$(NC)"
	docker-compose down
	@echo "$(GREEN)✅ Services stopped!$(NC)"

restart: ## Restart all services
	@echo "$(BLUE)Restarting Gitzen services...$(NC)"
	docker-compose restart
	@echo "$(GREEN)✅ Services restarted!$(NC)"

build: ## Rebuild all services
	@echo "$(BLUE)Rebuilding Gitzen services...$(NC)"
	docker-compose up -d --build
	@echo "$(GREEN)✅ Services rebuilt!$(NC)"

build-backend: ## Rebuild backend service
	@echo "$(BLUE)Rebuilding backend...$(NC)"
	docker-compose up -d --build backend
	@echo "$(GREEN)✅ Backend rebuilt!$(NC)"

build-frontend: ## Rebuild frontend service
	@echo "$(BLUE)Rebuilding frontend...$(NC)"
	docker-compose up -d --build frontend
	@echo "$(GREEN)✅ Frontend rebuilt!$(NC)"

logs: ## View logs from all services
	docker-compose logs -f

logs-backend: ## View backend logs
	docker-compose logs -f backend

logs-frontend: ## View frontend logs
	docker-compose logs -f frontend

logs-db: ## View database logs
	docker-compose logs -f postgres

logs-redis: ## View Redis logs
	docker-compose logs -f redis

ps: ## Show running services
	docker-compose ps

shell-backend: ## Open shell in backend container
	docker-compose exec backend /bin/bash

shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend /bin/sh

db-shell: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U gitzen -d gitzen

redis-cli: ## Open Redis CLI
	docker-compose exec redis redis-cli -a gitzen_redis_password

test-backend: ## Run backend tests
	docker-compose exec backend pytest -v

test-backend-cov: ## Run backend tests with coverage
	docker-compose exec backend pytest --cov=app --cov-report=html

clean: ## Stop services and remove volumes (⚠️ DATA LOSS)
	@echo "$(YELLOW)⚠️  This will delete all data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "$(GREEN)✅ Cleaned up!$(NC)"; \
	else \
		echo "$(BLUE)Cancelled$(NC)"; \
	fi

reset: clean up ## Clean and restart everything

health: ## Check health of all services
	@echo "$(BLUE)Checking service health...$(NC)"
	@echo "Backend API:"
	@curl -s http://localhost:8000/health | python3 -m json.tool || echo "$(YELLOW)Backend not responding$(NC)"
	@echo ""
	@echo "Frontend:"
	@curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000 || echo "$(YELLOW)Frontend not responding$(NC)"

init: ## Initial setup (copy .env.example to .env)
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(GREEN)✅ Created .env file from .env.example$(NC)"; \
		echo "$(YELLOW)⚠️  Remember to update values in .env$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  .env already exists$(NC)"; \
	fi

status: ps ## Alias for ps

dev: up logs ## Start services and show logs (development mode)
