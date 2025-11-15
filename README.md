# Tessra

A powerful, self-hosted image management and OCR processing platform built with Nuxt 4.

## Features

- 🖼️ **Image Management** - Upload, store, and organize images with metadata
- 🔍 **OCR Processing** - Optional text extraction using Tesseract.js
- 🔐 **Secure Admin Access** - Token-based authentication with session management
- 💾 **Flexible Storage** - Local filesystem or AWS S3-compatible storage
- ⚡ **Async Processing** - Background job queue with BullMQ and Redis
- 🐳 **Easy Deployment** - Production-ready Docker setup with automatic HTTPS
- 🔒 **Production Security** - Secure by default with Caddy reverse proxy

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Domain name (for production deployment with HTTPS)
- 2GB+ RAM recommended

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/BrOstro/tessra.git
   cd tessra
   ```

2. **Build the application** (required before Docker)
   ```bash
   npm install
   npm run build
   ```

3. **Start the development environment**
   ```bash
   docker compose up -d
   ```

4. **Access the application**
   - Open http://localhost:3000
   - Default admin token: `change-me-please-32chars`

The development setup includes:
- PostgreSQL database on port 5432
- Redis on port 6379
- Tessra web application on port 3000

## Production Deployment

### Quick Production Setup (Recommended)

We provide a helper script that automates the deployment process:

```bash
# 1. Check requirements
./deploy.sh check

# 2. Interactive setup (creates .env.production with secure passwords)
./deploy.sh setup

# 3. Deploy
./deploy.sh deploy

# 4. Check status
./deploy.sh status
```

The deployment script will:
- ✅ Generate secure random passwords automatically
- ✅ Configure your domain and SSL email
- ✅ Build and start all services
- ✅ Set up automatic HTTPS with Caddy

### Manual Production Setup

If you prefer to set up manually, follow these steps:

### Step 1: Server Requirements

- Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed
- Domain name pointing to your server's IP
- Ports 80 and 443 open for HTTPS

### Step 2: Prepare Environment

1. **Clone the repository on your server**
   ```bash
   git clone https://github.com/BrOstro/tessra.git
   cd tessra
   ```

2. **Create production environment file**
   ```bash
   cp .env.production.example .env.production
   ```

3. **Generate secure passwords**
   ```bash
   # Generate ADMIN_TOKEN
   openssl rand -base64 32
   
   # Generate POSTGRES_PASSWORD
   openssl rand -base64 32
   
   # Generate REDIS_PASSWORD
   openssl rand -base64 32
   ```

4. **Edit `.env.production` and configure**
   ```bash
   nano .env.production
   ```
   
   **Critical settings to change:**
   - `ADMIN_TOKEN` - Your generated admin token (REQUIRED)
   - `POSTGRES_PASSWORD` - PostgreSQL password (REQUIRED)
   - `REDIS_PASSWORD` - Redis password (REQUIRED)
   - `DOMAIN` - Your domain (e.g., tessra.example.com) (REQUIRED)
   - `PUBLIC_URL` - Your public URL (e.g., https://tessra.example.com) (REQUIRED)
   - `ADMIN_EMAIL` - Your email for Let's Encrypt notifications (REQUIRED)

   **Optional settings:**
   - `STORAGE_DRIVER` - Use "s3" for S3 storage (default: "local")
   - `OCR_ENABLED` - Enable OCR processing (default: "false")
   - `DEFAULT_VISIBILITY` - Default upload visibility (default: "private")

### Step 3: Deploy

1. **Build the application**
   ```bash
   npm install
   npm run build
   ```

2. **Start the production stack**
   ```bash
   docker compose --env-file .env.production -f docker-compose.prod.yml up -d
   ```

2. **Check logs**
   ```bash
   # View all logs
   docker compose -f docker-compose.prod.yml logs -f
   
   # View specific service logs
   docker compose -f docker-compose.prod.yml logs -f web
   docker compose -f docker-compose.prod.yml logs -f caddy
   ```

3. **Initialize database (first time only)**
   ```bash
   # Wait for services to be healthy (30-60 seconds)
   docker compose -f docker-compose.prod.yml ps
   
   # The database schema is automatically applied on first startup
   # If needed, you can manually push the schema:
   docker compose -f docker-compose.prod.yml exec web node -e "require('./server/lib/db').initDb()"
   ```

4. **Access your application**
   - Navigate to your domain (e.g., https://tessra.example.com)
   - Caddy will automatically obtain SSL certificates from Let's Encrypt
   - Log in with your ADMIN_TOKEN

### Step 4: Verify Deployment

1. **Check service health**
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```
   All services should show as "healthy"

2. **Test the application**
   - Access the web interface
   - Log in to the admin panel
   - Upload a test image

3. **Monitor logs for errors**
   ```bash
   docker compose -f docker-compose.prod.yml logs -f --tail=100
   ```

## Configuration

### Environment Variables

#### Authentication
- `ADMIN_TOKEN` - **REQUIRED** - Admin authentication token (32+ characters)

#### Database
- `POSTGRES_USER` - PostgreSQL username (default: "postgres")
- `POSTGRES_PASSWORD` - **REQUIRED** - PostgreSQL password
- `POSTGRES_DB` - Database name (default: "tessra")

#### Redis
- `REDIS_PASSWORD` - **REQUIRED** - Redis password for production

#### Application
- `APP_NAME` - Application name (default: "Tessra")
- `DOMAIN` - **REQUIRED for production** - Your domain name
- `PUBLIC_URL` - **REQUIRED for production** - Public URL with protocol
- `ADMIN_EMAIL` - **REQUIRED for production** - Email for SSL certificates

#### Storage
- `STORAGE_DRIVER` - Storage backend: "local" or "s3" (default: "local")
- `DEFAULT_VISIBILITY` - Default upload visibility: "public" or "private" (default: "private")

##### Local Storage
- `LOCAL_ROOT` - Storage directory (default: ".data")

##### S3 Storage
- `S3_ENDPOINT` - S3 endpoint URL (e.g., https://s3.us-east-1.amazonaws.com)
- `S3_REGION` - AWS region (e.g., us-east-1)
- `S3_BUCKET` - S3 bucket name
- `S3_ACCESS_KEY` - AWS access key
- `S3_SECRET_KEY` - AWS secret key

#### OCR
- `OCR_ENABLED` - Enable OCR processing: "true" or "false" (default: "false")
- `OCR_LANG` - OCR language code: "eng", "spa", "fra", etc. (default: "eng")

#### Performance
- `JOBS_CONCURRENCY` - Number of concurrent background jobs (default: 5)

## Management Commands

### Using the Deployment Script

```bash
# Show status
./deploy.sh status

# View logs
./deploy.sh logs

# Backup data
./deploy.sh backup

# Restart services
./deploy.sh restart

# Stop services
./deploy.sh stop

# Generate new passwords
./deploy.sh generate
```

### Manual Commands

### Update the Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

### Backup Data

```bash
# Backup PostgreSQL database
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres tessra > backup.sql

# Backup uploaded files (if using local storage)
docker cp tessra_web_prod:/app/.data ./uploads-backup

# Backup using volumes
docker run --rm -v tessra-prod_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz /data
```

### Restore Data

```bash
# Restore PostgreSQL database
cat backup.sql | docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres tessra

# Restore uploaded files
docker cp ./uploads-backup/. tessra_web_prod:/app/.data/
```

### View Logs

```bash
# All logs
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml logs -f postgres
docker compose -f docker-compose.prod.yml logs -f redis
docker compose -f docker-compose.prod.yml logs -f caddy
```

### Monitor Resources

```bash
# View container stats
docker stats
```

### Stop Services

```bash
# Stop all services
docker compose -f docker-compose.prod.yml down

# Stop and remove volumes (WARNING: Deletes all data)
docker compose -f docker-compose.prod.yml down -v
```

## Security Best Practices

### Production Security Checklist

- [x] ✅ Use strong, randomly generated passwords (32+ characters)
- [x] ✅ HTTPS automatically enabled via Caddy and Let's Encrypt
- [x] ✅ Security headers configured (HSTS, CSP, etc.)
- [x] ✅ Database and Redis not exposed to the internet
- [x] ✅ Non-root user in containers
- [x] ✅ Rate limiting enabled on reverse proxy
- [x] ✅ Backend network isolated from frontend

### Additional Recommendations

1. **Regular Updates**
   - Keep Docker images updated
   - Monitor for security advisories
   - Update application regularly

2. **Firewall Configuration**
   ```bash
   # Example using ufw on Ubuntu
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow ssh
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **Monitoring**
   - Set up log monitoring and alerting
   - Monitor disk space for uploads and logs
   - Track SSL certificate expiration (Caddy auto-renews)

4. **Backup Strategy**
   - Regular automated backups
   - Test backup restoration
   - Store backups securely off-site

5. **Access Control**
   - Use strong ADMIN_TOKEN
   - Rotate credentials periodically
   - Enable DEFAULT_VISIBILITY=private for sensitive content

## Troubleshooting

### SSL Certificate Issues

If Caddy can't obtain certificates:

1. Verify domain DNS points to your server
2. Ensure ports 80 and 443 are open
3. Check Caddy logs: `docker compose -f docker-compose.prod.yml logs caddy`
4. Verify DOMAIN and ADMIN_EMAIL are set correctly

### Database Connection Errors

1. Check if PostgreSQL is healthy:
   ```bash
   docker compose -f docker-compose.prod.yml ps postgres
   ```

2. Verify DATABASE_URL is correct in logs

3. Check PostgreSQL logs:
   ```bash
   docker compose -f docker-compose.prod.yml logs postgres
   ```

### Application Won't Start

1. Check environment variables are set correctly
2. Review application logs:
   ```bash
   docker compose -f docker-compose.prod.yml logs web
   ```

3. Ensure all dependencies are healthy:
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```

### Out of Disk Space

1. Check Docker disk usage:
   ```bash
   docker system df
   ```

2. Clean up unused resources:
   ```bash
   docker system prune -a
   ```

3. Monitor uploads directory size

## Architecture

### Components

- **Nuxt 4** - Full-stack SSR framework (frontend + API)
- **PostgreSQL 17** - Primary database for uploads, sessions, settings
- **Redis 8** - Caching and job queue
- **BullMQ** - Background job processing
- **Caddy 2** - Reverse proxy with automatic HTTPS
- **Tesseract.js** - OCR engine (optional)

### Network Architecture (Production)

```
Internet
    ↓
Caddy (HTTPS:443)
    ↓
Frontend Network
    ↓
Tessra Web App (3000)
    ↓
Backend Network (isolated)
    ├─ PostgreSQL (5432)
    └─ Redis (6379)
```

### Storage Options

1. **Local Storage** (default)
   - Files stored in Docker volume
   - Simple setup, no external dependencies
   - Limited to single server

2. **S3 Storage**
   - AWS S3 or S3-compatible storage
   - Scalable and distributed
   - Requires S3 credentials

## Development

### Local Development (without Docker)

1. **Prerequisites**
   - Node.js 20.19.5
   - PostgreSQL 17
   - Redis 8

2. **Setup**
   ```bash
   npm install
   cp apps/web/.env.example apps/web/.env
   docker compose up -d postgres redis  # Start only DB services
   npm run db:push
   npm run dev
   ```

3. **Build for production**
   ```bash
   npm run build
   npm run start
   ```

### Project Structure

```
tessra/
├── apps/
│   └── web/              # Main Nuxt application
│       ├── app/          # Frontend (Vue components, pages)
│       ├── server/       # Backend (API routes, server utilities)
│       ├── db/           # Database schema
│       ├── Dockerfile    # Multi-stage build (requires network access)
│       └── Dockerfile.simple  # Simple build (uses pre-built output)
├── packages/
│   ├── core/            # Core abstractions (storage, OCR)
│   └── drivers/         # Provider implementations
├── docker-compose.yml            # Development configuration
├── docker-compose.prod.yml       # Production configuration
├── Caddyfile                     # Reverse proxy configuration
├── deploy.sh                     # Deployment helper script
└── .env.production.example       # Production environment template
```

### Docker Build Notes

The repository includes two Dockerfile options:

1. **`Dockerfile`** (default) - Multi-stage build that compiles the application inside Docker
   - Requires network access to download npm packages
   - Best for CI/CD pipelines and production builds
   - Self-contained and reproducible

2. **`Dockerfile.simple`** - Lightweight build using pre-built output
   - Requires running `npm run build` locally first
   - Useful for restricted networks or faster iterations
   - Smaller build context

To use the simple Dockerfile:
```bash
# Build locally first
npm run build

# Build Docker image
docker build -f apps/web/Dockerfile.simple -t tessra-web .
```

## License

This project is open source. Please check the license file for details.

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/BrOstro/tessra).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Made with ❤️ using Nuxt 4**
