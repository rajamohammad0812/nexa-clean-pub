/**
 * Template Engine - Manages project templates and generation
 * Phase 1: File-based template system
 * Phase 2: Enhanced with AI-powered template selection and customization
 */

import path from 'path'
import fs from 'fs-extra'
import Handlebars from 'handlebars'
import { glob } from 'glob'
import { Logger } from './logger'
import { FileUtils } from './file-utils'
const logger = new Logger('template-engine')

export interface TemplateMetadata {
  id: string
  name: string
  description: string
  version: string
  tags: string[]
  framework: string
  features: string[]
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  scripts: Record<string, string>
}

export interface TemplateVariable {
  name: string
  type: 'string' | 'boolean' | 'number' | 'array'
  description: string
  default?: any
  required: boolean
  options?: string[] // For enum-like choices
}

export interface TemplateContext {
  projectName: string
  description?: string
  author?: string
  version?: string
  [key: string]: any
}

export class TemplateEngine {
  private templatesDir: string
  private templates: Map<string, TemplateMetadata> = new Map()

  constructor() {
    // Templates are stored in the CLI package
    this.templatesDir = path.resolve(__dirname, '../../templates')
    this.initializeHandlebarsHelpers()
  }

  private initializeHandlebarsHelpers(): void {
    // Helper for converting to kebab-case
    Handlebars.registerHelper('kebabCase', (str: string) => {
      return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
    })

    // Helper for converting to PascalCase
    Handlebars.registerHelper('pascalCase', (str: string) => {
      return str.replace(/(^\w|[\s-_]\w)/g, match => 
        match.replace(/[\s-_]/, '').toUpperCase()
      )
    })

    // Helper for converting to camelCase
    Handlebars.registerHelper('camelCase', (str: string) => {
      const pascal = str.replace(/(^\w|[\s-_]\w)/g, match => 
        match.replace(/[\s-_]/, '').toUpperCase()
      )
      return pascal.charAt(0).toLowerCase() + pascal.slice(1)
    })

    // Helper for conditional rendering
    Handlebars.registerHelper('ifEquals', (arg1: any, arg2: any, options: any) => {
      return (arg1 === arg2) ? options.fn(this) : options.inverse(this)
    })

    // Helper for array includes
    Handlebars.registerHelper('includes', (array: any[], item: any, options: any) => {
      return array && array.includes(item) ? options.fn(this) : options.inverse(this)
    })
  }

  /**
   * Get all available templates
   */
  async getAvailableTemplates(): Promise<TemplateMetadata[]> {
    try {
      await this.scanTemplates()
      return Array.from(this.templates.values())
    } catch (error) {
      logger.error('Failed to get available templates', { error })
      throw new Error('Failed to load templates')
    }
  }

  /**
   * Scan templates directory and load metadata
   */
  private async scanTemplates(): Promise<void> {
    try {
      // Ensure templates directory exists
      await fs.ensureDir(this.templatesDir)
      
      // Find all template directories
      const templateDirs = await fs.readdir(this.templatesDir)
      
      for (const dirName of templateDirs) {
        const templatePath = path.join(this.templatesDir, dirName)
        const stat = await fs.stat(templatePath)
        
        if (stat.isDirectory()) {
          await this.loadTemplateMetadata(dirName, templatePath)
        }
      }
    } catch (error) {
      logger.error('Failed to scan templates', { error })
    }
  }

  /**
   * Load metadata for a specific template
   */
  private async loadTemplateMetadata(id: string, templatePath: string): Promise<void> {
    try {
      const metadataPath = path.join(templatePath, 'template.json')
      
      if (await fs.pathExists(metadataPath)) {
        const metadata = await fs.readJSON(metadataPath) as TemplateMetadata
        metadata.id = id
        this.templates.set(id, metadata)
        
        logger.debug('Loaded template metadata', { id, metadata })
      } else {
        // Create basic metadata if template.json doesn't exist
        const basicMetadata: TemplateMetadata = {
          id,
          name: id.charAt(0).toUpperCase() + id.slice(1),
          description: `A ${id} project template`,
          version: '1.0.0',
          tags: [],
          framework: 'unknown',
          features: [],
          dependencies: {},
          devDependencies: {},
          scripts: {}
        }
        
        this.templates.set(id, basicMetadata)
        logger.debug('Created basic metadata for template', { id })
      }
    } catch (error) {
      logger.error('Failed to load template metadata', { id, error })
    }
  }

  /**
   * Generate a project from a template
   */
  async generateProject(
    templateId: string, 
    targetDir: string, 
    context: TemplateContext
  ): Promise<void> {
    try {
      const template = this.templates.get(templateId)
      if (!template) {
        throw new Error(`Template "${templateId}" not found`)
      }

      const templatePath = path.join(this.templatesDir, templateId)
      
      logger.info('Generating project from template', { templateId, targetDir, context })

      // Ensure target directory exists
      await fs.ensureDir(targetDir)

      // Copy and process template files
      await this.copyTemplateFiles(templatePath, targetDir, context)

      // Generate package.json
      await this.generatePackageJson(targetDir, template, context)

      logger.info('Project generated successfully', { templateId, targetDir })

    } catch (error) {
      logger.error('Failed to generate project', { templateId, error })
      throw error
    }
  }

  /**
   * Copy and process template files
   */
  private async copyTemplateFiles(
    templatePath: string, 
    targetDir: string, 
    context: TemplateContext
  ): Promise<void> {
    // Get all files in template (excluding template.json and package.json)
    const files = await glob('**/*', {
      cwd: templatePath,
      dot: true,
      ignore: ['template.json', 'package.json', 'node_modules/**']
    })

    for (const file of files) {
      const sourcePath = path.join(templatePath, file)
      const targetPath = path.join(targetDir, file)
      
      const stat = await fs.stat(sourcePath)
      
      if (stat.isDirectory()) {
        await fs.ensureDir(targetPath)
      } else {
        // Ensure target directory exists
        await fs.ensureDir(path.dirname(targetPath))
        
        // Process file based on extension
        if (this.isTemplateFile(file)) {
          await this.processTemplateFile(sourcePath, targetPath, context)
        } else {
          // Copy binary files as-is
          await fs.copy(sourcePath, targetPath)
        }
      }
    }
  }

  /**
   * Check if file should be processed as a template
   */
  private isTemplateFile(filePath: string): boolean {
    const textExtensions = [
      '.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.txt', '.yml', '.yaml',
      '.xml', '.html', '.css', '.scss', '.sass', '.less', '.env', '.gitignore',
      '.gitattributes', '.dockerignore', '.eslintrc', '.prettierrc'
    ]
    
    const ext = path.extname(filePath).toLowerCase()
    return textExtensions.includes(ext) || !ext // Files without extension are usually text
  }

  /**
   * Process a template file with Handlebars
   */
  private async processTemplateFile(
    sourcePath: string, 
    targetPath: string, 
    context: TemplateContext
  ): Promise<void> {
    try {
      const content = await fs.readFile(sourcePath, 'utf8')
      const template = Handlebars.compile(content)
      const processedContent = template(context)
      
      await fs.writeFile(targetPath, processedContent, 'utf8')
    } catch (error) {
      logger.error('Failed to process template file', { sourcePath, error })
      // Fall back to copying as-is
      await fs.copy(sourcePath, targetPath)
    }
  }

  /**
   * Generate package.json for the project
   */
  private async generatePackageJson(
    targetDir: string, 
    template: TemplateMetadata, 
    context: TemplateContext
  ): Promise<void> {
    const packageJsonPath = path.join(targetDir, 'package.json')
    
    // Check if template has its own package.json
    const templatePackageJsonPath = path.join(this.templatesDir, template.id, 'package.json')
    
    let packageJson: any = {}
    
    if (await fs.pathExists(templatePackageJsonPath)) {
      // Use template's package.json as base
      const templatePackageContent = await fs.readFile(templatePackageJsonPath, 'utf8')
      const processedContent = Handlebars.compile(templatePackageContent)(context)
      packageJson = JSON.parse(processedContent)
    } else {
      // Generate basic package.json
      packageJson = {
        name: context.projectName,
        version: context.version || '1.0.0',
        description: context.description || `A ${template.name} project created with NexaBuilder`,
        author: context.author || '',
        private: true,
        dependencies: template.dependencies,
        devDependencies: template.devDependencies,
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          lint: 'next lint',
          ...template.scripts
        }
      }
    }

    await fs.writeJSON(packageJsonPath, packageJson, { spaces: 2 })
  }

  /**
   * Smart template selection based on description (Phase 1 implementation)
   * Phase 2 will enhance this with actual AI analysis
   */
  async selectTemplateForDescription(description: string): Promise<TemplateMetadata> {
    await this.scanTemplates()
    const templates = Array.from(this.templates.values())
    
    if (templates.length === 0) {
      throw new Error('No templates available')
    }

    // Simple keyword-based matching for Phase 1
    // Phase 2 will replace this with AI-powered analysis
    const keywords = description.toLowerCase().split(/\s+/)
    
    // Score templates based on keyword matches
    const scored = templates.map(template => {
      let score = 0
      
      // Check template name and description
      const searchText = `${template.name} ${template.description} ${template.framework}`.toLowerCase()
      keywords.forEach(keyword => {
        if (searchText.includes(keyword)) score += 1
      })
      
      // Check tags and features
      template.tags.forEach(tag => {
        if (keywords.includes(tag.toLowerCase())) score += 2
      })
      
      template.features.forEach(feature => {
        if (keywords.some(keyword => feature.toLowerCase().includes(keyword))) {
          score += 1
        }
      })
      
      return { template, score }
    })

    // Sort by score and return the best match
    scored.sort((a, b) => b.score - a.score)
    
    if (scored[0].score > 0) {
      logger.info('Selected template based on description', {
        description,
        selectedTemplate: scored[0].template.name,
        score: scored[0].score
      })
      return scored[0].template
    }

    // Fall back to first available template if no good match
    logger.info('No good template match, using first available', {
      description,
      fallbackTemplate: templates[0].name
    })
    
    return templates[0]
  }

  /**
   * Get template variables for customization
   */
  async getTemplateVariables(templateId: string): Promise<TemplateVariable[]> {
    const templatePath = path.join(this.templatesDir, templateId)
    const variablesPath = path.join(templatePath, 'variables.json')
    
    if (await fs.pathExists(variablesPath)) {
      return await fs.readJSON(variablesPath)
    }
    
    // Return default variables
    return [
      {
        name: 'projectName',
        type: 'string',
        description: 'The name of your project',
        required: true
      },
      {
        name: 'description',
        type: 'string',
        description: 'Project description',
        required: false,
        default: ''
      },
      {
        name: 'author',
        type: 'string',
        description: 'Project author',
        required: false,
        default: ''
      }
    ]
  }
}