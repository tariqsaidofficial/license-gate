# --------------------------
# Backend Dockerfile (Fixed)
# --------------------------
FROM node:20

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# ✅ زيادة الذاكرة أثناء build
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Install all dependencies including dev (needed for tsc)
RUN npm install

# Copy source code
COPY . .

# ✅ Build TypeScript → JavaScript
RUN npm run build

# ✅ Generate Prisma Client
RUN npm run prisma-gen

# ✅ حذف devDependencies بعد build لتقليل الحجم
RUN npm prune --omit=dev

# ✅ Expose port and start compiled JS
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "run", "start"]