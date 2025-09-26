/**
 * Dynamic webhook API route for triggering workflows
 */

import { NextRequest, NextResponse } from 'next/server'
import { triggerManager } from '@/lib/workflow/triggers'

interface RouteParams {
  params: {
    endpoint: string
  }
}

// Handle all HTTP methods for webhook endpoints
async function handleWebhook(request: NextRequest, { params }: RouteParams) {
  try {
    const { endpoint } = params

    // Get request details
    const method = request.method
    const url = new URL(request.url)
    const query = Object.fromEntries(url.searchParams.entries())

    // Get headers (convert to plain object)
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Get body (handle different content types)
    let body: unknown = null
    try {
      const contentType = headers['content-type'] || ''

      if (contentType.includes('application/json')) {
        body = await request.json()
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData()
        body = Object.fromEntries(formData.entries())
      } else if (contentType.includes('text/')) {
        body = await request.text()
      } else {
        // For other types, try to read as text
        body = await request.text()
      }
    } catch (error) {
      // If body parsing fails, set to null
      body = null
    }

    // Create payload object
    const payload = {
      headers,
      body,
      query,
      method,
    }

    // Handle webhook trigger
    const result = await triggerManager.handleWebhookTrigger(endpoint, payload)

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          executionId: result.executionId,
          message: 'Workflow triggered successfully',
        },
        { status: 200 },
      )
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 },
    )
  }
}

// Export handlers for all HTTP methods
export const GET = handleWebhook
export const POST = handleWebhook
export const PUT = handleWebhook
export const PATCH = handleWebhook
export const DELETE = handleWebhook
