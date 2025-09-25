export type ProjectType = 
  | 'ecommerce'
  | 'social-media' 
  | 'blog'
  | 'portfolio'
  | 'landing-page'
  | 'dashboard'
  | 'streaming'
  | 'food-delivery'
  | 'real-estate'
  | 'education'
  | 'healthcare'
  | 'finance'
  | 'travel'
  | 'other'

export type ProjectComplexity = 'simple' | 'medium' | 'complex'

export interface TechStackRecommendation {
  frontend: string[]
  backend: string[]
  database: string[]
  authentication: string[]
  deployment: string[]
  additional: string[]
}

export interface ProjectFeature {
  name: string
  description: string
  priority: 'high' | 'medium' | 'low'
  estimated_hours: number
}

export interface ProjectRequirements {
  core_functionality: string[]
  user_roles: string[]
  key_pages: string[]
  integrations: string[]
  special_requirements: string[]
}

export interface ProjectAnalysis {
  projectType: ProjectType
  title: string
  description: string
  keyFeatures: ProjectFeature[]
  requirements: ProjectRequirements
  techStack: TechStackRecommendation
  complexity: ProjectComplexity
  estimatedTimeWeeks: number
  estimatedCost: {
    development: string
    monthly_hosting: string
  }
  marketAnalysis: {
    target_audience: string
    competition_level: 'low' | 'medium' | 'high'
    market_size: string
  }
  recommendedTemplate: {
    id: string
    name: string
    reason: string
  }
  nextSteps: string[]
}

export interface AnalysisRequest {
  userPrompt: string
  context?: {
    previousProjects?: string[]
    userSkillLevel?: 'beginner' | 'intermediate' | 'advanced'
    budget?: 'low' | 'medium' | 'high'
    timeline?: 'urgent' | 'normal' | 'flexible'
  }
}

export interface AnalysisResponse {
  success: boolean
  analysis?: ProjectAnalysis
  error?: string
  confidence: number // 0-1 score of how confident the AI is in the analysis
}