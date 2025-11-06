# 🐳 Docker Deployment Guide - LicenseGate

## 📋 Prerequisites

- Docker & Docker Compose installed
- Domain names configured (for production)
- SSL certificates (handled by Caddy automatically)

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone https://github.com/your-username/license-gate.git
cd license-gate
```

### 2. Environment Configuration
```bash
# Copy the example environment file
cp .env.docker.example .env

# Edit the environment variables
nano .env
```

### 3. Update Environment Variables
```env
# Database
MYSQL_ROOT_PASSWORD=your_strong_root_password
MYSQL_DATABASE=license_gate
MYSQL_USER=license_user
MYSQL_PASSWORD=your_strong_db_password

# Domains (Update with your actual domains)
PUBLIC_FRONTEND_URL=https://app.yourdomain.com
PUBLIC_BACKEND_URL=https://api.yourdomain.com
FRONTEND_FQDN=app.yourdomain.com
BACKEND_FQDN=api.yourdomain.com

# Security
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
```

### 4. Create Caddy Network
```bash
docker network create caddy
```

### 5. Deploy
```bash
# Build and start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Check status
docker-compose ps
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Caddy       │    │    Frontend     │    │    Backend      │
│   (Reverse      │────│   (SvelteKit)   │────│   (Express)     │
│    Proxy)       │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                              │
         │              ┌─────────────────┐             │
         └──────────────│     MySQL       │─────────────┘
                        │   (Database)    │
                        └─────────────────┘
```

## 📁 Docker Files Structure

```
license-gate/
├── docker-compose.yml          # Main orchestration
├── .env.docker.example         # Environment template
├── backend/
│   ├── Dockerfile             # Backend container
│   ├── .dockerignore          # Backend ignore rules
│   └── tsconfig.json          # TypeScript config
├── frontend/
│   ├── Dockerfile             # Frontend container
│   ├── .dockerignore          # Frontend ignore rules
│   └── .env.production        # Frontend production env
└── README.md
```

## 🔧 Services

### 1. Database (MySQL)
- **Image**: mysql:9.0.1
- **Port**: 3306 (internal)
- **Volume**: Persistent data storage
- **Network**: Internal only

### 2. Backend (Express + tRPC)
- **Build**: Custom Dockerfile
- **Port**: 3000 (internal)
- **Features**: 
  - TypeScript compilation
  - Prisma migrations
  - Health checks
- **Network**: Internal + Caddy

### 3. Frontend (SvelteKit)
- **Build**: Multi-stage Dockerfile
- **Port**: 5000 (internal)
- **Features**:
  - Static build optimization
  - Non-root user security
  - Health checks
- **Network**: Caddy

### 4. Caddy (Reverse Proxy)
- **Image**: lucaslorentz/caddy-docker-proxy
- **Ports**: 80, 443 (public)
- **Features**:
  - Automatic SSL certificates
  - Load balancing
  - Docker service discovery

## 🛠️ Management Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f db
```

### Service Management
```bash
# Restart a service
docker-compose restart api

# Rebuild and restart
docker-compose up -d --build api

# Scale services (if needed)
docker-compose up -d --scale api=2
```

### Database Management
```bash
# Access MySQL shell
docker-compose exec db mysql -u license_user -p license_gate

# Backup database
docker-compose exec db mysqldump -u license_user -p license_gate > backup.sql

# Restore database
docker-compose exec -T db mysql -u license_user -p license_gate < backup.sql
```

### Application Management
```bash
# Run Prisma migrations
docker-compose exec api npm run prisma-migrate

# Create admin user
docker-compose exec api npm run set-admin

# Check application health
curl https://api.yourdomain.com/health
```

## 🔒 Security Features

### Backend Security
- ✅ Helmet security headers
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Input validation
- ✅ JWT authentication

### Frontend Security
- ✅ Non-root user execution
- ✅ Minimal attack surface
- ✅ Static file serving

### Infrastructure Security
- ✅ Automatic SSL certificates
- ✅ Internal network isolation
- ✅ Health monitoring
- ✅ Container security

## 📊 Monitoring

### Health Checks
```bash
# Backend health
curl https://api.yourdomain.com/health

# Frontend health
curl https://app.yourdomain.com/

# Database health
docker-compose exec db mysqladmin ping -h localhost
```

### Performance Monitoring
```bash
# Container stats
docker stats

# Service status
docker-compose ps

# Resource usage
docker system df
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check database logs
docker-compose logs db

# Verify environment variables
docker-compose exec api printenv | grep DATABASE_URL
```

#### 2. SSL Certificate Issues
```bash
# Check Caddy logs
docker-compose logs caddy

# Verify domain DNS
nslookup yourdomain.com
```

#### 3. Build Failures
```bash
# Clean build
docker-compose down
docker system prune -f
docker-compose up -d --build
```

#### 4. Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

### Log Analysis
```bash
# Backend errors
docker-compose logs api | grep ERROR

# Frontend build issues
docker-compose logs web | grep error

# Database issues
docker-compose logs db | grep ERROR
```

## 🔄 Updates and Maintenance

### Application Updates
```bash
# Pull latest code
git pull origin main

# Rebuild and deploy
docker-compose up -d --build

# Run any new migrations
docker-compose exec api npm run prisma-migrate
```

### System Maintenance
```bash
# Clean unused images
docker image prune -f

# Clean unused volumes
docker volume prune -f

# Update base images
docker-compose pull
docker-compose up -d
```

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale backend instances
docker-compose up -d --scale api=3

# Scale with load balancer
# (Caddy automatically handles load balancing)
```

### Vertical Scaling
```yaml
# In docker-compose.yml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

## 🎯 Production Checklist

### Before Deployment
- [ ] Update all environment variables
- [ ] Configure proper domain names
- [ ] Set strong passwords
- [ ] Configure SMTP settings
- [ ] Test SSL certificate generation
- [ ] Backup strategy in place

### After Deployment
- [ ] Verify all services are running
- [ ] Test application functionality
- [ ] Check SSL certificates
- [ ] Monitor logs for errors
- [ ] Create admin user
- [ ] Test email functionality

## 📞 Support

### Documentation
- Backend API: `https://api.yourdomain.com/docs`
- Health Check: `https://api.yourdomain.com/health`
- Frontend: `https://app.yourdomain.com`

### Monitoring URLs
- Application: `https://app.yourdomain.com`
- API Health: `https://api.yourdomain.com/health`
- Database: Internal only (port 3306)

---

**🎉 Your LicenseGate application is now ready for production deployment!**

For additional support, check the logs and ensure all environment variables are properly configured.