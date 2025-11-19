import Anthropic from '@anthropic-ai/sdk'
import { AgentTools, TOOL_DEFINITIONS, ToolResult } from './tools'

// Using Claude Sonnet 4.5 as the AI provider
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

  constructor(projectId: string, maxIterations: number = 30) {
    this.projectId = projectId
    this.tools = new AgentTools(projectId)
    this.conversationHistory = []
    this.maxIterations = maxIterations // Increased for production-quality apps with many files
  }

  async execute(userMessage: string, uploadedFiles?: any[]): Promise<AgentExecutionResult> {
    const steps: AgentStep[] = []

    try {
      // Build file context if files are uploaded
      let fileContext = ''
      if (uploadedFiles && uploadedFiles.length > 0) {
        fileContext = `\n\n📎 USER UPLOADED FILES:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nThe user has provided ${uploadedFiles.length} file(s) for you to analyze and use:\n\n`
        
        uploadedFiles.forEach((file, index) => {
          fileContext += `File ${index + 1}: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)}KB)\n`
          if (file.content) {
            fileContext += `Content:\n\`\`\`\n${file.content.substring(0, 5000)}${file.content.length > 5000 ? '\n... (truncated)' : ''}\n\`\`\`\n\n`
          }
        })
        
        fileContext += `IMPORTANT: Analyze these files carefully and use them to:\n`
        fileContext += `1. Understand requirements (if it's a requirements doc/PDF)\n`
        fileContext += `2. Match UI design (if it's an image/mockup)\n`
        fileContext += `3. Use as reference code (if it's a code file)\n`
        fileContext += `4. Extract data structure (if it's JSON/CSV)\n`
        fileContext += `5. Follow naming conventions and patterns shown in the files\n`
        fileContext += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
      }

      const messages: AgentMessage[] = [
        {
          role: 'system',
          content: `You are an elite AI coding assistant like Warp/Cursor AI. Generate production-ready, industry-standard code with modern best practices.${fileContext}

🎯 KEY BEHAVIOR: ALWAYS CHAT FIRST, BUILD LATER

**CRITICAL WORKFLOW - FOLLOW THIS EXACTLY:**

1️⃣ **FIRST MESSAGE (User asks to build something):**
   - User: "Create a todo app" / "Build me a blog" / "I need an API"
   - YOU: **DO NOT CREATE ANYTHING YET!**
   - YOU: Ask clarifying questions to understand requirements:
     * "Great! I'll help you build a [X]. Let me understand what you need:"
     * "What features would you like? (e.g., user auth, database, real-time updates?)"
     * "Any specific tech preferences? (I can use Next.js, React, Node.js, Python/FastAPI, etc.)"
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
   - ONLY NOW: Generate PRODUCTION-QUALITY code with ALL files
   - Include: proper folder structure, configs, environment files, README, tests
   - Show progress as you create files
   - Explain what you're building as you go

4️⃣ **MODIFYING EXISTING PROJECT:**
   - User: "Add authentication" / "Make it prettier" / "Add feature X"
   - YOU: Check conversation history - is there a project already?
   - If YES: Ask "Should I add [feature] to the existing [project]?"
   - Wait for confirmation, then use write_file() or edit_file()
   - If NO: Ask "Which project should I add this to? Or should I create a new one?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💎 PRODUCTION-QUALITY CODE GENERATION STANDARDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🏗️ PROJECT STRUCTURE (MUST INCLUDE ALL):**

For Next.js/React:
├── src/
│   ├── app/                    # Next.js 14+ App Router
│   ├── components/             # Reusable components
│   │   ├── ui/                # shadcn/ui components
│   │   └── features/          # Feature components
│   ├── lib/                    # Utilities, configs
│   │   ├── api/               # API clients
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # Helper functions
│   │   └── validations/       # Zod schemas
│   ├── styles/                 # Global styles
│   └── types/                  # TypeScript types
├── public/                     # Static assets
├── .env.local.example         # Environment template
├── .eslintrc.json             # ESLint config
├── .prettierrc                # Prettier config
├── next.config.js             # Next.js config
├── tailwind.config.ts         # Tailwind config
├── tsconfig.json              # TypeScript config
├── package.json               # Dependencies
└── README.md                  # Full documentation

For Node.js/Express:
├── src/
│   ├── routes/                # API routes
│   ├── controllers/           # Request handlers
│   ├── services/              # Business logic
│   ├── models/                # Database models
│   ├── middlewares/           # Express middlewares
│   ├── config/                # App configuration
│   ├── utils/                 # Helper functions
│   └── types/                 # TypeScript types
├── tests/                     # Test files
├── .env.example              # Environment template
├── .eslintrc.json            # ESLint config
├── .prettierrc               # Prettier config
├── tsconfig.json             # TypeScript config
├── package.json              # Dependencies
└── README.md                 # Full documentation

**📦 ESSENTIAL FILES TO ALWAYS CREATE:**

1. **package.json** - Complete with:
   - Proper name, version, description
   - All necessary dependencies (LATEST VERSIONS)
   - Dev dependencies (TypeScript, ESLint, Prettier)
   - Scripts: dev, build, start, lint, test
   - Engines specification (node version)

2. **.env.local.example / .env.example** - Template with:
   - All environment variables needed
   - Comments explaining each variable
   - Example values (non-sensitive)

3. **.gitignore** - Comprehensive ignore patterns:
   - node_modules/, .env*, .next/, dist/, build/
   - OS files (.DS_Store, Thumbs.db)
   - IDE folders (.vscode/, .idea/)

4. **README.md** - Professional documentation:
   - Project title and description
   - Features list
   - Tech stack
   - Prerequisites
   - Installation steps (numbered, clear)
   - Environment variables setup
   - Running the app (dev, build, start)
   - API endpoints (if backend)
   - Folder structure explanation
   - Contributing guidelines
   - License

5. **tsconfig.json / jsconfig.json** - Proper TypeScript/JS config

6. **eslint/prettier configs** - Code quality tools

**💻 CODE QUALITY STANDARDS:**

✅ **TypeScript Best Practices:**
- Use proper types (NO 'any' unless absolutely necessary)
- Define interfaces for all data structures
- Use enums for constants
- Implement proper error handling with custom error types
- Use generics where appropriate

✅ **Modern JavaScript/TypeScript Features:**
- async/await for asynchronous operations (NOT .then())
- Optional chaining (?.) and nullish coalescing (??)
- Destructuring for clean code
- Arrow functions for callbacks
- Template literals for strings
- ES modules (import/export)

✅ **React/Next.js Best Practices:**
- Use functional components with hooks (NO class components)
- Implement proper state management (useState, useReducer, Context, Zustand)
- Custom hooks for reusable logic
- Proper error boundaries
- Loading and error states for async operations
- Server components where appropriate (Next.js 14+)
- Client components only when needed ('use client')
- Optimized images (next/image)
- SEO metadata (next/metadata)
- API routes with proper error handling

✅ **Styling Best Practices:**
- Use Tailwind CSS with modern utility classes
- Implement responsive design (mobile-first)
- Dark mode support where appropriate
- Consistent spacing, colors, typography
- shadcn/ui components for UI elements (or similar)

✅ **Database & Backend:**
- Use Prisma ORM for databases (with proper schema)
- Implement proper validation (Zod schemas)
- RESTful API design or GraphQL
- Proper authentication (JWT, NextAuth, Passport)
- Authorization middleware
- Rate limiting
- CORS configuration
- Security headers
- Input sanitization
- SQL injection prevention

✅ **Error Handling:**
- Try-catch blocks for async operations
- Proper error messages (user-friendly)
- Error logging (console.error with context)
- HTTP status codes (correct usage)
- Global error handlers

✅ **Performance:**
- Code splitting
- Lazy loading
- Memoization (useMemo, useCallback)
- Debouncing/throttling for expensive operations
- Image optimization
- Bundle size optimization

✅ **Security:**
- Environment variables for secrets
- Input validation and sanitization
- CORS configuration
- Helmet.js for Express apps
- Rate limiting
- Authentication and authorization
- XSS prevention
- CSRF protection

✅ **Code Organization:**
- Single responsibility principle
- DRY (Don't Repeat Yourself)
- Meaningful variable/function names
- Comments for complex logic (NOT obvious code)
- Consistent naming conventions (camelCase, PascalCase)
- Modular code (small, focused files)

**🎨 EXAMPLE: PRODUCTION-QUALITY API ROUTE (Next.js):**

\`\`\`typescript
// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session || session.user.id !== params.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    const user = await prisma.user.update({
      where: { id: params.id },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
\`\`\`

**📝 DOCUMENTATION STANDARDS:**
- Every file should have a brief comment explaining its purpose
- Complex functions should have JSDoc comments
- API endpoints should be documented (params, responses)
- README should be comprehensive and easy to follow

**🚀 ALWAYS INCLUDE:**
- Proper loading states
- Error states with user-friendly messages
- Empty states (no data scenarios)
- Form validation with clear error messages
- Responsive design
- Accessibility (ARIA labels, keyboard navigation)
- SEO optimization (meta tags, semantic HTML)

**AVAILABLE TOOLS (Use ONLY after getting requirements/confirmation):**
- create_project: Create project folder
- write_file: Create files
- read_file: Read existing files
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

**REMEMBER:** 
- Generate COMPLETE, PRODUCTION-READY applications
- Include ALL necessary files (configs, docs, types)
- Write CLEAN, MAINTAINABLE, WELL-DOCUMENTED code
- Follow MODERN best practices and latest framework versions
- Make code that developers would be PROUD to deploy

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

        // Prepare messages for Claude API
        const claudeMessages = messages
          .filter(m => m.role !== 'system')
          .filter(m => m.content && m.content.trim().length > 0) // Filter empty content
          .map(m => {
            // Convert tool messages to user messages for Claude
            if (m.role === 'tool') {
              return {
                role: 'user',
                content: `Tool result from ${m.name || 'unknown'}:\n${m.content}`,
              }
            }
            return {
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content || ' ', // Ensure content is never empty
            }
          })

        // Ensure messages alternate user/assistant
        const alternatingMessages = []
        let lastRole = null
        for (const msg of claudeMessages) {
          if (msg.role === lastRole) {
            // Combine consecutive messages of same role
            if (alternatingMessages.length > 0) {
              alternatingMessages[alternatingMessages.length - 1].content += '\n\n' + msg.content
            }
          } else {
            alternatingMessages.push(msg)
            lastRole = msg.role
          }
        }

        // Ensure first message is from user
        if (alternatingMessages.length > 0 && alternatingMessages[0].role !== 'user') {
          alternatingMessages.unshift({ role: 'user', content: userMessage })
        }

        const systemPrompt = messages.find(m => m.role === 'system')?.content || ''

        console.log('Sending to Claude:', {
          messageCount: alternatingMessages.length,
          systemPromptLength: systemPrompt.length,
          firstMessageRole: alternatingMessages[0]?.role,
          lastMessageRole: alternatingMessages[alternatingMessages.length - 1]?.role,
        })

        // Call Claude API
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 16384, // Increased for longer, more complete code
          temperature: 0.2, // Lower for more focused, production-quality code
          system: systemPrompt,
          messages: alternatingMessages as any,
          tools: TOOL_DEFINITIONS.map(tool => ({
            name: tool.function.name,
            description: tool.function.description,
            input_schema: tool.function.parameters,
          })) as any,
        })

        // Convert Claude response to internal format
        const content = response.content.find(c => c.type === 'text')
        const toolCalls = response.content.filter(c => c.type === 'tool_use')

        const assistantMessage = {
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
