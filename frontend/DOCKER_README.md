# Frontend Docker Setup

This directory contains the Docker configuration for the EatEase frontend application.

## Files

- `Dockerfile` - Standard Docker build for development/testing
- `Dockerfile.prod` - Production-optimized Docker build with security features
- `docker-compose.yml` - Local Docker Compose configuration
- `nginx.conf` - Custom Nginx configuration for React routing
- `.dockerignore` - Files to exclude from Docker build context

## Building and Running

### Option 1: Using Docker directly

#### Development Build

```bash
# Build the image
docker build -t eatease-frontend .

# Run the container
docker run -p 80:80 eatease-frontend
```

#### Production Build

```bash
# Build the production image
docker build -f Dockerfile.prod -t eatease-frontend:prod .

# Run the production container
docker run -p 80:80 eatease-frontend:prod
```

### Option 2: Using Docker Compose (local)

#### Development

```bash
# Run development version
docker-compose up frontend-dev

# Access at http://localhost:5173
```

#### Production

```bash
# Run production version
docker-compose --profile production up frontend-prod

# Access at http://localhost:80
```

### Option 3: Using Main Docker Compose (from root directory)

```bash
# From the root directory of the project
docker-compose up frontend

# This will also start the API gateway and other dependent services
# Access at http://localhost:80
```

## Environment Variables

The frontend service supports the following environment variables:

- `NODE_ENV` - Set to 'development' or 'production'

## Features

### Development Dockerfile

- Multi-stage build
- Optimized for fast builds
- Uses nginx to serve static files

### Production Dockerfile

- Security hardened
- Non-root user
- Health checks included
- Optimized for production use

### Nginx Configuration

- Client-side routing support (React Router)
- Static asset caching
- Gzip compression
- Security headers
- Performance optimizations

## Health Check

The production Dockerfile includes a health check that verifies the application is responding on port 80.

## Troubleshooting

1. **Build fails**: Make sure you're in the frontend directory when building
2. **Port conflicts**: Change the port mapping if 80 is already in use
3. **Routing issues**: The nginx.conf handles React Router - make sure it's properly copied

## Performance Notes

- The production build is optimized for size and performance
- Static assets are cached for 1 year
- Gzip compression is enabled for supported file types
- The nginx alpine image is used for minimal size
