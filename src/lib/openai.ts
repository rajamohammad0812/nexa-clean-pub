import OpenAI from 'openai'
import { ProjectAnalysis, AnalysisRequest, AnalysisResponse } from '@/types/ai-analysis'
import { TemplateSelector } from '@/lib/template-mapping'

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

  // Analyze user project description and return structured project analysis
  static async analyzeProjectPrompt(request: AnalysisRequest): Promise<AnalysisResponse> {
    const systemPrompt = `You are a project detection assistant. Your job is to determine if a user message is asking to CREATE, BUILD, or DEVELOP a software application.

ONLY return project analysis if the user is clearly requesting to build something. Common project request phrases:
- "I want to build..."
- "Create an app for..."
- "Help me develop..."
- "I need a website that..."
- "Build me a..."
- "Make a system for..."

DO NOT treat these as project requests:
- General questions ("How do I...", "What is...", "Can you explain...")
- Troubleshooting ("My code isn't working", "I have an error")
- Learning requests ("Teach me about...", "Show me how...")
- General conversation ("Hello", "Thanks", "How are you")

If this is NOT a project request, return: {"isProjectRequest": false}

If this IS a project request, analyze it and return structured JSON with project details.

Project types: ecommerce, social-media, blog, portfolio, landing-page, dashboard, streaming, food-delivery, real-estate, education, healthcare, finance, travel, other

Available Templates:
- nextjs-fullstack: Full-stack Next.js app with TypeScript, Tailwind CSS, NextAuth.js, and PostgreSQL (suitable for all project types)

Select the most appropriate template based on the project requirements.

Return JSON in this format:

For NON-project requests:
{"isProjectRequest": false}

For project requests:
{
  "isProjectRequest": true,
  "projectType": "string",
  "title": "string",
  "description": "string",
  "keyFeatures": [
    {"name": "string", "description": "string", "priority": "high|medium|low", "estimated_hours": number}
  ],
  "requirements": {
    "core_functionality": ["string"],
    "user_roles": ["string"],
    "key_pages": ["string"],
    "integrations": ["string"],
    "special_requirements": ["string"]
  },
  "techStack": {
    "frontend": ["string"],
    "backend": ["string"],
    "database": ["string"],
    "authentication": ["string"],
    "deployment": ["string"],
    "additional": ["string"]
  },
  "complexity": "simple|medium|complex",
  "estimatedTimeWeeks": number,
  "estimatedCost": {
    "development": "string",
    "monthly_hosting": "string"
  },
  "marketAnalysis": {
    "target_audience": "string",
    "competition_level": "low|medium|high",
    "market_size": "string"
  },
  "recommendedTemplate": {
    "id": "nextjs-fullstack",
    "name": "Next.js Fullstack",
    "reason": "string explaining why this template is suitable"
  },
  "nextSteps": ["string"]
}`

    const userContext = request.context ? `
    
Additional context:
    - User skill level: ${request.context.userSkillLevel || 'not specified'}
    - Budget: ${request.context.budget || 'not specified'}
    - Timeline: ${request.context.timeline || 'not specified'}
    - Previous projects: ${request.context.previousProjects?.join(', ') || 'none'}
    ` : ''

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Analyze this project description and return structured JSON analysis: "${request.userPrompt}"${userContext}`
      }
    ]

    try {
      const response = await this.createChatCompletion({ 
        messages,
        temperature: 0.3, // Lower temperature for more consistent structured output
        max_tokens: 2000
      })

      // Parse the JSON response
      let parsedResponse: { isProjectRequest: boolean; [key: string]: unknown }
      try {
        parsedResponse = JSON.parse(response.content)
      } catch (parseError) {
        console.error('Failed to parse AI analysis JSON:', response.content)
        return {
          success: false,
          error: 'AI returned invalid JSON format',
          confidence: 0
        }
      }

      // Check if this is a project request
      if (!parsedResponse.isProjectRequest) {
        return {
          success: false,
          error: 'Not a project request',
          confidence: 0
        }
      }

      // Extract the analysis (remove isProjectRequest flag)
      const { isProjectRequest: _, ...analysis } = parsedResponse
      
      // Basic validation of required fields
      if (!analysis.projectType || !analysis.title || !analysis.keyFeatures) {
        return {
          success: false,
          error: 'AI analysis missing required fields',
          confidence: 0
        }
      }

      // Validate and ensure template selection
      if (!analysis.recommendedTemplate || !analysis.recommendedTemplate.id) {
        console.warn('AI did not provide template recommendation, using fallback selection')
        const fallbackTemplate = TemplateSelector.selectTemplate(
          analysis.projectType, 
          analysis.complexity,
          analysis.keyFeatures.map(f => f.name)
        )
        analysis.recommendedTemplate = {
          id: fallbackTemplate.id,
          name: fallbackTemplate.name,
          reason: `Selected based on project type (${analysis.projectType}) and complexity (${analysis.complexity})`
        }
      } else {
        // Validate that the AI-selected template exists
        const templateExists = TemplateSelector.getTemplateById(analysis.recommendedTemplate.id)
        if (!templateExists) {
          console.warn(`AI recommended non-existent template: ${analysis.recommendedTemplate.id}, using fallback`)
          const fallbackTemplate = TemplateSelector.selectTemplate(
            analysis.projectType, 
            analysis.complexity,
            analysis.keyFeatures.map(f => f.name)
          )
          analysis.recommendedTemplate = {
            id: fallbackTemplate.id,
            name: fallbackTemplate.name,
            reason: `Fallback selection - AI recommended invalid template`
          }
        }
      }

      return {
        success: true,
        analysis: analysis as ProjectAnalysis,
        confidence: 0.85 // Base confidence score
      }

    } catch (error) {
      console.error('Project analysis error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown analysis error',
        confidence: 0
      }
    }
  }
}
