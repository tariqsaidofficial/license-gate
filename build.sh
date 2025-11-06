#!/usr/bin/env bash

echo "🚀 Starting Vercel build process..."

# Navigate to backend and install dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm ci

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Build backend
echo "🔨 Building backend..."
npm run build

# Navigate to frontend and install dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm ci

# Build frontend
echo "🔨 Building frontend..."
npm run build

echo "✅ Build complete!"
