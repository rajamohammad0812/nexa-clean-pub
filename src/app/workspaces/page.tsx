'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ProjectMetadata {
  name: string
  displayName: string
  description: string
  createdAt: string
  techStack: string[]
}

export default function WorkspacesPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [files, setFiles] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [serverRunning, setServerRunning] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const res = await fetch('/api/workspace/metadata')
      const data = await res.json()
      const projectsArray = Array.from(Object.entries(data.projects || {})).map(([_, meta]) => meta as ProjectMetadata)
      setProjects(projectsArray)
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
    setLoading(false)
  }

  const loadFiles = async (projectName: string) => {
    try {
      const res = await fetch(`/api/workspace/files?project=${projectName}`)
      const data = await res.json()
      setFiles(data.files || [])
    } catch (error) {
      console.error('Failed to load files:', error)
    }
  }

  const loadFileContent = async (projectName: string, filePath: string) => {
    try {
      const res = await fetch('/api/workspace/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: projectName, file: filePath }),
      })
      const data = await res.json()
      setFileContent(data.content || '')
    } catch (error) {
      console.error('Failed to load file:', error)
    }
  }

  const handleManage = (projectName: string) => {
    setSelectedProject(projectName)
    loadFiles(projectName)
  }

  const handleDownload = async (projectName: string) => {
    try {
      const res = await fetch(`/api/workspace/download?project=${projectName}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectName}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleRunServer = async (projectName: string) => {
    try {
      const res = await fetch('/api/workspace/dev-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: projectName,
          action: serverRunning[projectName] ? 'stop' : 'start',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setServerRunning((prev) => ({
          ...prev,
          [projectName]: !prev[projectName],
        }))
        alert(data.message)
      }
    } catch (error) {
      console.error('Server action failed:', error)
    }
  }

  const handleDelete = async (projectName: string) => {
    if (!confirm(`Are you sure you want to delete ${projectName}?`)) return

    try {
      const res = await fetch('/api/workspace/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: projectName }),
      })
      const data = await res.json()
      if (data.success) {
        alert('Project deleted successfully')
        loadProjects()
        if (selectedProject === projectName) {
          setSelectedProject(null)
          setFiles([])
        }
      }
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const getTechBadgeColor = (tech: string): string => {
    const lowerTech = tech.toLowerCase()
    if (lowerTech.includes('react') || lowerTech.includes('next')) return 'bg-cyan-500'
    if (lowerTech.includes('node') || lowerTech.includes('express')) return 'bg-green-500'
    if (lowerTech.includes('tailwind') || lowerTech.includes('css')) return 'bg-blue-400'
    if (lowerTech.includes('postgres') || lowerTech.includes('db')) return 'bg-indigo-500'
    if (lowerTech.includes('typescript') || lowerTech.includes('ts')) return 'bg-blue-600'
    return 'bg-gray-500'
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#002B2F]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#10F3FE]/30 border-t-[#10F3FE]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#002B2F] p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold text-white">My Workspaces</h1>
        <button
          onClick={() => router.push('/')}
          className="rounded-lg bg-[#10F3FE] px-6 py-2 font-semibold text-black transition hover:bg-[#10F3FE]/80"
        >
          Back to Chat
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-white/20 bg-black/20 p-12 text-center backdrop-blur-sm">
          <p className="mb-4 text-xl text-white/70">No projects yet</p>
          <button
            onClick={() => router.push('/')}
            className="rounded-lg bg-[#10F3FE] px-6 py-3 font-semibold text-black transition hover:bg-[#10F3FE]/80"
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.name}
              className="group relative overflow-hidden rounded-lg border border-[#10F3FE]/30 bg-gradient-to-br from-black/40 to-black/20 p-6 backdrop-blur-sm transition hover:border-[#10F3FE] hover:shadow-lg hover:shadow-[#10F3FE]/20"
            >
              <div className="mb-4">
                <h2 className="mb-2 text-2xl font-bold text-white">{project.displayName}</h2>
                <p className="text-sm text-white/60">{project.description || 'No description'}</p>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${getTechBadgeColor(tech)}`}
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <div className="mb-4 text-xs text-white/50">
                Created: {new Date(project.createdAt).toLocaleDateString()}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleManage(project.name)}
                  className="flex-1 rounded-lg bg-[#10F3FE] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#10F3FE]/80"
                >
                  Manage
                </button>
                <button
                  onClick={() => handleDownload(project.name)}
                  className="flex-1 rounded-lg border border-[#10F3FE] px-4 py-2 text-sm font-semibold text-[#10F3FE] transition hover:bg-[#10F3FE]/10"
                >
                  Download
                </button>
                <button
                  onClick={() => handleRunServer(project.name)}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    serverRunning[project.name]
                      ? 'border border-red-500 text-red-500 hover:bg-red-500/10'
                      : 'border border-green-500 text-green-500 hover:bg-green-500/10'
                  }`}
                >
                  {serverRunning[project.name] ? 'Stop' : 'Run'}
                </button>
              </div>

              <button
                onClick={() => handleDelete(project.name)}
                className="absolute right-2 top-2 rounded bg-red-500/20 px-2 py-1 text-xs text-red-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/30"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-8 backdrop-blur-sm">
          <div className="flex h-[80vh] w-full max-w-6xl overflow-hidden rounded-lg border border-[#10F3FE]/30 bg-[#002B2F]">
            <div className="w-1/3 overflow-y-auto border-r border-white/20 bg-black/20 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Files</h3>
                <button
                  onClick={() => {
                    setSelectedProject(null)
                    setFiles([])
                    setSelectedFile(null)
                  }}
                  className="text-white/70 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-1">
                {files.map((file) => (
                  <button
                    key={file}
                    onClick={() => {
                      setSelectedFile(file)
                      loadFileContent(selectedProject, file)
                    }}
                    className={`w-full rounded px-3 py-2 text-left text-sm transition ${
                      selectedFile === file
                        ? 'bg-[#10F3FE]/20 text-[#10F3FE]'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {file}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {selectedFile ? (
                <div className="flex h-full flex-col">
                  <div className="border-b border-white/20 bg-black/20 px-4 py-3">
                    <h4 className="font-mono text-sm text-white">{selectedFile}</h4>
                  </div>
                  <div className="flex-1 overflow-auto bg-[#001a1f] p-4">
                    <pre className="text-sm text-white/90">
                      <code>{fileContent}</code>
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-white/50">
                  Select a file to view
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
