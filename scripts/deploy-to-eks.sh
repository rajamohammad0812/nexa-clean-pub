#!/bin/bash

# EKS Deployment Script for NexaBuilder
# This script builds and deploys the application to AWS EKS

set -e

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REPOSITORY="${ECR_REPOSITORY:-nexabuilder}"
EKS_CLUSTER="${EKS_CLUSTER:-nexabuilder-dev-eks-cluster}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-470880515336}"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD)}"

echo "🚀 Starting EKS deployment..."
echo "Region: $AWS_REGION"
echo "ECR Repository: $ECR_REPOSITORY"
echo "EKS Cluster: $EKS_CLUSTER"
echo "Image Tag: $IMAGE_TAG"

# Check prerequisites
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI is required but not installed."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "❌ kubectl is required but not installed."; exit 1; }

# Login to ECR
echo "🔐 Logging in to Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Create ECR repository if it doesn't exist
echo "📦 Creating ECR repository if needed..."
aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION 2>/dev/null || \
    aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION

# Build and push Docker image
echo "🏗️ Building Docker image..."
docker build --platform linux/amd64 -f Dockerfile.production -t $ECR_REPOSITORY:$IMAGE_TAG .
docker tag $ECR_REPOSITORY:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG
docker tag $ECR_REPOSITORY:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

echo "📤 Pushing Docker image..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

# Update kubeconfig
echo "⚙️ Updating kubeconfig..."
aws eks update-kubeconfig --region $AWS_REGION --name $EKS_CLUSTER

# Update deployment with new image
echo "🔧 Updating Kubernetes deployment..."
sed -i.bak "s|image: .*|image: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG|g" k8s/deployment.yaml

# Apply Kubernetes manifests
echo "🚀 Applying Kubernetes manifests..."
kubectl apply -f k8s/deployment.yaml

# Wait for rollout
echo "⏳ Waiting for deployment to complete..."
kubectl rollout status deployment/nexabuilder-app -n nexabuilder --timeout=600s

# Show deployment status
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Deployment Status:"
kubectl get pods -n nexabuilder
echo ""
echo "🌐 Services:"
kubectl get services -n nexabuilder
echo ""
echo "🔗 Ingress:"
kubectl get ingress -n nexabuilder

# Restore original deployment file
mv k8s/deployment.yaml.bak k8s/deployment.yaml

echo ""
echo "🎉 NexaBuilder has been successfully deployed to EKS!"
echo "Check the ingress for the application URL."