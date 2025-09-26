import path from 'path'
import os from 'os'

export interface ProjectGenerationConfig {
  baseDirectory: string
  allowCustomPath: boolean
  defaultProjectsPath: string
}

// Default configuration
const DEFAULT_CONFIG: ProjectGenerationConfig = {
  baseDirectory: process.env.PROJECTS_BASE_DIR || path.join(process.cwd(), 'generated-projects'),
  allowCustomPath: process.env.ALLOW_CUSTOM_PROJECT_PATH === 'true' || true,
  defaultProjectsPath: path.join(process.cwd(), 'generated-projects')
}

// Get project generation configuration
export function getProjectConfig(): ProjectGenerationConfig {
  return DEFAULT_CONFIG
}

// Get the full path where a project should be generated
export function getProjectPath(projectId: string, customPath?: string): string {
  const config = getProjectConfig()
  
  if (customPath && config.allowCustomPath) {
    // Ensure the custom path is absolute
    const resolvedPath = path.resolve(customPath)
    return path.join(resolvedPath, projectId)
  }
  
  return path.join(config.baseDirectory, projectId)
}

// Get suggested project locations
export function getSuggestedProjectLocations(): string[] {
  const appDir = process.cwd()
  const homeDir = os.homedir()
  
  return [
    path.join(appDir, 'generated-projects'),
    path.join(appDir, 'projects'),
    path.join(appDir, 'user-projects'),
    path.join(homeDir, 'Desktop', 'Projects'),
    path.join(homeDir, 'Documents', 'Projects'),
    path.join(homeDir, 'Development'),
  ].filter(location => {
    try {
      // Only include locations that are accessible
      return path.resolve(location) !== ''
    } catch {
      return false
    }
  })
}

// Validate if a path is safe and accessible
export function validateProjectPath(projectPath: string): {
  isValid: boolean
  error?: string
  resolvedPath?: string
} {
  try {
    const resolvedPath = path.resolve(projectPath)
    const appDir = process.cwd()
    const homeDir = os.homedir()
    
    // Security check: ensure the path is within allowed directories
    if (!resolvedPath.startsWith(appDir) && 
        !resolvedPath.startsWith(homeDir) && 
        !resolvedPath.startsWith('/Users/Shared')) {
      return {
        isValid: false,
        error: 'Projects can only be created within the application directory, your home directory, or shared folders'
      }
    }
    
    return {
      isValid: true,
      resolvedPath
    }
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid path: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
