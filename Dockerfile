# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
# Copy package.json and install dependencies
COPY frontend/package*.json ./
RUN npm install
# Copy the rest of the frontend source code
COPY frontend/ ./
# Build the frontend for production
RUN npm run build

# Stage 2: Build the Node.js backend and serve the app
FROM node:20-alpine
WORKDIR /app/backend
# Copy package.json and install only production dependencies
COPY backend/package*.json ./
RUN npm install --production
# Copy the rest of the backend source code
COPY backend/ ./

# Copy the built frontend from Stage 1 into the correct directory structure
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose the port (Cloud Run will provide the PORT env var)
EXPOSE 8080

# Start the Node.js server
CMD ["npm", "start"]
