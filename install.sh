#!/bin/bash
# ==========================================
# Clean Install Script
# ==========================================
echo "Cleaning up previous build artifacts and dependencies..."
rm -rf node_modules
rm -rf dist
rm -rf local.db
rm -rf baileys_auth_info

echo "Installing dependencies..."
npm install

echo "Building application..."
npm run build

echo "Applying database schema..."
npx drizzle-kit push --force

echo "=========================================="
echo "Clean install completed successfully!"
echo "Starting the application..."
echo "=========================================="
node dist/server.cjs
