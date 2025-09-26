import { NextRequest, NextResponse } from 'next/server'
import { OpenAIService, ChatMessage } from '@/lib/openai'

interface ChatRequest {
  message: string
  conversationHistory?: ChatMessage[]
  type?: 'workflow' | 'general'
}

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.',
          suggestion: 'Get your API key from https://platform.openai.com/api-keys'
        },
        { status: 500 }
      )
    }

    const body: ChatRequest = await request.json()

    // Validate input
    if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Limit message length
    if (body.message.length > 2000) {
      return NextResponse.json(
        { error: 'Message too long. Please limit to 2000 characters.' },
        { status: 400 }
      )
    }

    let response: string

    // Choose the appropriate assistant based on type
    if (body.type === 'workflow') {
      // For workflow suggestions
      response = await OpenAIService.generateWorkflowSuggestion(body.message)
    } else {
      // For general automation chat
      response = await OpenAIService.chatAssistant(
        body.message,
        body.conversationHistory || []
      )
    }

    return NextResponse.json(
      {
        success: true,
        response,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Chat API error:', error)

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { 
            error: 'Invalid OpenAI API key. Please check your API key configuration.',
            suggestion: 'Verify your OPENAI_API_KEY environment variable is correct.'
          },
          { status: 401 }
        )
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded. Please try again in a moment.',
            suggestion: 'You can upgrade your OpenAI plan for higher rate limits.'
          },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to process chat request. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}