# ==============================================================================
# Stage 1: Build the React Frontend
# ==============================================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy package files and install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy the rest of the frontend source code
COPY frontend/ ./

# Build the Vite app for production (outputs to dist/)
RUN npm run build

# ==============================================================================
# Stage 2: Setup the Node.js Backend & Final Image
# ==============================================================================
FROM node:20-alpine AS production
WORKDIR /app

# Set Node environment to production so backend serves the frontend
ENV NODE_ENV=production

# Copy backend package files and install production dependencies only
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --omit=dev

# Copy the backend source code
COPY backend/ ./

# Copy the built frontend from Stage 1 into the frontend/dist folder
# (The backend server.js is now configured to look for ../frontend/dist)
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose the port (Cloud Run defaults to 8080 if PORT isn't set, so we expose it)
EXPOSE 8080
ENV PORT=8080

# Start the Node.js server
CMD ["npm", "start"]
