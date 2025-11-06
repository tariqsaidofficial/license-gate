# --------------------------
# Frontend Dockerfile (SvelteKit)
# --------------------------

# Build stage
FROM node:20 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the SvelteKit app
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S sveltekit -u 1001

# Change ownership of the app directory
RUN chown -R sveltekit:nodejs /app
USER sveltekit

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/ || exit 1

# Start the application
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5000"]