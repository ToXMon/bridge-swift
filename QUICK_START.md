# 🚀 Quick Start: Deploy to Akash in 5 Steps

## The Effortless Method (Using Akash Console)

### Step 1: Prepare Your Environment (5 min)
```bash
# Get your API keys ready:
# 1. WalletConnect: https://cloud.walletconnect.com/
# 2. Alchemy (optional): https://www.alchemy.com/
```

### Step 2: Build Multi-Platform Docker Image (10 min)
```bash
# Set environment variables
export DOCKERHUB_USERNAME=your_dockerhub_username
export NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
export NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key  # Optional

# Login to Docker Hub
docker login

# Build for both ARM64 and AMD64 (required for Akash)
./build-and-push.sh
```

**Why multi-platform?** Akash providers run on different CPU architectures. Building for both ARM64 and AMD64 ensures your app works on any provider.

### Step 3: Get AKT Tokens (5 min)
- Install [Keplr Wallet](https://www.keplr.app/)
- Buy ~20 AKT from [Osmosis](https://app.osmosis.zone/) (~$10 USD)

### Step 4: Deploy via Console (5 min)
1. Go to **[console.akash.network](https://console.akash.network/)**
2. Connect your Keplr wallet
3. Click **"Deploy"** → **"Build your template"**
4. Copy the SDL from `deploy.yaml` (update with your values)
5. Click **"Create Deployment"**
6. Wait for bids (~30 seconds)
7. Accept a bid
8. Wait for deployment (~2 minutes)

### Step 5: Access Your App (1 min)
- Click on your deployment
- Find the **URI** in the Leases tab
- Your app is live! 🎉

---

## Total Time: ~25 minutes
## Total Cost: ~$5-10/month

---

## What You Need to Replace in deploy.yaml

```yaml
# Line 6: Your Docker Hub username
image: YOUR_DOCKERHUB_USERNAME/bridge-swift:latest

# Line 8: Your WalletConnect Project ID
- "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_WALLETCONNECT_PROJECT_ID"

# Line 9: Your Alchemy API Key (or remove this line)
- "NEXT_PUBLIC_ALCHEMY_API_KEY=YOUR_ALCHEMY_API_KEY"
```

---

## Alternative: No Docker Build Required

If you don't want to build Docker locally, use **GitHub Actions**:

1. Fork this repo
2. Add secrets to GitHub:
   - `DOCKERHUB_USERNAME`
   - `DOCKERHUB_TOKEN`
   - `WALLETCONNECT_PROJECT_ID`
   - `ALCHEMY_API_KEY`
3. Push to main branch
4. GitHub will build and push automatically
5. Use the image in Akash Console

See `AKASH_DEPLOYMENT_GUIDE.md` for detailed instructions.
