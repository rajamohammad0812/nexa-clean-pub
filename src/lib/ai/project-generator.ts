import { OpenAIService, ChatMessage } from '@/lib/openai'

export interface ProjectRequirements {
  isProjectRequest: boolean
  projectType: string
  description: string
  features: string[]
  complexity: 'simple' | 'medium' | 'complex'
  suggestedTemplate: string
  confidence: number
  reasoning: string
}

export interface ProjectGenerationRequest {
  requirements: ProjectRequirements
  projectName: string
  customization?: Record<string, unknown>
}

export class ProjectGeneratorAI {
  /**
   * Analyzes a user message to determine if it's a project creation request
   * and extracts structured requirements
   */
  static async analyzeProjectRequest(userMessage: string): Promise<ProjectRequirements> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are an expert software architect and project analyzer. Your job is to analyze user messages and determine if they want to create a software project.

When a user describes something they want to build, analyze their request and respond with ONLY a JSON object in this exact format:

{
  "isProjectRequest": boolean,
  "projectType": string,
  "description": string,
  "features": [array of features],
  "complexity": "simple|medium|complex",
  "suggestedTemplate": "nextjs-fullstack",
  "confidence": number (0-100),
  "reasoning": string
}

Project Type Examples:
- "e-commerce" for online stores
- "social-media" for social platforms
- "blog" for blogs/cms
- "portfolio" for personal websites
- "dashboard" for admin panels
- "marketplace" for two-sided platforms
- "streaming" for video/content platforms
- "booking" for reservation systems
- "food-delivery" for delivery apps
- "chat" for messaging apps

Features should be specific and actionable (e.g., "user authentication", "payment processing", "real-time messaging").

For template selection, currently only suggest "nextjs-fullstack" as that's what we have available.

Confidence should be:
- 90-100: Clear project request with specific details
- 70-89: Likely project request but missing some details  
- 50-69: Vague project request
- 0-49: Not a project request

Examples:
User: "I want to build a Netflix clone" → isProjectRequest: true, confidence: 95
User: "How are you today?" → isProjectRequest: false, confidence: 0
User: "I need help with my app" → isProjectRequest: false, confidence: 30

IMPORTANT: Respond with ONLY the JSON object, no additional text.`
      },
      {
        role: 'user',
        content: userMessage
      }
    ]

    try {
      const response = await OpenAIService.createChatCompletion({ 
        messages,
        temperature: 0.3, // Lower temperature for more consistent JSON output
        max_tokens: 500
      })

      // Parse the JSON response
      const analysis = JSON.parse(response.content.trim())
      
      // Validate required fields
      if (typeof analysis.isProjectRequest !== 'boolean' ||
          typeof analysis.confidence !== 'number' ||
          !analysis.projectType ||
          !analysis.description) {
        throw new Error('Invalid analysis format from AI')
      }

      return {
        isProjectRequest: analysis.isProjectRequest,
        projectType: analysis.projectType,
        description: analysis.description,
        features: Array.isArray(analysis.features) ? analysis.features : [],
        complexity: ['simple', 'medium', 'complex'].includes(analysis.complexity) 
          ? analysis.complexity : 'medium',
        suggestedTemplate: analysis.suggestedTemplate || 'nextjs-fullstack',
        confidence: Math.max(0, Math.min(100, analysis.confidence)),
        reasoning: analysis.reasoning || 'AI analysis completed'
      }

    } catch (error) {
      console.error('Project analysis error:', error)
      
      // Fallback analysis for parsing errors
      const fallbackConfidence = this.calculateFallbackConfidence(userMessage)
      
      return {
        isProjectRequest: fallbackConfidence > 50,
        projectType: this.extractProjectType(userMessage),
        description: userMessage,
        features: this.extractFeatures(userMessage),
        complexity: 'medium',
        suggestedTemplate: 'nextjs-fullstack',
        confidence: fallbackConfidence,
        reasoning: 'Fallback analysis due to parsing error'
      }
    }
  }

  /**
   * Generates a detailed project plan from requirements
   */
  static async generateProjectPlan(requirements: ProjectRequirements): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a senior software architect. Create a detailed project plan for the given requirements.

Include:
1. Project overview and goals
2. Technical architecture
3. Key features breakdown
4. Database schema suggestions
5. API endpoints needed
6. UI components required
7. Implementation timeline

Keep it practical and specific. Focus on Next.js, TypeScript, Tailwind CSS, and PostgreSQL stack.`
      },
      {
        role: 'user',
        content: `Create a detailed project plan for:
Project Type: ${requirements.projectType}
Description: ${requirements.description}
Features: ${requirements.features.join(', ')}
Complexity: ${requirements.complexity}

Template: ${requirements.suggestedTemplate}`
      }
    ]

    const response = await OpenAIService.createChatCompletion({ 
      messages,
      temperature: 0.7,
      max_tokens: 1500
    })

    return response.content
  }

  /**
   * Simple keyword-based fallback for project type detection
   */
  private static extractProjectType(message: string): string {
    const lower = message.toLowerCase()
    
    if (lower.includes('e-commerce') || lower.includes('shop') || lower.includes('store')) return 'e-commerce'
    if (lower.includes('blog') || lower.includes('cms')) return 'blog'
    if (lower.includes('social') || lower.includes('instagram') || lower.includes('twitter')) return 'social-media'
    if (lower.includes('portfolio') || lower.includes('personal website')) return 'portfolio'
    if (lower.includes('dashboard') || lower.includes('admin')) return 'dashboard'
    if (lower.includes('marketplace') || lower.includes('platform')) return 'marketplace'
    if (lower.includes('netflix') || lower.includes('streaming') || lower.includes('video')) return 'streaming'
    if (lower.includes('booking') || lower.includes('reservation')) return 'booking'
    if (lower.includes('food') || lower.includes('delivery') || lower.includes('uber')) return 'food-delivery'
    if (lower.includes('chat') || lower.includes('messaging')) return 'chat'
    
    return 'web-application'
  }

  /**
   * Simple keyword-based feature extraction
   */
  private static extractFeatures(message: string): string[] {
    const lower = message.toLowerCase()
    const features: string[] = []
    
    if (lower.includes('auth') || lower.includes('login') || lower.includes('user')) features.push('user authentication')
    if (lower.includes('payment') || lower.includes('stripe') || lower.includes('checkout')) features.push('payment processing')
    if (lower.includes('admin') || lower.includes('dashboard')) features.push('admin dashboard')
    if (lower.includes('api') || lower.includes('backend')) features.push('REST API')
    if (lower.includes('database') || lower.includes('data')) features.push('database integration')
    if (lower.includes('responsive') || lower.includes('mobile')) features.push('responsive design')
    
    return features
  }

  /**
   * Calculate confidence based on keywords
   */
  private static calculateFallbackConfidence(message: string): number {
    const lower = message.toLowerCase()
    let confidence = 0
    
    // Project creation keywords
    const creationWords = ['build', 'create', 'make', 'develop', 'want', 'need']
    const hasCreationWord = creationWords.some(word => lower.includes(word))
    if (hasCreationWord) confidence += 30
    
    // Project type keywords
    const projectWords = ['app', 'website', 'platform', 'system', 'application', 'site']
    const hasProjectWord = projectWords.some(word => lower.includes(word))
    if (hasProjectWord) confidence += 40
    
    // Specific project types
    const specificTypes = ['e-commerce', 'blog', 'social', 'dashboard', 'netflix', 'instagram', 'uber']
    const hasSpecificType = specificTypes.some(type => lower.includes(type))
    if (hasSpecificType) confidence += 30
    
    return Math.min(100, confidence)
  }
}