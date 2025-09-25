import { NextRequest, NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/openai'
import { AnalysisRequest, AnalysisResponse } from '@/types/ai-analysis'

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          success: false,
          error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.',
          confidence: 0
        },
        { status: 500 }
      )
    }

    const body: AnalysisRequest = await request.json()

    // Validate input
    if (!body.userPrompt || typeof body.userPrompt !== 'string' || body.userPrompt.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Project description is required and must be a non-empty string',
          confidence: 0
        },
        { status: 400 }
      )
    }

    // Limit prompt length
    if (body.userPrompt.length > 1000) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Project description too long. Please limit to 1000 characters.',
          confidence: 0
        },
        { status: 400 }
      )
    }

    // Analyze the project prompt
    const analysisResponse: AnalysisResponse = await OpenAIService.analyzeProjectPrompt(body)

    return NextResponse.json(analysisResponse, { 
      status: analysisResponse.success ? 200 : 400 
    })

  } catch (error) {
    console.error('Project analysis API error:', error)

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid OpenAI API key. Please check your API key configuration.',
            confidence: 0
          },
          { status: 401 }
        )
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Rate limit exceeded. Please try again in a moment.',
            confidence: 0
          },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to analyze project. Please try again.',
        confidence: 0
      },
      { status: 500 }
    )
  }
}