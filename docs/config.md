# Environment Configuration

## 🏗️ **Architecture Overview**

With nginx handling SSL termination:
```
Client (HTTPS) → Nginx (SSL Termination) → Node.js App (HTTP)
```

Your Node.js application only needs to run HTTP internally.

## Development Environment

Create a `.env.development` file in the root directory:

```env
# API Configuration
NEXT_PUBLIC_API_HOST=localhost
NEXT_PUBLIC_API_PORT=3001
NEXT_PUBLIC_USE_HTTPS=false

# Backend Configuration  
NODE_ENV=development
PORT=3001
```

## Dev Staging Environment

Create a `.env.staging` file in the root directory:

```env
# API Configuration  
NEXT_PUBLIC_API_HOST=dev.swush.me
NEXT_PUBLIC_USE_HTTPS=true

# Backend Configuration
NODE_ENV=staging
PORT=3001
TRUST_PROXY=true

# Additional staging-specific configurations
LOG_LEVEL=debug
```

## Production Environment (with Nginx)

Create a `.env.production` file in the root directory:

```env
# API Configuration  
NEXT_PUBLIC_API_HOST=app.swush.me
NEXT_PUBLIC_USE_HTTPS=true

# Backend Configuration
NODE_ENV=production
PORT=3001
TRUST_PROXY=true
```

## Environment Variable Reference

### Frontend Variables (NEXT_PUBLIC_*)
- `NEXT_PUBLIC_API_HOST`: API server hostname 
  - Development: `localhost`
  - Production: `app.swush.me`
- `NEXT_PUBLIC_API_PORT`: HTTP port for development (default: `3001`)
- `NEXT_PUBLIC_USE_HTTPS`: Enable HTTPS for API calls 
  - Development: `false` 
  - Production: `true`

### Backend Variables
- `NODE_ENV`: Environment mode (`development`/`production`)
- `PORT`: HTTP server port (default: `3001`)
- `TRUST_PROXY`: Trust nginx proxy headers (`true` in production)

## 🚀 **Quick Start Commands**

### Development (HTTP only)
```bash
cp .env.development .env
pnpm dev
```

### Dev Staging (with Nginx SSL)
```bash
# One-time setup
bash packages/deploy/staging-env.sh

# Start staging environment
pnpm staging:restart

# View logs
pnpm staging:logs

# Stop staging
pnpm staging:stop
```

### Production (with Nginx SSL)
```bash
cp .env.production .env
pnpm production:restart

# View logs
pnpm production:logs

# Stop production
pnpm production:stop
```

## 🔧 **Nginx Configuration Example**
Refer to [nginx.md](./ci/nginx.md) for the nginx configuration.

## ✅ **Benefits of This Setup**

1. **Simplicity**: Node.js app is just HTTP
2. **Performance**: Nginx handles SSL efficiently
3. **Security**: Only nginx needs certificate access
4. **Scalability**: Easy to add load balancing
5. **Maintenance**: Standard nginx SSL management

## 🔧 **Environment Management**

### Environment Files
- `.env.development` - Local development (HTTP)
- `.env.staging` - Dev staging environment (HTTPS via nginx)
- `.env.production` - Production environment (HTTPS via nginx)

### Quick Environment Switching
```bash
# Setup staging environment (one-time)
bash packages/deploy/staging-env.sh

# Use specific environment files
cp .env.staging .env      # For staging
cp .env.production .env   # For production
```

### Domain Configuration
- **Development**: `localhost:3000` and `localhost:3001`
- **Dev Staging**: `dev.swush.me` (both UI and API)
- **Production**: `app.swush.me` (UI) and `api.swush.me` (API)

### Port Configuration
- **Frontend (Next.js)**: Port 3000
- **Backend (Express API)**: Port 3001
- **Nginx**: Handles HTTPS termination and proxying

## 🚨 **Important Notes**

1. **Nginx Configuration**: Ensure nginx is configured for `dev.swush.me` before starting staging
2. **SSL Certificates**: Staging and production need valid SSL certificates
3. **Environment Variables**: Always use the correct `.env` file for each environment
4. **Log Files**: 
   - Staging logs: `staging-output.log`
   - Production logs: `output.log`
5. **Process Management**: Use the provided scripts to avoid port conflicts