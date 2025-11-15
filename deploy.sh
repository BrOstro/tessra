#!/bin/bash
# Tessra Deployment Helper Script
# Makes production deployment easier

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function print_header() {
    echo -e "${GREEN}===================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}===================================${NC}"
}

function print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

function print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

function print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

function check_requirements() {
    print_header "Checking Requirements"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_info "✓ Docker is installed: $(docker --version)"
    print_info "✓ Docker Compose is installed: $(docker compose version)"
}

function generate_passwords() {
    print_header "Generating Secure Passwords"
    
    if ! command -v openssl &> /dev/null; then
        print_error "OpenSSL is not installed. Please install it to generate secure passwords."
        exit 1
    fi
    
    ADMIN_TOKEN=$(openssl rand -base64 32)
    POSTGRES_PASSWORD=$(openssl rand -base64 32)
    REDIS_PASSWORD=$(openssl rand -base64 32)
    
    print_info "Generated secure passwords:"
    echo ""
    echo "ADMIN_TOKEN=$ADMIN_TOKEN"
    echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"
    echo "REDIS_PASSWORD=$REDIS_PASSWORD"
    echo ""
    print_warning "Save these passwords in your .env.production file!"
}

function setup_production_env() {
    print_header "Setting Up Production Environment"
    
    if [ -f ".env.production" ]; then
        print_warning ".env.production already exists"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Skipping environment setup"
            return
        fi
    fi
    
    cp .env.production.example .env.production
    print_info "Created .env.production from template"
    
    echo ""
    read -p "Enter your domain name (e.g., tessra.example.com): " DOMAIN
    read -p "Enter your admin email for SSL certificates: " ADMIN_EMAIL
    
    # Generate passwords
    ADMIN_TOKEN=$(openssl rand -base64 32)
    POSTGRES_PASSWORD=$(openssl rand -base64 32)
    REDIS_PASSWORD=$(openssl rand -base64 32)
    
    # Update .env.production
    sed -i.bak "s|DOMAIN=your-domain.com|DOMAIN=$DOMAIN|g" .env.production
    sed -i.bak "s|PUBLIC_URL=https://your-domain.com|PUBLIC_URL=https://$DOMAIN|g" .env.production
    sed -i.bak "s|ADMIN_EMAIL=admin@example.com|ADMIN_EMAIL=$ADMIN_EMAIL|g" .env.production
    sed -i.bak "s|ADMIN_TOKEN=CHANGE_ME_TO_STRONG_RANDOM_VALUE_32_CHARS_MIN|ADMIN_TOKEN=$ADMIN_TOKEN|g" .env.production
    sed -i.bak "s|POSTGRES_PASSWORD=CHANGE_ME_TO_STRONG_RANDOM_PASSWORD|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|g" .env.production
    sed -i.bak "s|REDIS_PASSWORD=CHANGE_ME_TO_STRONG_RANDOM_PASSWORD|REDIS_PASSWORD=$REDIS_PASSWORD|g" .env.production
    
    rm -f .env.production.bak
    
    print_info "✓ Environment configured successfully"
    echo ""
    print_warning "Your credentials:"
    echo "  Domain: $DOMAIN"
    echo "  Admin Token: $ADMIN_TOKEN"
    echo ""
    print_warning "Please save your admin token securely!"
}

function deploy_production() {
    print_header "Deploying Production Environment"
    
    if [ ! -f ".env.production" ]; then
        print_error ".env.production not found. Run './deploy.sh setup' first."
        exit 1
    fi
    
    print_info "Building application..."
    docker compose --env-file .env.production -f docker-compose.prod.yml build --no-cache
    
    print_info "Starting services..."
    docker compose --env-file .env.production -f docker-compose.prod.yml up -d
    
    print_info "Waiting for services to be healthy..."
    sleep 10
    
    docker compose --env-file .env.production -f docker-compose.prod.yml ps
    
    print_info "✓ Deployment complete!"
    echo ""
    print_info "Your application should be available at your domain shortly."
    print_info "It may take a few minutes for SSL certificates to be issued."
}

function show_logs() {
    print_header "Showing Logs"
    docker compose -f docker-compose.prod.yml logs -f
}

function show_status() {
    print_header "Service Status"
    docker compose -f docker-compose.prod.yml ps
}

function backup_data() {
    print_header "Backing Up Data"
    
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    print_info "Backing up database..."
    docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres tessra > "$BACKUP_DIR/database.sql"
    
    print_info "Backing up uploads..."
    docker run --rm -v tessra-prod_uploads:/data -v "$PWD/$BACKUP_DIR":/backup alpine tar czf /backup/uploads.tar.gz /data
    
    print_info "✓ Backup complete: $BACKUP_DIR"
}

function show_help() {
    echo "Tessra Deployment Helper"
    echo ""
    echo "Usage: ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  check          Check if requirements are met"
    echo "  generate       Generate secure passwords"
    echo "  setup          Interactive setup of .env.production"
    echo "  deploy         Deploy production environment"
    echo "  logs           Show logs"
    echo "  status         Show service status"
    echo "  backup         Backup database and uploads"
    echo "  stop           Stop all services"
    echo "  restart        Restart all services"
    echo "  help           Show this help message"
    echo ""
}

function stop_services() {
    print_header "Stopping Services"
    docker compose -f docker-compose.prod.yml down
    print_info "✓ Services stopped"
}

function restart_services() {
    print_header "Restarting Services"
    docker compose --env-file .env.production -f docker-compose.prod.yml restart
    print_info "✓ Services restarted"
}

# Main script
case "${1:-help}" in
    check)
        check_requirements
        ;;
    generate)
        generate_passwords
        ;;
    setup)
        check_requirements
        setup_production_env
        ;;
    deploy)
        check_requirements
        deploy_production
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    backup)
        backup_data
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    help|*)
        show_help
        ;;
esac
