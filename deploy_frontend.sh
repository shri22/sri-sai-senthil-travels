#!/bin/bash
set -e

echo "Building Frontend..."
npm run build

echo "Packaging Frontend Build..."
tar -czf s3t-frontend-v3.tar.gz .next/ package.json package-lock.json public/

echo "Transferring to VPS..."
# This will prompt for the restricted user password: Travels2026#
scp s3t-frontend-v3.tar.gz s3t_dev@193.203.160.3:/var/www/srisaisenthiltravels/

echo "Deploying on Server..."
# Login as s3t_dev
ssh s3t_dev@193.203.160.3 << 'EOF'
  set -e
  STAGING_DIR="/var/www/srisaisenthiltravels/frontend-staging"
  mkdir -p $STAGING_DIR
  
  echo "Extracting to $STAGING_DIR..."
  tar -xzf /var/www/srisaisenthiltravels/s3t-frontend-v3.tar.gz -C $STAGING_DIR
  
  cd $STAGING_DIR
  echo "Ensuring production dependencies..."
  npm install --production --no-audit --no-fund
  
  echo "Packaging for live deployment..."
  tar -czf /var/www/srisaisenthiltravels/frontend_live_bundle.tar.gz .
  
  echo "Deploying to live directory (/root/s3t-app) via sudo tar..."
  sudo tar -xzf /var/www/srisaisenthiltravels/frontend_live_bundle.tar.gz -C /root/s3t-app
  
  echo "Restarting PM2 process..."
  sudo pm2 restart s3t-frontend || sudo pm2 start npm --name "s3t-frontend" -- start
  
  echo "Frontend Deployment Successful."
  sudo pm2 list
EOF
