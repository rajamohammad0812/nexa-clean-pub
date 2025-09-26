'use client'
import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'

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

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const FRAMEWORKS = [
  { value: 'NEXTJS', label: 'Next.js' },
  { value: 'REACT', label: 'React' },
  { value: 'VUE', label: 'Vue.js' },
  { value: 'ANGULAR', label: 'Angular' },
  { value: 'SVELTE', label: 'Svelte' },
  { value: 'NODEJS', label: 'Node.js' },
  { value: 'PYTHON', label: 'Python' },
  { value: 'GOLANG', label: 'Go' },
  { value: 'RUST', label: 'Rust' },
  { value: 'DOCKER', label: 'Docker' },
]

export default function CreateProjectModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    repository: '',
    framework: 'NEXTJS',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          repository: formData.repository || undefined,
          description: formData.description || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Reset form
        setFormData({
          name: '',
          description: '',
          repository: '',
          framework: 'NEXTJS',
        })
        onSuccess()
        onClose()
      } else {
        if (data.details && Array.isArray(data.details)) {
          // Handle Zod validation errors
          const errorMap: Record<string, string> = {}
          data.details.forEach((error: { path?: string[]; message: string }) => {
            if (error.path && error.path[0]) {
              errorMap[error.path[0]] = error.message
            }
          })
          setErrors(errorMap)
        } else {
          setErrors({ general: data.error || 'Failed to create project' })
        }
      }
    } catch (error) {
      console.error('Error creating project:', error)
      setErrors({ general: 'Failed to create project. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <CutoutShell className="w-full max-w-md">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#10F3FE]">Create New Project</h2>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-cyan-300 transition-colors hover:text-[#10F3FE] disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* General Error */}
            {errors.general && (
              <div className="rounded border border-red-500/30 bg-red-500/20 p-3 text-sm text-red-300">
                {errors.general}
              </div>
            )}

            {/* Project Name */}
            <div className="space-y-2">
              <label htmlFor="project-name" className="text-sm font-medium text-cyan-100">
                Project Name *
              </label>
              <input
                id="project-name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full rounded-lg border border-[#10F3FE]/30 bg-[#002B2F] px-4 py-3 text-base text-white placeholder-gray-400 transition-colors focus:border-[#10F3FE] focus:outline-none focus:ring-1 focus:ring-[#10F3FE]/50"
                placeholder="My Awesome Project"
                disabled={isLoading}
                required
              />
              {errors.name && <p className="text-xs text-red-300">{errors.name}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="project-description" className="text-sm font-medium text-cyan-100">
                Description
              </label>
              <textarea
                id="project-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-[#10F3FE]/30 bg-[#002B2F] px-4 py-3 text-base text-white placeholder-gray-400 transition-colors focus:border-[#10F3FE] focus:outline-none focus:ring-1 focus:ring-[#10F3FE]/50"
                placeholder="Brief description of your project..."
                disabled={isLoading}
              />
              {errors.description && <p className="text-xs text-red-300">{errors.description}</p>}
            </div>

            {/* Repository URL */}
            <div className="space-y-2">
              <label htmlFor="project-repository" className="text-sm font-medium text-cyan-100">
                Repository URL
              </label>
              <input
                id="project-repository"
                type="url"
                value={formData.repository}
                onChange={(e) => handleInputChange('repository', e.target.value)}
                className="w-full rounded-lg border border-[#10F3FE]/30 bg-[#002B2F] px-4 py-3 text-base text-white placeholder-gray-400 transition-colors focus:border-[#10F3FE] focus:outline-none focus:ring-1 focus:ring-[#10F3FE]/50"
                placeholder="https://github.com/username/repo"
                disabled={isLoading}
              />
              {errors.repository && <p className="text-xs text-red-300">{errors.repository}</p>}
            </div>

            {/* Framework */}
            <div className="space-y-2">
              <label htmlFor="project-framework" className="text-sm font-medium text-cyan-100">
                Framework *
              </label>
              <select
                id="project-framework"
                value={formData.framework}
                onChange={(e) => handleInputChange('framework', e.target.value)}
                className="w-full rounded-lg border border-[#10F3FE]/30 bg-[#002B2F] px-4 py-3 text-base text-white transition-colors focus:border-[#10F3FE] focus:outline-none focus:ring-1 focus:ring-[#10F3FE]/50"
                disabled={isLoading}
                required
              >
                {FRAMEWORKS.map((framework) => (
                  <option key={framework.value} value={framework.value} className="bg-[#002B2F]">
                    {framework.label}
                  </option>
                ))}
              </select>
              {errors.framework && <p className="text-xs text-red-300">{errors.framework}</p>}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 rounded-lg border border-gray-500 px-4 py-3 text-gray-300 transition-colors hover:bg-gray-500/20 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.name.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#10F3FE] px-4 py-3 font-medium text-black transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </CutoutShell>
    </div>
  )
}
