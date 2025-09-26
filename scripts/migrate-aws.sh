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

# Check if DATABASE_URL is set, or if separate DB variables are set
if [ -z "$DATABASE_URL" ] && { [ -z "$DB_HOST" ] || [ -z "$DB_USERNAME" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; }; then
    echo -e "${RED}❌ Database configuration is incomplete${NC}"
    echo "Please set either:"
    echo "  Option 1: DATABASE_URL=postgresql://username:password@host:port/database"
    echo "  Option 2: DB_HOST, DB_USERNAME, DB_PASSWORD, and DB_NAME separately"
    echo ""
    echo "Examples:"
    echo "  export DATABASE_URL='postgresql://myuser:mypass@mydb.abc123.us-east-1.rds.amazonaws.com:5432/nexabuilder'"
    echo "  OR"
    echo "  export DB_HOST='mydb.abc123.us-east-1.rds.amazonaws.com'"
    echo "  export DB_USERNAME='myuser'"
    echo "  export DB_PASSWORD='mypass'"
    echo "  export DB_NAME='nexabuilder'"
    exit 1
fi

# Show database configuration (masked password)
if [ -n "$DATABASE_URL" ]; then
    echo -e "${YELLOW}📋 Database URL: ${DATABASE_URL%:*}:****@${DATABASE_URL##*@}${NC}"
else
    echo -e "${YELLOW}📋 Database: ${DB_USERNAME}:****@${DB_HOST}:${DB_PORT:-5432}/${DB_NAME}${NC}"
fi

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