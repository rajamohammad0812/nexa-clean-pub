import { NextRequest, NextResponse } from 'next/server'
import { AgentExecutor } from '@/lib/agent/executor'

export async function POST(request: NextRequest) {
  try {
    const { message, projectId, conversationHistory } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      )
    }

    const workspaceId = projectId || 'workspace'
    const agent = new AgentExecutor(workspaceId)

    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.forEach((msg: { role: 'user' | 'assistant'; content: string }) => {
        agent.addToHistory(msg)
      })
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await agent.execute(message)

          for (const step of result.steps) {
            const eventData = JSON.stringify({
              type: step.type,
              content: step.content,
              tool_name: step.tool_name,
              tool_args: step.tool_args,
              tool_result: step.tool_result,
              timestamp: step.timestamp,
              progress: step.progress,
            })

            controller.enqueue(
              encoder.encode(`data: ${eventData}\n\n`)
            )

            await new Promise((resolve) => setTimeout(resolve, 10))
          }

          const doneData = JSON.stringify({
            type: 'done',
            success: result.success,
            response: result.response,
            error: result.error,
          })
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`))

          controller.close()
        } catch (error) {
          console.error('Agent execution error:', error)
          const errorData = JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
