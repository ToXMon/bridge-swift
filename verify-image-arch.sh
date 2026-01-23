#!/bin/bash

# Verify Docker image architecture
# Usage: ./verify-image-arch.sh [image:tag]

set -e

IMAGE="${1:-$DOCKERHUB_USERNAME/bridge-swift:latest}"

echo "🔍 Verifying architecture for: $IMAGE"
echo ""

# Pull the image manifest
echo "📥 Inspecting image manifest..."
docker buildx imagetools inspect "$IMAGE" | grep -A 5 "Platform:"

echo ""
echo "✅ Verification complete!"
echo ""
echo "Expected output for Akash deployment:"
echo "  Platform: linux/amd64"
echo ""
echo "If you see 'linux/arm64' or 'darwin/arm64', rebuild with the fixed Dockerfile"
