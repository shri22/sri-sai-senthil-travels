#!/bin/bash
set -e

echo "Cleaning up web server conflict..."
systemctl stop apache2 || true
systemctl disable apache2 || true

echo "Configuring Nginx..."
apt update && apt install -y nginx

# Copy config if it exists in the temp location
if [ -f "/root/s3t_nginx.conf" ]; then
    cp /root/s3t_nginx.conf /etc/nginx/sites-available/s3t.cloud
else
    cat > /etc/nginx/sites-available/s3t.cloud <<EOF
server {
    listen 80;
    server_name s3t.cloud www.s3t.cloud;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
fi

ln -sf /etc/nginx/sites-available/s3t.cloud /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl restart nginx

echo "Nginx configured for s3t.cloud"
