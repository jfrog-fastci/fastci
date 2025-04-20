#!/bin/bash

# make sure to alais
# alias docker='~/cnc/docker-wrapper.sh "$@"'

# Check for correct usage
if [ "$1" != "build" ]; then
    echo "Running: $@"
    eval "docker $@"
fi

# Extract image name and tag
image_tag="$4"

echo "Building image: $image_tag"
# Extract context directory (default to current directory if not provided)
context_directory="${5:-.}"
echo "Using context directory: $context_directory"
# Construct the full buildx command
buildx_command="DOCKER_BUILDKIT=1 docker buildx build --progress=plain --cache-to type=registry,ref=fastcidemo.jfrog.io/fastci-images/${image_tag},mode=max --cache-from=type=registry,ref=fastcidemo.jfrog.io/fastci-images/${image_tag} -t ${image_tag} ${context_directory}"

# Execute the buildx command
eval "$buildx_command"
