"use client"
import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import generalChatIcon from '@/components/assets/img/MainContent/generalChat.svg'
import ProjectGenerationModal from '@/components/ai/ProjectGenerationModal'
import ProjectAnalysisCard from '@/components/ai/ProjectAnalysisCard'
import { ProjectRequirements } from '@/lib/ai/project-generator'
import { ProjectAnalysis, AnalysisRequest, AnalysisResponse } from '@/types/ai-analysis'
import searchIcon from '@/components/assets/img/MainContent/search.svg'
import micIcon from '@/components/assets/img/MainContent/mic.svg'
import sendArrowIcon from '@/components/assets/img/MainContent/sendArrow.svg'
import backgroundPattern from '@/components/assets/img/MainContent/backgroundPattern.svg'
import starsPattern from '@/components/assets/img/MainContent/starsPattern.svg'
import chatIcon from '@/components/assets/img/MainContent/chat.svg'
import canvasIcon from '@/components/assets/img/MainContent/canvas.svg'
import watchIcon from '@/components/assets/img/MainContent/watch.svg'
import downChevron from '@/components/assets/img/MainContent/downChevron.svg'
import borderDesignLeft from '@/components/assets/img/LeftSideNav/borderDesign.svg'
import borderDesignRight from '@/components/assets/img/RightSideNav/borderDesign.svg'

type Props = {
  className?: string
}

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

interface ChatMessage {
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  projectAnalysis?: ProjectAnalysis
  showCreateButton?: boolean
  confidence?: number
}

export default function MainContent({ className = "" }: Props) {
  const { data: session, status } = useSession()
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingProject, setIsGeneratingProject] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAnalysis, setSelectedAnalysis] = useState<ProjectRequirements | null>(null)
  const [originalAnalysis, setOriginalAnalysis] = useState<ProjectAnalysis | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Session-aware chat management
  useEffect(() => {
    if (status === 'loading') return // Wait for session to load
    
    const sessionId = session?.user?.id || session?.user?.email || 'anonymous'
    
    // If session changed, reset chat for new session
    if (currentSessionId !== sessionId) {
      console.log('Session changed from', currentSessionId, 'to', sessionId, '- resetting chat')
      setMessages([]) // Clear messages for fresh session
      setCurrentSessionId(sessionId)
      
      // Clear any old localStorage data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('nexa-chat-messages')
      }
      return
    }
    
    // Load messages for current session
    if (typeof window !== 'undefined' && sessionId) {
      const storageKey = `nexa-chat-messages-${sessionId}`
      const savedMessages = localStorage.getItem(storageKey)
      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages) as any[]
          setMessages(parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })))
        } catch (error) {
          console.error('Failed to load saved messages:', error)
        }
      }
    }
  }, [session, status, currentSessionId])
  
  // Save messages to localStorage whenever they change (session-specific)
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0 && currentSessionId) {
      const storageKey = `nexa-chat-messages-${currentSessionId}`
      localStorage.setItem(storageKey, JSON.stringify(messages))
    }
  }, [messages, currentSessionId])
  
  const clipPath = "polygon(25px 0, 35% 0, calc(35% + 25px) 25px, calc(35% + 25px) 70px, 39% 90px, 97.5% 90px, 100% 110px, 100% calc(100% - 25px), calc(100% - 25px) 100%, 0 100%, 0 25px)"
  const clipPathInner = "polygon(25px 0, 34.8% 0, calc(35% + 22px) 25px, calc(35% + 22px) 70px, 38.8% 90px, 97.5% 90px, 100% 110px, 100% calc(100% - 25px), calc(100% - 25px) 100%, 0 100%, 0 25px)"

  useEffect(() => {
    if (messagesEndRef.current) {
      const chatContainer = messagesEndRef.current.closest('.overflow-y-auto')
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue('')
    
    // Add user message to chat
    const newUserMessage: ChatMessage = {
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newUserMessage])
    
    setIsLoading(true)
    try {
      // First, analyze if this is a project request
      const analysisRequest: AnalysisRequest = {
        userPrompt: userMessage,
        context: {
          userSkillLevel: 'intermediate', // Could be customized based on user profile
          budget: 'medium',
          timeline: 'normal'
        }
      }
      
      const analysisResponse = await fetch('/api/analyze-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisRequest)
      })
      const analysisData: AnalysisResponse = await analysisResponse.json()
      
      let projectAnalysis = null
      let showCreateButton = false
      
      if (analysisData.success && analysisData.analysis) {
        projectAnalysis = analysisData.analysis
        // Show create button if we have a valid project analysis with good confidence
        showCreateButton = analysisData.confidence > 0.7
      }
      // If analysis failed with "Not a project request", that's normal - just continue with regular chat

      // Get regular chat response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          type: 'general'
        }),
      })

      const data = await response.json()

      if (data.success) {
        let aiContent = data.response
        
        // If it's a project request, enhance the response
        if (showCreateButton && projectAnalysis && analysisData.confidence) {
          const confidencePercent = Math.round(analysisData.confidence * 100)
          const features = projectAnalysis.keyFeatures.slice(0, 3).map(f => f.name).join(', ')
          aiContent += `\n\n**I detected you want to create a ${projectAnalysis.title}**\n\nProject Type: ${projectAnalysis.projectType}\nConfidence: ${confidencePercent}%\nKey Features: ${features}\nComplexity: ${projectAnalysis.complexity}\nEstimated Time: ${projectAnalysis.estimatedTimeWeeks} weeks\nRecommended Template: ${projectAnalysis.recommendedTemplate?.name || 'Next.js Fullstack'}\n\nI can generate a complete application for you with all the code, database setup, and deployment configuration.`
        }
        
        // Add AI response to chat
        const aiMessage: ChatMessage = {
          type: 'assistant',
          content: aiContent,
          timestamp: new Date(),
          projectAnalysis,
          showCreateButton,
          confidence: analysisData.confidence
        }
        setMessages(prev => [...prev, aiMessage])
      } else {
        console.error('Chat error:', data.error)
      }
    } catch (error) {
      console.error('Network error:', error)
    }
    setIsLoading(false)
  }

  const handleOpenCustomizationModal = (projectAnalysis: ProjectAnalysis) => {
    // Convert to old format for modal
    const requirements = convertAnalysisToRequirements(projectAnalysis)
    setSelectedAnalysis(requirements)
    setOriginalAnalysis(projectAnalysis) // Store original for enhanced generation
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedAnalysis(null)
    setOriginalAnalysis(null)
  }

  const handleGenerateFromModal = async (customizedAnalysis: ProjectRequirements, projectName: string, originalAnalysis?: ProjectAnalysis) => {
    setIsGeneratingProject(true)
    setIsModalOpen(false)
    
    // Add generating message to chat
    const generatingMessage: ChatMessage = {
      type: 'assistant',
      content: `**Creating project "${projectName}"...** \n\nI'm analyzing your requirements and preparing your project setup.`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, generatingMessage])
    
    // Actually create the project in the database
    try {
      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies
        body: JSON.stringify({
          name: projectName,
          description: customizedAnalysis.description || `AI-generated ${customizedAnalysis.projectType} project`,
          repository: '', // Optional field
          framework: 'NEXTJS', // Default framework
          config: {
            aiGenerated: true,
            projectType: customizedAnalysis.projectType,
            complexity: customizedAnalysis.complexity,
            features: customizedAnalysis.features,
            template: customizedAnalysis.suggestedTemplate,
            generatedAt: new Date().toISOString()
          }
        })
      })
      
      const projectData = await projectResponse.json()
      
      if (projectData.success) {
        // Add success message with actual project ID
        const successMessage: ChatMessage = {
          type: 'assistant',
          content: `**✅ Project "${projectName}" Created Successfully!**\n\n**Project Details:**\n- **Type:** ${customizedAnalysis.projectType}\n- **Complexity:** ${customizedAnalysis.complexity}\n- **Features:** ${customizedAnalysis.features.length} features\n- **Template:** ${customizedAnalysis.suggestedTemplate}\n- **Project ID:** ${projectData.project.id}\n\n**Features Included:**\n${customizedAnalysis.features.map(f => `• ${f}`).join('\n')}\n\n**Database Record Created:**\n• Project saved to PostgreSQL database\n• Development environment configured\n• Production environment configured\n• Available in Projects page\n\n🎉 **Your project has been created and saved!**\n\n→ **[View in Projects Page](/projects)**`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, successMessage])
      } else {
        console.error('Project creation failed:', projectData)
        throw new Error(projectData.error || projectData.details || 'Failed to create project')
      }
    } catch (error) {
      console.error('Project creation error:', error)
      
      // Handle specific authentication error
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
        const authError: ChatMessage = {
          type: 'assistant',
          content: `**❌ Authentication Required**\n\nYou need to be signed in to create projects.\n\n→ **[Sign In](/api/auth/signin)** to continue\n\nOnce signed in, you can create and manage AI-generated projects.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, authError])
      } else {
        const errorMessage: ChatMessage = {
          type: 'assistant',
          content: `**❌ Project Creation Failed**\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease ensure you're signed in and try again. If the issue persists, check the console for more details.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    }
    
    setIsGeneratingProject(false)
    
    setIsGeneratingProject(false)
  }

  // Convert ProjectAnalysis to ProjectRequirements for backward compatibility
  const convertAnalysisToRequirements = (analysis: ProjectAnalysis): ProjectRequirements => {
    return {
      isProjectRequest: true, // Always true since we're converting from project analysis
      projectType: analysis.projectType,
      description: analysis.description,
      features: analysis.keyFeatures.map(f => f.name),
      complexity: analysis.complexity,
      suggestedTemplate: analysis.recommendedTemplate?.id || 'nextjs-fullstack', // Use AI-selected template
      confidence: 85, // Static confidence for converted analysis
      reasoning: `Converted from AI project analysis for ${analysis.title}` // Add reasoning
    }
  }

  const handleQuickGenerate = async (projectAnalysis: ProjectAnalysis) => {
    // Store original analysis and convert for backward compatibility
    setOriginalAnalysis(projectAnalysis)
    const requirements = convertAnalysisToRequirements(projectAnalysis)
    const defaultProjectName = `${projectAnalysis.projectType.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`
    handleGenerateFromModal(requirements, defaultProjectName, projectAnalysis)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <section className={`${className}`} style={{
      filter: `
          drop-shadow(0 0 30px rgba(16, 243, 254, 0.3))
          drop-shadow(0 0 45px rgba(16, 243, 254, 0.1))
        `
    }}>
      <div
        className="absolute inset-0 bg-[#10F3FE]"
        style={{ clipPath }}
      />
      <div
        className="relative bg-[#002B2F] h-full w-full flex flex-col"
        style={{
          clipPath: clipPathInner,
          transform: 'translate(2px, 2px)',
          width: 'calc(100% - 4px)',
          height: 'calc(100% - 4px)',
          backgroundImage: `url(${backgroundPattern.src}), url(${starsPattern.src})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom',
          backgroundSize: '100% auto',
        }}
      >
        {/* Top: General Chat icon */}
        <div className="p-4 ml-4">
          <img
            src={generalChatIcon.src}
            alt="General Chat"
            className="mt-4"
          />
        </div>

        {/* Center block */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          {/* Debug info - temporarily show state */}
          <div className="absolute top-2 left-2 text-xs text-white/50 z-50">
            Messages: {messages.length} | Session: {currentSessionId?.substring(0, 8)}...
          </div>
          
          {/* Welcome content - always visible */}
          <div className="text-[22px] font-light text-white">
            Hey <span className="font-bold">{session?.user?.name || session?.user?.email || 'User'}</span>
          </div>
          <div className="text-[#FFFFFF66] text-[22px] font-light">
            Whats on your mind today
          </div>
          
          {/* Transparent chat overlay - only when messages exist */}
          {messages.length > 0 && (
            <div className="absolute bg-black/20 backdrop-blur-sm rounded-lg overflow-hidden" style={{ 
              left: '20px', 
              right: '20px', 
              top: '60px', 
              bottom: '100px' 
            }}>
              {/* Chat messages area with internal scroll */}
              <div className="absolute inset-0 flex flex-col">
                {/* Messages container - takes remaining space */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-20">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-3 py-2 rounded-lg ${
                        message.type === 'user' 
                          ? 'bg-[#10F3FE]/90 text-black' 
                          : 'bg-black/40 text-white backdrop-blur-sm'
                      }`}>
                        <div className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </div>
                        
                        {/* Show Enhanced Project Analysis for project requests */}
                        {message.showCreateButton && message.projectAnalysis && (
                          <div className="mt-4 pt-4 border-t border-white/20">
                            <ProjectAnalysisCard
                              analysis={message.projectAnalysis}
                              confidence={message.confidence}
                              onCustomize={() => handleOpenCustomizationModal(message.projectAnalysis)}
                              onGenerateNow={() => handleQuickGenerate(message.projectAnalysis)}
                              isGenerating={isGeneratingProject}
                            />
                          </div>
                        )}
                        
                        <div className={`text-xs mt-1 opacity-70 ${
                          message.type === 'user' ? 'text-black/70' : 'text-white/70'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-black/40 text-white px-3 py-2 rounded-lg backdrop-blur-sm">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin w-4 h-4 border-2 border-[#10F3FE]/30 border-t-[#10F3FE] rounded-full"></div>
                          <span className="text-sm">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Chat input - absolutely positioned at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10 bg-black/20 backdrop-blur-sm">
                  <CutoutShell>
                    <div className="relative w-full" style={{ height: '60px' }}>
                      <div className="flex items-center w-full">
                        <img src={searchIcon.src} alt="Search" className="w-4 h-4 ml-3 mb-1 opacity-70" />
                        <input
                          type="text"
                          placeholder={isLoading ? "AI is thinking..." : "Continue the conversation..."}
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={handleKeyPress}
                          disabled={isLoading}
                          className="flex-1 px-3 mb-1 bg-transparent border-none text-white text-sm placeholder:text-white focus:outline-none"
                        />
                        <div className="p-2 mr-1 rounded-full hover:bg-white/10 transition">
                          <img src={micIcon.src} alt="Mic" />
                        </div>
                        <CutoutShell className="-mt-[2px]">
                          <button
                            className={`p-4 hover:bg-cyan-400/30 transition cursor-pointer ${
                              isLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            style={{ width: '60px', height: '60px' }}
                            onClick={handleSendMessage}
                            disabled={isLoading}
                            aria-label="Send message"
                          >
                            {isLoading ? (
                              <div className='ml-1 mt-1 animate-spin w-4 h-4 border-2 border-[#10F3FE]/30 border-t-[#10F3FE] rounded-full'></div>
                            ) : (
                              <img src={sendArrowIcon.src} alt="Send" className='ml-1 mt-1' />
                            )}
                          </button>
                        </CutoutShell>
                      </div>
                    </div>
                  </CutoutShell>
                </div>
              </div>
              
              {/* Clear button */}
              <button
                onClick={() => {
                  setMessages([])
                  if (typeof window !== 'undefined' && currentSessionId) {
                    const storageKey = `nexa-chat-messages-${currentSessionId}`
                    localStorage.removeItem(storageKey)
                  }
                }}
                className="absolute top-2 right-2 px-2 py-1 text-xs bg-black/40 text-white rounded hover:bg-black/60 transition backdrop-blur-sm"
              >
                Clear
              </button>
            </div>
          )}

          {/* Search bar - only show when no messages */}
          {messages.length === 0 && (
            <div className="mt-8">
              <CutoutShell>
                <div className="relative" style={{ width: '600px', height: '65px' }}>
                <div className="flex items-center w-full">
                  {/* Left search icon */}
                  <img
                    src={searchIcon.src}
                    alt="Search"
                    className="w-4 h-4 ml-3 mb-1 opacity-70"
                  />

                  {/* Input */}
                  <input
                    type="text"
                    placeholder={isLoading ? "AI is thinking..." : "Ask anything"}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isLoading}
                    className="flex-1 px-3 mb-1 bg-transparent border-none text-white text-[14px] placeholder:text-white focus:outline-none focus:ring-0 focus:shadow-none outline-none disabled:opacity-50"
                  />

                  {/* Mic */}
                  <div className="p-2 mr-1 rounded-full hover:bg-white/10 transition">
                    <img src={micIcon.src} alt="Mic" />
                  </div>

                  {/* Send */}
                  <CutoutShell className="-mt-[2px]">
                    <button
                      className={`p-4 hover:bg-cyan-400/30 transition cursor-pointer ${
                        isLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      style={{
                        width: '70px',
                        height: '65px',
                      }}
                      onClick={handleSendMessage}
                      disabled={isLoading}
                      aria-label="Send message"
                    >
                      {isLoading ? (
                        <div className='ml-1 mt-1 animate-spin text-[#10F3FE] text-lg'>⟳</div>
                      ) : (
                        <img src={sendArrowIcon.src} alt="Send" className='ml-1 mt-1' />
                      )}
                    </button>
                  </CutoutShell>
                </div>
              </div>
            </CutoutShell>
            </div>
          )}
        </div>
      </div>
      <div className=' absolute top-1 left-[40%] flex gap-4 z-50'>
        <CutoutShell>
          <div className="flex items-center pb-2 px-4 gap-2" style={{ width: '200px', height: '65px' }}>
            <img src={chatIcon.src} alt="General Chat" className='mt-2' />
            <span className="text-white text-base">General Chat</span>
          </div>
        </CutoutShell>
        <CutoutShell>
          <div className="flex items-center px-4 pb-2 gap-2" style={{ width: '200px', height: '65px' }}>
            <img src={canvasIcon.src} alt="Canvas" className='mt-2' />
            <span className="text-white text-base">Canvas</span>
            <img src={downChevron.src} alt="Dropdown" className='absolute right-4 mt-2' />
          </div>
        </CutoutShell>
        <CutoutShell>
          <div className="flex items-center px-4 pb-2 gap-2" style={{ width: '200px', height: '65px' }}>
            <img src={watchIcon.src} alt="Watch Live" className='mt-2' />
            <span className="text-white text-base">Watch Live</span>
          </div>
        </CutoutShell>
      </div>
      <img
        src={borderDesignLeft.src}
        alt="Border Decoration"
        className="absolute -top-14 left-20 z-50 pointer-events-none select-none -rotate-90"
      />
      <img
        src={borderDesignRight.src}
        alt="Border Decoration"
        className="absolute right-0 bottom-40 translate-x-1/2 z-50 pointer-events-none select-none -rotate-90"
      />
      
      {/* Project Generation Modal */}
      {selectedAnalysis && (
        <ProjectGenerationModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          analysis={selectedAnalysis}
          onGenerate={handleGenerateFromModal}
          isGenerating={isGeneratingProject}
        />
      )}
    </section>
  )
}
