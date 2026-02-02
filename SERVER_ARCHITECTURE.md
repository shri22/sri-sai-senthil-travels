# 🖥️ Ubuntu VPS Server Architecture

**Server IP**: `193.203.160.3`  
**OS**: Ubuntu 22.04 LTS  
**Last Updated**: February 2, 2026

---

## 📊 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         UBUNTU VPS SERVER                                │
│                        (193.203.160.3)                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
         ┌──────────▼──────────┐         ┌─────────▼──────────┐
         │   NGINX (Port 80/443)│         │  SQL SERVER        │
         │   Web Server + SSL   │         │  (Port 1433)       │
         └──────────┬───────────┘         └────────────────────┘
                    │                              │
        ┌───────────┼───────────┐                  │
        │           │           │                  │
        │           │           │                  │
┌───────▼─────┐ ┌──▼────────┐ ┌▼──────────┐      │
│ DOMAIN 1    │ │ DOMAIN 2  │ │ DOMAIN 2  │      │
│ :443 (HTTPS)│ │ :443      │ │ :3002     │      │
└─────────────┘ └───────────┘ └───────────┘      │
        │             │             │              │
        │             │             │              │
┌───────▼─────────────▼─────────────▼──────────────▼────────────┐
│                      PM2 PROCESS MANAGER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  s3t-frontend (Port 3000)                                │ │
│  │  Next.js Application                                     │ │
│  │  Path: /root/s3t-app/                                    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  s3t-api (Port 5000)                                     │ │
│  │  .NET 8 API                                              │ │
│  │  Path: /root/s3t-api-published/                          │ │
│  │  Database: S3T_Production ────────────────────────────┐  │ │
│  └──────────────────────────────────────────────────────│──┘ │
│                                                           │    │
│  ┌───────────────────────────────────────────────────────│──┐ │
│  │  vmurugan-api (Port 3002 HTTPS)                       │  │ │
│  │  Node.js API                                          │  │ │
│  │  Path: /root/sql_server_api/                          │  │ │
│  │  Database: VMuruganGoldTrading ───────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🌐 Domain Routing

### 1. **srisaisenthiltravels.cloud**

```
Internet → Nginx (Port 443) → Routes:
                              ├─ / → s3t-frontend (Port 3000)
                              ├─ /api/ → s3t-api (Port 5000)
                              └─ /swagger/ → s3t-api (Port 5000)
```

**URLs:**
- **Website**: https://srisaisenthiltravels.cloud
- **API**: https://srisaisenthiltravels.cloud/api/
- **Swagger**: https://srisaisenthiltravels.cloud/swagger/index.html

**SSL Certificate**: `/etc/letsencrypt/live/srisaisenthiltravels.cloud/`

---

### 2. **prodapi.vmuruganjewellery.co.in**

```
Internet → Nginx (Port 443) → vmurugan-api (Port 3002 HTTPS)
```

**URLs:**
- **API**: https://prodapi.vmuruganjewellery.co.in

**SSL Certificate**: `/etc/letsencrypt/live/prodapi.vmuruganjewellery.co.in/`

---

## 📁 File Structure on Server

```
/root/
├── s3t-app/                          # Sri Sai Senthil Travels Frontend
│   ├── .next/                        # Next.js build output
│   ├── node_modules/
│   ├── package.json
│   └── .env.production
│
├── s3t-api-published/                # Sri Sai Senthil Travels API (Built)
│   ├── S3T.Api.dll                   # Main .NET executable
│   ├── appsettings.Production.json   # Production config
│   └── [other .NET runtime files]
│
├── s3t-api-build/                    # Build artifacts (can be deleted)
│   └── dotnet-api/
│
└── sql_server_api/                   # VMurugan Gold Trading API
    ├── server.js                     # Node.js entry point
    ├── .env                          # Environment config
    ├── package.json
    └── node_modules/

/etc/nginx/sites-available/
├── s3t.cloud                         # Config for srisaisenthiltravels.cloud
├── vmurugan                          # Config for prodapi.vmuruganjewellery.co.in
└── default                           # Default Nginx config

/etc/nginx/sites-enabled/
├── s3t.cloud -> ../sites-available/s3t.cloud
└── vmurugan -> ../sites-available/vmurugan

/var/opt/mssql/data/
├── S3T_Production.mdf                # Sri Sai Senthil database
├── S3T_Production_log.ldf
├── VMuruganGoldTrading.mdf           # VMurugan database
└── VMuruganGoldTrading_log.ldf

/etc/letsencrypt/live/
├── srisaisenthiltravels.cloud/
│   ├── fullchain.pem
│   └── privkey.pem
└── prodapi.vmuruganjewellery.co.in/
    ├── fullchain.pem
    └── privkey.pem
```

---

## 🔧 PM2 Process Manager

### Running Processes

| ID | Name | Port | Type | Status | Path |
|----|------|------|------|--------|------|
| 0 | s3t-frontend | 3000 | Next.js | ✅ Online | /root/s3t-app |
| 3 | s3t-api | 5000 | .NET 8 | ✅ Online | /root/s3t-api-published |
| 2 | vmurugan-api | 3002 | Node.js | ✅ Online | /root/sql_server_api |

### PM2 Commands

```bash
# View all processes
pm2 list

# View logs
pm2 logs s3t-frontend
pm2 logs s3t-api
pm2 logs vmurugan-api

# Restart processes
pm2 restart s3t-frontend
pm2 restart s3t-api
pm2 restart vmurugan-api

# Stop processes
pm2 stop s3t-frontend
pm2 stop s3t-api
pm2 stop vmurugan-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

---

## 💾 Database Configuration

### SQL Server (Port 1433)

**Version**: SQL Server 2022  
**Status**: Running  
**Service**: `mssql-server`

#### Database 1: S3T_Production
- **Application**: Sri Sai Senthil Travels
- **Connection String**: `Server=localhost;Database=S3T_Production;User Id=sa;Password=VMurugan@2025#SQL;TrustServerCertificate=True;`
- **Tables**: Users, Vehicles, Bookings, Drivers, Partners, SystemConfigs, PaymentLogs, FuelLogs, Expenses, Reviews

#### Database 2: VMuruganGoldTrading
- **Application**: VMurugan Gold Trading
- **Connection String**: Configured in `/root/sql_server_api/.env`
- **Tables**: Customers, Transactions, Schemes, etc.

### Database Commands

```bash
# Check SQL Server status
systemctl status mssql-server

# Restart SQL Server
systemctl restart mssql-server

# Connect to SQL Server (if sqlcmd is installed)
sqlcmd -S localhost -U sa -P 'VMurugan@2025#SQL'
```

---

## 🔐 SSL/TLS Configuration

### Certificate Management (Let's Encrypt)

Both domains use Let's Encrypt SSL certificates managed by Certbot.

**Auto-renewal**: Certificates auto-renew via systemd timer

```bash
# Check certificate expiry
certbot certificates

# Manual renewal (if needed)
certbot renew

# Renew specific domain
certbot renew --cert-name srisaisenthiltravels.cloud
certbot renew --cert-name prodapi.vmuruganjewellery.co.in
```

---

## 🌐 Nginx Configuration

### Main Config Files

1. **srisaisenthiltravels.cloud** (`/etc/nginx/sites-available/s3t.cloud`):
   - HTTP (Port 80) → Redirects to HTTPS
   - HTTPS (Port 443) → Proxies to frontend/API

2. **prodapi.vmuruganjewellery.co.in** (`/etc/nginx/sites-available/vmurugan`):
   - HTTP (Port 80) → Redirects to HTTPS
   - HTTPS (Port 443) → Proxies to Node.js API (Port 3002)

### Nginx Commands

```bash
# Test configuration
nginx -t

# Reload configuration (no downtime)
systemctl reload nginx

# Restart Nginx
systemctl restart nginx

# Check status
systemctl status nginx

# View error logs
tail -f /var/log/nginx/error.log

# View access logs
tail -f /var/log/nginx/access.log
```

---

## 🚀 Application Details

### 1. Sri Sai Senthil Travels

**Frontend (Next.js)**
- **Framework**: Next.js 16.1.6
- **Language**: TypeScript
- **Port**: 3000
- **Environment**: Production
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

**Backend (.NET API)**
- **Framework**: .NET 8.0 / ASP.NET Core
- **Language**: C#
- **Port**: 5000
- **Database**: SQL Server (S3T_Production)
- **Features**: JWT Auth, SignalR, Swagger UI

**Default Credentials:**
- Admin: `admin@s3t.com` / `admin123`
- Partner: `partner@alpha.com` / `partner123`

---

### 2. VMurugan Gold Trading API

**Backend (Node.js)**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Port**: 3002 (HTTPS)
- **Database**: SQL Server (VMuruganGoldTrading)
- **Features**: Firebase Push Notifications, Omniware Integration

---

## 🔄 Deployment Workflow

### Updating Sri Sai Senthil Travels

#### Frontend Update:
```bash
# On local machine
cd /path/to/sri-sai-senthil-travels
npm run build
tar -czf s3t-frontend.tar.gz .next/ package.json package-lock.json public/

# Upload to server
scp s3t-frontend.tar.gz root@193.203.160.3:/root/

# On server
ssh root@193.203.160.3
cd /root/s3t-app
tar -xzf ../s3t-frontend.tar.gz
npm install --production
pm2 restart s3t-frontend
```

#### Backend Update:
```bash
# On local machine
cd /path/to/sri-sai-senthil-travels/dotnet-api
tar -czf s3t-api-source.tar.gz .

# Upload to server
scp s3t-api-source.tar.gz root@193.203.160.3:/root/

# On server
ssh root@193.203.160.3
rm -rf /root/s3t-api-build
mkdir /root/s3t-api-build
tar -xzf /root/s3t-api-source.tar.gz -C /root/s3t-api-build
cd /root/s3t-api-build
find . -name '._*' -delete  # Remove macOS metadata
dotnet publish -c Release -o /root/s3t-api-published
pm2 restart s3t-api
```

---

## 🛠️ Troubleshooting

### Check Application Status
```bash
# PM2 processes
pm2 list
pm2 logs --lines 50

# Nginx
systemctl status nginx
nginx -t

# SQL Server
systemctl status mssql-server

# Check ports
netstat -tulpn | grep -E '3000|5000|3002|1433|80|443'
```

### Common Issues

**Frontend not loading:**
```bash
pm2 logs s3t-frontend
pm2 restart s3t-frontend
```

**API errors:**
```bash
pm2 logs s3t-api
# Check database connection
systemctl status mssql-server
```

**SSL certificate issues:**
```bash
certbot certificates
certbot renew --dry-run
```

**Nginx 502 Bad Gateway:**
```bash
# Check if backend services are running
pm2 list
# Check Nginx error logs
tail -f /var/log/nginx/error.log
```

---

## 📝 Important Notes

1. **Both applications are completely isolated** - They run on different ports and use separate databases
2. **SSL certificates auto-renew** - Certbot handles this automatically
3. **PM2 auto-starts on boot** - All processes will restart if the server reboots
4. **Database backups** - Set up regular SQL Server backups for both databases
5. **Firewall** - Ensure ports 80, 443, and 1433 are open

---

## 🔗 Quick Links

- **S3T Website**: https://srisaisenthiltravels.cloud
- **S3T API Docs**: https://srisaisenthiltravels.cloud/swagger/index.html
- **VMurugan API**: https://prodapi.vmuruganjewellery.co.in

---

## 📞 Support

For deployment issues or questions, refer to this document or check the application logs using PM2.

**Last Updated**: February 2, 2026
