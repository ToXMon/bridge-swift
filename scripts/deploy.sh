#!/bin/bash

# Bridge Swift - Deployment Script
# Usage: ./scripts/deploy.sh

set -e

echo "🚀 Bridge Swift - Deployment"
echo "============================"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Check for required env vars
if [ -z "$NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID" ]; then
  echo -e "${RED}❌ Error: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID not set${NC}"
  echo "Please set it in .env or export it"
  exit 1
fi

echo "📦 Step 1: Installing dependencies..."
npm ci

echo "🔍 Step 2: Type checking..."
npm run type-check || {
  echo -e "${RED}❌ TypeScript errors found. Fix them before deploying.${NC}"
  exit 1
}

echo "🏗️ Step 3: Building..."
npm run build || {
  echo -e "${RED}❌ Build failed. Check errors above.${NC}"
  exit 1
}

echo -e "${GREEN}✅ Build successful!${NC}"
echo ""
echo "To deploy to Vercel:"
echo "1. Push to GitHub: git push origin main"
echo "2. Import to Vercel: https://vercel.com/new"
echo "3. Set environment variables in Vercel dashboard"
echo "4. Deploy!"
echo ""
echo "Or use Vercel CLI:"
echo "  npx vercel --prod"
