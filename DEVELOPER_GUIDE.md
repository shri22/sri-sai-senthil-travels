# 🛠️ Sri Sai Senthil Travels - Developer Guide

This document contains the technical details required for developers to work on the **Sri Sai Senthil Travels** platform.

## 🗄️ Server Information

| Detail | Value |
| :--- | :--- |
| **Server IP** | `193.203.160.3` |
| **Environment** | Ubuntu 22.04 LTS (Contabo VPS) |
| **Developer User** | `s3t_dev` |
| **Password** | `Travels2026#` |
| **Access Type** | Restricted (Project-level access only) |

---

## 📂 Project Structure

All project files are isolated in the following directory to ensure security and privacy of other server assets:

| Path | Description |
| :--- | :--- |
| `/var/www/srisaisenthiltravels/` | Main Project Root |
| `.../api-published/` | .NET 8 Backend API (Live Binaries) |
| `.../frontend-app/` | Next.js Frontend (Production Build) |
| `.../api-build/` | Temporary Build Path for API |

---

## 🚀 Deployment Workflow

We use automated shell scripts on the local development machine (Mac/Windows) to push updates to the server.

### 1. Deploying Backend (.NET)
Run from project root:
```bash
./deploy_v3.sh
```
*Prompts for `s3t_dev` password.*

### 2. Deploying Frontend (Next.js)
Run from project root:
```bash
./deploy_frontend.sh
```
*Prompts for `s3t_dev` password.*

---

## ⚙️ Service Management

The developer user has `sudo` permissions for specific management commands only.

### PM2 (Process Manager)
- **View Status**: `sudo pm2 list`
- **Check API Logs**: `sudo pm2 logs s3t-api`
- **Check Frontend Logs**: `sudo pm2 logs s3t-frontend`
- **Restart All**: `sudo pm2 restart all`

### Nginx (Web Server)
- **Test Config**: `sudo nginx -t`
- **Reload Config**: `sudo nginx -s reload`

---

## 🛡️ Security Policy

1. **Jailed Environment**: The `s3t_dev` user is restricted to the `/var/www/srisaisenthiltravels` directory. 
2. **Privacy**: Access to `/root` and other project directories (e.g., `vmurugan`) is strictly prohibited and physically blocked by Linux permissions.
3. **Database**: MSSQL is running locally on the VPS. Connection strings are managed via `appsettings.json` or Environment Variables.

---

## 📞 Support
For infrastructure issues or root-level access (SSL, software installs), please contact the System Administrator.
