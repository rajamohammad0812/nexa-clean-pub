"use client"
import { useState, useEffect } from 'react'
import { Bot, Calendar, Code2, Trash2, Folder, AlertCircle } from 'lucide-react'

// Reusable CutoutShell component
const CLIP = "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)"

function CutoutShell({
  clip = CLIP,
  className = "",
  innerClassName = "",
  children,
}: {
  clip?: string
  className?: string
  innerClassName?: string
  children?: React.ReactNode
}) {
  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#6FDBFF_0%,#E5F9FF_50%,#6FDBFF_75%,#E5F9FF_100%)]"
        style={{ clipPath: clip }}
      />
      <div
        className={`relative bg-[#05181E] ${innerClassName}`}
        style={{
          clipPath: clip,
          transform: 'translate(2px, 2px)',
          width: 'calc(100% - 4px)',
          height: 'calc(100% - 4px)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

interface AIProject {
  id: string
  name: string
  description?: string
  projectType: string
  complexity: string
  confidence: number
  userPrompt: string
  keyFeatures: { name: string; description?: string }[]
  techStack: string[]
  estimatedWeeks?: number
  templateId: string
  templateName: string
  status: 'GENERATING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
  projectPath?: string
  errorMessage?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

interface AIProjectsDashboardProps {
  className?: string
  limit?: number
}

export default function AIProjectsDashboard({ className = "", limit = 10 }: AIProjectsDashboardProps) {
  const [projects, setProjects] = useState<AIProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAIProjects()
  }, [limit])

  const fetchAIProjects = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/ai-projects?limit=${limit}`)
      const data = await response.json()

      if (data.success) {
        setProjects(data.aiProjects)
        setError(null)
      } else {
        setError(data.error || 'Failed to load AI projects')
      }
    } catch (err) {
      console.error('Error fetching AI projects:', err)
      setError('Network error while loading projects')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this AI project?')) {
      return
    }

    try {
      const response = await fetch(`/api/ai-projects/${projectId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setProjects(prev => prev.filter(p => p.id !== projectId))
      } else {
        alert('Failed to delete project')
      }
    } catch (err) {
      console.error('Error deleting project:', err)
      alert('Error deleting project')
    }
  }

  const getStatusColor = (status: AIProject['status']) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'FAILED':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'GENERATING':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'CANCELLED':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'LOW':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'HIGH':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <CutoutShell>
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin w-8 h-8 border-2 border-[#10F3FE]/30 border-t-[#10F3FE] rounded-full mb-4"></div>
            <p className="text-cyan-200">Loading AI projects...</p>
          </div>
        </CutoutShell>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <CutoutShell>
          <div className="flex flex-col items-center justify-center p-8">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-red-300 text-center mb-4">{error}</p>
            <button
              onClick={fetchAIProjects}
              className="px-4 py-2 bg-[#10F3FE] text-black rounded-lg hover:bg-cyan-300 transition-colors"
            >
              Try Again
            </button>
          </div>
        </CutoutShell>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Bot className="w-6 h-6 text-[#10F3FE]" />
          <h2 className="text-xl font-bold text-white">AI Generated Projects</h2>
        </div>
        <p className="text-sm text-cyan-200/80">
          Projects generated by your AI development partner
        </p>
      </div>

      {projects.length === 0 ? (
        <CutoutShell>
          <div className="flex flex-col items-center justify-center p-8">
            <Bot className="w-16 h-16 text-[#10F3FE]/20 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No AI Projects Yet</h3>
            <p className="text-cyan-200/80 text-center mb-6">
              Start a conversation with the AI to generate your first project
            </p>
            <a
              href="/"
              className="px-6 py-3 bg-[#10F3FE] text-black rounded-lg font-medium hover:bg-cyan-300 transition-colors"
            >
              Start Creating
            </a>
          </div>
        </CutoutShell>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <CutoutShell key={project.id} className="h-fit">
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg truncate">
                      {project.name}
                    </h3>
                    <p className="text-sm text-cyan-300 mt-1">
                      {project.projectType}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="text-red-400 hover:text-red-300 transition-colors p-1"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Status and Complexity */}
                <div className="flex items-center gap-2">
                  <span className={`rounded border px-2 py-1 text-xs ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  <span className={`rounded border px-2 py-1 text-xs ${getComplexityColor(project.complexity)}`}>
                    {project.complexity}
                  </span>
                  <span className="text-xs text-cyan-400">
                    {Math.round(project.confidence * 100)}% match
                  </span>
                </div>

                {/* Description */}
                {project.description && (
                  <p className="text-sm text-cyan-200/80 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* User Prompt */}
                <div className="bg-black/20 rounded p-3 border-l-2 border-[#10F3FE]/50">
                  <p className="text-xs text-cyan-200/60 mb-1">Original Request:</p>
                  <p className="text-sm text-white line-clamp-2">
                    &ldquo;{project.userPrompt}&rdquo;
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-sm font-semibold text-[#10F3FE]">
                      {project.keyFeatures?.length || 0}
                    </div>
                    <div className="text-xs text-cyan-200/80">Features</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#10F3FE]">
                      {project.estimatedWeeks || '?'}w
                    </div>
                    <div className="text-xs text-cyan-200/80">Timeline</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#10F3FE]">
                      {project.techStack?.length || 0}
                    </div>
                    <div className="text-xs text-cyan-200/80">Technologies</div>
                  </div>
                </div>

                {/* Template */}
                <div className="flex items-center gap-2 text-sm">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-200/80">Template:</span>
                  <span className="text-white">{project.templateName}</span>
                </div>

                {/* Error Message */}
                {project.status === 'FAILED' && project.errorMessage && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
                    <p className="text-xs text-red-300">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      {project.errorMessage}
                    </p>
                  </div>
                )}

                {/* Actions and Timestamps */}
                <div className="flex items-center justify-between text-xs border-t border-cyan-500/20 pt-3">
                  <div className="flex items-center gap-1 text-cyan-200/60">
                    <Calendar className="w-3 h-3" />
                    {formatDate(project.createdAt)}
                  </div>
                  <div className="flex items-center gap-2">
                    {project.projectPath && project.status === 'SUCCESS' && (
                      <button
                        onClick={() => {
                          // Could open project in file explorer or IDE
                          navigator.clipboard.writeText(project.projectPath!)
                          alert('Project path copied to clipboard!')
                        }}
                        className="text-cyan-300 hover:text-[#10F3FE] transition-colors"
                        title="Copy project path"
                      >
                        <Folder className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </CutoutShell>
          ))}
        </div>
      )}
    </div>
  )
}