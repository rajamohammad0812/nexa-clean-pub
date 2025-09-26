"use client"
import { useState, useEffect } from 'react'
import { ProjectRequirements } from '@/lib/ai/project-generator'
import ProjectAnalysisCard from './ProjectAnalysisCard'

const ROW_CLIP = "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)"

function CutoutShell({
  clip = ROW_CLIP,
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
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#6FDBFF_0%,#E5F9FF_50%,#6FDBFF_75%,#E5F9FF_100%)]" style={{ clipPath: clip }} />
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

interface ProjectGenerationModalProps {
  isOpen: boolean
  onClose: () => void
  analysis: ProjectRequirements
  onGenerate: (customizedAnalysis: ProjectRequirements, projectName: string) => void
  isGenerating?: boolean
}

export default function ProjectGenerationModal({
  isOpen,
  onClose,
  analysis,
  onGenerate,
  isGenerating = false
}: ProjectGenerationModalProps) {
  const [customizedAnalysis, setCustomizedAnalysis] = useState<ProjectRequirements>(analysis)
  const [projectName, setProjectName] = useState('')
  const [newFeature, setNewFeature] = useState('')

  useEffect(() => {
    if (isOpen) {
      setCustomizedAnalysis(analysis)
      // Generate default project name
      const defaultName = `${analysis.projectType.replace(/[^a-zA-Z0-9]/g, '-')}-app`
      setProjectName(defaultName)
    }
  }, [isOpen, analysis])

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleAddFeature = () => {
    if (newFeature.trim() && !customizedAnalysis.features.includes(newFeature.trim())) {
      setCustomizedAnalysis(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }))
      setNewFeature('')
    }
  }

  const handleRemoveFeature = (index: number) => {
    setCustomizedAnalysis(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const handleComplexityChange = (complexity: 'simple' | 'medium' | 'complex') => {
    setCustomizedAnalysis(prev => ({
      ...prev,
      complexity
    }))
  }

  const handleGenerate = () => {
    if (projectName.trim()) {
      onGenerate(customizedAnalysis, projectName.trim())
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Enter' && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Close modal"
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <CutoutShell>
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#10F3FE]">
                  Customize Your Project
                </h2>
                <p className="text-sm text-cyan-200/80 mt-1">
                  Fine-tune the AI analysis before generating your app
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isGenerating}
                className="p-2 text-cyan-200/80 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Project Analysis Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">AI Analysis</h3>
              <ProjectAnalysisCard 
                analysis={customizedAnalysis}
                isGenerating={isGenerating}
              />
            </div>

            {/* Customization Options */}
            <div className="space-y-6">
              <div className="border-t border-cyan-200/20 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Customization</h3>
                
                {/* Project Name */}
                <div className="space-y-2 mb-4">
                  <label htmlFor="project-name" className="text-sm font-medium text-[#10F3FE]">
                    Project Name
                  </label>
                  <CutoutShell>
                    <input
                      id="project-name"
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      disabled={isGenerating}
                      placeholder="my-awesome-app"
                      className="w-full px-4 py-3 bg-transparent border-none text-white text-sm placeholder:text-cyan-200/50 focus:outline-none disabled:opacity-50"
                    />
                  </CutoutShell>
                  <p className="text-xs text-cyan-200/60">
                    Letters, numbers, hyphens, and underscores only
                  </p>
                </div>

                {/* Complexity */}
                <div className="space-y-2 mb-4">
                  <label htmlFor="complexity-simple" className="text-sm font-medium text-[#10F3FE]">
                    Project Complexity
                  </label>
                  <div className="flex gap-2">
                    {(['simple', 'medium', 'complex'] as const).map((complexity) => (
                      <CutoutShell key={complexity} className="flex-1">
                        <button
                          onClick={() => handleComplexityChange(complexity)}
                          disabled={isGenerating}
                          className={`w-full py-2 px-3 text-sm font-medium transition-all capitalize ${
                            customizedAnalysis.complexity === complexity
                              ? 'text-black bg-[#10F3FE]'
                              : 'text-[#10F3FE] hover:bg-[#10F3FE]/10'
                          } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {complexity}
                        </button>
                      </CutoutShell>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#10F3FE]">
                    Features ({customizedAnalysis.features.length})
                  </label>
                  
                  {/* Feature List */}
                  <div className="space-y-2 mb-3">
                    {customizedAnalysis.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-1 h-1 bg-[#10F3FE] rounded-full flex-shrink-0" />
                        <span className="flex-1 text-cyan-200/90">{feature}</span>
                        {!isGenerating && (
                          <button
                            onClick={() => handleRemoveFeature(index)}
                            className="text-red-400 hover:text-red-300 transition-colors text-xs px-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Feature */}
                  <div className="flex gap-2">
                    <CutoutShell className="flex-1">
                      <input
                        type="text"
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddFeature()}
                        disabled={isGenerating}
                        placeholder="Add a feature..."
                        className="w-full px-3 py-2 bg-transparent border-none text-white text-sm placeholder:text-cyan-200/50 focus:outline-none disabled:opacity-50"
                      />
                    </CutoutShell>
                    <CutoutShell>
                      <button
                        onClick={handleAddFeature}
                        disabled={!newFeature.trim() || isGenerating}
                        className={`px-4 py-2 text-sm font-medium transition-all ${
                          !newFeature.trim() || isGenerating
                            ? 'text-cyan-200/50 cursor-not-allowed'
                            : 'text-[#10F3FE] hover:bg-[#10F3FE]/10'
                        }`}
                      >
                        + Add
                      </button>
                    </CutoutShell>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-cyan-200/20">
              <CutoutShell className="flex-1">
                <button
                  onClick={onClose}
                  disabled={isGenerating}
                  className={`w-full py-3 px-4 text-sm font-medium transition-all ${
                    isGenerating
                      ? 'text-cyan-200/50 cursor-not-allowed'
                      : 'text-[#10F3FE] hover:bg-[#10F3FE]/10'
                  }`}
                >
                  Cancel
                </button>
              </CutoutShell>
              
              <CutoutShell className="flex-1">
                <button
                  onClick={handleGenerate}
                  disabled={!projectName.trim() || isGenerating}
                  className={`w-full py-3 px-4 text-sm font-medium transition-all ${
                    !projectName.trim() || isGenerating
                      ? 'text-black/50 bg-[#10F3FE]/50 cursor-not-allowed'
                      : 'text-black bg-[#10F3FE] hover:bg-[#10F3FE]/80'
                  }`}
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin text-sm">⟳</div>
                      <span>Generating Project...</span>
                    </div>
                  ) : (
                    <>🚀 Generate Project</>
                  )}
                </button>
              </CutoutShell>
            </div>
          </div>
        </CutoutShell>
      </div>
    </div>
  )
}