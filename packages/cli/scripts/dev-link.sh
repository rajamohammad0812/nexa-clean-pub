#!/bin/bash

# Development script to link the CLI globally for testing
# Run this to make 'nexa' command available globally during development

set -e

echo "🔗 Setting up NexaBuilder CLI for development..."

# Navigate to CLI directory
cd "$(dirname "$0")/.."

# Build the CLI
echo "📦 Building CLI..."
npm run build

# Link globally
echo "🌍 Linking globally..."
npm link

echo "✅ NexaBuilder CLI is now available globally!"
echo ""
echo "Test it with:"
echo "  nexa --help"
echo "  nexa templates"
echo "  nexa create my-test-app --template nextjs-fullstack"
echo ""
echo "To unlink later, run: npm unlink -g @nexabuilder/cli"