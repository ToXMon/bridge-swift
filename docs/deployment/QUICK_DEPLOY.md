# Quick Deploy to Fleek

## 🚀 Fast Track Deployment

### Option 1: Fleek Platform (Recommended)

1. **Push to GitHub**:
```bash
git add .
git commit -m "Ready for Fleek deployment"
git push origin main
```

2. **Deploy on Fleek**:
   - Visit: https://app.fleek.co/
   - Click "Add New Site"
   - Connect your GitHub repository
   - Use these settings:
     - Build Command: `npm run build`
     - Publish Directory: `out`
     - Node Version: 18.x

3. **Done!** Your site will be live at `your-site.on.fleek.co` and accessible via IPFS.

### Option 2: Manual IPFS Upload

1. **Build locally**:
```bash
npm run build
```

2. **Upload the `out` folder** to any IPFS service:
   - **Pinata**: https://pinata.cloud (easiest)
   - **NFT.Storage**: https://nft.storage (free)
   - **Web3.Storage**: https://web3.storage (free)
   - **Fleek Storage**: https://app.fleek.co/storage

3. **Get your IPFS hash** and share it!

### Option 3: Vercel (Alternative)

If Fleek doesn't work, Vercel is another option:

```bash
npm install -g vercel
vercel --prod
```

## ✅ What's Been Configured

- ✅ Next.js set to static export mode
- ✅ Images configured for static hosting
- ✅ Webpack optimized for Web3 libraries
- ✅ Build tested and working
- ✅ Output directory: `out/`

## 📝 Environment Variables Needed

Add these in Fleek dashboard or `.env.local`:

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
```

## 🔗 Access Your Site

After deployment, your site will be available at:
- Fleek URL: `https://your-site.on.fleek.co`
- IPFS Gateway: `https://ipfs.io/ipfs/YOUR_HASH`
- IPFS Native: `ipfs://YOUR_HASH`

## 📚 Full Documentation

See `FLEEK_DEPLOYMENT.md` for detailed instructions and troubleshooting.
