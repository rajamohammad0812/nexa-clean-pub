import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Base project directory - all operations are scoped to this
const getProjectRoot = (projectId: string) => {
  return path.join(process.cwd(), 'generated-projects', projectId)
}

// Validate path is within project directory (security)
const validatePath = (projectId: string, filePath: string): string => {
  const projectRoot = getProjectRoot(projectId)
  const fullPath = path.resolve(projectRoot, filePath)
  
  if (!fullPath.startsWith(projectRoot)) {
    throw new Error('Access denied: Path outside project directory')
  }
  
  return fullPath
}

export interface ToolResult {
  success: boolean
  data?: any
  error?: string
  metadata?: Record<string, any>
}

/**
 * Agent Tools - Similar to tools available in Warp
 */
export class AgentTools {
  projectId: string
  projectRoot: string

  constructor(projectId: string) {
    this.projectId = projectId
    this.projectRoot = getProjectRoot(projectId)
  }

  /**
   * Read file contents
   */
  async readFile(filePath: string): Promise<ToolResult> {
    try {
      const fullPath = validatePath(this.projectId, filePath)
      const content = await fs.readFile(fullPath, 'utf-8')
      
      return {
        success: true,
        data: {
          path: filePath,
          content,
          size: content.length,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read file',
      }
    }
  }

  /**
   * Write/create file
   */
  async writeFile(filePath: string, content: string): Promise<ToolResult> {
    try {
      const fullPath = validatePath(this.projectId, filePath)
      const dir = path.dirname(fullPath)
      
      // Ensure directory exists
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(fullPath, content, 'utf-8')
      
      return {
        success: true,
        data: {
          path: filePath,
          size: content.length,
          created: true,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to write file',
      }
    }
  }

  /**
   * Edit file - replace specific content
   */
  async editFile(
    filePath: string,
    searchText: string,
    replaceText: string
  ): Promise<ToolResult> {
    try {
      const fullPath = validatePath(this.projectId, filePath)
      const content = await fs.readFile(fullPath, 'utf-8')
      
      if (!content.includes(searchText)) {
        return {
          success: false,
          error: 'Search text not found in file',
        }
      }
      
      const newContent = content.replace(searchText, replaceText)
      await fs.writeFile(fullPath, newContent, 'utf-8')
      
      return {
        success: true,
        data: {
          path: filePath,
          replaced: true,
          changes: newContent.length - content.length,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to edit file',
      }
    }
  }

  /**
   * List files in directory
   */
  async listFiles(dirPath: string = '.'): Promise<ToolResult> {
    try {
      const fullPath = validatePath(this.projectId, dirPath)
      const items = await fs.readdir(fullPath, { withFileTypes: true })
      
      const files = items.map((item) => ({
        name: item.name,
        type: item.isDirectory() ? 'directory' : 'file',
        path: path.join(dirPath, item.name),
      }))
      
      return {
        success: true,
        data: {
          path: dirPath,
          files,
          count: files.length,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list files',
      }
    }
  }

  /**
   * Search for text in files
   */
  async searchFiles(query: string, dirPath: string = '.'): Promise<ToolResult> {
    try {
      const fullPath = validatePath(this.projectId, dirPath)
      const matches: Array<{ file: string; line: number; content: string }> = []
      
      const searchDir = async (dir: string) => {
        const items = await fs.readdir(dir, { withFileTypes: true })
        
        for (const item of items) {
          const itemPath = path.join(dir, item.name)
          
          if (item.isDirectory()) {
            if (!item.name.startsWith('.') && item.name !== 'node_modules') {
              await searchDir(itemPath)
            }
          } else {
            if (item.name.match(/\.(ts|tsx|js|jsx|json|md|css|html)$/)) {
              try {
                const content = await fs.readFile(itemPath, 'utf-8')
                const lines = content.split('\n')
                
                lines.forEach((line, index) => {
                  if (line.toLowerCase().includes(query.toLowerCase())) {
                    matches.push({
                      file: path.relative(fullPath, itemPath),
                      line: index + 1,
                      content: line.trim(),
                    })
                  }
                })
              } catch {
                // Skip files that can't be read
              }
            }
          }
        }
      }
      
      await searchDir(fullPath)
      
      return {
        success: true,
        data: {
          query,
          matches,
          count: matches.length,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search files',
      }
    }
  }

  /**
   * Format command output for readability
   */
  private formatCommandOutput(output: string): string {
    const lines = output.split('\n')
    const maxLines = 50
    if (lines.length > maxLines) {
      return lines.slice(0, maxLines).join('\n') + `\n... (${lines.length - maxLines} more lines)`
    }
    return output
  }

  /**
   * Run shell command (safe commands only)
   */
  async runCommand(command: string): Promise<ToolResult> {
    try {
      const SAFE_COMMANDS = ['npm', 'yarn', 'node', 'git', 'ls', 'cat', 'pwd', 'echo', 'python']
      const BLOCKED_PATTERNS = ['rm -rf /', 'sudo', '&&', '|', '>', '<', ';']
      
      const cmd = command.trim().split(' ')[0]
      
      if (!SAFE_COMMANDS.includes(cmd)) {
        return {
          success: false,
          error: `Command '${cmd}' is not allowed. Safe commands: ${SAFE_COMMANDS.join(', ')}`,
        }
      }
      
      if (BLOCKED_PATTERNS.some(pattern => command.includes(pattern))) {
        return {
          success: false,
          error: 'Command contains blocked patterns',
        }
      }
      
      const timeout = cmd === 'npm' ? 120000 : 30000
      
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.projectRoot,
        timeout,
        maxBuffer: 1024 * 1024 * 10,
      })
      
      return {
        success: true,
        data: {
          command,
          stdout: this.formatCommandOutput(stdout),
          stderr: stderr ? this.formatCommandOutput(stderr) : undefined,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Command execution failed',
        data: {
          stdout: error.stdout ? this.formatCommandOutput(error.stdout) : undefined,
          stderr: error.stderr ? this.formatCommandOutput(error.stderr) : undefined,
        },
      }
    }
  }

  /**
   * Git Status
   */
  async gitStatus(): Promise<ToolResult> {
    try {
      const { stdout } = await execAsync('git status --short', {
        cwd: this.projectRoot,
        timeout: 5000,
      })
      
      return {
        success: true,
        data: {
          status: stdout,
          hasChanges: stdout.trim().length > 0,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Git status failed',
      }
    }
  }

  /**
   * Git Diff
   */
  async gitDiff(filePath?: string): Promise<ToolResult> {
    try {
      const command = filePath ? `git diff ${filePath}` : 'git diff'
      const { stdout } = await execAsync(command, {
        cwd: this.projectRoot,
        timeout: 10000,
      })
      
      return {
        success: true,
        data: {
          diff: this.formatCommandOutput(stdout),
          file: filePath,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Git diff failed',
      }
    }
  }

  /**
   * Git Log
   */
  async gitLog(count: number = 10): Promise<ToolResult> {
    try {
      const { stdout } = await execAsync(`git log -${count} --oneline`, {
        cwd: this.projectRoot,
        timeout: 5000,
      })
      
      return {
        success: true,
        data: {
          log: stdout,
          count,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Git log failed',
      }
    }
  }

  /**
   * Git Branch
   */
  async gitBranch(): Promise<ToolResult> {
    try {
      const { stdout } = await execAsync('git branch', {
        cwd: this.projectRoot,
        timeout: 5000,
      })
      
      return {
        success: true,
        data: {
          branches: stdout,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Git branch failed',
      }
    }
  }

  /**
   * Install Package
   */
  async installPackage(
    packageName: string,
    options: { dev?: boolean; manager?: 'npm' | 'yarn' } = {}
  ): Promise<ToolResult> {
    try {
      const manager = options.manager || 'npm'
      const devFlag = options.dev ? (manager === 'npm' ? '--save-dev' : '--dev') : ''
      const command = `${manager} install ${packageName} ${devFlag}`.trim()
      
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.projectRoot,
        timeout: 120000,
      })
      
      return {
        success: true,
        data: {
          package: packageName,
          output: this.formatCommandOutput(stdout + stderr),
        },
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Package installation failed',
      }
    }
  }

  /**
   * Uninstall Package
   */
  async uninstallPackage(
    packageName: string,
    manager: 'npm' | 'yarn' = 'npm'
  ): Promise<ToolResult> {
    try {
      const command = manager === 'npm' ? `npm uninstall ${packageName}` : `yarn remove ${packageName}`
      
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.projectRoot,
        timeout: 30000,
      })
      
      return {
        success: true,
        data: {
          package: packageName,
          output: this.formatCommandOutput(stdout + stderr),
        },
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Package removal failed',
      }
    }
  }

  /**
   * List Packages
   */
  async listPackages(): Promise<ToolResult> {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json')
      const content = await fs.readFile(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(content)
      
      return {
        success: true,
        data: {
          dependencies: packageJson.dependencies || {},
          devDependencies: packageJson.devDependencies || {},
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list packages',
      }
    }
  }

  /**
   * Detect Project Context
   */
  async detectProjectContext(): Promise<ToolResult> {
    try {
      const context: any = {
        framework: 'unknown',
        languages: [],
        features: [],
        configFiles: [],
      }
      
      const packageJsonPath = path.join(this.projectRoot, 'package.json')
      try {
        const content = await fs.readFile(packageJsonPath, 'utf-8')
        const packageJson = JSON.parse(content)
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
        
        if (deps['next']) context.framework = 'Next.js'
        else if (deps['react']) context.framework = 'React'
        else if (deps['express']) context.framework = 'Express'
        
        if (deps['typescript']) context.languages.push('TypeScript')
        else context.languages.push('JavaScript')
        
        if (deps['tailwindcss']) context.features.push('Tailwind CSS')
        if (deps['prisma']) context.features.push('Prisma')
        if (deps['next-auth']) context.features.push('NextAuth.js')
      } catch {
        context.languages.push('JavaScript')
      }
      
      const configFiles = ['next.config.js', 'vite.config.ts', 'webpack.config.js', '.env.local']
      context.configFiles = []
      for (const file of configFiles) {
        try {
          await fs.access(path.join(this.projectRoot, file))
          context.configFiles.push(file)
        } catch {
          // File doesn't exist
        }
      }
      
      return {
        success: true,
        data: context,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to detect project context',
      }
    }
  }

  /**
   * Run Tests
   */
  async runTests(pattern?: string): Promise<ToolResult> {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json')
      let testCommand = 'npm test'
      
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
        if (packageJson.scripts?.test) {
          testCommand = 'npm test'
        } else if (packageJson.scripts?.['test:unit']) {
          testCommand = 'npm run test:unit'
        }
      } catch {
        // Use default
      }
      
      if (pattern) {
        testCommand += ` -- ${pattern}`
      }
      
      const { stdout, stderr } = await execAsync(testCommand, {
        cwd: this.projectRoot,
        timeout: 60000,
      })
      
      const output = stdout + stderr
      const passed = /\d+ passed/.exec(output)?.[0] || 'unknown'
      const failed = /\d+ failed/.exec(output)?.[0] || '0 failed'
      
      return {
        success: !output.toLowerCase().includes('failed'),
        data: {
          command: testCommand,
          output: this.formatCommandOutput(output),
          summary: `${passed}, ${failed}`,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Tests failed',
        data: {
          output: this.formatCommandOutput(error.stdout || error.stderr || ''),
        },
      }
    }
  }

  /**
   * Create Project Folder
   */
  async createProject(projectName: string, description?: string): Promise<ToolResult> {
    try {
      const sanitized = projectName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      
      const workspaceRoot = path.join(process.cwd(), 'generated-projects', 'workspace')
      const projectPath = path.join(workspaceRoot, sanitized)
      
      await fs.mkdir(projectPath, { recursive: true })
      
      // Save metadata
      const metadataPath = path.join(workspaceRoot, '.projects-metadata.json')
      let metadata: any = { projects: {} }
      try {
        const existing = await fs.readFile(metadataPath, 'utf-8')
        metadata = JSON.parse(existing)
      } catch {
        // File doesn't exist
      }
      
      metadata.projects[sanitized] = {
        name: sanitized,
        displayName: projectName,
        description: description || `A ${projectName} project`,
        createdAt: new Date().toISOString(),
        techStack: [],
      }
      
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
      
      this.projectRoot = projectPath
      this.projectId = `workspace/${sanitized}`
      
      return {
        success: true,
        data: {
          projectName: sanitized,
          path: sanitized,
          description,
          message: `Project "${sanitized}" created. All files will be created in this project folder.`,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create project',
      }
    }
  }
}

export const TOOL_DEFINITIONS = [
  {
    type: 'function' as const,
    function: {
      name: 'create_project',
      description: 'Create a new project folder. Use this when user wants to create/build a new app.',
      parameters: {
        type: 'object',
        properties: {
          project_name: {
            type: 'string',
            description: 'Name of the project (e.g., "todo-app", "blog")',
          },
          description: {
            type: 'string',
            description: 'Brief description',
          },
        },
        required: ['project_name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'read_file',
      description: 'Read a file',
      parameters: {
        type: 'object',
        properties: {
          file_path: { type: 'string' },
        },
        required: ['file_path'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'write_file',
      description: 'Create or overwrite a file',
      parameters: {
        type: 'object',
        properties: {
          file_path: { type: 'string' },
          content: { type: 'string' },
        },
        required: ['file_path', 'content'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'edit_file',
      description: 'Edit a file by replacing text',
      parameters: {
        type: 'object',
        properties: {
          file_path: { type: 'string' },
          search_text: { type: 'string' },
          replace_text: { type: 'string' },
        },
        required: ['file_path', 'search_text', 'replace_text'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_files',
      description: 'List files in a directory',
      parameters: {
        type: 'object',
        properties: {
          dir_path: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_files',
      description: 'Search for text in files',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          dir_path: { type: 'string' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'run_command',
      description: 'Run a shell command (npm, git, node, etc.)',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string' },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'git_status',
      description: 'Show git status',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'git_diff',
      description: 'Show git diff',
      parameters: {
        type: 'object',
        properties: {
          file_path: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'git_log',
      description: 'Show git log',
      parameters: {
        type: 'object',
        properties: {
          count: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'git_branch',
      description: 'Show git branches',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'install_package',
      description: 'Install an npm package',
      parameters: {
        type: 'object',
        properties: {
          package_name: { type: 'string' },
          dev: { type: 'boolean' },
          manager: { type: 'string', enum: ['npm', 'yarn'] },
        },
        required: ['package_name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'uninstall_package',
      description: 'Uninstall an npm package',
      parameters: {
        type: 'object',
        properties: {
          package_name: { type: 'string' },
          manager: { type: 'string', enum: ['npm', 'yarn'] },
        },
        required: ['package_name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_packages',
      description: 'List installed packages',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'detect_context',
      description: 'Detect project framework and features',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'run_tests',
      description: 'Run test suite',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string' },
        },
      },
    },
  },
]
