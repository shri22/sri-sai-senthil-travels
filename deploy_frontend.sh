#!/bin/bash
set -e

echo "Building Frontend..."
npm run build

echo "Packaging Frontend Build..."
tar -czf s3t-frontend-v3.tar.gz .next/ package.json package-lock.json public/

echo "Transferring to VPS..."
# User will enter password
scp s3t-frontend-v3.tar.gz root@193.203.160.3:/root/

echo "Deploying on Server..."
# User will enter password
ssh root@193.203.160.3 << 'EOF'
  set -e
  WORK_DIR="/root/s3t-app"
  mkdir -p $WORK_DIR
  
  echo "Extracting to $WORK_DIR..."
  tar -xzf /root/s3t-frontend-v3.tar.gz -C $WORK_DIR
  
  cd $WORK_DIR
  echo "Ensuring production dependencies..."
  # Clean install production deps
  npm install --production --no-audit --no-fund
  
  echo "Restarting PM2 process..."
  pm2 restart s3t-frontend || pm2 start npm --name "s3t-frontend" -- start
  
  echo "Frontend Deployment Successful."
  pm2 list
EOF
