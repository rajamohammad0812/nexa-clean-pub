import OpenAI from 'openai'
import { AgentTools, TOOL_DEFINITIONS, ToolResult } from './tools'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  tool_calls?: any[]
  tool_call_id?: string
  name?: string
}

export interface AgentStep {
  type: 'thought' | 'tool_call' | 'tool_result' | 'response' | 'progress'
  content: string
  tool_name?: string
  tool_args?: Record<string, any>
  tool_result?: ToolResult
  timestamp: Date
  progress?: {
    current: number
    total: number
    percentage: number
  }
}

export interface AgentExecutionResult {
  success: boolean
  response: string
  steps: AgentStep[]
  error?: string
}

export class AgentExecutor {
  private projectId: string
  private tools: AgentTools
  private conversationHistory: AgentMessage[]
  private maxIterations: number
  private fileCreationCount: number = 0
  private estimatedTotalFiles: number = 0

  constructor(projectId: string, maxIterations: number = 10) {
    this.projectId = projectId
    this.tools = new AgentTools(projectId)
    this.conversationHistory = []
    this.maxIterations = maxIterations
  }

  async execute(userMessage: string): Promise<AgentExecutionResult> {
    const steps: AgentStep[] = []

    try {
      const messages: AgentMessage[] = [
        {
          role: 'system',
          content: `You are an AI coding assistant like Warp AI. Be conversational, helpful, and context-aware.

You understand natural language and adapt to the user's intent. When they say vague things like "make it better" or "add that feature we discussed", you understand from context what they mean.

CRITICAL: You must CALL TOOLS to do work, not just describe it.

AVAILABLE TOOLS (YOU MUST USE THESE):
- create_project: Create a new project folder (MANDATORY FIRST STEP!)
- write_file: Create/overwrite files (USE THIS to create files, don't just describe them)
- read_file: Read any file
- edit_file: Modify existing files
- list_files: Browse directories  
- search_files: Search code
- run_command: Execute commands (npm, node, yarn, ls, cat, etc.)
- git_status: Show git status
- git_diff: Show file changes
- git_log: Show commit history
- git_branch: Show branches
- install_package: Install npm/yarn packages
- uninstall_package: Remove packages
- list_packages: Show installed packages
- detect_context: Detect project type, framework, tech stack
- run_tests: Execute test suite

HOW TO BE CONVERSATIONAL & SMART:

1. UNDERSTAND CONTEXT:
   - Track what project you're working on from the conversation
   - If user previously asked you to create a project, remember that
   - When they say "add X" or "change Y" or "make it do Z", they mean the CURRENT project
   - Only create a NEW project if they explicitly start a new thing ("now create...", "let's build a different...")

2. ASK CLARIFYING QUESTIONS WHEN NEEDED:
   - If request is vague: "I want to build an app" → Ask: "What kind of app? A todo list, blog, e-commerce, etc?"
   - If ambiguous: "Add authentication" → You can decide: "I'll add JWT authentication with login/signup"
   - Be helpful and proactive, make reasonable assumptions

3. WORKFLOWS:
   
   **Starting Fresh (NEW project):**
   - User: "Create a todo app" / "Build me a blog" / "I need an API"
   - You: create_project("todo-app") → write_file("package.json") → write_file("src/app.js") → etc.
   - Create ALL necessary files in one go
   
   **Continuing Work (SAME project):**
   - User: "Add user authentication" / "Make it prettier" / "Add a database"
   - You: Check conversation - is there already a project?
   - If YES: write_file("src/auth.js") or edit_file("src/app.js") - ADD to existing project
   - If NO: Ask "What project should I add this to?"
   
   **Starting Over (NEW project):**
   - User: "Actually, let's create a different app" / "Start over" / "Now build X instead"
   - You: create_project("new-name") → Start fresh

4. FILE PATH RULES:
   - After create_project, ALL paths are relative: "src/app.js" NOT "project-name/src/app.js"
   - You're INSIDE the project folder
   - Don't prefix paths with the project name

BE LIKE WARP AI: Natural, smart, context-aware, proactive.

Project: ${this.projectId}
All paths relative to project root (generated-projects/${this.projectId}/)`,
        },
        ...this.conversationHistory,
        {
          role: 'user',
          content: userMessage,
        },
      ]

      let iterations = 0
      let finished = false

      while (!finished && iterations < this.maxIterations) {
        iterations++

        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: messages as any,
          tools: TOOL_DEFINITIONS as any,
          tool_choice: 'auto',
          temperature: 0.3,
        })

        const assistantMessage = response.choices[0]?.message

        if (!assistantMessage) {
          throw new Error('No response from AI')
        }

        messages.push(assistantMessage as any)

        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
          for (const toolCall of assistantMessage.tool_calls) {
            const toolName = toolCall.function.name
            const toolArgs = JSON.parse(toolCall.function.arguments)

            steps.push({
              type: 'tool_call',
              content: `Calling ${toolName}`,
              tool_name: toolName,
              tool_args: toolArgs,
              timestamp: new Date(),
            })

            const result = await this.executeTool(toolName, toolArgs)

            steps.push({
              type: 'tool_result',
              content: result.success ? 'Success' : `Error: ${result.error}`,
              tool_name: toolName,
              tool_result: result,
              timestamp: new Date(),
            })

            if (toolName === 'write_file' && this.fileCreationCount > 0) {
              const percentage = Math.min(
                Math.round((this.fileCreationCount / this.estimatedTotalFiles) * 100),
                100,
              )
              steps.push({
                type: 'progress',
                content: `Creating files: ${this.fileCreationCount}/${this.estimatedTotalFiles}`,
                timestamp: new Date(),
                progress: {
                  current: this.fileCreationCount,
                  total: this.estimatedTotalFiles,
                  percentage,
                },
              })
            }

            messages.push({
              role: 'tool',
              content: JSON.stringify(result),
              tool_call_id: toolCall.id,
              name: toolName,
            })
          }
        } else {
          finished = true

          steps.push({
            type: 'response',
            content: assistantMessage.content || 'Task completed',
            timestamp: new Date(),
          })
        }
      }

      if (iterations >= this.maxIterations) {
        steps.push({
          type: 'response',
          content: 'Reached maximum iterations. Task may be incomplete.',
          timestamp: new Date(),
        })
      }

      const finalMessage = messages[messages.length - 1]
      const finalResponse =
        finalMessage.role === 'assistant'
          ? finalMessage.content || 'Task completed'
          : 'Task completed'

      this.conversationHistory.push(
        {
          role: 'user',
          content: userMessage,
        },
        {
          role: 'assistant',
          content: finalResponse,
        },
      )

      return {
        success: true,
        response: finalResponse,
        steps,
      }
    } catch (error) {
      console.error('Agent execution error:', error)

      steps.push({
        type: 'response',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      })

      return {
        success: false,
        response: 'Failed to execute task',
        steps,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private async executeTool(toolName: string, args: Record<string, any>): Promise<ToolResult> {
    try {
      switch (toolName) {
        case 'create_project':
          return await this.tools.createProject(args.project_name, args.description)

        case 'read_file':
          return await this.tools.readFile(args.file_path)

        case 'write_file':
          this.fileCreationCount++
          if (this.estimatedTotalFiles === 0) {
            this.estimatedTotalFiles = 10
          }
          return await this.tools.writeFile(args.file_path, args.content)

        case 'edit_file':
          return await this.tools.editFile(args.file_path, args.search_text, args.replace_text)

        case 'list_files':
          return await this.tools.listFiles(args.dir_path || '.')

        case 'search_files':
          return await this.tools.searchFiles(args.query, args.dir_path || '.')

        case 'run_command':
          return await this.tools.runCommand(args.command)

        case 'git_status':
          return await this.tools.gitStatus()

        case 'git_diff':
          return await this.tools.gitDiff(args.file_path)

        case 'git_log':
          return await this.tools.gitLog(args.count || 10)

        case 'git_branch':
          return await this.tools.gitBranch()

        case 'install_package':
          return await this.tools.installPackage(args.package_name, {
            dev: args.dev,
            manager: args.manager,
          })

        case 'uninstall_package':
          return await this.tools.uninstallPackage(args.package_name, args.manager)

        case 'list_packages':
          return await this.tools.listPackages()

        case 'detect_context':
          return await this.tools.detectProjectContext()

        case 'run_tests':
          return await this.tools.runTests(args.pattern)

        default:
          return {
            success: false,
            error: `Unknown tool: ${toolName}`,
          }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed',
      }
    }
  }

  addToHistory(message: { role: 'user' | 'assistant'; content: string }) {
    this.conversationHistory.push(message)
  }

  resetHistory() {
    this.conversationHistory = []
  }

  getHistory(): AgentMessage[] {
    return this.conversationHistory
  }

  getProgress() {
    return {
      current: this.fileCreationCount,
      total: this.estimatedTotalFiles,
      percentage:
        this.estimatedTotalFiles > 0
          ? Math.round((this.fileCreationCount / this.estimatedTotalFiles) * 100)
          : 0,
    }
  }
}

export async function executeAgent(
  projectId: string,
  userMessage: string,
): Promise<AgentExecutionResult> {
  const agent = new AgentExecutor(projectId)
  return await agent.execute(userMessage)
}
