#!/bin/bash
# ==========================================
# Clean Install Script
# ==========================================

echo "Cleaning up previous build artifacts and dependencies..."
rm -rf node_modules
rm -rf dist
rm -rf data/sqlite.db
rm -rf baileys_auth_info

echo "Installing dependencies..."
npm install

echo "Building application..."
npm run build

echo "Clean install completed successfully!"
