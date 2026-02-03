#!/bin/bash
set -e

echo "Packaging API Source..."
cd dotnet-api
# Exclude build artifacts and unrelated files
tar -czf ../s3t-api-v3.tar.gz --exclude='bin' --exclude='obj' --exclude='s3t.db' .
cd ..

echo "Transferring files..."
# This will prompt for the restricted user password: Travels2026#
scp s3t-api-v3.tar.gz s3t_dev@193.203.160.3:/var/www/srisaisenthiltravels/

echo "Deploying on Server..."
# This will prompt for password again
ssh s3t_dev@193.203.160.3 << 'EOF'
  set -e
  
  # 1. Prepare Build Directory
  echo "Preparing build..."
  rm -rf /var/www/srisaisenthiltravels/api-build
  mkdir -p /var/www/srisaisenthiltravels/api-build
  tar -xzf /var/www/srisaisenthiltravels/s3t-api-v3.tar.gz -C /var/www/srisaisenthiltravels/api-build
  cd /var/www/srisaisenthiltravels/api-build
  find . -name '._*' -delete

  # 2. Build and Publish
  echo "Publishing API locally on server..."
  dotnet publish S3T.Api.csproj -c Release -o /var/www/srisaisenthiltravels/api-published
  
  echo "Staging for live deployment..."
  cd /var/www/srisaisenthiltravels/api-published
  tar -czf /var/www/srisaisenthiltravels/api_live_bundle.tar.gz .
  
  # 3. Deploy to /root and Restart
  echo "Deploying to live directory (/root) via sudo tar..."
  sudo tar -xzf /var/www/srisaisenthiltravels/api_live_bundle.tar.gz -C /root/s3t-api-published
  
  echo "Restarting via PM2..."
  sudo pm2 restart s3t-api || sudo pm2 start /root/s3t-api-published/S3T.Api --name s3t-api

  echo "Deployment Complete."
  sudo pm2 list
EOF
