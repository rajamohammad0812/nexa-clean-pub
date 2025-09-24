#!/bin/bash

# OpenAI API Key Setup Script
echo "🔧 OpenAI API Key Setup"
echo "======================="
echo ""

if [ -z "$1" ]; then
    echo "❌ Please provide your OpenAI API key as an argument"
    echo ""
    echo "Usage: ./setup-api-key.sh sk-your-api-key-here"
    echo ""
    echo "You can get your API key from: https://platform.openai.com/api-keys"
    exit 1
fi

API_KEY="$1"

# Validate API key format
if [[ ! $API_KEY =~ ^sk-.+ ]]; then
    echo "❌ Invalid API key format. OpenAI API keys start with 'sk-'"
    echo "Please check your API key and try again."
    exit 1
fi

# Backup existing .env.local
if [ -f .env.local ]; then
    cp .env.local .env.local.backup
    echo "✅ Backed up existing .env.local to .env.local.backup"
fi

# Update .env.local with the new API key
sed -i.bak "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$API_KEY/" .env.local

if [ $? -eq 0 ]; then
    echo "✅ OpenAI API key has been configured successfully!"
    echo ""
    echo "🚀 Next steps:"
    echo "1. Start the development server: npm run dev"
    echo "2. Test the chat: node test-chat.js"
    echo "3. Open http://localhost:3001 in your browser"
    echo ""
    echo "📖 See CHAT_INTEGRATION.md for detailed testing instructions"
else
    echo "❌ Failed to update API key. Please check your permissions and try again."
    exit 1
fi

# Clean up backup file
rm -f .env.local.bak