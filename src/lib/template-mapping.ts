import { ProjectType } from '@/types/ai-analysis'

export interface TemplateInfo {
  id: string
  name: string
  description: string
  suitableFor: ProjectType[]
  features: string[]
  complexity: 'simple' | 'medium' | 'complex'
  tags: string[]
}

// Available CLI templates
export const AVAILABLE_TEMPLATES: TemplateInfo[] = [
  {
    id: 'nextjs-fullstack',
    name: 'Next.js Fullstack',
    description: 'A full-stack Next.js application with TypeScript, Tailwind CSS, NextAuth.js, and PostgreSQL',
    suitableFor: [
      'ecommerce',
      'social-media', 
      'blog',
      'portfolio',
      'dashboard',
      'streaming',
      'food-delivery',
      'real-estate',
      'education',
      'healthcare',
      'finance',
      'travel',
      'landing-page',
      'other'
    ],
    features: [
      'TypeScript',
      'Tailwind CSS',
      'NextAuth.js authentication',
      'PostgreSQL database',
      'API routes',
      'Server-side rendering',
      'Static generation',
      'Responsive design'
    ],
    complexity: 'medium',
    tags: ['nextjs', 'typescript', 'tailwind', 'fullstack', 'auth', 'postgres']
  }
]

// Future templates (for when you add more)
export const PLANNED_TEMPLATES: TemplateInfo[] = [
  {
    id: 'react-spa',
    name: 'React SPA',
    description: 'Single-page React application with TypeScript and Tailwind',
    suitableFor: ['portfolio', 'landing-page', 'dashboard'],
    features: ['React', 'TypeScript', 'Tailwind CSS', 'Vite'],
    complexity: 'simple',
    tags: ['react', 'spa', 'vite', 'typescript']
  },
  {
    id: 'node-api',
    name: 'Node.js API',
    description: 'REST API with Node.js, Express, and PostgreSQL',
    suitableFor: ['other'],
    features: ['Node.js', 'Express', 'PostgreSQL', 'JWT Auth'],
    complexity: 'medium',
    tags: ['nodejs', 'api', 'express', 'postgres']
  },
  {
    id: 'ecommerce-advanced',
    name: 'Advanced E-commerce',
    description: 'Full e-commerce platform with payment processing and admin',
    suitableFor: ['ecommerce'],
    features: ['Stripe Integration', 'Admin Dashboard', 'Inventory Management'],
    complexity: 'complex',
    tags: ['ecommerce', 'stripe', 'admin', 'inventory']
  },
  {
    id: 'streaming-platform',
    name: 'Video Streaming',
    description: 'Video streaming platform with user subscriptions',
    suitableFor: ['streaming'],
    features: ['Video Upload', 'HLS Streaming', 'Subscriptions', 'CDN'],
    complexity: 'complex',
    tags: ['video', 'streaming', 'hls', 'subscriptions']
  }
]

export class TemplateSelector {
  /**
   * Select the best template for a given project type and requirements
   */
  static selectTemplate(
    projectType: ProjectType, 
    complexity: 'simple' | 'medium' | 'complex',
    features: string[] = []
  ): TemplateInfo {
    const availableTemplates = AVAILABLE_TEMPLATES

    // Score templates based on suitability
    const scoredTemplates = availableTemplates.map(template => {
      let score = 0

      // Primary scoring: project type match
      if (template.suitableFor.includes(projectType)) {
        score += 10
      }

      // Secondary scoring: complexity match
      if (template.complexity === complexity) {
        score += 5
      } else if (
        (template.complexity === 'medium' && complexity === 'simple') ||
        (template.complexity === 'medium' && complexity === 'complex')
      ) {
        score += 3 // Medium templates are versatile
      }

      // Feature matching scoring
      const featureLower = features.map(f => f.toLowerCase())
      template.features.forEach(templateFeature => {
        if (featureLower.some(f => templateFeature.toLowerCase().includes(f))) {
          score += 2
        }
      })

      // Tag matching scoring
      template.tags.forEach(tag => {
        if (featureLower.some(f => f.includes(tag) || tag.includes(f))) {
          score += 1
        }
      })

      return { template, score }
    })

    // Sort by score and return best match
    scoredTemplates.sort((a, b) => b.score - a.score)
    
    return scoredTemplates[0]?.template || availableTemplates[0]
  }

  /**
   * Get all available templates
   */
  static getAvailableTemplates(): TemplateInfo[] {
    return AVAILABLE_TEMPLATES
  }

  /**
   * Get template by ID
   */
  static getTemplateById(id: string): TemplateInfo | undefined {
    return AVAILABLE_TEMPLATES.find(t => t.id === id)
  }

  /**
   * Get recommended templates for a project type
   */
  static getRecommendedTemplates(projectType: ProjectType): TemplateInfo[] {
    return AVAILABLE_TEMPLATES.filter(t => t.suitableFor.includes(projectType))
  }
}