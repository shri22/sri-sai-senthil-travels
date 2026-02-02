#!/bin/bash
set -e

echo "--- 📦 Packaging Components ---"

# 1. Frontend Build (Assuming already built in previous step, but let's be sure)
echo "Building Frontend..."
npm run build

echo "Packaging Frontend..."
tar -czf s3t-frontend-v3.tar.gz .next/ package.json package-lock.json public/

# 2. Backend
echo "Packaging Backend..."
cd dotnet-api
# Ensure we don't include massive bin/obj or local sqlite if any
tar -czf ../s3t-api-v3.tar.gz --exclude='bin' --exclude='obj' --exclude='s3t.db' .
cd ..

echo "--- 🚀 Transferring to VPS ---"
echo "Please enter your password when prompted."
scp s3t-frontend-v3.tar.gz s3t-api-v3.tar.gz dotnet-api/update_schema_v2.sql s3t_nginx.conf root@193.203.160.3:/root/

echo "--- 🛠️  Executing Server Deployment ---"
ssh root@193.203.160.3 << 'EOF'
  set -e
  
  # 1. Update Nginx Config
  echo "Updating Nginx..."
  cp /root/s3t_nginx.conf /etc/nginx/sites-available/s3t.cloud
  ln -sf /etc/nginx/sites-available/s3t.cloud /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx

  # 2. Update Database
  echo "Applying SQL Updates..."
  /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'VMurugan@2025#SQL' -i /root/update_schema_v2.sql || echo "SQL warnings (likely columns exist)"

  # 3. Deploy Backend
  echo "Deploying Backend..."
  rm -rf /root/s3t-api-build-final
  mkdir -p /root/s3t-api-build-final
  tar -xzf /root/s3t-api-v3.tar.gz -C /root/s3t-api-build-final
  cd /root/s3t-api-build-final
  find . -name '._*' -delete
  
  dotnet publish S3T.Api.csproj -c Release -o /root/s3t-api-published
  
  pm2 stop s3t-api || true
  pm2 restart s3t-api || pm2 start /root/s3t-api-published/S3T.Api.dll --name s3t-api

  # 4. Deploy Frontend
  echo "Deploying Frontend..."
  mkdir -p /root/s3t-app
  tar -xzf /root/s3t-frontend-v3.tar.gz -C /root/s3t-app
  cd /root/s3t-app
  npm install --production --no-audit --no-fund
  
  pm2 restart s3t-frontend || pm2 start npm --name "s3t-frontend" -- start

  echo "Deployment Finalized."
  pm2 list
  
  echo "Checking logs for errors..."
  sleep 2
  pm2 logs s3t-api --lines 20 --no-daemon &
  LOG_PID=$!
  sleep 5
  kill $LOG_PID || true
EOF
