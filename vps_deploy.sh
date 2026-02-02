#!/bin/bash
set -e

echo "Starting Deployment for Sri Sai Senthil Travels..."

# Setup Directories
mkdir -p /var/www/s3t-api
mkdir -p /var/www/s3t-frontend

# Extract Backend
echo "Extracting Backend..."
tar -xzf /root/s3t-backend.tar.gz -C /var/www/s3t-api/

# Extract Frontend
echo "Extracting Frontend..."
tar -xzf /root/s3t-frontend.tar.gz -C /var/www/s3t-frontend/

# Install Frontend dependencies
echo "Installing Frontend dependencies..."
cd /var/www/s3t-frontend
npm install --omit=dev --legacy-peer-deps

# Start with PM2
echo "Configuring PM2..."
pm2 delete s3t-api 2>/dev/null || true
pm2 delete s3t-frontend 2>/dev/null || true

cd /var/www/s3t-api
# Ensure we use port 5000 for the new api
export ASPNETCORE_URLS="http://localhost:5000"
pm2 start "dotnet S3T.Api.dll" --name s3t-api

cd /var/www/s3t-frontend
# Ensure we use port 3000 for the new frontend
pm2 start npm --name s3t-frontend -- start -- -p 3000

# Save PM2 state
pm2 save

echo "Deployment finished successfully!"
