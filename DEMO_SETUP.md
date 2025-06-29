# 🚀 Swush Demo Environment Setup

Quick setup guide for beta testers to run the Swush demo with chopsticks.

## Prerequisites

1. **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
2. **Node.js 18+** - [Download here](https://nodejs.org/)
3. **pnpm** - Install with `npm install -g pnpm`

## Quick Start

### 1. Start Demo Environment
```bash
# Option A: Use the script (recommended)
./scripts/start-demo.sh

# Option B: Manual Docker command
docker compose -f docker-compose.dev.yml up -d chopsticks
```

### 2. Start Web App
```bash
# Install dependencies (first time only)
pnpm install

# Start the web app
pnpm dev
```

### 3. Access Demo
- **Web App**: http://localhost:3000
- **Chopsticks Asset Hub**: ws://localhost:3421
- **Chopsticks Hydration**: ws://localhost:3422

## Troubleshooting

### Demo Environment Issues
```bash
# Check if chopsticks is running
docker compose -f docker-compose.dev.yml ps chopsticks

# View logs
docker compose -f docker-compose.dev.yml logs chopsticks

# Restart chopsticks
docker compose -f docker-compose.dev.yml restart chopsticks

# Rebuild if needed
docker compose -f docker-compose.dev.yml up -d --build chopsticks
```

### Common Issues

**"Demo environment unavailable"**
- Ensure Docker Desktop is running
- Run `./scripts/start-demo.sh` to restart
- Check logs: `docker compose -f docker-compose.dev.yml logs chopsticks`

**Port conflicts**
- Make sure ports 3421 and 3422 are not in use
- Stop other blockchain nodes or change ports in `docker-compose.dev.yml`

**Docker build fails**
- Ensure you have internet connection
- Try: `docker system prune` then restart

## What's Running

- **Chopsticks Container**: Runs forked Polkadot Asset Hub (3421) and Hydration (3422)
- **Web App**: Next.js app with wallet integration and swap interface
- **Auto-restart**: Docker automatically restarts chopsticks if it crashes
- **Health Monitoring**: UI checks chopsticks health every 30 seconds

## Demo Features

✅ **Cross-chain swaps** between Asset Hub and Hydration  
✅ **Test wallet** with pre-funded Alice account  
✅ **Real-time balance updates**  
✅ **Transaction monitoring**  
✅ **Auto-reconnection** if chopsticks restarts  

## Clean Up

```bash
# Stop demo environment
docker compose -f docker-compose.dev.yml down chopsticks

# Remove containers and images (optional)
docker compose -f docker-compose.dev.yml down --rmi all
```

## Need Help?

1. Check the logs first: `docker compose -f docker-compose.dev.yml logs chopsticks`
2. Try restarting: `./scripts/start-demo.sh`
3. Open an issue with your error logs

Happy testing! 🎉 