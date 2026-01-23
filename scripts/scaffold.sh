#!/bin/bash

# Bridge Swift - Project Scaffolding Script
# Usage: ./scripts/scaffold.sh

set -e

echo "🚀 Bridge Swift - Project Scaffolding"
echo "======================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Project root
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo -e "${BLUE}📦 Step 1: Installing dependencies...${NC}"
npm install next@latest react@latest react-dom@latest typescript@latest @types/react @types/node tailwindcss postcss autoprefixer

echo -e "${BLUE}📦 Step 2: Installing Web3 dependencies...${NC}"
npm install viem wagmi @rainbow-me/rainbowkit @tanstack/react-query

echo -e "${BLUE}📦 Step 3: Installing Stacks dependencies...${NC}"
npm install @stacks/transactions @stacks/network micro-packed @scure/base

echo -e "${BLUE}📦 Step 4: Installing dev dependencies...${NC}"
npm install -D eslint eslint-config-next @types/react-dom

echo -e "${BLUE}📁 Step 5: Creating folder structure...${NC}"
mkdir -p app
mkdir -p components
mkdir -p hooks
mkdir -p lib
mkdir -p types
mkdir -p public

echo -e "${BLUE}⚙️ Step 6: Creating config files...${NC}"

# Create tsconfig.json if not exists
if [ ! -f tsconfig.json ]; then
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF
fi

# Create tailwind.config.ts
cat > tailwind.config.ts << 'EOF'
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        card: '#1a1a1a',
        primary: '#6366f1',
      },
    },
  },
  plugins: [],
};
export default config;
EOF

# Create postcss.config.js
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOF

# Create next.config.js
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push('pino-pretty', 'encoding');
    return config;
  },
};
module.exports = nextConfig;
EOF

# Create .env.example
cat > .env.example << 'EOF'
# Required: Get from https://cloud.walletconnect.com/
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Optional: For better RPC performance
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key_here

# Enable testnets
NEXT_PUBLIC_ENABLE_TESTNETS=true
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
.next/
.env
.env.local
*.log
.DS_Store
EOF

echo -e "${GREEN}✅ Scaffolding complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env and add your keys"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:3000"
