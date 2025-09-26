#!/bin/bash

# Database Configuration Setup Helper
# This script helps you set up your database configuration easily

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Database Configuration Setup${NC}"
echo -e "${YELLOW}This script will help you configure your AWS RDS database connection${NC}"
echo ""

# Function to prompt for input with default value
prompt_with_default() {
    local prompt=$1
    local default=$2
    local result
    
    if [ -n "$default" ]; then
        read -p "$prompt (default: $default): " result
        echo ${result:-$default}
    else
        read -p "$prompt: " result
        echo $result
    fi
}

# Function to prompt for sensitive input (password)
prompt_password() {
    local prompt=$1
    local result
    
    echo -n "$prompt: "
    read -s result
    echo ""
    echo $result
}

echo -e "${BLUE}Please provide your AWS RDS PostgreSQL database details:${NC}"
echo ""

# Collect database information
DB_HOST=$(prompt_with_default "RDS Endpoint (e.g., mydb.abc123.us-east-1.rds.amazonaws.com)" "")
DB_PORT=$(prompt_with_default "Database Port" "5432")
DB_NAME=$(prompt_with_default "Database Name" "nexabuilder")
DB_USERNAME=$(prompt_with_default "Database Username" "")
DB_PASSWORD=$(prompt_password "Database Password")

echo ""
echo -e "${YELLOW}📋 Configuration Summary:${NC}"
echo "DB_HOST=$DB_HOST"
echo "DB_PORT=$DB_PORT"
echo "DB_NAME=$DB_NAME"
echo "DB_USERNAME=$DB_USERNAME"
echo "DB_PASSWORD=****"
echo ""

# Ask for confirmation
read -p "Does this look correct? (y/N): " confirm
if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
    echo "Configuration cancelled."
    exit 1
fi

# Update .env.production file
echo -e "${YELLOW}📝 Updating .env.production file...${NC}"

# Backup existing file if it exists
if [ -f .env.production ]; then
    cp .env.production .env.production.backup
    echo -e "${GREEN}✅ Backed up existing .env.production to .env.production.backup${NC}"
fi

# Update the database variables in .env.production
sed -i.tmp "s/DB_HOST=.*/DB_HOST=$DB_HOST/" .env.production
sed -i.tmp "s/DB_PORT=.*/DB_PORT=$DB_PORT/" .env.production
sed -i.tmp "s/DB_NAME=.*/DB_NAME=$DB_NAME/" .env.production
sed -i.tmp "s/DB_USERNAME=.*/DB_USERNAME=$DB_USERNAME/" .env.production
sed -i.tmp "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env.production

# Clean up temporary file
rm -f .env.production.tmp

echo -e "${GREEN}✅ Database configuration updated in .env.production${NC}"
echo ""

# Test database connection
echo -e "${YELLOW}🔍 Testing database connection...${NC}"
export DB_HOST="$DB_HOST"
export DB_PORT="$DB_PORT"
export DB_NAME="$DB_NAME"
export DB_USERNAME="$DB_USERNAME"
export DB_PASSWORD="$DB_PASSWORD"

# Try to generate Prisma client and test connection
if command -v npx &> /dev/null; then
    echo "Generating Prisma client..."
    npx prisma generate > /dev/null 2>&1
    
    echo "Testing database connection..."
    if npx prisma db execute --command "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database connection successful!${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not test database connection (this might be normal if migrations haven't been run yet)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  npm/npx not found, skipping connection test${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Database configuration complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the updated .env.production file"
echo "2. Run database migrations: ./scripts/migrate-aws.sh"
echo "3. Deploy to AWS: ./scripts/deploy-aws.sh"
echo ""
echo -e "${BLUE}💡 Pro tip: Your database password is now stored separately for better security!${NC}"