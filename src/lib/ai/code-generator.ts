import { OpenAIService, ChatMessage } from '@/lib/openai'
import { ProjectAnalysis } from '@/types/ai-analysis'

export interface GeneratedCode {
  filename: string
  content: string
  description: string
  type: 'component' | 'api' | 'schema' | 'page' | 'util'
}

export interface CodeGenerationOptions {
  projectAnalysis: ProjectAnalysis
  feature: string
  additionalContext?: string
}

export class AICodeGenerator {
  /**
   * Generate a custom React component based on feature requirements
   */
  static async generateComponent(options: CodeGenerationOptions): Promise<GeneratedCode> {
    const { projectAnalysis, feature, additionalContext } = options
    
    const systemPrompt = `You are an expert React/Next.js developer. Generate a high-quality, production-ready React component based on the project requirements.

IMPORTANT: Generate ONLY the component code. No explanations, no markdown formatting, just pure TypeScript/React code.

Requirements:
- Use TypeScript with proper types
- Use Tailwind CSS for styling
- Follow Next.js 14 App Router conventions
- Use modern React patterns (hooks, functional components)
- Include proper error handling
- Add loading states where appropriate
- Use proper accessibility attributes
- Include proper TypeScript interfaces

Project Context:
- Project Type: ${projectAnalysis.projectType}
- Complexity: ${projectAnalysis.complexity}
- Tech Stack: Next.js, TypeScript, Tailwind CSS, PostgreSQL
- Authentication: NextAuth.js available

Component Requirements:
- Feature: ${feature}
- Additional Context: ${additionalContext || 'None'}

Generate a complete, working component that fits this feature. Include all necessary imports, types, and implementations.`

    const userPrompt = `Generate a React component for: ${feature}

Project details:
- Type: ${projectAnalysis.projectType}
- Description: ${projectAnalysis.description}
- Key features: ${projectAnalysis.keyFeatures.map(f => f.name).join(', ')}

Create a component that implements the "${feature}" functionality with proper styling, error handling, and TypeScript types.`

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    const response = await OpenAIService.createChatCompletion({
      messages,
      temperature: 0.3,
      max_tokens: 2000
    })

    // Generate appropriate filename
    const componentName = this.generateComponentName(feature)
    const filename = `${componentName}.tsx`

    return {
      filename,
      content: response.content.trim(),
      description: `React component for ${feature}`,
      type: 'component'
    }
  }

  /**
   * Generate database schema based on project requirements
   */
  static async generateDatabaseSchema(projectAnalysis: ProjectAnalysis): Promise<GeneratedCode> {
    const systemPrompt = `You are a database architect specializing in Prisma and PostgreSQL. Generate a complete Prisma schema based on the project requirements.

IMPORTANT: Generate ONLY the Prisma schema code. No explanations, no markdown formatting, just the schema.prisma content.

Requirements:
- Use PostgreSQL as the database provider
- Include proper relationships between models
- Add appropriate indexes for performance
- Use proper field types and constraints
- Include createdAt and updatedAt timestamps
- Add user authentication models (User, Account, Session, VerificationToken) for NextAuth.js
- Follow Prisma best practices

Generate a complete schema that supports all the project features and requirements.`

    const featuresText = projectAnalysis.keyFeatures.map(f => 
      `- ${f.name}: ${f.description} (Priority: ${f.priority})`
    ).join('\n')

    const userPrompt = `Generate a Prisma database schema for a ${projectAnalysis.projectType} project.

Project Description: ${projectAnalysis.description}

Key Features to support:
${featuresText}

User Roles: ${projectAnalysis.requirements.user_roles.join(', ')}
Core Functionality: ${projectAnalysis.requirements.core_functionality.join(', ')}

Create models that support all these features with proper relationships and constraints.`

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    const response = await OpenAIService.createChatCompletion({
      messages,
      temperature: 0.2,
      max_tokens: 2000
    })

    return {
      filename: 'schema.prisma',
      content: response.content.trim(),
      description: 'Database schema for the project',
      type: 'schema'
    }
  }

  /**
   * Generate API endpoint based on feature requirements
   */
  static async generateAPIEndpoint(options: CodeGenerationOptions): Promise<GeneratedCode> {
    const { projectAnalysis, feature, additionalContext } = options

    const systemPrompt = `You are an expert Next.js API developer. Generate a complete API route handler for Next.js 14 App Router.

IMPORTANT: Generate ONLY the API route code. No explanations, no markdown formatting, just pure TypeScript code.

Requirements:
- Use Next.js 14 App Router API routes (route.ts)
- Implement GET, POST, PUT, DELETE methods as appropriate
- Use TypeScript with proper types and interfaces
- Include input validation using Zod
- Add proper error handling and HTTP status codes
- Include authentication checks where needed (use NextAuth)
- Use Prisma for database operations
- Follow REST API best practices
- Add proper CORS headers if needed

Generate a complete, production-ready API endpoint.`

    const userPrompt = `Generate a Next.js API endpoint for: ${feature}

Project Context:
- Type: ${projectAnalysis.projectType}
- Description: ${projectAnalysis.description}
- User Roles: ${projectAnalysis.requirements.user_roles.join(', ')}
- Additional Context: ${additionalContext || 'None'}

Create API routes that handle CRUD operations for this feature with proper validation, authentication, and error handling.`

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    const response = await OpenAIService.createChatCompletion({
      messages,
      temperature: 0.3,
      max_tokens: 2000
    })

    // Generate appropriate filename
    const routeName = this.generateRouteName(feature)
    const filename = `${routeName}/route.ts`

    return {
      filename,
      content: response.content.trim(),
      description: `API endpoint for ${feature}`,
      type: 'api'
    }
  }

  /**
   * Generate a complete page component for a feature
   */
  static async generatePage(options: CodeGenerationOptions): Promise<GeneratedCode> {
    const { projectAnalysis, feature, additionalContext } = options

    const systemPrompt = `You are an expert Next.js developer. Generate a complete page component for Next.js 14 App Router.

IMPORTANT: Generate ONLY the page component code. No explanations, no markdown formatting, just pure TypeScript/React code.

Requirements:
- Use Next.js 14 App Router (page.tsx)
- Use TypeScript with proper types
- Use Tailwind CSS for styling that matches modern design
- Implement proper SEO with metadata
- Add loading states and error handling
- Use React Server Components where appropriate
- Include proper accessibility
- Follow the project's design patterns

Generate a complete, beautiful, functional page.`

    const userPrompt = `Generate a Next.js page for: ${feature}

Project Details:
- Type: ${projectAnalysis.projectType}  
- Description: ${projectAnalysis.description}
- Complexity: ${projectAnalysis.complexity}
- Additional Context: ${additionalContext || 'None'}

Create a complete page that implements this feature with proper styling, functionality, and user experience.`

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]

    const response = await OpenAIService.createChatCompletion({
      messages,
      temperature: 0.4,
      max_tokens: 2500
    })

    // Generate appropriate filename  
    const pageName = this.generatePageName(feature)
    const filename = `${pageName}/page.tsx`

    return {
      filename,
      content: response.content.trim(),
      description: `Page component for ${feature}`,
      type: 'page'
    }
  }

  /**
   * Generate multiple code files for a complete feature
   */
  static async generateFeatureFiles(
    projectAnalysis: ProjectAnalysis, 
    feature: string
  ): Promise<GeneratedCode[]> {
    const files: GeneratedCode[] = []

    try {
      // Generate component
      const component = await this.generateComponent({
        projectAnalysis,
        feature,
        additionalContext: `Part of ${projectAnalysis.projectType} project`
      })
      files.push(component)

      // Generate API endpoint if needed
      if (this.needsAPI(feature)) {
        const apiEndpoint = await this.generateAPIEndpoint({
          projectAnalysis,
          feature,
          additionalContext: `CRUD operations for ${feature}`
        })
        files.push(apiEndpoint)
      }

      // Generate page if it's a main feature
      if (this.needsPage(feature)) {
        const page = await this.generatePage({
          projectAnalysis,
          feature,
          additionalContext: `Main page for ${feature} functionality`
        })
        files.push(page)
      }

    } catch (error) {
      console.error(`Error generating files for feature ${feature}:`, error)
      throw error
    }

    return files
  }

  /**
   * Helper: Generate component name from feature
   */
  private static generateComponentName(feature: string): string {
    return feature
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
      .replace(/[^a-zA-Z0-9]/g, '')
  }

  /**
   * Helper: Generate route name from feature
   */
  private static generateRouteName(feature: string): string {
    return feature
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }

  /**
   * Helper: Generate page name from feature
   */
  private static generatePageName(feature: string): string {
    return feature
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }

  /**
   * Helper: Determine if feature needs API endpoint
   */
  private static needsAPI(feature: string): boolean {
    const apiKeywords = [
      'authentication', 'login', 'register', 'user', 'profile',
      'payment', 'checkout', 'order', 'cart', 'product',
      'comment', 'review', 'rating', 'search', 'filter',
      'upload', 'download', 'data', 'crud', 'database'
    ]
    
    return apiKeywords.some(keyword => 
      feature.toLowerCase().includes(keyword)
    )
  }

  /**
   * Helper: Determine if feature needs dedicated page
   */
  private static needsPage(feature: string): boolean {
    const pageKeywords = [
      'dashboard', 'profile', 'settings', 'checkout', 'cart',
      'login', 'register', 'home', 'about', 'contact',
      'product', 'service', 'gallery', 'portfolio'
    ]
    
    return pageKeywords.some(keyword => 
      feature.toLowerCase().includes(keyword)
    )
  }
}