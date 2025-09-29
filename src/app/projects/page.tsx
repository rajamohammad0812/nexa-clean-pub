'use client'
import { useState, useEffect } from 'react'
import { Plus, Settings, GitBranch, Activity, Clock, ExternalLink } from 'lucide-react'
import CreateProjectModal from '@/components/projects/CreateProjectModal'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'

// Define types for our data
interface Environment {
  id: string
  name: string
  type: string
  cloudProvider: string
}

interface Workflow {
  id: string
  name: string
  status: string
  isActive: boolean
}

interface Deployment {
  id: string
  status: string
  createdAt: string
}

interface Project {
  id: string
  name: string
  description: string | null
  repository: string | null
  framework: string
  status: string
  createdAt: string
  updatedAt: string
  environments: Environment[]
  workflows: Workflow[]
  deployments: Deployment[]
  _count: {
    workflows: number
    deployments: number
    environments: number
  }
}

// Reusable CutoutShell component
const CLIP =
  'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)'

function CutoutShell({
  clip = CLIP,
  className = '',
  innerClassName = '',
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

// Status badge component
function StatusBadge({
  status,
  variant = 'project',
}: {
  status: string
  variant?: 'project' | 'deployment' | 'workflow'
}) {
  const getStatusColor = (status: string, variant: string) => {
    if (variant === 'deployment') {
      switch (status) {
        case 'SUCCESS':
          return 'bg-green-500/20 text-green-300 border-green-500/30'
        case 'FAILED':
          return 'bg-red-500/20 text-red-300 border-red-500/30'
        case 'BUILDING':
        case 'DEPLOYING':
          return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
        case 'PENDING':
          return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
        default:
          return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      }
    }
    if (variant === 'workflow') {
      switch (status) {
        case 'ACTIVE':
          return 'bg-green-500/20 text-green-300 border-green-500/30'
        case 'DRAFT':
          return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
        case 'PAUSED':
          return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
        default:
          return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      }
    }
    // Project status
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'DRAFT':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      case 'PAUSED':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'ARCHIVED':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  return (
    <span className={`rounded border px-2 py-1 text-xs ${getStatusColor(status, variant)}`}>
      {status}
    </span>
  )
}

// Framework icon/badge component
function FrameworkBadge({ framework }: { framework: string }) {
  const getFrameworkColor = (framework: string) => {
    switch (framework) {
      case 'NEXTJS':
        return 'bg-black text-white border-gray-600'
      case 'REACT':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'VUE':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'ANGULAR':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'SVELTE':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      case 'NODEJS':
        return 'bg-green-600/20 text-green-400 border-green-600/30'
      case 'PYTHON':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  return (
    <span className={`rounded border px-2 py-1 text-xs ${getFrameworkColor(framework)}`}>
      {framework}
    </span>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Load projects on component mount
  useEffect(() => {
    console.log('ProjectsPage: useEffect running')
    console.log('ProjectsPage: current loading state:', isLoading)
    fetchProjects()
  }, [])

  // Debug component state
  useEffect(() => {
    console.log(
      'ProjectsPage: State changed - loading:',
      isLoading,
      'error:',
      error,
      'projects count:',
      projects.length,
    )
  }, [isLoading, error, projects])

  const fetchProjects = async () => {
    try {
      console.log('Fetching projects...')
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch('/api/projects', {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      clearTimeout(timeoutId)
      console.log('Response status:', response.status)

      const data = await response.json()
      console.log('Response data:', data)

      if (data.success) {
        setProjects(data.projects)
        console.log('Projects loaded successfully:', data.projects.length, 'projects')
      } else {
        setError('Failed to load projects: ' + (data.error || 'Unknown error'))
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Request timeout: Failed to load projects (server might be slow)')
        } else {
          setError('Network error: ' + err.message)
        }
      } else {
        setError('Network error: Failed to load projects')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const clipPath =
    'polygon(0 0, calc(100% - 25px) 0, 100% 25px, 100% 100%, 25px 100%, 0 calc(100% - 25px))'

  return (
    <AuthenticatedLayout>
      {/* Main content container with futuristic outline */}
      <div className="relative h-full">
        {/* Outer cyan border */}
        <div className="absolute inset-0 bg-[#10F3FE]" style={{ clipPath }} />

        {/* Inner dark container */}
        <div
          className="relative h-full bg-[#002B2F]"
          style={{
            clipPath,
            transform: 'translate(2px, 2px)',
            width: 'calc(100% - 4px)',
            height: 'calc(100% - 4px)',
          }}
        >
          <div className="flex h-full flex-col overflow-hidden p-6 text-cyan-100">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#10F3FE]">Projects</h1>
                <p className="text-sm text-cyan-200/80">
                  Manage your automation projects and deployments
                </p>
              </div>
              <CutoutShell className="h-[45px]">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex h-full items-center gap-2 px-4 text-white transition-colors hover:text-[#10F3FE]"
                >
                  <Plus className="h-4 w-4" />
                  New Project
                </button>
              </CutoutShell>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#10F3FE] border-t-transparent" />
                  <p className="mt-4 text-cyan-200">Loading projects...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                  <p className="text-red-300">{error}</p>
                  <button
                    onClick={fetchProjects}
                    className="mt-4 rounded bg-[#10F3FE] px-4 py-2 text-black transition-colors hover:bg-cyan-300"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Projects Grid */}
            {!isLoading && !error && (
              <div className="flex-1 overflow-hidden">
                {projects.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center">
                    <div className="text-center">
                      <div className="mb-4 text-6xl text-[#10F3FE]/20">⚡</div>
                      <h3 className="mb-2 text-xl font-semibold text-white">No projects yet</h3>
                      <p className="mb-6 text-cyan-200/80">
                        Create your first automation project to get started
                      </p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="rounded-lg bg-[#10F3FE] px-6 py-3 font-medium text-black transition-colors hover:bg-cyan-300"
                      >
                        Create First Project
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid h-full grid-cols-1 gap-6 overflow-y-auto pb-6 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                      <CutoutShell key={project.id} className="h-fit">
                        <div className="space-y-4 p-6">
                          {/* Project Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="truncate text-lg font-semibold text-white">
                                {project.name}
                              </h3>
                              {project.description && (
                                <p className="mt-1 line-clamp-2 text-sm text-cyan-200/80">
                                  {project.description}
                                </p>
                              )}
                            </div>
                            <button className="text-cyan-300 transition-colors hover:text-[#10F3FE]">
                              <Settings className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Status and Framework */}
                          <div className="flex items-center gap-2">
                            <StatusBadge status={project.status} />
                            <FrameworkBadge framework={project.framework} />
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-lg font-semibold text-[#10F3FE]">
                                {project._count.deployments}
                              </div>
                              <div className="text-xs text-cyan-200/80">Deployments</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-[#10F3FE]">
                                {project._count.workflows}
                              </div>
                              <div className="text-xs text-cyan-200/80">Workflows</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-[#10F3FE]">
                                {project._count.environments}
                              </div>
                              <div className="text-xs text-cyan-200/80">Environments</div>
                            </div>
                          </div>

                          {/* Recent Activity */}
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-cyan-200">Recent Activity</div>
                            {project.deployments.length > 0 ? (
                              <div className="space-y-1">
                                {project.deployments.slice(0, 2).map((deployment) => (
                                  <div
                                    key={deployment.id}
                                    className="flex items-center justify-between text-xs"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Activity className="h-3 w-3 text-cyan-400" />
                                      <span>Deployment</span>
                                      <StatusBadge
                                        status={deployment.status}
                                        variant="deployment"
                                      />
                                    </div>
                                    <span className="text-cyan-200/60">
                                      {formatDate(deployment.createdAt)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-cyan-200/60">No recent activity</div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between border-t border-cyan-500/20 pt-2">
                            <div className="flex items-center gap-1 text-xs text-cyan-200/80">
                              <Clock className="h-3 w-3" />
                              Updated {formatDate(project.updatedAt)}
                            </div>
                            <div className="flex items-center gap-2">
                              {project.repository && (
                                <button className="text-cyan-300 transition-colors hover:text-[#10F3FE]">
                                  <GitBranch className="h-4 w-4" />
                                </button>
                              )}
                              <button className="text-cyan-300 transition-colors hover:text-[#10F3FE]">
                                <ExternalLink className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </CutoutShell>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Create Project Modal */}
          <CreateProjectModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={fetchProjects}
          />
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
