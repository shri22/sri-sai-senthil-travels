#!/bin/bash
set -e

echo "Packaging API Source..."
cd dotnet-api
# Exclude build artifacts and unrelated files
tar -czf ../s3t-api-v3.tar.gz --exclude='bin' --exclude='obj' --exclude='s3t.db' .
cd ..

echo "Transferring files..."
# This will prompt for password
scp s3t-api-v3.tar.gz dotnet-api/update_schema_v2.sql root@193.203.160.3:/root/

echo "Deploying on Server..."
# This will prompt for password again
ssh root@193.203.160.3 << 'EOF'
  set -e
  
  # 1. Update DB Schema (MSSQL)
  echo "Updating SQL Server Schema (S3T_Production)..."
  # Use sqlcmd to apply updates. We ignore errors in case columns already exist.
  /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'VMurugan@2025#SQL' -i /root/update_schema_v2.sql || echo "Schema update finished with warnings."

  # 2. Prepare Build Directory
  echo "Preparing build..."
  rm -rf /root/s3t-api-build-new
  mkdir -p /root/s3t-api-build-new
  tar -xzf /root/s3t-api-v3.tar.gz -C /root/s3t-api-build-new
  cd /root/s3t-api-build-new
  find . -name '._*' -delete  # Remove macOS binary sidecar files to prevent build errors

  # 3. Build and Publish
  echo "Publishing API..."
  dotnet publish S3T.Api.csproj -c Release -o /root/s3t-api-published

  # 4. Restart via PM2
  echo "Restarting via PM2..."
  pm2 restart s3t-api || pm2 start /root/s3t-api-published/S3T.Api.dll --name s3t-api

  echo "Deployment Complete."
  pm2 list
EOF
