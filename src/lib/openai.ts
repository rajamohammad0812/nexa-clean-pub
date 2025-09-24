import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionRequest {
  messages: ChatMessage[]
  model?: string
  temperature?: number
  max_tokens?: number
}

export interface ChatCompletionResponse {
  content: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model: string
}

export class OpenAIService {
  static async createChatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    try {
      const response = await openai.chat.completions.create({
        model: request.model || 'gpt-4',
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens ?? 1000,
      })

      const choice = response.choices[0]
      if (!choice?.message?.content) {
        throw new Error('No response content received from OpenAI')
      }

      return {
        content: choice.message.content,
        usage: {
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0,
        },
        model: response.model,
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Generate automation workflow suggestions
  static async generateWorkflowSuggestion(description: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are an expert automation consultant. When a user describes what they want to automate, provide practical, step-by-step automation suggestions.

Focus on:
- Clear, actionable steps
- Popular automation tools and platforms
- Best practices and considerations
- Realistic implementation approaches

Keep responses helpful and concise.`
      },
      {
        role: 'user',
        content: `Help me automate: ${description}`
      }
    ]

    const response = await this.createChatCompletion({ messages })
    return response.content
  }

  // General chat assistant for automation topics
  static async chatAssistant(userMessage: string, conversationHistory: ChatMessage[] = []): Promise<string> {
    const systemMessage: ChatMessage = {
      role: 'system',
      content: `You are an AI automation assistant. You help users with:
- Building automation workflows
- Suggesting tools and platforms
- Troubleshooting automation issues
- Best practices for process automation
- Integration recommendations

Be helpful, practical, and provide actionable advice. If users ask about specific tools, provide accurate information about their capabilities and limitations.`
    }

    const messages: ChatMessage[] = [
      systemMessage,
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage
      }
    ]

    const response = await this.createChatCompletion({ messages })
    return response.content
  }
}