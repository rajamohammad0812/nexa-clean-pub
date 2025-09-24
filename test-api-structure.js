#!/usr/bin/env node

// Test script to verify API structure and error handling
async function testApiStructure() {
  console.log('🔍 Testing API Structure and Error Handling\n')

  const tests = [
    {
      name: 'Valid request format',
      payload: { message: 'Test message', type: 'general' },
      expectedStatus: 401, // Since we don't have a valid API key
    },
    {
      name: 'Empty message',
      payload: { message: '', type: 'general' },
      expectedStatus: 400,
    },
    {
      name: 'Missing message',
      payload: { type: 'general' },
      expectedStatus: 400,
    },
    {
      name: 'Very long message',
      payload: { message: 'a'.repeat(2001), type: 'general' },
      expectedStatus: 400,
    },
    {
      name: 'Workflow type',
      payload: { message: 'Test workflow', type: 'workflow' },
      expectedStatus: 401, // Since we don't have a valid API key
    },
  ]

  for (const test of tests) {
    console.log(`Testing: ${test.name}`)

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(test.payload),
      })

      const data = await response.json()

      const status = response.status === test.expectedStatus ? '✅' : '❌'
      console.log(`  ${status} Status: ${response.status} (expected: ${test.expectedStatus})`)

      if (data.error) {
        console.log(`  📝 Error: ${data.error}`)
        if (data.suggestion) {
          console.log(`  💡 Suggestion: ${data.suggestion}`)
        }
      }
    } catch (error) {
      console.log(`  ❌ Network error: ${error.message}`)
    }

    console.log('')
  }
}

if (require.main === module) {
  testApiStructure()
}
