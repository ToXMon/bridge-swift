#!/bin/bash

# Build and push multi-platform Docker image for Akash deployment
# Supports both ARM64 and AMD64 architectures

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Building multi-platform Docker image for Akash${NC}"

# Check if required variables are set
if [ -z "$DOCKERHUB_USERNAME" ]; then
    echo -e "${RED}Error: DOCKERHUB_USERNAME environment variable is not set${NC}"
    echo "Usage: export DOCKERHUB_USERNAME=your_username"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID" ]; then
    echo -e "${YELLOW}Warning: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID not set${NC}"
    echo "Set it with: export NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id"
fi

# Optional: Alchemy API key
ALCHEMY_ARG=""
if [ -n "$NEXT_PUBLIC_ALCHEMY_API_KEY" ]; then
    ALCHEMY_ARG="--build-arg NEXT_PUBLIC_ALCHEMY_API_KEY=$NEXT_PUBLIC_ALCHEMY_API_KEY"
fi

IMAGE_NAME="$DOCKERHUB_USERNAME/bridge-swift"
TAG="${1:-latest}"

echo -e "${GREEN}📦 Image: $IMAGE_NAME:$TAG${NC}"
echo -e "${GREEN}🏗️  Platform: linux/amd64${NC}"

# Create and use buildx builder with explicit platform support
if docker buildx inspect akash-builder > /dev/null 2>&1; then
    echo -e "${YELLOW}Removing existing builder to ensure clean state...${NC}"
    docker buildx rm akash-builder || true
fi

echo -e "${YELLOW}Creating buildx builder with AMD64 support...${NC}"
docker buildx create --name akash-builder --platform linux/amd64 --use
docker buildx inspect --bootstrap

# Build and push AMD64 image only (for Akash compatibility)
echo -e "${GREEN}🔨 Building and pushing AMD64 image...${NC}"
docker buildx build \
    --platform linux/amd64 \
    --provenance=false \
    --build-arg NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="$NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID" \
    $ALCHEMY_ARG \
    --build-arg NEXT_PUBLIC_ENABLE_TESTNETS=true \
    -t "$IMAGE_NAME:$TAG" \
    --push \
    .

echo -e "${GREEN}✅ Successfully built and pushed AMD64 image!${NC}"
echo -e "${GREEN}📍 Image: $IMAGE_NAME:$TAG${NC}"
echo -e "${GREEN}🎯 Platform: linux/amd64${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update deploy.yaml with: image: $IMAGE_NAME:$TAG"
echo "2. Deploy to Akash Console: https://console.akash.network/"
