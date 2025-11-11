#!/bin/bash

set -euo pipefail

# Script to copy a GitHub release from the current public repository
# to the internal GitHub Enterprise repository (https://github.jfrog.info/JFROG/devx-fastci)
#
# Usage:
#   ./scripts/copy-release.sh <release-tag> [options]
#
# Options:
#   --source-repo <owner/repo>     Source repository (default: auto-detect from git)
#   --target-repo <owner/repo>     Target repository (default: JFROG/devx-fastci)
#   --target-host <host>           Target GitHub host (default: github.jfrog.info)
#   --dry-run                      Show what would be done without actually doing it

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
SOURCE_REPO="jfrog-fastci/fastci"
TARGET_REPO="JFROG/devx-fastci"
TARGET_HOST="github.jfrog.info"
DRY_RUN=false

# Parse command line arguments
RELEASE_TAG="v0.19.6" # <======== change here
RELEASE_BRANCH="release/${RELEASE_TAG}"
if [ -z "$RELEASE_TAG" ]; then
    echo -e "${RED}Error: Release tag is required${NC}"
    echo "Usage: $0 <release-tag> [options]"
    exit 1
fi

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check authentication for source (public GitHub)
echo -e "${BLUE}Checking authentication for source repository...${NC}"
if ! gh auth status --hostname github.com &>/dev/null; then
    echo -e "${YELLOW}Warning: Not authenticated with github.com. You may need to run: gh auth login${NC}"
fi

# Check authentication for target (GitHub Enterprise)
echo -e "${BLUE}Checking authentication for target repository...${NC}"
if ! gh auth status --hostname "$TARGET_HOST" &>/dev/null; then
    echo -e "${YELLOW}Warning: Not authenticated with $TARGET_HOST. You may need to run: gh auth login --hostname $TARGET_HOST${NC}"
fi

echo ""
echo -e "${GREEN}📦 Copying release ${RELEASE_TAG} from ${SOURCE_REPO} to ${TARGET_REPO}${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}🔍 DRY RUN MODE - No changes will be made${NC}"
    echo ""
fi

# Step 1: Fetch release information from source repository
echo -e "${BLUE}Step 1: Fetching release information from source repository...${NC}"

# Use gh api to get release info (works with any GitHub instance)
RELEASE_JSON=$(gh api "repos/${SOURCE_REPO}/releases/tags/${RELEASE_TAG}" --hostname github.com 2>&1) || {
    echo -e "${RED}✗ Error fetching release: ${RELEASE_JSON}${NC}"
    exit 1
}

RELEASE_NAME=$(echo "$RELEASE_JSON" | jq -r '.name // .tag_name')
RELEASE_BODY=$(echo "$RELEASE_JSON" | jq -r '.body // ""')
RELEASE_DRAFT=$(echo "$RELEASE_JSON" | jq -r '.draft // false')
RELEASE_PRERELEASE=$(echo "$RELEASE_JSON" | jq -r '.prerelease // false')
ASSET_COUNT=$(echo "$RELEASE_JSON" | jq -r '.assets | length')

echo -e "${GREEN}✓ Found release: ${RELEASE_NAME}${NC}"
echo "  Published: $(echo "$RELEASE_JSON" | jq -r '.published_at // "Draft"')"
echo "  Assets: ${ASSET_COUNT} file(s)"

# Step 2: Download all assets
echo ""
echo -e "${BLUE}Step 2: Downloading release assets...${NC}"

TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

if [ "$ASSET_COUNT" -gt 0 ]; then
    # Extract asset URLs and download them
    ASSET_NAMES=$(echo "$RELEASE_JSON" | jq -r '.assets[] | .name')
    
    while IFS= read -r asset_name; do
        if [ -z "$asset_name" ]; then
            continue
        fi
        
        asset_size=$(echo "$RELEASE_JSON" | jq -r ".assets[] | select(.name == \"$asset_name\") | .size")
        asset_size_mb=$(awk "BEGIN {printf \"%.2f\", $asset_size/1024/1024}")
        
        echo "  Downloading: ${asset_name} (${asset_size_mb} MB)..."
        
        if [ "$DRY_RUN" = false ]; then
            # Get the download URL from the asset info
            asset_download_url=$(echo "$RELEASE_JSON" | jq -r ".assets[] | select(.name == \"$asset_name\") | .browser_download_url")
            output_file="$TEMP_DIR/$asset_name"
            
            # Get auth token and use curl to download (most reliable method)
            AUTH_TOKEN=$(gh auth token --hostname github.com 2>/dev/null || echo "")
            
            if [ -n "$AUTH_TOKEN" ]; then
                # Use curl with authentication token
                if curl -L -f -s -H "Authorization: token $AUTH_TOKEN" \
                    -H "Accept: application/octet-stream" \
                    -o "$output_file" \
                    "$asset_download_url"; then
                    echo -e "  ${GREEN}✓ Downloaded: ${asset_name}${NC}"
                else
                    echo -e "  ${RED}✗ Error downloading ${asset_name}${NC}"
                    exit 1
                fi
            else
                # Fallback: use gh release download with GH_HOST set
                export GH_HOST=github.com
                if gh release download "$RELEASE_TAG" \
                    --repo "$SOURCE_REPO" \
                    --pattern "$asset_name" \
                    --dir "$TEMP_DIR" 2>&1; then
                    echo -e "  ${GREEN}✓ Downloaded: ${asset_name}${NC}"
                else
                    echo -e "  ${RED}✗ Error downloading ${asset_name}${NC}"
                    exit 1
                fi
                unset GH_HOST
            fi
        else
            echo "  [DRY RUN] Would download: ${asset_name}"
        fi
    done <<< "$ASSET_NAMES"
else
    echo "  No assets to download"
fi

# Step 3: Create release in target repository
echo ""
echo -e "${BLUE}Step 3: Creating release in target repository...${NC}"

# Check if release already exists
EXISTING_RELEASE=$(gh api "repos/${TARGET_REPO}/releases/tags/${RELEASE_TAG}" --hostname "$TARGET_HOST" 2>&1) || {
    EXISTING_RELEASE=""
}

if [ -n "$EXISTING_RELEASE" ] && [ "$(echo "$EXISTING_RELEASE" | jq -r '.tag_name // ""')" = "$RELEASE_TAG" ]; then
    echo -e "${YELLOW}⚠ Release ${RELEASE_TAG} already exists in target repository${NC}"
    RELEASE_ID=$(echo "$EXISTING_RELEASE" | jq -r '.id')
    echo "  Using existing release ID: ${RELEASE_ID}"
else
    if [ "$DRY_RUN" = false ]; then
        # Create release using gh api (gh release create doesn't support --hostname reliably)
        RELEASE_DATA=$(jq -n \
            --arg tag_name "$RELEASE_TAG" \
            --arg name "$RELEASE_NAME" \
            --arg body "$RELEASE_BODY" \
            --argjson draft "$([ "$RELEASE_DRAFT" = "true" ] && echo true || echo false)" \
            --argjson prerelease "$([ "$RELEASE_PRERELEASE" = "true" ] && echo true || echo false)" \
            '{tag_name: $tag_name, name: $name, body: $body, draft: $draft, prerelease: $prerelease}')
        
        CREATED_RELEASE=$(gh api "repos/${TARGET_REPO}/releases" \
            --hostname "$TARGET_HOST" \
            --method POST \
            --input - <<< "$RELEASE_DATA" 2>&1) || {
            echo -e "${RED}✗ Error creating release: ${CREATED_RELEASE}${NC}"
            exit 1
        }
        
        # Get the release ID
        RELEASE_ID=$(echo "$CREATED_RELEASE" | jq -r '.id')
        echo -e "${GREEN}✓ Created release: ${RELEASE_NAME}${NC}"
        echo "  Release ID: ${RELEASE_ID}"
    else
        echo "[DRY RUN] Would create release:"
        echo "  Tag: ${RELEASE_TAG}"
        echo "  Name: ${RELEASE_NAME}"
        echo "  Draft: ${RELEASE_DRAFT}"
        echo "  Prerelease: ${RELEASE_PRERELEASE}"
        RELEASE_ID="dry-run-id"
    fi
fi

# Step 4: Upload assets to target release
if [ "$ASSET_COUNT" -gt 0 ] && [ "$DRY_RUN" = false ]; then
    echo ""
    echo -e "${BLUE}Step 4: Uploading assets to target release...${NC}"
    
    for asset_file in "$TEMP_DIR"/*; do
        if [ ! -f "$asset_file" ]; then
            continue
        fi
        
        asset_name=$(basename "$asset_file")
        asset_size=$(stat -f%z "$asset_file" 2>/dev/null || stat -c%s "$asset_file" 2>/dev/null)
        asset_size_mb=$(awk "BEGIN {printf \"%.2f\", $asset_size/1024/1024}")
        
        echo "  Uploading: ${asset_name} (${asset_size_mb} MB)..."
        
        # Use gh api to upload asset (gh release upload doesn't support --hostname)
        # First get the upload URL from the release
        UPLOAD_URL=$(gh api "repos/${TARGET_REPO}/releases/${RELEASE_ID}" \
            --hostname "$TARGET_HOST" \
            --jq '.upload_url' | sed 's/{?name,label}/?name='"$(echo "$asset_name" | sed 's/ /%20/g')"'/')
        
        if [ -n "$UPLOAD_URL" ] && [ "$UPLOAD_URL" != "null" ]; then
            # Upload using gh api with the upload URL
            if gh api "$UPLOAD_URL" \
                --hostname "$TARGET_HOST" \
                --method POST \
                -H "Content-Type: application/octet-stream" \
                --input "$asset_file" 2>&1 > /dev/null; then
                echo -e "  ${GREEN}✓ Uploaded: ${asset_name}${NC}"
            else
                # Fallback: use GH_HOST environment variable with gh release upload
                export GH_HOST="$TARGET_HOST"
                if gh release upload "$RELEASE_TAG" \
                    "$asset_file" \
                    --repo "$TARGET_REPO" 2>&1 > /dev/null; then
                    echo -e "  ${GREEN}✓ Uploaded: ${asset_name}${NC}"
                else
                    echo -e "  ${YELLOW}⚠ Error uploading ${asset_name} (may already exist)${NC}"
                fi
                unset GH_HOST
            fi
        else
            echo -e "  ${YELLOW}⚠ Could not get upload URL for ${asset_name}${NC}"
        fi
    done
elif [ "$DRY_RUN" = true ] && [ "$ASSET_COUNT" -gt 0 ]; then
    echo ""
    echo -e "${BLUE}Step 4: Uploading assets to target release...${NC}"
    while IFS= read -r asset_name; do
        if [ -z "$asset_name" ]; then
            continue
        fi
        echo "  [DRY RUN] Would upload: ${asset_name}"
    done <<< "$ASSET_NAMES"
fi

# Cleanup
echo ""
echo -e "${BLUE}Step 5: Cleaning up temporary files...${NC}"
if [ "$DRY_RUN" = false ]; then
    rm -rf "$TEMP_DIR"
    echo -e "${GREEN}✓ Cleaned up temporary files${NC}"
else
    echo "[DRY RUN] Would clean up temporary files"
fi

# Step 6: Sync release branch
echo ""
echo -e "${BLUE}Step 6: Syncing release branch...${NC}"

if [ "$DRY_RUN" = false ]; then
    # Create temp directories
    TARGET_CLONE_DIR=$(mktemp -d)
    SOURCE_CLONE_DIR=$(mktemp -d)
    
    echo "  Cloning target repository..."
    # Clone target repository
    export GH_HOST="$TARGET_HOST"
    if ! gh repo clone "$TARGET_REPO" "$TARGET_CLONE_DIR" 2>&1; then
        echo -e "  ${RED}✗ Error cloning target repository${NC}"
        rm -rf "$TARGET_CLONE_DIR" "$SOURCE_CLONE_DIR"
        exit 1
    fi
    unset GH_HOST
    
    echo "  Cloning source repository at tag ${RELEASE_TAG}..."
    # Clone source repository and checkout the tag
    export GH_HOST=github.com
    if ! gh repo clone "$SOURCE_REPO" "$SOURCE_CLONE_DIR" 2>&1; then
        echo -e "  ${RED}✗ Error cloning source repository${NC}"
        rm -rf "$TARGET_CLONE_DIR" "$SOURCE_CLONE_DIR"
        exit 1
    fi
    unset GH_HOST
    
    # Checkout the release tag in source repo
    cd "$SOURCE_CLONE_DIR"
    if ! git checkout "$RELEASE_BRANCH" 2>&1; then
        echo -e "  ${RED}✗ Error checking out branch ${RELEASE_BRANCH} in source repository${NC}"
        rm -rf "$TARGET_CLONE_DIR" "$SOURCE_CLONE_DIR"
        exit 1
    fi
    cd - > /dev/null
    
    echo "  Checking out release branch in target repository..."
    # Checkout or create release branch in target repo
    cd "$TARGET_CLONE_DIR"
    
    # Fetch all remote branches
    git fetch origin 2>&1 || true
    
    # Check if branch exists locally or remotely
    if git show-ref --verify --quiet "refs/heads/${RELEASE_BRANCH}" || \
       git show-ref --verify --quiet "refs/remotes/origin/${RELEASE_BRANCH}"; then
        echo "  Branch ${RELEASE_BRANCH} already exists, checking it out..."
        if git show-ref --verify --quiet "refs/heads/${RELEASE_BRANCH}"; then
            git checkout "$RELEASE_BRANCH"
        else
            git checkout -b "$RELEASE_BRANCH" "origin/${RELEASE_BRANCH}"
        fi
    else
        echo "  Creating new branch ${RELEASE_BRANCH}..."
        # Get the default branch (main or master)
        DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@' || echo "main")
        git checkout "$DEFAULT_BRANCH" 2>/dev/null || git checkout "main" 2>/dev/null || git checkout "master" 2>/dev/null || true
        git checkout -b "$RELEASE_BRANCH"
    fi
    
    echo "  Copying dist directory and action.yml from source repository..."
    # Copy only dist directory and action.yml from source to target
    if command -v rsync &> /dev/null; then
        # Copy dist directory if it exists
        if [ -d "$SOURCE_CLONE_DIR/dist" ]; then
            rsync -av "$SOURCE_CLONE_DIR/dist/" "$TARGET_CLONE_DIR/dist/"
        fi
        # Copy action.yml if it exists
        if [ -f "$SOURCE_CLONE_DIR/action.yml" ]; then
            cp "$SOURCE_CLONE_DIR/action.yml" "$TARGET_CLONE_DIR/action.yml"
        fi
    else
        # Fallback: use cp
        if [ -d "$SOURCE_CLONE_DIR/dist" ]; then
            cp -r "$SOURCE_CLONE_DIR/dist" "$TARGET_CLONE_DIR/"
        fi
        if [ -f "$SOURCE_CLONE_DIR/action.yml" ]; then
            cp "$SOURCE_CLONE_DIR/action.yml" "$TARGET_CLONE_DIR/action.yml"
        fi
    fi
    
    echo "  Committing changes..."
    # Configure git user for commit (if not already configured)
    git config user.name "${GIT_USER_NAME:-GitHub Actions}" || true
    git config user.email "${GIT_USER_EMAIL:-github-actions@github.com}" || true
    
    # Add all changes
    git add -A
    
    # Check if there are changes to commit
    if git diff --staged --quiet; then
        echo -e "  ${GREEN}✓ No changes to commit (branch already up to date)${NC}"
    else
        # Commit the changes
        git commit -m "FAST-000 - Update ${RELEASE_TAG} from ${SOURCE_REPO}" || {
            echo -e "  ${YELLOW}⚠ No changes to commit${NC}"
        }
        
        echo "  Pushing branch to target repository..."
        # Push the branch (gh repo clone sets up authentication automatically)
        if git push -u origin "$RELEASE_BRANCH" 2>&1; then
            echo -e "  ${GREEN}✓ Pushed branch ${RELEASE_BRANCH} to target repository${NC}"
        else
            echo -e "  ${RED}✗ Error pushing branch ${RELEASE_BRANCH}${NC}"
            exit 1
        fi
    fi
    
    # Cleanup
    cd - > /dev/null
    rm -rf "$TARGET_CLONE_DIR" "$SOURCE_CLONE_DIR"
else
    echo "[DRY RUN] Would sync branch:"
    echo "  1. Clone target repository ${TARGET_REPO}"
    echo "  2. Clone source repository ${SOURCE_REPO} at tag ${RELEASE_TAG}"
    echo "  3. Create/checkout branch ${RELEASE_BRANCH}"
    echo "  4. Copy dist directory and action.yml from source to target"
    echo "  5. Commit and push branch"
fi

echo ""
echo -e "${GREEN}✅ Release copy completed successfully!${NC}"
echo ""

