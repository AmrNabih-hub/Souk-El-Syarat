# Use the official Node.js 20 image as a base
FROM node:20-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code excluding unnecessary files
COPY . .

# Create .env.production if it doesn't exist
RUN touch .env.production

# Build the frontend assets
RUN npm run build:apphosting:ci

# Remove dev dependencies after build
RUN npm prune --production

# Expose the port the app runs on
EXPOSE 8080

# Define the command to run the application
CMD [ "tsx", "server.ts" ]
