'use client'
import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  Shield,
  Star,
  GitFork,
  Activity,
  Code,
  Bug,
  CheckCircle,
} from 'lucide-react'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'

// Types for GitHub data
interface SecurityAlert {
  id: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  created_at: string
  state: 'open' | 'dismissed' | 'fixed'
}

interface RepoStats {
  name: string
  full_name: string
  description: string
  language: string
  stars: number
  forks: number
  watchers: number
  open_issues: number
  size: number
  created_at: string
  updated_at: string
  license?: string
  topics: string[]
}

interface CodeQLAlert {
  id: number
  rule: {
    id: string
    severity: string
    description: string
  }
  message: {
    text: string
  }
  state: 'open' | 'dismissed' | 'fixed'
  created_at: string
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

// Severity badge component
function SeverityBadge({ severity }: { severity: string }) {
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'high':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'low':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  return (
    <span className={`rounded border px-2 py-1 text-xs ${getSeverityColor(severity)}`}>
      {severity.toUpperCase()}
    </span>
  )
}

export default function AnalyticsPage() {
  const [repoStats, setRepoStats] = useState<RepoStats | null>(null)
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([])
  const [codeqlAlerts, setCodeqlAlerts] = useState<CodeQLAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRepo, setSelectedRepo] = useState<string>('octocat/Hello-World')

  // Fetch data from GitHub API
  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedRepo, fetchAnalyticsData])

  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/analytics/github?repo=${encodeURIComponent(selectedRepo)}`)
      const data = await response.json()

      if (data.success) {
        const { repository, security_alerts, code_scanning_alerts } = data.data

        setRepoStats({
          name: repository.name,
          full_name: repository.full_name,
          description: repository.description,
          language: repository.language,
          stars: repository.stars,
          forks: repository.forks,
          watchers: repository.watchers,
          open_issues: repository.open_issues,
          size: repository.size,
          created_at: repository.created_at,
          updated_at: repository.updated_at,
          license: repository.license,
          topics: repository.topics,
        })

        setSecurityAlerts(security_alerts)
        setCodeqlAlerts(code_scanning_alerts)
      } else {
        setError('Failed to load analytics data')
      }
    } catch (err) {
      setError('Failed to load analytics data')
      console.error('Error fetching analytics:', err)
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

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <AuthenticatedLayout>
      <div className="flex h-full flex-col overflow-hidden text-cyan-100">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#10F3FE]">Analytics</h1>
            <p className="text-sm text-cyan-200/80">
              Repository insights, security alerts, and code quality metrics
            </p>
          </div>
          <CutoutShell className="h-[45px]">
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="h-full border-none bg-transparent px-4 text-white focus:outline-none"
            >
              <option value="octocat/Hello-World" className="bg-[#05181E]">
                octocat/Hello-World
              </option>
              <option value="microsoft/vscode" className="bg-[#05181E]">
                microsoft/vscode
              </option>
              <option value="facebook/react" className="bg-[#05181E]">
                facebook/react
              </option>
            </select>
          </CutoutShell>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#10F3FE] border-t-transparent" />
              <p className="mt-4 text-cyan-200">Loading analytics...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <p className="text-red-300">{error}</p>
              <button
                onClick={fetchAnalyticsData}
                className="mt-4 rounded bg-[#10F3FE] px-4 py-2 text-black transition-colors hover:bg-cyan-300"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && repoStats && (
          <div className="flex-1 space-y-6 overflow-y-auto">
            {/* Repository Overview */}
            <CutoutShell>
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{repoStats.full_name}</h2>
                    <p className="mt-1 text-cyan-200/80">{repoStats.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#10F3FE]/20 px-3 py-1 text-sm text-[#10F3FE]">
                      {repoStats.language}
                    </span>
                    {repoStats.license && (
                      <span className="rounded-full bg-gray-500/20 px-3 py-1 text-sm text-gray-300">
                        {repoStats.license}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <div className="mb-2 flex items-center justify-center">
                      <Star className="h-5 w-5 text-[#10F3FE]" />
                    </div>
                    <div className="text-2xl font-bold text-[#10F3FE]">
                      {repoStats.stars.toLocaleString()}
                    </div>
                    <div className="text-xs text-cyan-200/80">Stars</div>
                  </div>
                  <div className="text-center">
                    <div className="mb-2 flex items-center justify-center">
                      <GitFork className="h-5 w-5 text-[#10F3FE]" />
                    </div>
                    <div className="text-2xl font-bold text-[#10F3FE]">
                      {repoStats.forks.toLocaleString()}
                    </div>
                    <div className="text-xs text-cyan-200/80">Forks</div>
                  </div>
                  <div className="text-center">
                    <div className="mb-2 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-orange-400" />
                    </div>
                    <div className="text-2xl font-bold text-orange-400">
                      {repoStats.open_issues}
                    </div>
                    <div className="text-xs text-cyan-200/80">Open Issues</div>
                  </div>
                  <div className="text-center">
                    <div className="mb-2 flex items-center justify-center">
                      <Code className="h-5 w-5 text-[#10F3FE]" />
                    </div>
                    <div className="text-2xl font-bold text-[#10F3FE]">
                      {formatBytes(repoStats.size * 1024)}
                    </div>
                    <div className="text-xs text-cyan-200/80">Size</div>
                  </div>
                </div>

                {/* Topics */}
                {repoStats.topics.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 text-sm font-medium text-cyan-200">Topics</div>
                    <div className="flex flex-wrap gap-2">
                      {repoStats.topics.map((topic, index) => (
                        <span
                          key={index}
                          className="rounded bg-cyan-500/20 px-2 py-1 text-xs text-cyan-300"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CutoutShell>

            {/* Security Alerts */}
            <CutoutShell>
              <div className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-400" />
                  <h2 className="text-xl font-semibold text-white">Security Alerts</h2>
                  <span className="rounded bg-red-500/20 px-2 py-1 text-sm text-red-300">
                    {securityAlerts.filter((alert) => alert.state === 'open').length} Open
                  </span>
                </div>

                <div className="space-y-3">
                  {securityAlerts.map((alert) => (
                    <div key={alert.id} className="rounded-lg border border-cyan-500/20 p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <SeverityBadge severity={alert.severity} />
                          {alert.state === 'open' ? (
                            <AlertTriangle className="h-4 w-4 text-orange-400" />
                          ) : alert.state === 'fixed' ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <Bug className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <span className="text-xs text-cyan-200/60">
                          {formatDate(alert.created_at)}
                        </span>
                      </div>
                      <h3 className="mb-1 font-medium text-white">{alert.title}</h3>
                      <p className="text-sm text-cyan-200/80">{alert.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CutoutShell>

            {/* Code Quality */}
            <CutoutShell>
              <div className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#10F3FE]" />
                  <h2 className="text-xl font-semibold text-white">Code Quality</h2>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* CodeQL Alerts */}
                  <div>
                    <h3 className="mb-3 text-lg font-medium text-cyan-200">CodeQL Analysis</h3>
                    <div className="space-y-2">
                      {codeqlAlerts.map((alert) => (
                        <div key={alert.id} className="rounded border border-cyan-500/10 p-3">
                          <div className="mb-1 flex items-center justify-between">
                            <SeverityBadge severity={alert.rule.severity} />
                            <span className="text-xs text-cyan-200/60">
                              {formatDate(alert.created_at)}
                            </span>
                          </div>
                          <div className="mb-1 text-sm text-white">{alert.rule.description}</div>
                          <div className="text-xs text-cyan-200/80">{alert.message.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Repository Health */}
                  <div>
                    <h3 className="mb-3 text-lg font-medium text-cyan-200">Repository Health</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-cyan-200">Last Updated</span>
                        <span className="text-sm text-white">
                          {formatDate(repoStats.updated_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-cyan-200">Created</span>
                        <span className="text-sm text-white">
                          {formatDate(repoStats.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-cyan-200">Watchers</span>
                        <span className="text-sm text-white">{repoStats.watchers}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-cyan-200">Open Issues</span>
                        <span className="text-sm text-white">{repoStats.open_issues}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CutoutShell>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  )
}
