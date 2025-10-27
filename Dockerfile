# Use Node.js with TypeScript support
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the project
COPY . .

# Build the project
RUN npm run build

# Default command
CMD ["node", "dist/index.js"]
