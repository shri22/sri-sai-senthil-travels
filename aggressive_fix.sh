#!/bin/bash
set -x

# 1. Kill Apache and Monarx (if running)
systemctl stop apache2 || true
systemctl stop httpd || true
fuser -k 80/tcp || true

# 2. Unmask Apache just in case
systemctl unmask apache2 || true
systemctl disable apache2 || true

# 3. Apply Nginx config
cp /root/s3t_nginx.conf /etc/nginx/sites-available/s3t.cloud || {
    # If file not there, create it again
    cat > /etc/nginx/sites-available/s3t.cloud <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name s3t.cloud www.s3t.cloud 193.203.160.3;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
}

ln -sf /etc/nginx/sites-available/s3t.cloud /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default || true

# 4. Final attempt to start Nginx
nginx -t && systemctl restart nginx
systemctl enable nginx

echo "Aggressive Fix Complete"
