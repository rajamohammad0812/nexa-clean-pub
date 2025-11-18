import { NextRequest, NextResponse } from 'next/server'
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'

const WORKSPACE_ROOT = path.join(process.cwd(), 'generated-projects', 'workspace')
const runningServers: Map<string, ChildProcess> = new Map()

export async function POST(request: NextRequest) {
  try {
    const { project, action } = await request.json()

    if (!project) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    if (action === 'start') {
      if (runningServers.has(project)) {
        return NextResponse.json(
          { error: 'Server is already running', running: true },
          { status: 400 }
        )
      }

      const projectPath = path.join(WORKSPACE_ROOT, project)

      if (!fs.existsSync(projectPath)) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      const packageJsonPath = path.join(projectPath, 'package.json')
      if (!fs.existsSync(packageJsonPath)) {
        return NextResponse.json(
          { error: 'package.json not found' },
          { status: 400 }
        )
      }

      const serverProcess = spawn('npm', ['run', 'dev'], {
        cwd: projectPath,
        shell: true,
        detached: false,
      })

      runningServers.set(project, serverProcess)

      let output = ''
      serverProcess.stdout?.on('data', (data) => {
        output += data.toString()
      })

      serverProcess.stderr?.on('data', (data) => {
        output += data.toString()
      })

      serverProcess.on('close', (code) => {
        runningServers.delete(project)
        console.log(`Server for ${project} exited with code ${code}`)
      })

      return NextResponse.json({
        success: true,
        message: 'Development server started',
        pid: serverProcess.pid,
      })
    } else if (action === 'stop') {
      const serverProcess = runningServers.get(project)

      if (!serverProcess) {
        // Server not running, but return success anyway
        return NextResponse.json({
          success: true,
          message: 'Server was not running',
          wasRunning: false,
        })
      }

      serverProcess.kill('SIGTERM')
      runningServers.delete(project)

      return NextResponse.json({
        success: true,
        message: 'Development server stopped',
        wasRunning: true,
      })
    } else if (action === 'status') {
      const isRunning = runningServers.has(project)
      const serverProcess = runningServers.get(project)

      return NextResponse.json({
        running: isRunning,
        pid: serverProcess?.pid,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "start", "stop", or "status"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Dev server error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to manage dev server' },
      { status: 500 }
    )
  }
}
