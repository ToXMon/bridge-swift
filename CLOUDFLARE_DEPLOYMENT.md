# Cloudflare Pages Deployment Guide

This guide covers deploying your Bridge Swift app to Cloudflare Pages using either the CLI or the dashboard.

## Prerequisites

1. A Cloudflare account (sign up at https://dash.cloudflare.com/sign-up)
2. Node.js and npm installed
3. Git repository (GitHub, GitLab, or Bitbucket)

## Method 1: Deploy via Cloudflare Dashboard (Recommended for First Deploy)

### Step 1: Push to Git Repository

```bash
git add .
git commit -m "Prepare for Cloudflare Pages deployment"
git push origin main
```

### Step 2: Connect to Cloudflare Pages

1. Go to https://dash.cloudflare.com/
2. Select your account
3. Click **Pages** in the left sidebar
4. Click **Create a project**
5. Click **Connect to Git**
6. Authorize Cloudflare to access your repository
7. Select your `bridge-swift` repository

### Step 3: Configure Build Settings

Use these **EXACT** settings:

- **Production branch**: `main` (or your default branch)
- **Framework preset**: `Next.js (Static HTML Export)`
- **Build command**: `npm run build`
- **Build output directory**: `out`
- **Root directory**: (leave empty)

⚠️ **CRITICAL**: The build output directory MUST be `out` - this is where Next.js exports static files when using `output: 'export'` in next.config.js

### Step 4: Add Environment Variables

Click **Environment variables** and add:

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_actual_api_key
NEXT_PUBLIC_ENABLE_TESTNETS=true
```

⚠️ **Important**: Replace placeholder values with your actual API keys from:
- WalletConnect: https://cloud.walletconnect.com/
- Alchemy: https://dashboard.alchemy.com/

### Step 5: Deploy

1. Click **Save and Deploy**
2. Wait for the build to complete (usually 2-3 minutes)
3. Your app will be live at `https://bridge-swift-xxx.pages.dev`

---

## Method 2: Deploy via Wrangler CLI

### Step 1: Install Wrangler

```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open a browser window for authentication.

### Step 3: Create Environment File

Create a `.env.local` file with your actual values:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your real API keys.

### Step 4: Build the Project

```bash
npm install
npm run build
```

### Step 5: Deploy to Cloudflare Pages

```bash
wrangler pages deploy out --project-name=bridge-swift
```

On first deploy, Wrangler will:
1. Create the project if it doesn't exist
2. Upload your static files
3. Provide you with a deployment URL

### Step 6: Set Environment Variables (CLI)

```bash
# Set production environment variables
wrangler pages secret put NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID --project-name=bridge-swift
# Enter your value when prompted

wrangler pages secret put NEXT_PUBLIC_ALCHEMY_API_KEY --project-name=bridge-swift
# Enter your value when prompted

wrangler pages secret put NEXT_PUBLIC_ENABLE_TESTNETS --project-name=bridge-swift
# Enter: true
```

---

## Quick Deploy Script

For subsequent deployments, use this one-liner:

```bash
npm run build && wrangler pages deploy out --project-name=bridge-swift
```

Or add to `package.json`:

```json
"scripts": {
  "deploy:cf": "npm run build && wrangler pages deploy out --project-name=bridge-swift"
}
```

Then deploy with:

```bash
npm run deploy:cf
```

---

## Custom Domain Setup

### Add Custom Domain

1. Go to your project in Cloudflare Pages dashboard
2. Click **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain (e.g., `bridge.yourdomain.com`)
5. Follow DNS configuration instructions

Cloudflare will automatically provision SSL certificates.

---

## Environment Variables Management

### View All Variables

```bash
wrangler pages secret list --project-name=bridge-swift
```

### Update a Variable

```bash
wrangler pages secret put VARIABLE_NAME --project-name=bridge-swift
```

### Delete a Variable

```bash
wrangler pages secret delete VARIABLE_NAME --project-name=bridge-swift
```

---

## Continuous Deployment

Once connected via Git (Method 1), Cloudflare Pages automatically deploys:

- **Production**: Every push to your main branch
- **Preview**: Every pull request gets a unique preview URL

### Preview Deployments

Each PR gets a URL like: `https://abc123.bridge-swift.pages.dev`

---

## Monitoring & Logs

### View Deployment Logs

1. Go to your project dashboard
2. Click on a deployment
3. View build logs and deployment status

### Analytics

Cloudflare Pages includes free analytics:
- Page views
- Unique visitors
- Top pages
- Referrers

Access at: **Pages** → **Your Project** → **Analytics**

---

## Rollback to Previous Deployment

1. Go to your project dashboard
2. Click **Deployments**
3. Find the deployment you want to rollback to
4. Click **⋯** → **Rollback to this deployment**

---

## Troubleshooting

### "Missing entry-point to Worker script" Error

This error occurs when Cloudflare tries to deploy as a Worker instead of Pages. **Solution:**

1. In Cloudflare dashboard, go to **Pages** (not Workers)
2. Ensure **Build output directory** is set to `out`
3. Do NOT use `wrangler.toml` for dashboard deployments
4. Framework preset should be `Next.js (Static HTML Export)`

### Build Fails

**Check Node.js version:**
If you need a specific Node version, set it in dashboard:
**Settings** → **Environment variables** → Add `NODE_VERSION = 18`

**Clear build cache:**
In dashboard: **Settings** → **Builds & deployments** → **Clear build cache**

### Environment Variables Not Working

- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding/updating variables
- Check variable names match exactly (case-sensitive)

### 404 Errors on Routes

Your app uses static export, so all routes should work. If issues persist:

1. Check `next.config.js` has `output: 'export'`
2. Verify `out` directory exists after build
3. Check `_headers` file is in the `out` directory

### WalletConnect Connection Issues

Ensure CSP headers allow WalletConnect domains. The `_headers` file includes:
```
connect-src 'self' https://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.com wss://*.walletconnect.org
```

---

## Performance Optimization

### Enable Cloudflare CDN Features

1. **Auto Minify**: Dashboard → **Speed** → **Optimization** → Enable HTML/CSS/JS
2. **Brotli Compression**: Enabled by default
3. **HTTP/3**: Enabled by default

### Caching

Cloudflare automatically caches static assets. To customize:

Create `_redirects` file in project root:
```
/static/* 200 Cache-Control: public, max-age=31536000, immutable
```

---

## Security Headers

The `_headers` file includes security best practices:
- XSS protection
- Clickjacking prevention
- Content Security Policy
- HTTPS enforcement

Review and adjust CSP if you add new external services.

---

## Cost

Cloudflare Pages Free Tier includes:
- Unlimited requests
- Unlimited bandwidth
- 500 builds per month
- 1 build at a time

Paid plans available for:
- Concurrent builds
- More build minutes
- Advanced features

---

## Support Resources

- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages/
- **Wrangler CLI Docs**: https://developers.cloudflare.com/workers/wrangler/
- **Community Discord**: https://discord.gg/cloudflaredev
- **Status Page**: https://www.cloudflarestatus.com/

---

## Next Steps

1. ✅ Deploy your app
2. ✅ Add custom domain
3. ✅ Set up environment variables
4. ✅ Test all functionality
5. ✅ Monitor analytics
6. Share your live URL! 🚀
