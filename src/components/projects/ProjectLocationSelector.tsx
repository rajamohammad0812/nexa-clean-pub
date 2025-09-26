'use client'
import { useState, useEffect } from 'react'
import { ChevronDownIcon, FolderIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ProjectLocationSelectorProps {
  selectedPath: string
  onPathChange: (path: string) => void
  projectName?: string
}

interface ProjectConfig {
  baseDirectory: string
  allowCustomPath: boolean
  defaultProjectsPath: string
}

interface ValidationResult {
  isValid: boolean
  error?: string
  resolvedPath?: string
}

export default function ProjectLocationSelector({ 
  selectedPath, 
  onPathChange, 
  projectName = 'your-project' 
}: ProjectLocationSelectorProps) {
  const [config, setConfig] = useState<ProjectConfig | null>(null)
  const [suggestedLocations, setSuggestedLocations] = useState<string[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [customPath, setCustomPath] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  useEffect(() => {
    if (isCustom && customPath) {
      validateCustomPath(customPath)
    }
  }, [customPath, isCustom])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/projects/config')
      const data = await response.json()
      
      if (data.success) {
        setConfig(data.config)
        setSuggestedLocations(data.suggestedLocations)
        
        // Set default path if none selected
        if (!selectedPath) {
          onPathChange(data.config.defaultProjectsPath)
        }
      }
    } catch (error) {
      console.error('Error fetching project config:', error)
    }
  }

  const validateCustomPath = async (path: string) => {
    if (!path.trim()) {
      setValidation(null)
      return
    }

    setIsValidating(true)
    try {
      const response = await fetch('/api/projects/config/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setValidation(data.validation)
      }
    } catch (error) {
      console.error('Error validating path:', error)
      setValidation({
        isValid: false,
        error: 'Failed to validate path'
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleLocationSelect = (location: string) => {
    setIsCustom(false)
    setCustomPath('')
    setValidation(null)
    onPathChange(location)
    setIsDropdownOpen(false)
  }

  const handleCustomPathChange = (path: string) => {
    setCustomPath(path)
    if (validation?.isValid) {
      onPathChange(path)
    }
  }

  const toggleCustomPath = () => {
    setIsCustom(!isCustom)
    if (!isCustom) {
      setCustomPath('')
      setValidation(null)
      // Reset to default location
      if (config) {
        onPathChange(config.defaultProjectsPath)
      }
    }
  }

  const getFullProjectPath = (basePath: string) => {
    return `${basePath}/${projectName}`
  }

  if (!config) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          📁 Project Location
        </label>
        
        {!isCustom ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="relative w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <span className="flex items-center">
                <FolderIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="block truncate">{selectedPath}</span>
              </span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              </span>
            </button>

            {isDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                {suggestedLocations.map((location) => (
                  <button
                    key={location}
                    onClick={() => handleLocationSelect(location)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <FolderIcon className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="truncate">{location}</span>
                    {location === selectedPath && (
                      <CheckCircleIcon className="h-4 w-4 text-green-500 ml-auto" />
                    )}
                  </button>
                ))}
                
                {config.allowCustomPath && (
                  <div className="border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={toggleCustomPath}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-blue-600"
                    >
                      <span>📝 Custom location...</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={customPath}
                onChange={(e) => handleCustomPathChange(e.target.value)}
                placeholder="Enter custom project location..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              />
              <button
                onClick={toggleCustomPath}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
            
            {isValidating && (
              <div className="flex items-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-2"></div>
                Validating path...
              </div>
            )}
            
            {validation && (
              <div className={`flex items-center text-sm ${
                validation.isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {validation.isValid ? (
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                ) : (
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                )}
                {validation.isValid 
                  ? `Valid location: ${validation.resolvedPath}`
                  : validation.error
                }
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Project will be created at:
        </div>
        <div className="font-mono text-sm text-blue-600 dark:text-blue-400 break-all">
          {getFullProjectPath(isCustom && validation?.isValid ? customPath : selectedPath)}
        </div>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400">
        💡 Your project files will be created in this location and will be accessible through your file manager.
      </div>
    </div>
  )
}