#!/bin/bash

# Manual EKS Deployment Script for NexaBuilder
# This script builds and deploys the application to your existing AWS EKS cluster

set -e

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REPOSITORY="${ECR_REPOSITORY:-nexabuilder}"
EKS_CLUSTER="${EKS_CLUSTER:-nexabuilder-dev-eks-cluster}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-470880515336}"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD)}"

echo "🚀 Starting manual EKS deployment for NexaBuilder..."
echo "📍 Region: $AWS_REGION"
echo "📦 ECR Repository: $ECR_REPOSITORY"
echo "🌐 EKS Cluster: $EKS_CLUSTER"
echo "🏷️  Image Tag: $IMAGE_TAG"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI is required but not installed. Install it first."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Install it first."; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "❌ kubectl is required but not installed. Install it first."; exit 1; }
echo "✅ All prerequisites are installed"

# Check if secrets are required
if [ ! -f ".env.production" ]; then
    echo "⚠️  Warning: .env.production not found. Make sure your secrets are configured."
fi

# Login to ECR
echo "🔐 Logging in to Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Create ECR repository if it doesn't exist
echo "📦 Ensuring ECR repository exists..."
aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION 2>/dev/null || {
    echo "Creating ECR repository..."
    aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION --image-scanning-configuration scanOnPush=true
}

# Build Docker image for Linux/AMD64
echo "🏗️  Building Docker image for linux/amd64..."
docker buildx build \
    --platform linux/amd64 \
    --file Dockerfile.simple \
    --tag $ECR_REPOSITORY:$IMAGE_TAG \
    --tag $ECR_REPOSITORY:latest \
    --load \
    .

# Tag images for ECR
echo "🏷️  Tagging images for ECR..."
docker tag $ECR_REPOSITORY:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG
docker tag $ECR_REPOSITORY:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

# Push to ECR
echo "📤 Pushing Docker images to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

# Update kubeconfig
echo "⚙️  Configuring kubectl for EKS cluster..."
aws eks update-kubeconfig --region $AWS_REGION --name $EKS_CLUSTER
kubectl cluster-info --request-timeout=10s || {
    echo "❌ Cannot connect to EKS cluster. Check your AWS credentials and cluster name."
    exit 1
}

# Create deployment manifest with new image
echo "🔧 Preparing deployment manifest..."
cp k8s/deployment.yaml k8s/deployment-temp.yaml
sed -i.bak "s|image: .*nexabuilder.*|image: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG|g" k8s/deployment-temp.yaml

echo "🔍 Deployment manifest preview:"
echo "Image will be: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG"
echo ""

# Apply to Kubernetes
echo "🚀 Deploying to EKS cluster..."
kubectl apply -f k8s/deployment-temp.yaml

# Wait for rollout
echo "⏳ Waiting for deployment rollout (timeout: 10 minutes)..."
kubectl rollout status deployment/nexabuilder-app -n nexabuilder --timeout=600s

# Show deployment status
echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Current Status:"
echo "================="
kubectl get deployments -n nexabuilder
echo ""
echo "🟢 Running Pods:"
kubectl get pods -n nexabuilder -o wide
echo ""
echo "🌐 Services:"
kubectl get services -n nexabuilder
echo ""
echo "🔗 Ingress (Load Balancer):"
kubectl get ingress -n nexabuilder

# Show application logs
echo ""
echo "📝 Recent Application Logs:"
kubectl logs -n nexabuilder deployment/nexabuilder-app --tail=10 || echo "No logs available yet"

# Clean up temporary files
rm -f k8s/deployment-temp.yaml k8s/deployment.yaml.bak

echo ""
echo "🎉 NexaBuilder deployment completed successfully!"
echo "🌍 Your application is now running on EKS cluster: $EKS_CLUSTER"
echo "📋 Check the ingress above for your application URL"
echo ""
echo "💡 Useful commands:"
echo "   View logs: kubectl logs -f deployment/nexabuilder-app -n nexabuilder"
echo "   Check status: kubectl get pods -n nexabuilder"
echo "   Scale app: kubectl scale deployment nexabuilder-app --replicas=3 -n nexabuilder"
