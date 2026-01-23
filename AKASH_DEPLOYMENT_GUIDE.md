# 🚀 Deploying Bridge Swift to Akash Network

This guide walks you through deploying Bridge Swift to Akash Network using the Akash Console (web UI).

## 📋 Prerequisites

1. **Akash Wallet** with AKT tokens
   - Get wallet: [Keplr](https://www.keplr.app/) or [Leap](https://www.leapwallet.io/)
   - Get AKT: [Osmosis DEX](https://app.osmosis.zone/) or exchanges

2. **Docker Hub Account** (free)
   - Sign up at [hub.docker.com](https://hub.docker.com/)

3. **Environment Variables**
   - WalletConnect Project ID: [cloud.walletconnect.com](https://cloud.walletconnect.com/)
   - Alchemy API Key (optional): [alchemy.com](https://www.alchemy.com/)

## 🔨 Step 1: Build and Push Docker Image

### Option A: Using Automated Script (Recommended)

**This builds for both ARM64 and AMD64 architectures (required for Akash)**

```bash
# 1. Set your environment variables
export DOCKERHUB_USERNAME=your_dockerhub_username
export NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
export NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key  # Optional

# 2. Login to Docker Hub
docker login

# 3. Run the build script (builds for both ARM64 and AMD64)
./build-and-push.sh
```

### Option B: Manual Multi-Platform Build

```bash
# 1. Create buildx builder (one-time setup)
docker buildx create --name akash-builder --use

# 2. Build and push for both ARM64 and AMD64
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id \
  --build-arg NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key \
  -t YOUR_DOCKERHUB_USERNAME/bridge-swift:latest \
  --push \
  .
```

**⚠️ IMPORTANT:** Always use `--platform linux/amd64,linux/arm64` to ensure compatibility with all Akash providers.

### Option B: Using GitHub Actions (Automated)

Create `.github/workflows/docker-build.yml`:

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/bridge-swift:latest
          build-args: |
            NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=${{ secrets.WALLETCONNECT_PROJECT_ID }}
            NEXT_PUBLIC_ALCHEMY_API_KEY=${{ secrets.ALCHEMY_API_KEY }}
```

## 🌐 Step 2: Deploy via Akash Console

### 2.1 Access Akash Console

1. Go to **[console.akash.network](https://console.akash.network/)**
2. Click **"Connect Wallet"**
3. Select **Keplr** or **Leap** wallet
4. Approve the connection

### 2.2 Create Deployment

1. Click **"Deploy"** button (top right)
2. Select **"Build your template"** or **"Empty"**
3. **Paste the SDL configuration** (see below)
4. Click **"Create Deployment"**

### 2.3 SDL Configuration for Console

Copy and paste this into the Akash Console SDL editor:

```yaml
---
version: "2.0"

services:
  web:
    image: YOUR_DOCKERHUB_USERNAME/bridge-swift:latest
    env:
      - "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_WALLETCONNECT_PROJECT_ID"
      - "NEXT_PUBLIC_ALCHEMY_API_KEY=YOUR_ALCHEMY_API_KEY"
      - "NEXT_PUBLIC_ENABLE_TESTNETS=true"
      - "NODE_ENV=production"
    expose:
      - port: 3000
        as: 80
        to:
          - global: true

profiles:
  compute:
    web:
      resources:
        cpu:
          units: 1
        memory:
          size: 1Gi
        storage:
          size: 2Gi
  placement:
    akash:
      pricing:
        web:
          denom: uakt
          amount: 1000

deployment:
  web:
    akash:
      profile: web
      count: 1
```

**⚠️ IMPORTANT: Replace these values:**
- `YOUR_DOCKERHUB_USERNAME` → Your Docker Hub username
- `YOUR_WALLETCONNECT_PROJECT_ID` → Your WalletConnect project ID
- `YOUR_ALCHEMY_API_KEY` → Your Alchemy API key (or remove if not using)

### 2.4 Accept Bid and Deploy

1. **Review the deployment** - Check resources and pricing
2. **Submit deposit** - Approve the transaction (5 AKT deposit)
3. **Wait for bids** - Providers will bid on your deployment (~30 seconds)
4. **Select a provider** - Choose based on price/reputation
5. **Accept bid** - Approve the transaction
6. **Wait for deployment** - Container will start (~2-3 minutes)

### 2.5 Access Your App

1. Once deployed, click on your deployment
2. Find the **"Leases"** tab
3. Click **"URI"** to see your app's URL
4. Your app will be live at: `https://[random-hash].provider.akash.network`

## 🔧 Step 3: Update Next.js Config for Standalone Build

**CRITICAL:** Update `next.config.js` to enable standalone output:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // ADD THIS LINE
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push('pino-pretty', 'encoding');
    return config;
  },
};

module.exports = nextConfig;
```

## 💰 Cost Estimation

| Resource | Amount | Monthly Cost (approx) |
|----------|--------|----------------------|
| CPU | 1 core | ~5-10 AKT |
| Memory | 1 GB | ~3-5 AKT |
| Storage | 2 GB | ~1-2 AKT |
| **Total** | | **~10-20 AKT/month** (~$5-10 USD) |

## 🔄 Updating Your Deployment

To update your app:

1. **Build new Docker image** with updated code
2. **Push to Docker Hub** with same tag or new version
3. **Update deployment** in Akash Console:
   - Go to your deployment
   - Click "Update Deployment"
   - Change image tag if needed
   - Submit update transaction

## 🐛 Troubleshooting

### Container won't start
- Check logs in Akash Console → Deployment → Logs
- Verify Docker image is public (not private)
- Ensure environment variables are set correctly

### Out of memory errors
- Increase memory in SDL: `size: 2Gi`
- Rebuild and update deployment

### Can't access the URL
- Wait 2-3 minutes after deployment
- Check if port 3000 is exposed correctly
- Verify `global: true` is set in SDL

### Build fails
- Ensure `output: 'standalone'` is in next.config.js
- Check all dependencies are in package.json
- Verify Node.js version compatibility

## 🎯 Quick Deploy Checklist

- [ ] Update `next.config.js` with `output: 'standalone'`
- [ ] Get WalletConnect Project ID
- [ ] Get Alchemy API Key (optional)
- [ ] Create Docker Hub account
- [ ] Build Docker image locally
- [ ] Push image to Docker Hub
- [ ] Get AKT tokens in Keplr/Leap wallet
- [ ] Open Akash Console
- [ ] Create deployment with SDL
- [ ] Accept provider bid
- [ ] Access your live app!

## 📚 Additional Resources

- [Akash Console](https://console.akash.network/)
- [Akash Docs](https://akash.network/docs/)
- [Akash Discord](https://discord.akash.network/)
- [Awesome Akash Templates](https://github.com/akash-network/awesome-akash)

## 🆘 Need Help?

- **Akash Discord**: [discord.akash.network](https://discord.akash.network/)
- **Akash Forum**: [forum.akash.network](https://forum.akash.network/)
- **GitHub Issues**: Open an issue in this repo

---

**Estimated Time to Deploy**: 15-30 minutes (first time)

**Difficulty**: ⭐⭐☆☆☆ (Beginner-friendly with this guide)
