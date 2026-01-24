# Vercel CLI Deployment Guide

## Prerequisites

Install Vercel CLI globally:
```bash
npm install -g vercel
```

## First-Time Setup

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Link your project (first deployment):**
   ```bash
   vercel
   ```
   Follow the prompts to:
   - Set up and deploy
   - Link to existing project or create new one
   - Configure project settings

## Deployment Commands

### Production Deployment
```bash
npm run deploy:vercel
```
or
```bash
vercel --prod
```

### Preview Deployment
```bash
npm run deploy:vercel:preview
```
or
```bash
vercel
```

## Environment Variables

Add your environment variables to Vercel:

```bash
vercel env add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
vercel env add NEXT_PUBLIC_ALCHEMY_ID
```

Or add them via the Vercel Dashboard:
1. Go to your project settings
2. Navigate to Environment Variables
3. Add each variable from your `.env` file

## Project Configuration

The project is configured with:
- **Framework:** Next.js (auto-detected)
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

Configuration is defined in `vercel.json`.

## Useful Commands

- **Check deployment status:** `vercel ls`
- **View logs:** `vercel logs [deployment-url]`
- **Remove deployment:** `vercel rm [deployment-name]`
- **Pull environment variables:** `vercel env pull`

## Notes

- The `next.config.js` has been updated to work with Vercel's dynamic features
- Static export mode has been removed to enable full Next.js capabilities
- Each `vercel` command creates a preview deployment
- Use `vercel --prod` for production deployments
