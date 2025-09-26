#!/bin/bash

# AWS Deployment Script for Nexa Builder
# This script builds, tags, and pushes the Docker image to AWS ECR

set -e  # Exit immediately if a command exits with a non-zero status

# Configuration - Update these values for your AWS setup
AWS_REGION=${AWS_REGION:-"us-east-1"}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-"YOUR_ACCOUNT_ID"}
ECR_REPOSITORY=${ECR_REPOSITORY:-"nexabuilder"}
IMAGE_TAG=${IMAGE_TAG:-"latest"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting AWS deployment for Nexa Builder${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "AWS Region: $AWS_REGION"
echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "ECR Repository: $ECR_REPOSITORY"
echo "Image Tag: $IMAGE_TAG"
echo ""

# Validate required environment variables
if [ "$AWS_ACCOUNT_ID" = "YOUR_ACCOUNT_ID" ]; then
    echo -e "${RED}❌ Please set your AWS_ACCOUNT_ID environment variable${NC}"
    echo "Example: export AWS_ACCOUNT_ID=123456789012"
    exit 1
fi

# Get the login token and login to ECR
echo -e "${YELLOW}🔐 Logging in to Amazon ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Create ECR repository if it doesn't exist
echo -e "${YELLOW}📦 Checking if ECR repository exists...${NC}"
if ! aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION &> /dev/null; then
    echo -e "${YELLOW}📦 Creating ECR repository: $ECR_REPOSITORY${NC}"
    aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION
    
    # Set lifecycle policy to limit the number of images
    echo -e "${YELLOW}📦 Setting lifecycle policy for ECR repository${NC}"
    aws ecr put-lifecycle-policy --repository-name $ECR_REPOSITORY --region $AWS_REGION --lifecycle-policy-text '{
        "rules": [
            {
                "rulePriority": 1,
                "description": "Keep only 10 images",
                "selection": {
                    "tagStatus": "any",
                    "countType": "imageCountMoreThan",
                    "countNumber": 10
                },
                "action": {
                    "type": "expire"
                }
            }
        ]
    }'
fi

# Build the Docker image
echo -e "${YELLOW}🔨 Building Docker image...${NC}"
docker build -f Dockerfile.aws -t $ECR_REPOSITORY:$IMAGE_TAG .

# Tag the image for ECR
ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG"
echo -e "${YELLOW}🏷️  Tagging image: $ECR_URI${NC}"
docker tag $ECR_REPOSITORY:$IMAGE_TAG $ECR_URI

# Push the image to ECR
echo -e "${YELLOW}📤 Pushing image to ECR...${NC}"
docker push $ECR_URI

echo -e "${GREEN}✅ Successfully deployed to ECR!${NC}"
echo -e "${GREEN}📍 Image URI: $ECR_URI${NC}"
echo ""
echo -e "${YELLOW}🚀 Next steps:${NC}"
echo "1. Update your ECS service or App Runner to use the new image"
echo "2. Run database migrations in your AWS environment if needed"
echo "3. Update your environment variables in AWS Systems Manager or Secrets Manager"
echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"