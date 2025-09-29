const testProjectDescriptions = [
  'I want to build a Netflix clone for streaming movies',
  'Create an e-commerce store for selling books',
  'Build a social media platform like Instagram',
  'I need a blog website for my travel stories',
  'Create a dashboard for managing my business analytics',
  'Build a food delivery app like Uber Eats',
  'I want a portfolio website to showcase my work',
  'Create a real estate listing website',
  'Build a simple landing page for my startup',
]

async function testAnalysis(prompt) {
  console.log(`\n🧪 Testing: "${prompt}"`)
  console.log('=' * 60)

  try {
    const response = await fetch('http://localhost:3000/api/analyze-project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userPrompt: prompt,
        context: {
          userSkillLevel: 'intermediate',
          budget: 'medium',
          timeline: 'normal',
        },
      }),
    })

    const data = await response.json()

    if (data.success && data.analysis) {
      const analysis = data.analysis
      console.log(`✅ SUCCESS - Confidence: ${Math.round(data.confidence * 100)}%`)
      console.log(`📋 Project: ${analysis.title}`)
      console.log(`🎯 Type: ${analysis.projectType}`)
      console.log(`⚡ Complexity: ${analysis.complexity}`)
      console.log(`⏰ Time: ${analysis.estimatedTimeWeeks} weeks`)
      console.log(
        `🔧 Features: ${analysis.keyFeatures
          .slice(0, 3)
          .map((f) => f.name)
          .join(', ')}`,
      )
      console.log(`💻 Tech: ${analysis.techStack.frontend.slice(0, 2).join(', ')}`)
    } else {
      console.log(`❌ FAILED: ${data.error}`)
      console.log(`📊 Confidence: ${Math.round((data.confidence || 0) * 100)}%`)
    }
  } catch (error) {
    console.log(`💥 ERROR: ${error.message}`)
  }
}

async function runAllTests() {
  console.log('🚀 Starting Project Analysis Tests')
  console.log('Make sure your development server is running on port 3000')

  for (const prompt of testProjectDescriptions) {
    await testAnalysis(prompt)
    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  console.log('\n🎉 All tests completed!')
}

// Run tests if this script is executed directly
if (typeof window === 'undefined') {
  runAllTests().catch(console.error)
}

module.exports = { testAnalysis, testProjectDescriptions }
