import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { AgentTools, TOOL_DEFINITIONS, ToolResult } from './tools'

// Choose your AI model: 'claude' or 'openai'
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai' // Default to OpenAI (Claude available as backup)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
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

You understand natural language and adapt to the user's intent. Be conversational and interactive!

🎯 KEY BEHAVIOR: ALWAYS CHAT FIRST, BUILD LATER

**CRITICAL WORKFLOW - FOLLOW THIS EXACTLY:**

1️⃣ **FIRST MESSAGE (User asks to build something):**
   - User: "Create a todo app" / "Build me a blog" / "I need an API"
   - YOU: **DO NOT CREATE ANYTHING YET!**
   - YOU: Ask clarifying questions to understand requirements:
     * "Great! I'll help you build a [X]. Let me understand what you need:"
     * "What features would you like? (e.g., user auth, database, real-time updates?)"
     * "Any specific tech preferences? (I can use Next.js, React, Node.js, etc.)"
     * "What's the main purpose/use case?"
   - **DO NOT CALL create_project OR write_file YET**

2️⃣ **GATHER REQUIREMENTS (User responds):**
   - User provides more details about features, tech stack, purpose
   - YOU: Summarize what you understood
   - YOU: Ask if they want to proceed or need changes
   - Example: "Got it! So I'll build a [project] with [features] using [tech]. Sound good?"
   - **STILL DON'T CREATE ANYTHING - Wait for confirmation**

3️⃣ **EXPLICIT CONFIRMATION (User says "yes" / "go ahead" / "build it"):**
   - ONLY NOW: Call create_project()
   - ONLY NOW: Start calling write_file() for each file
   - Show progress as you create files
   - Explain what you're building as you go

4️⃣ **MODIFYING EXISTING PROJECT:**
   - User: "Add authentication" / "Make it prettier" / "Add feature X"
   - YOU: Check conversation history - is there a project already?
   - If YES: Ask "Should I add [feature] to the existing [project]?"
   - Wait for confirmation, then use write_file() or edit_file()
   - If NO: Ask "Which project should I add this to? Or should I create a new one?"

**AVAILABLE TOOLS (Use ONLY after getting requirements/confirmation):**
- create_project: Create project folder (Use AFTER user confirms)
- write_file: Create files (Use AFTER confirmation)
- read_file: Read files
- edit_file: Modify files
- list_files: Browse directories
- search_files: Search code
- run_command: Execute commands
- install_package: Install packages
- detect_context: Detect project type
- run_tests: Run tests

**FILE PATH RULES:**
- After create_project, ALL paths are relative: "src/app.js" NOT "project-name/src/app.js"
- You're INSIDE the project folder

**REMEMBER:** Be conversational like a human developer having a planning conversation. Don't rush to generate code - understand requirements first!

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

        let assistantMessage: any

        if (AI_PROVIDER === 'claude') {
          // Use Claude 3.5 Sonnet
          const claudeMessages = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content,
            }))

          const systemPrompt = messages.find(m => m.role === 'system')?.content || ''

          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 8192,
            temperature: 0.3,
            system: systemPrompt,
            messages: claudeMessages as any,
            tools: TOOL_DEFINITIONS.map(tool => ({
              name: tool.function.name,
              description: tool.function.description,
              input_schema: tool.function.parameters,
            })) as any,
          })

          // Convert Claude response to OpenAI format
          const content = response.content.find(c => c.type === 'text')
          const toolCalls = response.content.filter(c => c.type === 'tool_use')

          assistantMessage = {
            role: 'assistant',
            content: content?.type === 'text' ? content.text : '',
            tool_calls: toolCalls.length > 0 ? toolCalls.map(tc => ({
              id: tc.type === 'tool_use' ? tc.id : '',
              type: 'function',
              function: {
                name: tc.type === 'tool_use' ? tc.name : '',
                arguments: JSON.stringify(tc.type === 'tool_use' ? tc.input : {}),
              },
            })) : undefined,
          }
        } else {
          // Use OpenAI GPT-4
          const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: messages as any,
            tools: TOOL_DEFINITIONS as any,
            tool_choice: 'auto',
            temperature: 0.3,
          })

          assistantMessage = response.choices[0]?.message
        }

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
