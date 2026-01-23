# Docker Hub Authentication Fix

## Issue
```
ERROR: push access denied, repository does not exist or may require authorization
```

## Solution

### Step 1: Login to Docker Hub
```bash
docker login
```
Enter your Docker Hub username and password when prompted.

### Step 2: Verify Repository Exists

**Option A: Create repository via Docker Hub website**
1. Go to https://hub.docker.com/
2. Click "Create Repository"
3. Name it: `bridge-swift`
4. Set visibility: Public
5. Click "Create"

**Option B: Let Docker create it automatically**
- First push will create the repository if you have push permissions

### Step 3: Rebuild and Push
```bash
./build-and-push.sh
```

## Alternative: Use Docker Hub Access Token

For better security, use an access token instead of password:

1. Go to https://hub.docker.com/settings/security
2. Click "New Access Token"
3. Name it: `akash-deployment`
4. Copy the token
5. Login with token:
```bash
docker login -u YOUR_USERNAME
# Paste the token when prompted for password
```

## Quick Test

Test if you can push to Docker Hub:
```bash
docker tag wijnladum/bridge-swift:latest wijnladum/bridge-swift:test
docker push wijnladum/bridge-swift:test
```

If this works, run the full build script again.
