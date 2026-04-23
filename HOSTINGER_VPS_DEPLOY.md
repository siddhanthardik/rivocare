# Hostinger VPS Deployment Guide

This project has:

- `frontend`: Vite/React static build
- `backend`: Node.js/Express API
- `MongoDB`: local MongoDB or MongoDB Atlas

These steps assume:

- your Hostinger VPS is Ubuntu
- you already have **two other projects** running on the same server
- you will deploy this app on a **new domain or subdomain**
- you will use **Nginx + PM2**

Recommended structure:

- Frontend domain: `carely.yourdomain.com`
- API domain: `api-carely.yourdomain.com`
- Backend port: `5002`

Use a **new port** so you do not disturb the two existing apps.

---

## 1. Connect to the VPS

From your local machine:

```bash
ssh root@YOUR_SERVER_IP
```

If you use another user:

```bash
ssh youruser@YOUR_SERVER_IP
```

---

## 2. Check what is already running

Before deploying, inspect the current server setup:

```bash
pm2 list
sudo nginx -t
sudo ls /etc/nginx/sites-available
sudo ls /etc/nginx/sites-enabled
sudo ss -tulpn | grep LISTEN
```

Pick a backend port that is not already in use. For this guide, we use `5002`.

---

## 3. Install required packages

If Node, Nginx, and PM2 are already installed, you can skip this.

```bash
sudo apt update
sudo apt install -y nginx git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

Verify:

```bash
node -v
npm -v
pm2 -v
```

---

## 4. Create an app directory

Example:

```bash
mkdir -p /var/www/carely
cd /var/www/carely
```

---

## 5. Upload or clone the project

Option A: clone from Git:

```bash
git clone YOUR_GIT_REPOSITORY .
```

Option B: upload from local machine using SCP/WinSCP, then place the files in:

```bash
/var/www/carely
```

After upload:

```bash
cd /var/www/carely
```

---

## 6. Install dependencies

Because this repo uses npm workspaces, install from the root:

```bash
npm install
```

---

## 7. Create production environment files

### Backend env

Create:

```bash
nano /var/www/carely/backend/.env
```

Use production values like this:

```env
NODE_ENV=production
PORT=5002
MONGODB_URI=mongodb://127.0.0.1:27017/rivo
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRE=30d
JWT_REFRESH_SECRET=replace_with_another_long_random_secret
CLIENT_URL=https://carely.yourdomain.com
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_EMAIL=your_smtp_username
SMTP_PASSWORD=your_smtp_password
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Carely
ENCRYPTION_SECRET=replace_with_32_byte_hex_or_strong_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

If you use MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string.

### Frontend env

Create:

```bash
nano /var/www/carely/frontend/.env
```

Add:

```env
VITE_API_URL=https://api-carely.yourdomain.com/api
```

Important:

- `CLIENT_URL` must match the frontend domain exactly
- `VITE_API_URL` must point to the public API domain, not `localhost`
- do not reuse secrets from your current `.env.example`

---

## 8. Build the frontend

Run:

```bash
cd /var/www/carely
npm run build --workspace=frontend
```

This creates:

```bash
/var/www/carely/frontend/dist
```

---

## 9. Start the backend with PM2

From the project root:

```bash
cd /var/www/carely
pm2 start backend/src/index.js --name carely-backend
```

Check logs:

```bash
pm2 logs carely-backend
```

Check status:

```bash
pm2 list
```

Make PM2 restart after reboot:

```bash
pm2 save
pm2 startup
```

Run the command that `pm2 startup` prints.

---

## 10. Test the backend locally on the server

Run:

```bash
curl http://127.0.0.1:5002/api/health
```

You should get a JSON response showing the API is healthy.

If not:

```bash
pm2 logs carely-backend
```

---

## 11. Configure Nginx for the frontend

Create a new Nginx site file:

```bash
sudo nano /etc/nginx/sites-available/carely-frontend
```

Paste:

```nginx
server {
    listen 80;
    server_name carely.yourdomain.com;

    root /var/www/carely/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/carely-frontend /etc/nginx/sites-enabled/
```

---

## 12. Configure Nginx for the backend API

Create another site:

```bash
sudo nano /etc/nginx/sites-available/carely-api
```

Paste:

```nginx
server {
    listen 80;
    server_name api-carely.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/carely-api /etc/nginx/sites-enabled/
```

---

## 13. Test and reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

If Nginx fails, check for:

- a port conflict
- duplicate `server_name`
- typo in the site file

---

## 14. Point DNS in Hostinger

In your Hostinger DNS panel, create:

- `A` record for `carely` -> your VPS IP
- `A` record for `api-carely` -> your VPS IP

If you prefer a single main domain, you can also use:

- `yourdomain.com` for frontend
- `api.yourdomain.com` for backend

Wait for DNS propagation.

---

## 15. Add SSL with Let's Encrypt

Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Generate certificates:

```bash
sudo certbot --nginx -d carely.yourdomain.com -d api-carely.yourdomain.com
```

Then verify auto-renew:

```bash
sudo systemctl status certbot.timer
```

---

## 16. Verify the full deployment

Check these in the browser:

- `https://carely.yourdomain.com`
- `https://api-carely.yourdomain.com/api/health`

Also check on the server:

```bash
pm2 list
pm2 logs carely-backend --lines 100
sudo systemctl status nginx
```

---

## 17. Future updates

Whenever you push new code:

```bash
cd /var/www/carely
git pull
npm install
npm run build --workspace=frontend
pm2 restart carely-backend
sudo systemctl reload nginx
```

---

## 18. If MongoDB is not installed on the VPS

You have two options:

### Option A: Use MongoDB Atlas

This is the simplest production option. Just put the Atlas URI into:

```env
MONGODB_URI=your_atlas_connection_string
```

### Option B: Install MongoDB on the VPS

If you want MongoDB on the same VPS, install it separately and make sure it starts on boot. Atlas is usually easier and safer for smaller deployments.

---

## 19. Important notes because you already run 2 projects on the same server

Do these carefully:

1. Use a **different PM2 app name**:

```bash
carely-backend
```

2. Use a **different backend port**:

```bash
5002
```

3. Use a **new Nginx server block** with a unique `server_name`

4. Do **not** modify the Nginx files for the other two projects unless you intentionally want to merge configs

5. Check open ports before choosing one:

```bash
sudo ss -tulpn | grep LISTEN
```

6. If another app already uses the same domain or subdomain, choose a different one

---

## 20. Recommended deployment map

For a server with multiple projects, this is a clean setup:

- Project 1: `app1.yourdomain.com` -> existing config
- Project 2: `app2.yourdomain.com` -> existing config
- Carely frontend: `carely.yourdomain.com` -> Nginx static files
- Carely API: `api-carely.yourdomain.com` -> Nginx reverse proxy to `127.0.0.1:5002`

---

## 21. Quick troubleshooting

### Frontend loads but API fails

Check:

- `frontend/.env`
- `backend/.env`
- CORS `CLIENT_URL`
- Nginx API config
- PM2 backend status

### 502 Bad Gateway

Usually means backend is not running or wrong port in Nginx:

```bash
pm2 logs carely-backend
curl http://127.0.0.1:5002/api/health
```

### Blank page after frontend deploy

Usually means the frontend was built with the wrong `VITE_API_URL`, or Nginx root is wrong:

```bash
ls /var/www/carely/frontend/dist
```

### CORS error

Make sure:

```env
CLIENT_URL=https://carely.yourdomain.com
```

---

## 22. Best practice for this project

For this repo, the safest production setup is:

- frontend served by Nginx from `frontend/dist`
- backend managed by PM2
- MongoDB Atlas or dedicated MongoDB
- separate frontend and API subdomains

That keeps this deployment isolated from your two existing projects and makes rollback easier.
