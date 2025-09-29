# GitHub Actions Secrets Setup Guide

This document provides step-by-step instructions for configuring the required secrets in your GitHub repository for automated AWS EKS deployment.

## 🔐 Required GitHub Secrets

Navigate to your GitHub repository: **Settings** → **Secrets and variables** → **Actions**

### AWS Infrastructure Secrets

1. **`AWS_ACCESS_KEY_ID`**
   - Your AWS IAM user's access key ID
   - Example: `AKIAIOSFODNN7EXAMPLE`
   - Required permissions: ECR, EKS, CloudWatch

2. **`AWS_SECRET_ACCESS_KEY`**
   - Your AWS IAM user's secret access key
   - Example: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
   - Keep this secret secure and never share

### Database Configuration Secrets

3. **`DATABASE_URL`**
   - Complete PostgreSQL connection string
   - Format: `postgresql://username:password@host:port/database`
   - Example: `postgresql://postgresadmin:mypassword@nexabuilder-dev-rds.coz0yeck4uy6.us-east-1.rds.amazonaws.com:5432/nexabuilder`

4. **`DB_HOST`**
   - Your AWS RDS PostgreSQL endpoint
   - Example: `nexabuilder-dev-rds.coz0yeck4uy6.us-east-1.rds.amazonaws.com`

5. **`DB_PORT`**
   - Database port (typically 5432 for PostgreSQL)
   - Example: `5432`

6. **`DB_NAME`**
   - Name of your PostgreSQL database
   - Example: `nexabuilder`

7. **`DB_USERNAME`**
   - Database username
   - Example: `postgresadmin`

8. **`DB_PASSWORD`**
   - Database password
   - Example: `mySecurePassword123!`

### Application Authentication Secrets

9. **`NEXTAUTH_SECRET`**
   - Secret for NextAuth.js session encryption
   - Generate: `openssl rand -base64 32`
   - Example: `zYvwtcgU7ddXR9wSKVdA9dZ3d5R9CouvKO+dFsQ6EOg=`

10. **`NEXTAUTH_URL`**
    - Your application's production URL
    - Example: `https://dev.nexabuilder.net`

### API Keys

11. **`OPENAI_API_KEY`**
    - Your OpenAI API key for AI functionality
    - Format: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Get from: https://platform.openai.com/api-keys

## 📋 Step-by-Step Setup Instructions

### Step 1: Access GitHub Repository Settings

1. Go to your repository: https://github.com/rajamohammad0812/nexa-clean-pub
2. Click the **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**

### Step 2: Add Each Secret

For each secret listed above:

1. Click **New repository secret**
2. Enter the **Name** (exactly as shown above)
3. Enter the **Value** (your actual secret value)
4. Click **Add secret**

### Step 3: Verify Setup

After adding all secrets, you should see 11 secrets in your repository:

- ✅ AWS_ACCESS_KEY_ID
- ✅ AWS_SECRET_ACCESS_KEY
- ✅ DATABASE_URL
- ✅ DB_HOST
- ✅ DB_PORT
- ✅ DB_NAME
- ✅ DB_USERNAME
- ✅ DB_PASSWORD
- ✅ NEXTAUTH_SECRET
- ✅ NEXTAUTH_URL
- ✅ OPENAI_API_KEY

## 🚀 Deployment Triggers

The GitHub Actions workflow will automatically trigger when:

- You push to the `master` branch
- You create a pull request to `master`
- You manually trigger it from the Actions tab

## 🔍 Monitoring Deployment

### Check GitHub Actions Workflow

1. Go to the **Actions** tab in your repository
2. Look for "Deploy to AWS EKS" workflow
3. Click on the latest run to see detailed logs

### Verify EKS Deployment

After successful deployment, verify using kubectl:

```bash
# Check pod status
kubectl get pods -n nexabuilder

# Check services
kubectl get services -n nexabuilder

# Check ingress
kubectl get ingress -n nexabuilder

# View logs
kubectl logs -f deployment/nexabuilder-app -n nexabuilder
```

## 🛠️ Troubleshooting

### Common Issues and Solutions

**1. AWS Authentication Failed**

- Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are correct
- Ensure IAM user has required permissions (ECR, EKS, CloudWatch)

**2. Database Connection Failed**

- Check DATABASE_URL format is correct
- Verify database is accessible from EKS cluster
- Confirm security groups allow connections

**3. Build Failures**

- Check if all required secrets are set
- Verify Dockerfile.production exists
- Look for syntax errors in deployment.yaml

**4. Pod Crashes**

- Check application logs: `kubectl logs -f pod/nexabuilder-app-xxx -n nexabuilder`
- Verify environment variables are set correctly
- Check if database migrations ran successfully

### Getting Help

- Check GitHub Actions workflow logs for detailed error messages
- Use AWS CloudWatch for EKS cluster logs
- Monitor application logs through kubectl

## 🔐 Security Best Practices

- **Rotate secrets regularly** (every 90 days)
- **Use least-privilege IAM policies** for AWS credentials
- **Monitor secret usage** in GitHub Actions logs
- **Never commit secrets** to your repository
- **Use different secrets** for different environments (dev/staging/prod)

## 🎯 Next Steps

Once all secrets are configured:

1. **Push any changes** to trigger deployment
2. **Monitor the workflow** in GitHub Actions
3. **Test your application** at the deployed URL
4. **Set up monitoring** and alerts for production

---

Your NexaBuilder application is now ready for automated deployment to AWS EKS! 🎉
