#!/bin/bash

# Test script for Single Build Executor
# This script tests the AI project generation endpoint

echo "🚀 Testing Single Build Executor..."
echo ""

# Test 1: Analyze a project request
echo "📝 Test 1: Analyzing project request..."
curl -X GET "http://localhost:3000/api/ai/generate-project?message=I want to build a todo app with user authentication" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo ""

# Test 2: Generate a simple project
echo "🔨 Test 2: Generating a simple project..."
curl -X POST http://localhost:3000/api/ai/generate-project \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "my-test-app",
    "requirements": {
      "isProjectRequest": true,
      "projectType": "portfolio",
      "description": "A simple portfolio website",
      "features": ["responsive design", "contact form", "dark mode"],
      "complexity": "simple",
      "suggestedTemplate": "nextjs-fullstack",
      "confidence": 90,
      "reasoning": "Simple portfolio requirements"
    }
  }' \
  | jq '.'

echo ""
echo "✅ Test complete!"
