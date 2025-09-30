# Job Portal Docker Commands

.PHONY: help build up down dev logs clean restart migrate seed

# Default target
help:
	@echo "Available commands:"
	@echo "  build     - Build all Docker images"
	@echo "  up        - Start all services in production mode"
	@echo "  down      - Stop all services"
	@echo "  dev       - Start all services in development mode"
	@echo "  logs      - Show logs from all services"
	@echo "  clean     - Remove all containers, images, and volumes"
	@echo "  restart   - Restart all services"
	@echo "  migrate   - Run database migrations"
	@echo "  seed      - Seed the database with sample data"

# Build all images
build:
	docker-compose build

# Start production environment
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# Start development environment
dev:
	docker-compose -f docker-compose.dev.yml up

# Show logs
logs:
	docker-compose logs -f

# Clean everything
clean:
	docker-compose down -v --remove-orphans
	docker system prune -a --volumes -f

# Restart services
restart:
	docker-compose down
	docker-compose up -d

# Run database migrations
migrate:
	docker-compose exec backend dotnet ef database update

# Seed database (if you have seeding implemented)
seed:
	docker-compose exec backend dotnet run --seed-data

# Database backup
backup:
	docker-compose exec database pg_dump -U jobportal_user jobportal > backup_$(shell date +%Y%m%d_%H%M%S).sql

# Database restore
restore:
	@read -p "Enter backup file path: " file; \
	docker-compose exec -T database psql -U jobportal_user jobportal < $$file