"use client"
import { ProjectAnalysis, ProjectType } from '@/types/ai-analysis'

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

interface ProjectAnalysisCardProps {
  analysis: ProjectAnalysis
  onCustomize?: () => void
  onGenerateNow?: () => void
  isGenerating?: boolean
  confidence?: number
}

export default function ProjectAnalysisCard({
  analysis,
  onCustomize,
  onGenerateNow,
  isGenerating = false,
  confidence
}: ProjectAnalysisCardProps) {
  const getProjectTypeIcon = (type: ProjectType): string => {
    const typeMap: Record<ProjectType, string> = {
      'ecommerce': 'STORE',
      'blog': 'BLOG',
      'social-media': 'SOCIAL',
      'portfolio': 'PORTFOLIO',
      'dashboard': 'DASHBOARD',
      'streaming': 'STREAMING',
      'food-delivery': 'DELIVERY',
      'real-estate': 'REALTY',
      'education': 'LEARN',
      'healthcare': 'HEALTH',
      'finance': 'FINANCE',
      'travel': 'TRAVEL',
      'landing-page': 'LANDING',
      'other': 'PROJECT'
    }
    return typeMap[type] || 'PROJECT'
  }

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 90) return 'text-green-400'
    if (confidence >= 70) return 'text-[#10F3FE]'
    if (confidence >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getComplexityColor = (complexity: string): string => {
    const colorMap: Record<string, string> = {
      'simple': 'text-green-400',
      'medium': 'text-[#10F3FE]',
      'complex': 'text-yellow-400'
    }
    return colorMap[complexity] || 'text-[#10F3FE]'
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <CutoutShell className="mb-4">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="px-2 py-1 bg-[#10F3FE]/20 rounded border border-[#10F3FE]/30">
              <span className="text-xs font-bold text-[#10F3FE] tracking-wider">
                {getProjectTypeIcon(analysis.projectType)}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#10F3FE]">
                AI Project Analysis
              </h3>
              <p className="text-sm text-cyan-200/80">
                I understand what you want to build
              </p>
            </div>
          </div>

          {/* Project Type */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-cyan-200/80">Project Type:</span>
              <span className="text-white font-medium capitalize">
                {analysis.projectType.replace(/-/g, ' ')}
              </span>
            </div>
            
            {/* Confidence */}
            {confidence && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-cyan-200/80">AI Confidence:</span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${getConfidenceColor(confidence * 100)}`}>
                    {Math.round(confidence * 100)}%
                  </span>
                  <div className="w-16 h-2 bg-black/40 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r from-[#10F3FE] to-cyan-300 transition-all duration-500`}
                      style={{ width: `${confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Complexity */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-cyan-200/80">Complexity:</span>
              <span className={`font-medium capitalize ${getComplexityColor(analysis.complexity)}`}>
                {analysis.complexity}
              </span>
            </div>
          </div>

          {/* Features */}
          {analysis.keyFeatures && analysis.keyFeatures.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-[#10F3FE]">Key Features Detected:</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {analysis.keyFeatures.slice(0, 5).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-1 h-1 bg-[#10F3FE] rounded-full flex-shrink-0" />
                    <span className="text-cyan-200/90">{feature.name}</span>
                    <span className="text-xs text-cyan-200/60">({feature.estimated_hours}h)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {analysis.description && (
            <div className="pt-2 border-t border-cyan-200/20">
              <h4 className="text-sm font-medium text-[#10F3FE] mb-1">Project Summary:</h4>
              <p className="text-xs text-cyan-200/80 italic line-clamp-3">
                {analysis.description}
              </p>
            </div>
          )}

          {/* Estimated Time & Cost */}
          <div className="pt-2 border-t border-cyan-200/20 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-cyan-200/80">Estimated Time:</span>
              <span className="text-[#10F3FE] font-medium">
                {analysis.estimatedTimeWeeks} weeks
              </span>
            </div>
            {analysis.estimatedCost && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-cyan-200/80">Development Cost:</span>
                <span className="text-[#10F3FE] font-medium">
                  {analysis.estimatedCost.development}
                </span>
              </div>
            )}
          </div>

          {/* Recommended Template */}
          {analysis.recommendedTemplate && (
            <div className="pt-2 border-t border-cyan-200/20">
              <h4 className="text-sm font-medium text-[#10F3FE] mb-2">Recommended Template:</h4>
              <div className="bg-[#10F3FE]/10 border border-[#10F3FE]/30 rounded p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium text-sm">{analysis.recommendedTemplate.name}</span>
                  <span className="text-xs text-[#10F3FE] font-mono">{analysis.recommendedTemplate.id}</span>
                </div>
                <p className="text-xs text-cyan-200/80 italic">
                  {analysis.recommendedTemplate.reason}
                </p>
              </div>
            </div>
          )}
        </div>
      </CutoutShell>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onCustomize && (
          <CutoutShell className="flex-1">
            <button
              onClick={onCustomize}
              disabled={isGenerating}
              className={`w-full py-3 px-4 text-sm font-medium transition-all ${
                isGenerating
                  ? 'text-cyan-200/50 cursor-not-allowed'
                  : 'text-[#10F3FE] hover:bg-[#10F3FE]/10'
              }`}
            >
              Customize
            </button>
          </CutoutShell>
        )}

        {onGenerateNow && (
          <CutoutShell className="flex-1">
            <button
              onClick={onGenerateNow}
              disabled={isGenerating}
              className={`w-full py-3 px-4 text-sm font-medium transition-all ${
                isGenerating
                  ? 'text-black/50 bg-[#10F3FE]/50 cursor-not-allowed'
                  : 'text-black bg-[#10F3FE] hover:bg-[#10F3FE]/80'
              }`}
            >
              {isGenerating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full"></div>
                  <span>Generating...</span>
                </div>
              ) : (
                "Generate Now"
              )}
            </button>
          </CutoutShell>
        )}
      </div>
    </div>
  )
}