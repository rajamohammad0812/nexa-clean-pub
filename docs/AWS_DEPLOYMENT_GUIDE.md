# AWS Deployment Guide for Nexa Builder

This guide walks you through deploying Nexa Builder to AWS using containerized deployment options.

## 🏗️ Prerequisites

### Required AWS Services

- **AWS Account** with appropriate permissions
- **Amazon ECR** (Elastic Container Registry) for storing Docker images
- **Amazon RDS PostgreSQL** (your existing database)
- **AWS ECS** or **AWS App Runner** for running containers
- **AWS Systems Manager Parameter Store** or **AWS Secrets Manager** for environment variables

### Local Requirements

- Docker installed and running
- AWS CLI installed and configured
- Node.js 18+ (for local testing)

## 🔧 Setup Instructions

### 1. Configure AWS CLI

```bash
# Configure AWS CLI with your credentials
aws configure
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]
# Default region name: [us-east-1 or your preferred region]
# Default output format: json
```

### 2. Set Environment Variables

```bash
# Set your AWS configuration
export AWS_ACCOUNT_ID="123456789012"  # Replace with your AWS account ID
export AWS_REGION="us-east-1"         # Replace with your preferred region
export ECR_REPOSITORY="nexabuilder"
```

### 3. Prepare Environment Configuration

Copy the AWS environment template:

```bash
cp .env.aws.example .env.production
```

Edit `.env.production` with your actual values:

- Update `DATABASE_URL` with your RDS PostgreSQL connection string
- Set `NEXTAUTH_SECRET` (generate with: `openssl rand -base64 32`)
- Add your `OPENAI_API_KEY`
- Configure OAuth providers with production redirect URIs
- Set `NEXT_PUBLIC_BASE_URL` to your production domain

## 🚀 Deployment Options

### Option 1: AWS App Runner (Recommended for Simplicity)

AWS App Runner is the simplest way to deploy containerized web applications.

#### Step 1: Store Secrets in AWS Systems Manager

```bash
# Store sensitive environment variables as secure strings
aws ssm put-parameter --name "/nexabuilder/database-url" --value "your-database-url" --type "SecureString" --region $AWS_REGION
aws ssm put-parameter --name "/nexabuilder/nextauth-secret" --value "your-nextauth-secret" --type "SecureString" --region $AWS_REGION
aws ssm put-parameter --name "/nexabuilder/openai-api-key" --value "your-openai-key" --type "SecureString" --region $AWS_REGION
```

#### Step 2: Deploy to ECR

```bash
# Run the deployment script
./scripts/deploy-aws.sh
```

#### Step 3: Create App Runner Service

1. Go to AWS App Runner console
2. Create a new service
3. Choose "Container registry" as source
4. Select your ECR repository and image
5. Configure environment variables:
   - Set non-sensitive variables directly
   - Reference Parameter Store for sensitive data
6. Configure health check path: `/api/health`
7. Deploy the service

### Option 2: AWS ECS with Fargate

For more control and scalability, use Amazon ECS.

#### Step 1: Store Secrets in AWS Secrets Manager

```bash
# Create secrets in AWS Secrets Manager
aws secretsmanager create-secret --name "nexabuilder/database-url" --secret-string "your-database-url" --region $AWS_REGION
aws secretsmanager create-secret --name "nexabuilder/nextauth-secret" --secret-string "your-nextauth-secret" --region $AWS_REGION
aws secretsmanager create-secret --name "nexabuilder/openai-api-key" --secret-string "your-openai-key" --region $AWS_REGION
```

#### Step 2: Create ECS Resources

```bash
# Deploy to ECR first
./scripts/deploy-aws.sh

# Create CloudWatch log group
aws logs create-log-group --log-group-name "/ecs/nexabuilder-app" --region $AWS_REGION

# Update the task definition with your account ID and region
sed -i '' "s/YOUR_ACCOUNT_ID/$AWS_ACCOUNT_ID/g" aws/ecs-task-definition.json
sed -i '' "s/YOUR_REGION/$AWS_REGION/g" aws/ecs-task-definition.json

# Register the task definition
aws ecs register-task-definition --cli-input-json file://aws/ecs-task-definition.json --region $AWS_REGION

# Create ECS cluster (if you don't have one)
aws ecs create-cluster --cluster-name nexabuilder-cluster --region $AWS_REGION

# Create ECS service (requires VPC, subnets, and security groups)
# See AWS documentation for detailed networking setup
```

## 🔄 Database Migration

Run database migrations against your AWS RDS instance:

```bash
# Set your production database URL
export DATABASE_URL="postgresql://username:password@your-rds-endpoint.region.rds.amazonaws.com:5432/nexabuilder"

# Run migrations
./scripts/migrate-aws.sh
```

## 🔒 Security Best Practices

### Environment Variables

- ✅ Store sensitive data in AWS Secrets Manager or Parameter Store
- ✅ Use IAM roles instead of access keys when possible
- ✅ Enable encryption at rest and in transit
- ✅ Regularly rotate secrets

### Network Security

- ✅ Use VPC with private subnets for containers
- ✅ Configure security groups to allow only necessary traffic
- ✅ Use Application Load Balancer with SSL/TLS
- ✅ Enable AWS WAF for web application protection

### Monitoring

- ✅ Enable CloudWatch logs and metrics
- ✅ Set up CloudWatch alarms for critical metrics
- ✅ Use AWS X-Ray for distributed tracing
- ✅ Monitor costs with AWS Cost Explorer

## 🔍 Troubleshooting

### Common Issues

**Build Failures**

- Check Docker is running locally
- Ensure all dependencies are properly listed in package.json
- Verify Dockerfile.aws syntax

**Container Startup Issues**

- Check CloudWatch logs for error messages
- Verify environment variables are properly set
- Ensure database connectivity from container

**Database Connection Issues**

- Verify DATABASE_URL format and credentials
- Check RDS security groups allow connections
- Ensure database is in same VPC or properly configured for external access

### Health Check Endpoint

The application includes a health check endpoint at `/api/health` that verifies:

- Application is responding
- Database connectivity
- Basic system health

Access it at: `https://your-domain.com/api/health`

## 📊 Monitoring and Logs

### CloudWatch Logs

View application logs:

```bash
aws logs tail /ecs/nexabuilder-app --follow --region $AWS_REGION
```

### Key Metrics to Monitor

- HTTP request rate and response times
- Container CPU and memory usage
- Database connection pool usage
- Error rates and 5xx responses

## 🔄 Continuous Deployment

### GitHub Actions Example

```yaml
name: Deploy to AWS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - name: Deploy to AWS
        run: |
          export AWS_ACCOUNT_ID=${{ secrets.AWS_ACCOUNT_ID }}
          ./scripts/deploy-aws.sh
```

## 💡 Cost Optimization Tips

1. **Use AWS App Runner** for simple applications (pay-per-use)
2. **Configure ECS auto-scaling** based on CPU/memory metrics
3. **Use Fargate Spot** for development environments
4. **Enable CloudWatch Container Insights** selectively
5. **Set up billing alerts** to monitor costs
6. **Use ECR lifecycle policies** to limit stored images

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review CloudWatch logs for error details
3. Verify all environment variables are correctly set
4. Ensure your RDS database is accessible from the container

---

## 📋 Quick Deployment Checklist

- [ ] AWS CLI configured
- [ ] Environment variables set
- [ ] `.env.production` configured with production values
- [ ] Database accessible from AWS (RDS endpoint, credentials, security groups)
- [ ] Secrets stored in AWS Secrets Manager/Parameter Store
- [ ] Docker image built and pushed to ECR
- [ ] ECS service or App Runner service created
- [ ] Database migrations run
- [ ] Health check endpoint responding
- [ ] Domain configured with SSL/TLS
- [ ] Monitoring and logging set up

🎉 **Your Nexa Builder application should now be running on AWS!**
