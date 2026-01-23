# Fleek Deployment Guide

This guide walks you through deploying Bridge Swift to Fleek, which provides IPFS hosting with CDN and automatic deployments.

## Prerequisites

- GitHub account (for connecting your repository)
- Fleek account (sign up at https://app.fleek.co/)

## Deployment Steps

### 1. Prepare Your Repository

Ensure your code is pushed to GitHub:

```bash
git add .
git commit -m "Configure for Fleek deployment"
git push origin main
```

### 2. Connect to Fleek

1. Go to https://app.fleek.co/
2. Sign up or log in with your GitHub account
3. Click "Add New Site"
4. Select "Deploy with Fleek"

### 3. Configure Build Settings

When prompted, use these settings:

- **Framework**: Next.js
- **Branch**: main (or your default branch)
- **Build Command**: `npm run build`
- **Publish Directory**: `out`
- **Install Command**: `npm install`
- **Node Version**: 18.x or higher

### 4. Environment Variables

Add your environment variables in the Fleek dashboard:

1. Go to Site Settings → Environment Variables
2. Add the following variables:
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: Your WalletConnect project ID
   - `NEXT_PUBLIC_ALCHEMY_API_KEY`: Your Alchemy API key (if using)
   - Any other environment variables from `.env.example`

### 5. Deploy

1. Click "Deploy Site"
2. Fleek will automatically build and deploy your site
3. You'll get:
   - A Fleek URL (e.g., `your-site.on.fleek.co`)
   - An IPFS hash for decentralized access
   - A custom domain option (optional)

## Automatic Deployments

Fleek automatically deploys when you push to your connected branch:

```bash
git add .
git commit -m "Update bridge UI"
git push origin main
```

Fleek will detect the push and trigger a new deployment.

## Custom Domain (Optional)

1. Go to Site Settings → Domain Management
2. Click "Add Custom Domain"
3. Enter your domain name
4. Follow the DNS configuration instructions
5. Wait for DNS propagation (usually 5-30 minutes)

## IPFS Access

Your site is accessible via:

1. **Fleek URL**: `https://your-site.on.fleek.co`
2. **IPFS Gateway**: `https://ipfs.io/ipfs/YOUR_IPFS_HASH`
3. **IPFS Native**: `ipfs://YOUR_IPFS_HASH` (requires IPFS browser extension)

## Monitoring

- **Build Logs**: Available in the Fleek dashboard under "Deploys"
- **Analytics**: View traffic and performance metrics
- **IPFS Pinning**: Automatic pinning across multiple IPFS nodes

## Troubleshooting

### Build Fails

Check build logs in Fleek dashboard. Common issues:

1. **Missing dependencies**: Ensure `package.json` is complete
2. **Node version**: Update to Node 18+ in settings
3. **Environment variables**: Verify all required vars are set

### Site Not Loading

1. Check if build completed successfully
2. Verify `out` directory contains files
3. Clear browser cache and try IPFS gateway URL

### Wallet Connection Issues

Ensure environment variables are set correctly in Fleek dashboard, especially `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`.

## Alternative: Manual IPFS Deployment

If you prefer manual IPFS deployment:

```bash
# Build the site
npm run build

# The static files are in the 'out' directory
# Upload to IPFS using:
# - Pinata (https://pinata.cloud)
# - NFT.Storage (https://nft.storage)
# - Web3.Storage (https://web3.storage)
# - IPFS Desktop (https://docs.ipfs.tech/install/ipfs-desktop/)
```

## Cost

Fleek offers:
- **Free tier**: 50GB bandwidth/month, unlimited builds
- **Pro tier**: Higher bandwidth and custom features
- **IPFS hosting**: Included in all tiers

## Support

- Fleek Documentation: https://docs.fleek.co/
- Fleek Discord: https://discord.gg/fleek
- GitHub Issues: Report issues in your repository

## Next Steps

After deployment:
1. Test all bridge functionality
2. Verify wallet connections work
3. Share your Fleek URL or IPFS hash
4. Set up custom domain (optional)
5. Monitor usage in Fleek dashboard
