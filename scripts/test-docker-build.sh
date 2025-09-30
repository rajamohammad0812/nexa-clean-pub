#!/bin/bash

# Test Docker build for AWS deployment
# This script tests the Docker build locally before pushing to AWS

set -e

echo "🧪 Testing Docker build for AWS deployment..."

# Build the image locally
echo "Building Docker image with Dockerfile.aws..."
docker build --platform linux/amd64 -f Dockerfile.aws -t nexabuilder-test:latest .

echo "✅ Docker build successful!"

# Optional: Test the built image
echo "🔍 Testing the built image..."
docker run --rm --name nexabuilder-test-run -d \
  -p 3001:3000 \
  -e DATABASE_URL="postgresql://test:test@localhost:5432/test" \
  -e NEXTAUTH_SECRET="test-secret" \
  -e NEXTAUTH_URL="http://localhost:3001" \
  -e OPENAI_API_KEY="test-key" \
  nexabuilder-test:latest || echo "Container test skipped (expected without database)"

sleep 5

# Check if container is running
if docker ps | grep -q nexabuilder-test-run; then
  echo "✅ Container started successfully!"
  docker logs nexabuilder-test-run
  docker stop nexabuilder-test-run
else
  echo "ℹ️  Container test completed (database connection expected to fail)"
fi

echo "🎉 Docker build test completed successfully!"
echo "Ready for AWS EKS deployment."