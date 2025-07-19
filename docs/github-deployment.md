# GitHub Docker Deployment

This document explains how to deploy and test the Health Guide application using GitHub Actions and Docker, without requiring Google Cloud Platform.

## Overview

The GitHub deployment workflow (`deploy-github.yaml`) provides:
- **Automated Docker builds** for both backend and frontend
- **GitHub Container Registry (GHCR)** for image storage
- **Integration testing** with full application stack
- **Release management** with tagged Docker images

## Workflow Triggers

The deployment runs on:
- **Push to main/develop branches** - Full build, test, and release
- **Pull requests to main** - Build and test only
- **Manual dispatch** - On-demand deployment

## Docker Images

Images are automatically built and pushed to GitHub Container Registry:

```bash
# Backend image
ghcr.io/[username]/[repository]/backend:latest

# Frontend image  
ghcr.io/[username]/[repository]/frontend:latest
```

## Local Testing

### Quick Start with Pre-built Images

```bash
# Set your GitHub repository
export GITHUB_REPOSITORY="username/repository-name"

# Pull and run with docker compose
docker compose -f docker-compose.github.yml up
```

### Access URLs
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin/

### Manual Image Pull

```bash
# Pull specific version
docker pull ghcr.io/username/repository/backend:main-abc1234
docker pull ghcr.io/username/repository/frontend:main-abc1234

# Pull latest from main branch
docker pull ghcr.io/username/repository/backend:latest
docker pull ghcr.io/username/repository/frontend:latest
```

## Environment Variables

### Backend Environment Variables
- `DEBUG` - Set to `True` for development
- `SECRET_KEY` - Django secret key
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `ALLOWED_HOSTS` - Comma-separated list of allowed hosts

### Frontend Configuration
- Nginx serves static files and proxies API requests
- Health check endpoint at `/health`
- SPA routing support for client-side navigation

## Workflow Jobs

### 1. Build and Push
- Builds Docker images for backend and frontend
- Pushes to GitHub Container Registry
- Uses Docker layer caching for faster builds
- Tags images with branch name and commit SHA

### 2. Deploy Test
- Pulls built images
- Starts full application stack with docker-compose
- Runs database migrations
- Performs integration tests
- Validates all services are healthy

### 3. Create Release (main branch only)
- Creates GitHub release with version tag
- Includes Docker image references
- Provides quick start instructions

## Testing Strategy

The workflow performs comprehensive testing:

1. **Health Checks** - Verify all services start correctly
2. **Database Connectivity** - Test PostgreSQL connection and migrations
3. **API Accessibility** - Validate backend endpoints
4. **Frontend Serving** - Ensure static files are served
5. **Proxy Configuration** - Test API routing through frontend

## Troubleshooting

### Common Issues

**Images not found:**
```bash
# Make sure you're authenticated
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

**Permission denied:**
- Ensure repository has `packages: write` permission
- Check if images are public or if you have access

**Services not starting:**
```bash
# Check logs
docker compose -f docker-compose.github.yml logs

# Check specific service
docker compose -f docker-compose.github.yml logs backend
```

### Manual Cleanup

```bash
# Stop and remove containers
docker compose -f docker-compose.github.yml down -v

# Remove images
docker rmi ghcr.io/username/repository/backend:latest
docker rmi ghcr.io/username/repository/frontend:latest

# Clean up system
docker system prune -f
```

## Security Considerations

- Images are stored in GitHub Container Registry
- Secrets are managed through GitHub Actions secrets
- Database credentials are only for testing (not production)
- Images can be made private for sensitive projects

## Next Steps

This GitHub deployment provides a foundation for:
- **Development testing** - Validate changes before production
- **Demo environments** - Share working versions with stakeholders  
- **Local development** - Consistent environment across team
- **CI/CD pipeline** - Automated testing and deployment

For production deployment, consider:
- Using managed database services
- Implementing proper secret management
- Setting up monitoring and logging
- Configuring SSL/TLS certificates