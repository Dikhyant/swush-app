FROM node:18-alpine

# Install dependencies for chopsticks
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    bash

# Set working directory
WORKDIR /app

# Install chopsticks globally
RUN npm install -g @acala-network/chopsticks@latest

# Expose ports for Asset Hub and Hydration
EXPOSE 3421 3422

# Default command
CMD ["npx", "@acala-network/chopsticks@latest", "--help"] 