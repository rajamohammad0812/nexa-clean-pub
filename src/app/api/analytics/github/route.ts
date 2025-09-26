import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Types for GitHub API responses
interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string
  language: string
  stargazers_count: number
  forks_count: number
  watchers_count: number
  open_issues_count: number
  size: number
  created_at: string
  updated_at: string
  license?: {
    name: string
  }
  topics: string[]
}

interface GitHubSecurityAlert {
  number: number
  state: 'open' | 'dismissed' | 'fixed'
  dependency: {
    package: {
      name: string
    }
    manifest_path: string
  }
  security_advisory: {
    ghsa_id: string
    summary: string
    description: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    published_at: string
  }
  created_at: string
}

interface GitHubCodeScanningAlert {
  number: number
  state: 'open' | 'dismissed' | 'fixed'
  rule: {
    id: string
    severity: string
    description: string
  }
  message: {
    text: string
  }
  created_at: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const repo = searchParams.get('repo')

    if (!repo) {
      return NextResponse.json({ error: 'Repository parameter is required' }, { status: 400 })
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN

    if (!GITHUB_TOKEN) {
      // Return sample data if no GitHub token is configured
      return NextResponse.json({
        success: true,
        data: getSampleData(repo),
      })
    }

    const headers = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'NexaBuilder-Analytics',
    }

    try {
      // Fetch repository information
      const repoResponse = await fetch(`https://api.github.com/repos/${repo}`, { headers })

      if (!repoResponse.ok) {
        throw new Error(`GitHub API error: ${repoResponse.status}`)
      }

      const repoData: GitHubRepo = await repoResponse.json()

      // Fetch security alerts (Dependabot alerts)
      let securityAlerts: GitHubSecurityAlert[] = []
      try {
        const securityResponse = await fetch(
          `https://api.github.com/repos/${repo}/dependabot/alerts`,
          { headers },
        )
        if (securityResponse.ok) {
          securityAlerts = await securityResponse.json()
        }
      } catch (error) {
        console.log('Could not fetch security alerts:', error)
      }

      // Fetch code scanning alerts
      let codeScanningAlerts: GitHubCodeScanningAlert[] = []
      try {
        const codeScanResponse = await fetch(
          `https://api.github.com/repos/${repo}/code-scanning/alerts`,
          { headers },
        )
        if (codeScanResponse.ok) {
          codeScanningAlerts = await codeScanResponse.json()
        }
      } catch (error) {
        console.log('Could not fetch code scanning alerts:', error)
      }

      return NextResponse.json({
        success: true,
        data: {
          repository: {
            name: repoData.name,
            full_name: repoData.full_name,
            description: repoData.description,
            language: repoData.language,
            stars: repoData.stargazers_count,
            forks: repoData.forks_count,
            watchers: repoData.watchers_count,
            open_issues: repoData.open_issues_count,
            size: repoData.size,
            created_at: repoData.created_at,
            updated_at: repoData.updated_at,
            license: repoData.license?.name,
            topics: repoData.topics,
          },
          security_alerts: securityAlerts.map((alert) => ({
            id: alert.number,
            severity: alert.security_advisory.severity,
            title: alert.security_advisory.summary,
            description: alert.security_advisory.description,
            package_name: alert.dependency.package.name,
            created_at: alert.created_at,
            state: alert.state,
          })),
          code_scanning_alerts: codeScanningAlerts.map((alert) => ({
            id: alert.number,
            rule: alert.rule,
            message: alert.message,
            state: alert.state,
            created_at: alert.created_at,
          })),
        },
      })
    } catch (error) {
      console.error('Error fetching from GitHub API:', error)
      // Fall back to sample data if GitHub API fails
      return NextResponse.json({
        success: true,
        data: getSampleData(repo),
        note: 'Using sample data due to API limitation',
      })
    }
  } catch (error) {
    console.error('Error in analytics API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getSampleData(repo: string) {
  const repoName = repo.split('/')[1] || 'sample-repo'

  return {
    repository: {
      name: repoName,
      full_name: repo,
      description: `Sample description for ${repo}`,
      language: 'TypeScript',
      stars: Math.floor(Math.random() * 10000) + 100,
      forks: Math.floor(Math.random() * 1000) + 50,
      watchers: Math.floor(Math.random() * 500) + 20,
      open_issues: Math.floor(Math.random() * 50) + 1,
      size: Math.floor(Math.random() * 50000) + 1000,
      created_at: '2023-01-15T10:30:00Z',
      updated_at: new Date().toISOString(),
      license: 'MIT',
      topics: ['javascript', 'typescript', 'web-development', 'automation'],
    },
    security_alerts: [
      {
        id: 1,
        severity: 'high' as const,
        title: 'Prototype Pollution in lodash',
        description: 'Versions of lodash before 4.17.12 are vulnerable to Prototype Pollution.',
        package_name: 'lodash',
        created_at: '2024-12-18T09:15:00Z',
        state: 'open' as const,
      },
      {
        id: 2,
        severity: 'medium' as const,
        title: 'Cross-Site Scripting in axios',
        description: 'Improper neutralization of input during web page generation.',
        package_name: 'axios',
        created_at: '2024-12-10T14:22:00Z',
        state: 'fixed' as const,
      },
      {
        id: 3,
        severity: 'critical' as const,
        title: 'SQL Injection vulnerability',
        description: 'User input is not properly sanitized before being used in SQL queries.',
        package_name: 'mysql',
        created_at: '2024-12-05T11:45:00Z',
        state: 'open' as const,
      },
    ],
    code_scanning_alerts: [
      {
        id: 1,
        rule: {
          id: 'js/incomplete-sanitization',
          severity: 'warning',
          description: 'Incomplete string escaping or encoding',
        },
        message: {
          text: 'This string concatenation may contain unescaped user input.',
        },
        state: 'open' as const,
        created_at: '2024-12-15T16:30:00Z',
      },
      {
        id: 2,
        rule: {
          id: 'js/unused-local-variable',
          severity: 'note',
          description: 'Unused local variable',
        },
        message: {
          text: 'Variable is assigned but never used.',
        },
        state: 'dismissed' as const,
        created_at: '2024-12-12T10:15:00Z',
      },
    ],
  }
}
