#!/bin/bash

# Database Migration Script for AWS Deployment
# This script runs Prisma migrations against your AWS RDS database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Running database migrations for AWS deployment${NC}"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL environment variable is not set${NC}"
    echo "Please set your DATABASE_URL to point to your AWS RDS instance"
    echo "Example: export DATABASE_URL='postgresql://username:password@your-rds-endpoint.region.rds.amazonaws.com:5432/nexabuilder'"
    exit 1
fi

echo -e "${YELLOW}📋 Database URL: ${DATABASE_URL%:*}:****@${DATABASE_URL##*@}${NC}"

# Generate Prisma client
echo -e "${YELLOW}⚙️  Generating Prisma client...${NC}"
npx prisma generate

# Run database migrations
echo -e "${YELLOW}🚀 Running database migrations...${NC}"
npx prisma migrate deploy

# Check database status
echo -e "${YELLOW}🔍 Checking database status...${NC}"
npx prisma migrate status

echo -e "${GREEN}✅ Database migrations completed successfully!${NC}"
echo -e "${YELLOW}💡 If this is a fresh deployment, you may want to seed your database${NC}"
echo "   Run: npx prisma db seed (if you have a seed script configured)"