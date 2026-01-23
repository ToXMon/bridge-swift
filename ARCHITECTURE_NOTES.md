# 🏗️ Multi-Architecture Build for Akash

## Why Multi-Platform Builds Matter

Akash Network is a decentralized cloud with providers running different CPU architectures:
- **AMD64 (x86_64)**: Traditional Intel/AMD processors
- **ARM64 (aarch64)**: ARM-based processors (more energy efficient)

**Without multi-platform builds**, your deployment may fail or only work on specific providers, limiting your options and potentially increasing costs.

## Architecture Support in This Project

### Dockerfile Configuration

```dockerfile
FROM --platform=$BUILDPLATFORM node:18-alpine AS base
```

- `$BUILDPLATFORM`: Automatically uses the correct platform during build
- Ensures native dependencies compile correctly for target architecture

### Build Process

The `build-and-push.sh` script uses Docker Buildx to create images for both architectures:

```bash
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    ...
```

This creates a **multi-manifest image** that automatically selects the correct architecture when deployed.

## Common Issues and Solutions

### Issue 1: Native Dependencies Fail
**Symptom**: Build fails with "unsupported architecture" errors

**Solution**: Added build tools to Dockerfile
```dockerfile
RUN apk add --no-cache libc6-compat python3 make g++
```

### Issue 2: Image Works Locally but Fails on Akash
**Symptom**: Container starts locally but crashes on Akash

**Cause**: Local machine is AMD64, Akash provider is ARM64 (or vice versa)

**Solution**: Always build with `--platform linux/amd64,linux/arm64`

### Issue 3: Slow Builds
**Symptom**: Multi-platform builds take 2x longer

**Explanation**: Building for two architectures requires compiling twice. This is normal and necessary.

**Optimization**: Use layer caching and multi-stage builds (already implemented)

## Verifying Multi-Platform Image

After pushing to Docker Hub, verify both architectures exist:

```bash
docker buildx imagetools inspect YOUR_USERNAME/bridge-swift:latest
```

Expected output:
```
Name:      docker.io/YOUR_USERNAME/bridge-swift:latest
MediaType: application/vnd.docker.distribution.manifest.list.v2+json
Digest:    sha256:...

Manifests:
  Name:      docker.io/YOUR_USERNAME/bridge-swift:latest@sha256:...
  MediaType: application/vnd.docker.distribution.manifest.v2+json
  Platform:  linux/amd64

  Name:      docker.io/YOUR_USERNAME/bridge-swift:latest@sha256:...
  MediaType: application/vnd.docker.distribution.manifest.v2+json
  Platform:  linux/arm64
```

## Best Practices

1. **Always use buildx** for Akash deployments
2. **Test on both architectures** if possible (use QEMU emulation)
3. **Keep base images updated** for security and compatibility
4. **Monitor build times** - multi-platform adds ~50-100% build time
5. **Use layer caching** to speed up subsequent builds

## Testing Locally

### Test ARM64 image on AMD64 machine (or vice versa):

```bash
# Enable QEMU emulation
docker run --privileged --rm tonistiigi/binfmt --install all

# Run ARM64 image on AMD64 machine
docker run --platform linux/arm64 YOUR_USERNAME/bridge-swift:latest

# Run AMD64 image on ARM64 machine
docker run --platform linux/amd64 YOUR_USERNAME/bridge-swift:latest
```

## Akash Provider Architecture Distribution

Based on Akash Network stats (approximate):
- **AMD64**: ~70% of providers
- **ARM64**: ~30% of providers

By supporting both, you:
- ✅ Maximize provider options
- ✅ Increase bid competition (lower costs)
- ✅ Improve deployment reliability
- ✅ Enable geographic diversity

## Resources

- [Docker Buildx Documentation](https://docs.docker.com/buildx/working-with-buildx/)
- [Multi-platform Images Guide](https://docs.docker.com/build/building/multi-platform/)
- [Akash Provider Stats](https://stats.akash.network/)
