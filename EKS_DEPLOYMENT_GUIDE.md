# NexaBuilder EKS Deployment Guide

## Overview

This guide covers deploying your working NexaBuilder application to your existing AWS EKS cluster. The deployment is optimized for Mac → Linux cross-platform builds and preserves all your application code.

## 🏗️ Architecture

- **Local Development**: macOS (your machine)
- **Production Target**: Linux/AMD64 (AWS EKS)
- **Container Registry**: Amazon ECR
- **Orchestration**: Kubernetes on EKS
- **Load Balancer**: AWS Application Load Balancer (ALB)

## 🚀 Deployment Options

### Option 1: Automated GitHub Actions (Recommended)

The GitHub Actions workflow automatically triggers on every push to `master` branch.

#### Required GitHub Secrets:

Navigate to: https://github.com/rajamohammad0812/nexa-clean-pub/settings/secrets/actions

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
DATABASE_URL
DB_HOST
DB_PORT
DB_NAME
DB_USERNAME
DB_PASSWORD
NEXTAUTH_SECRET
NEXTAUTH_URL
OPENAI_API_KEY
```

#### Workflow Features:

- ✅ Cross-platform Docker builds (macOS → Linux/AMD64)
- ✅ Automatic ECR repository creation
- ✅ Secure secret injection
- ✅ Rolling deployments with zero downtime
- ✅ Health check validation
- ✅ Deployment verification and logging

### Option 2: Manual Deployment

For manual deployments or testing, use the provided script:

```bash
# Make sure you're in the project directory
cd /Users/ramo7985/Desktop/nexa-clean-pub

# Run the deployment script
./scripts/deploy-to-eks.sh
```

## 🎯 What Gets Deployed

### Docker Image

- **Multi-stage build** optimized for production
- **Linux/AMD64 platform** (compatible with EKS nodes)
- **Security hardened** (non-root user)
- **Health check endpoints** built-in
- **Automatic database migrations** on startup

### Kubernetes Resources

- **Namespace**: `nexabuilder`
- **Deployment**: `nexabuilder-app` (2 replicas)
- **Service**: `nexabuilder-service` (ClusterIP)
- **Ingress**: `nexabuilder-ingress` (ALB)

### Resource Configuration

```yaml
Resources:
  requests:
    memory: '512Mi'
    cpu: '250m'
  limits:
    memory: '1Gi'
    cpu: '500m'

Probes:
  - Startup Probe (12 attempts, 5s intervals)
  - Liveness Probe (every 30s)
  - Readiness Probe (every 10s)
```

## 🔧 Configuration

### Environment Variables

The application automatically receives these environment variables:

```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_APP_NAME="Nexa Builder"
DATABASE_URL=<from secrets>
DB_HOST=<from secrets>
DB_PORT=<from secrets>
DB_NAME=<from secrets>
DB_USERNAME=<from secrets>
DB_PASSWORD=<from secrets>
NEXTAUTH_SECRET=<from secrets>
NEXTAUTH_URL=<from secrets>
OPENAI_API_KEY=<from secrets>
AWS_REGION=us-east-1
LOG_LEVEL=info
```

### Rolling Update Strategy

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```

## 📊 Monitoring & Verification

### Check Deployment Status

```bash
# Get pod status
kubectl get pods -n nexabuilder

# Check deployment
kubectl get deployments -n nexabuilder

# View service and ingress
kubectl get services,ingress -n nexabuilder

# Check logs
kubectl logs -f deployment/nexabuilder-app -n nexabuilder
```

### Health Checks

Your application includes a health check endpoint at `/api/health` that:

- ✅ Validates database connectivity
- ✅ Checks application startup status
- ✅ Returns JSON status response

### Load Balancer

The ALB (Application Load Balancer) automatically:

- ✅ Routes traffic to healthy pods only
- ✅ Performs health checks every 30 seconds
- ✅ Handles SSL termination
- ✅ Supports WebSocket connections

## 🔍 Troubleshooting

### Common Issues

**1. Build Failures (Platform Mismatch)**

```bash
# Solution: The Dockerfile.production uses --platform linux/amd64
# This is automatically handled in the workflow
```

**2. Database Connection Issues**

```bash
# Check if secrets are properly set in GitHub
# Verify DATABASE_URL format: postgresql://user:pass@host:port/db

# Test database connectivity from a pod
kubectl run -it --rm debug --image=postgres:13 --restart=Never -- psql $DATABASE_URL
```

**3. Pod Startup Issues**

```bash
# Check pod logs
kubectl logs -n nexabuilder deployment/nexabuilder-app

# Check pod events
kubectl describe pods -n nexabuilder

# Check if Prisma migrations are running
kubectl logs -n nexabuilder deployment/nexabuilder-app | grep -i prisma
```

**4. Ingress/Load Balancer Issues**

```bash
# Check ingress status
kubectl describe ingress nexabuilder-ingress -n nexabuilder

# Verify ALB controller is running
kubectl get pods -n kube-system | grep aws-load-balancer-controller
```

### Useful Commands

```bash
# Scale the application
kubectl scale deployment nexabuilder-app --replicas=3 -n nexabuilder

# Restart deployment (rolling restart)
kubectl rollout restart deployment/nexabuilder-app -n nexabuilder

# Check rollout history
kubectl rollout history deployment/nexabuilder-app -n nexabuilder

# Rollback to previous version
kubectl rollout undo deployment/nexabuilder-app -n nexabuilder

# Port forward for local testing
kubectl port-forward deployment/nexabuilder-app 3000:3000 -n nexabuilder
```

## 🔐 Security Features

- ✅ **No secrets in code** - All sensitive data via GitHub Secrets
- ✅ **Non-root containers** - Runs as user `nextjs` (uid: 1001)
- ✅ **ECR image scanning** - Automatic vulnerability scanning
- ✅ **Network policies** - Kubernetes namespace isolation
- ✅ **Resource limits** - Prevents resource exhaustion
- ✅ **Health checks** - Automatic unhealthy pod replacement

## 📈 Performance Optimization

- ✅ **Multi-stage Docker builds** - Minimal production image size
- ✅ **Next.js standalone output** - Optimized for containers
- ✅ **Build caching** - GitHub Actions cache for faster builds
- ✅ **Rolling updates** - Zero downtime deployments
- ✅ **Horizontal scaling** - Ready for HPA (Horizontal Pod Autoscaler)

## 🎉 Success Indicators

After successful deployment, you should see:

1. **GitHub Actions**: ✅ Workflow completes successfully
2. **Kubernetes**: ✅ All pods show `Running` status
3. **Load Balancer**: ✅ Ingress shows an address
4. **Application**: ✅ Health check returns 200 OK
5. **Database**: ✅ Migrations complete successfully

## 🔄 Continuous Deployment

Every time you push to the `master` branch:

1. 🏗️ GitHub Actions builds new Docker image
2. 📤 Pushes image to ECR with unique tag
3. 🔄 Updates Kubernetes deployment
4. ⏳ Waits for rolling update to complete
5. ✅ Verifies deployment success

## 📞 Getting Help

If you encounter issues:

1. **Check GitHub Actions logs** for build/deployment errors
2. **Review kubectl logs** for application errors
3. **Verify GitHub Secrets** are correctly configured
4. **Confirm EKS cluster** connectivity and permissions
5. **Check AWS Load Balancer** configuration and security groups

---

Your NexaBuilder application is now production-ready and automatically deployable to AWS EKS! 🚀
