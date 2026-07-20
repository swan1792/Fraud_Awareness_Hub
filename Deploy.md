# Deployment Guide — Fraud Awareness Hub

## Overview

| Service | Platform | What it does |
|---------|----------|--------------|
| ML Server | **GCP Compute Engine** | Python FastAPI + LLM model (e2-standard-2, $300 free credits) |
| Backend | Railway | Express.js API + SQLite |
| Client | Vercel | Public React SPA |
| Admin | Vercel | Admin React SPA |

---

## Prerequisites

- GitHub account
- Railway account ([railway.app](https://railway.app))
- Vercel account ([vercel.com](https://vercel.com))
- Google Drive account
- `model.gguf` file (downloaded from Colab)

---

## Part 1: Push to GitHub

```bash
cd ~/Desktop/ML/Fraud_Awareness_Hub
git add .
git commit -m "feat: deployment-ready configuration"
git push
```

---

## Part 2: Upload Model to Google Drive

### 2.1 Upload

1. Go to [drive.google.com](https://drive.google.com)
2. Click **"+ New"** → **"File upload"**
3. Select `ml/models/scammer-llm/model.gguf`
4. Wait for upload to complete (~1.6GB)

### 2.2 Make Public

1. Right-click `model.gguf` in Google Drive
2. Click **"Share"**
3. Under **"General access"**, change to **"Anyone with the link"**
4. Click **"Copy link"**

### 2.3 Extract File ID

Your link looks like:
```
https://drive.google.com/file/d/1ABC123XYZ/view?usp=sharing
```

Copy the file ID: `1ABC123XYZ`

### 2.4 Create Download URL

```
https://drive.google.com/uc?export=download&id=1ABC123XYZ
```

Save this URL — you'll need it in Step 4.

---

## Part 3: Deploy ML Server to GCP

We use **GCP Compute Engine** for the ML server because Railway doesn't offer GPU/CPU instances large enough for LLM inference. GCP gives **$300 free credits for 90 days** — enough for ~5 months of an e2-standard-2 instance.

### 3.1 Prerequisites

1. Go to [cloud.google.com/free](https://cloud.google.com/free)
2. Sign up for GCP Free Tier (requires credit card for verification, won't be charged)
3. You'll receive **$300 in free credits** valid for 90 days

### 3.2 Create a VM Instance

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Select or create a project
3. Go to **"Compute Engine"** → **"VM instances"**
4. Click **"Create Instance"**

### 3.3 Configure the VM

| Setting | Value |
|---------|-------|
| **Name** | `ml-server` |
| **Region** | `us-central1` (or closest to your users) |
| **Zone** | Any (e.g., `us-central1-a`) |
| **Machine type** | `e2-standard-2` (2 vCPU, 8GB RAM) |
| **Boot disk** | Ubuntu 22.04 LTS, **30 GB** standard persistent disk |
| **Firewall** | ✅ Allow HTTP traffic, ✅ Allow HTTPS traffic |

> **Cost:** ~$49/month. With $300 credits, this runs free for ~6 months.

### 3.4 Set Up Firewall Rule

1. Go to **"VPC Network"** → **"Firewall"**
2. Click **"Create Firewall Rule"**

| Setting | Value |
|---------|-------|
| **Name** | `allow-llm-server` |
| **Targets** | `Instance tags` → `llm-server` |
| **Source IP ranges** | `0.0.0.0/0` |
| **Protocols/ports** | `tcp:8000` |

3. Go back to your VM → **"Edit"** → add network tag: `llm-server`

### 3.5 SSH into the VM and Deploy

Click **"SSH"** on your VM instance in the GCP console, then run:

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Log out and back in for docker group to take effect
exit
```

SSH back in, then:

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/Fraud_Awareness_Hub.git
cd Fraud_Awareness_Hub/ml/server

# Create models directory
mkdir -p models/scammer-llm

# Download the model from Google Drive
# Replace YOUR_FILE_ID with your actual Google Drive file ID
sudo apt-get install -y gdown
gdown "https://drive.google.com/uc?export=download&id=YOUR_FILE_ID" -O models/scammer-llm/model.gguf

# Build and run with Docker
sudo docker build -t ml-server .
sudo docker run -d \
  --name ml-server \
  --restart unless-stopped \
  -p 8000:8000 \
  -e MODEL_DIR=/app/models/scammer-llm \
  -e MAX_TOKENS=150 \
  -e TEMPERATURE=0.8 \
  -e N_THREADS=2 \
  -v $(pwd)/models:/app/models \
  ml-server
```

### 3.6 Verify the Server

```bash
# Check container is running
sudo docker ps

# Check logs
sudo docker logs ml-server

# Test health endpoint (from VM)
curl http://localhost:8000/health

# Test from your machine (replace VM_IP with your external IP)
curl http://VM_IP:8000/health
```

Expected response:
```json
{"status":"ok","model_loaded":true,"model_path":"/app/models/scammer-llm"}
```

### 3.7 Find Your External IP

1. Go to GCP Console → **Compute Engine** → **VM instances**
2. Find your `ml-server` instance
3. Copy the **"External IP"** (e.g., `34.123.45.67`)

Your ML server URL is: `http://34.123.45.67:8000`

> **Security note:** This endpoint is publicly accessible. For production, add API key authentication (see Part 3.8).

### 3.8 (Optional) Add API Key Authentication

For production, protect the ML server with a simple API key:

```bash
# On the VM, create an nginx reverse proxy with API key auth
sudo apt-get install -y nginx

# Create nginx config
sudo tee /etc/nginx/sites-available/ml-server << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        # Check for API key in header
        if ($http_x_api_key != "YOUR_SECRET_API_KEY") {
            return 401 '{"error":"Unauthorized"}';
        }

        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;
        proxy_cache off;

        # SSE support
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/ml-server /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

# Update Docker to only listen on localhost
sudo docker stop ml-server
sudo docker rm ml-server
sudo docker run -d \
  --name ml-server \
  --restart unless-stopped \
  --network host \
  -e MODEL_DIR=/app/models/scammer-llm \
  -e MAX_TOKENS=150 \
  -e TEMPERATURE=0.8 \
  -e N_THREADS=2 \
  -v $(pwd)/models:/app/models \
  ml-server
```

Then use port **80** instead of **8000**, and add the API key header in your backend.

---

## Part 4: Deploy Backend to Railway

### 4.1 Create Service

1. In same Railway project, click **"New"**
2. Click **"GitHub Repo"**
3. Select same `Fraud_Awareness_Hub` repo

### 4.2 Configure Service

1. Click on the new service
2. Go to **"Settings"**
3. Set **Root Directory** to: `backend`

### 4.3 Add Environment Variables

Go to **"Variables"** tab and add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `PYTHON_SIDECAR_URL` | `http://VM_EXTERNAL_IP:8000` (e.g., `http://34.123.45.67:8000`) |
| `JWT_SECRET` | *(generate a random secret, e.g., `openssl rand -hex 32`)* |
| `JWT_EXPIRES_IN` | `24h` |
| `ADMIN_EMAIL` | *(your email, e.g., `admin@example.com`)* |
| `ADMIN_PASSWORD` | *(strong password, e.g., `MySecurePass123!`)* |
| `DB_PATH` | `/data/fraud_hub.db` |
| `CORS_ORIGINS` | `https://your-client-app.vercel.app,https://your-admin-app.vercel.app` |

**Note:** SQLite database resets on each deploy. Schema + seed data auto-recreate from `schema.sql`.

### 4.4 Generate Domain

1. Go to **"Settings"** → **"Networking"**
2. Click **"Generate Domain"**
3. Copy the URL: `https://backend-xxx.up.railway.app`

### 4.6 Verify ML Connection

Open in browser:
```
https://backend-xxx.up.railway.app/api/simulator/health
```

Expected response:
```json
{"status":"ok","model_loaded":true}
```

If `model_loaded` is `false`, check the ML server logs.

---

## Part 5: Deploy Frontend Client to Vercel

### 5.1 Create Project

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"Add New Project"**
4. Import `Fraud_Awareness_Hub` repo

### 5.2 Configure Project

| Setting | Value |
|---------|-------|
| Root Directory | `frontend-client` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### 5.3 Add Environment Variable

Go to **"Environment Variables"** and add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://backend-xxx.up.railway.app` |

### 5.4 Deploy

1. Click **"Deploy"**
2. Wait for build to complete
3. Copy the URL: `https://client-xxx.vercel.app`

---

## Part 6: Deploy Frontend Admin to Vercel

### 6.1 Create Project

1. In Vercel, click **"Add New Project"**
2. Import same `Fraud_Awareness_Hub` repo

### 6.2 Configure Project

| Setting | Value |
|---------|-------|
| Root Directory | `frontend-admin` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### 6.3 Add Environment Variable

Go to **"Environment Variables"** and add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://backend-xxx.up.railway.app` |

### 6.4 Deploy

1. Click **"Deploy"**
2. Wait for build to complete
3. Copy the URL: `https://admin-xxx.vercel.app`

---

## Part 7: Update Backend CORS

### 7.1 Update CORS_ORIGINS

1. Go to Railway → Backend service → **"Variables"**
2. Find `CORS_ORIGINS`
3. Update to:

```
https://client-xxx.vercel.app,https://admin-xxx.vercel.app
```

4. Railway auto-redeploys

---

## Part 8: Test Everything

| Test | URL | Expected Result |
|------|-----|-----------------|
| Client Homepage | `https://client-xxx.vercel.app` | Loads, shows scam alerts |
| Client Scam Alerts | `https://client-xxx.vercel.app` | Displays alerts from API |
| Client Chat Simulator | `https://client-xxx.vercel.app` | Works with real model |
| Admin Login | `https://admin-xxx.vercel.app/login` | Login form appears |
| Admin Dashboard | Login with admin creds | Shows stats |
| Admin CRUD | Create/edit/delete alerts | Works |
| Health Check | `https://backend-xxx.up.railway.app/api/health` | `{"status":"ok"}` |
| Simulator Health | `https://backend-xxx.up.railway.app/api/simulator/health` | `{"status":"ok","model_loaded":true}` |

---

## Final URLs

| Service | Platform | URL |
|---------|----------|-----|
| ML Server | GCP Compute Engine | `http://VM_EXTERNAL_IP:8000` |
| Backend | Railway | `https://backend-xxx.up.railway.app` |
| Client | Vercel | `https://client-xxx.vercel.app` |
| Admin | Vercel | `https://admin-xxx.vercel.app` |

---

## Troubleshooting

### Model not loading (GCP)

1. SSH into VM: `sudo docker logs ml-server`
2. Verify model file exists: `ls -la models/scammer-llm/model.gguf`
3. Check disk space: `df -h`
4. If Google Drive download failed, re-run manually:
   ```bash
   gdown "https://drive.google.com/uc?export=download&id=YOUR_FILE_ID" -O models/scammer-llm/model.gguf
   ```
5. If Google Drive shows virus warning, add `&confirm=t` to URL:
   ```
   https://drive.google.com/uc?export=download&confirm=t&id=YOUR_FILE_ID
   ```

### Cannot SSH into GCP VM

1. Check firewall rule allows port 22
2. Ensure you're using the correct username (typically `gcloud` or your GCP username)
3. Try via GCP Console → Compute Engine → VM instances → SSH button

### Backend can't reach GCP ML server

1. Verify VM external IP is correct in `PYTHON_SIDECAR_URL`
2. Check firewall rule allows port 8000 (or 80 if using nginx)
3. Test from VM: `curl http://localhost:8000/health`
4. Test from outside: `curl http://VM_IP:8000/health`
5. Ensure Docker container is running: `sudo docker ps`

### CORS errors

1. Verify `CORS_ORIGINS` includes both Vercel URLs
2. Check for typos in URLs
3. Wait for Railway to redeploy after env var change

### Frontend can't reach API

1. Verify `VITE_API_URL` is set correctly in Vercel
2. Check the backend is running in Railway
3. Test the API directly: `https://backend-xxx.up.railway.app/api/health`

### SQLite database resets

1. Verify volume is mounted at `/data`
2. Check `DB_PATH` is set to `/data/fraud_hub.db`

### Vercel build fails

1. Check build logs in Vercel dashboard
2. Verify `package.json` has correct build script
3. Test locally: `cd frontend-client && npm run build`

---

## Important Notes

| Note | Detail |
|------|--------|
| **GCP Free Tier** | $300 credits for 90 days. e2-standard-2 costs ~$49/mo = ~6 months free |
| **GCP Billing** | Credit card required for signup. You won't be charged until credits expire |
| **First deploy** | ML server takes 1-3 minutes to download model |
| **Vite env vars** | Baked at build time — changing requires Vercel redeploy |
| **SQLite** | Railway volume persists data across redeploys |
| **JWT Secret** | Use a strong random secret in production |
| **Admin Password** | Change from default in production |
| **Google Drive** | Free accounts have download limits — consider S3 for production |
| **Model Size** | 1.6GB — first deploy is slow, subsequent deploys use cache |
| **ML Server Security** | GCP ML server is public by default. Add nginx + API key for production |
| **Shut down to save credits** | Stop VM when not in use to preserve credits |

---

## GCP Cost-Saving Tips

### Stop VM When Not in Use

If you're done testing and want to preserve credits:

1. Go to GCP Console → Compute Engine → VM instances
2. Click **"Stop"** next to your `ml-server` instance
3. Disk data is preserved (you still pay ~$2/mo for 30GB disk)
4. Click **"Start"** when you need it again

### Cost Breakdown

| Resource | Cost | With $300 credits |
|----------|------|-------------------|
| e2-standard-2 (2 vCPU, 8GB) | ~$49/mo | ~6 months free |
| 30GB standard disk | ~$2/mo | ~150 months free |
| Network egress (1GB/mo) | ~$0.12 | Free |
| **Total** | **~$51/mo** | **~6 months free** |

### To Minimize Credit Usage

- **Stop the VM** when not actively testing
- Use a **smaller disk** (10GB = ~$0.40/mo) if you don't need the extra space
- **Delete the VM** when credits run out (don't let it auto-charge your card)

### After Credits Expire

Options when $300 runs out:
1. **Move ML server to Railway Pro** ($20/mo) — CPU inference is slower but works
2. **Use a different cloud** — AWS/GCP/Azure often have new-user credits
3. **Run locally** — `docker-compose up` on your machine for development
4. **Use mock mode** — your FastAPI server already has keyword-based fallback
