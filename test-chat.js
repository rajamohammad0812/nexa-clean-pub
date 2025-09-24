#!/usr/bin/env node

// Simple test script for the chat API
// Usage: node test-chat.js

const testMessage = process.argv[2] || 'Hello, can you help me create a simple automation workflow?'
const chatType = process.argv[3] || 'general'

async function testChat() {
  try {
    console.log(`Testing chat API with message: "${testMessage}"`)
    console.log(`Chat type: ${chatType}`)
    console.log('---')

    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testMessage,
        type: chatType,
      }),
    })

    const data = await response.json()

    console.log('Status:', response.status)
    console.log('Response:', JSON.stringify(data, null, 2))

    if (data.success) {
      console.log('\n✅ Chat API is working!')
      console.log('AI Response:')
      console.log('---')
      console.log(data.response)
    } else {
      console.log('\n❌ Chat API returned an error:')
      console.log(data.error)
      if (data.suggestion) {
        console.log('Suggestion:', data.suggestion)
      }
    }
  } catch (error) {
    console.error('❌ Failed to connect to chat API:', error.message)
    console.log('\nMake sure the development server is running with: npm run dev')
  }
}

// Test different scenarios
async function runTests() {
  console.log('🧪 Testing Chat Integration\n')

  // Test 1: Basic general chat
  console.log('Test 1: General Chat')
  await testChat()

  console.log('\n' + '='.repeat(50) + '\n')

  // Test 2: Workflow suggestion
  console.log('Test 2: Workflow Suggestion')
  process.argv[2] = 'I want to automate my email responses for customer support'
  process.argv[3] = 'workflow'
  await testChat()
}

if (require.main === module) {
  runTests()
}
