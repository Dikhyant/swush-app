
## Prerequisites

- Node.js >= 20.17.0 
- pnpm >= 9.13.0
- Docker & Docker Compose (for containerized development)

## Getting Started

### Local Development

#### 1. Install dependencies:
```bash
pnpm i
```

2. Start the development servers:
```bash
# Start both web and API services
pnpm dev

```

The web application will be available at [http://localhost:3000](http://localhost:3000)
The API server will be available at [http://localhost:3001](http://localhost:3001)

#### 2. Start Chopsticks:

```bash
# Start Chopsticks
pnpm start-chopsticks
```

### Docker Development Environment

The project includes a Docker setup for consistent development environments:

```bash
# Start all services
docker-compose up --build

# Stop services
docker compose down
```
After running the docker compose up command, the web application will be available at [http://localhost:3000](http://localhost:3000)

Chopsticks needs to be run separately, after running the docker compose up command, run the following command from the root directory to start Chopsticks:

```bash
# Install all dependencies if not already installed
pnpm i

# Start Chopsticks
pnpm start-chopsticks
```

### Lint check

To lint the codebase, run the following command:

```bash
pnpm lint
```

This will check for code quality and style issues across the entire monorepo.

### Unit tests

To run the tests, use the following command:

```bash
pnpm test
```

### Configuration and Environment Variables

See [docs/config.md](docs/config.md) for more details.

## Acknowledgements

Check out the [NOTICE.md](NOTICE.md) file for more details.
