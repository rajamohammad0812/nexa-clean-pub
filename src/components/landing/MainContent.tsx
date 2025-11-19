'use client'
import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import generalChatIcon from '@/components/assets/img/MainContent/generalChat.svg'
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

const ROW_CLIP =
  'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)'

function CutoutShell({
  clip = ROW_CLIP,
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

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachedFiles?: UploadedFile[]
}

interface UploadedFile {
  name: string
  size: number
  type: string
  content: string
  path: string
}

interface AgentStep {
  type: 'tool_call' | 'tool_result' | 'response' | 'progress'
  content: string
  tool_name?: string
  tool_args?: Record<string, any>
  tool_result?: {
    success: boolean
    file_path?: string
    message?: string
    project_name?: string
    [key: string]: any
  }
  timestamp: string | Date
  progress?: {
    current: number
    total: number
    percentage: number
  }
}

export default function MainContent({ className = '' }: Props) {
  const { data: session } = useSession()
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([])
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [completedProjectName, setCompletedProjectName] = useState('')
  const [completedProjectImage, setCompletedProjectImage] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [serverRunning, setServerRunning] = useState(false)
  const [showWatchLive, setShowWatchLive] = useState(false)
  const [liveSteps, setLiveSteps] = useState<AgentStep[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatFileInputRef = useRef<HTMLInputElement>(null)
  const liveEndRef = useRef<HTMLDivElement>(null)

  const clipPath =
    'polygon(25px 0, 35% 0, calc(35% + 25px) 25px, calc(35% + 25px) 70px, 39% 90px, 97.5% 90px, 100% 110px, 100% calc(100% - 25px), calc(100% - 25px) 100%, 0 100%, 0 25px)'
  const clipPathInner =
    'polygon(25px 0, 34.8% 0, calc(35% + 22px) 25px, calc(35% + 22px) 70px, 38.8% 90px, 97.5% 90px, 100% 110px, 100% calc(100% - 25px), calc(100% - 25px) 100%, 0 100%, 0 25px)'

  // Load chat history from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chat-history')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setMessages(parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })))
        } catch (e) {
          console.error('Failed to load chat history:', e)
        }
      }
    }
  }, [])

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      localStorage.setItem('chat-history', JSON.stringify(messages))
    }
  }, [messages])

  // Auto-scroll for chat
  useEffect(() => {
    if (messagesEndRef.current) {
      const chatContainer = messagesEndRef.current.closest('.overflow-y-auto')
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    }
  }, [messages, agentSteps])

  // Auto-scroll for Watch Live panel
  useEffect(() => {
    if (liveEndRef.current && showWatchLive) {
      liveEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [liveSteps, showWatchLive])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadingFiles(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => {
        formData.append('files', file)
      })

      const response = await fetch('/api/agent/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success && data.files) {
        setUploadedFiles((prev) => [...prev, ...data.files])
      } else {
        alert(`Upload failed: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('File upload error:', error)
      alert('Failed to upload files. Please try again.')
    } finally {
      setUploadingFiles(false)
      if (chatFileInputRef.current) {
        chatFileInputRef.current.value = ''
      }
    }
  }

  const removeUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && uploadedFiles.length === 0) || isLoading) return

    const userMessage = inputValue.trim()
    const attachedFiles = uploadedFiles
    setInputValue('')
    setUploadedFiles([])

    const newMessage: ChatMessage = {
      role: 'user',
      content: userMessage || 'I\'ve attached some files for you to analyze.',
      timestamp: new Date(),
      attachedFiles: attachedFiles.length > 0 ? attachedFiles : undefined,
    }
    setMessages((prev) => [...prev, newMessage])
    setAgentSteps([])

    setIsLoading(true)

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          projectId: 'workspace',
          conversationHistory: messages,
          uploadedFiles: attachedFiles.length > 0 ? attachedFiles : undefined,
        }),
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let finalResponse = ''

      if (!reader) throw new Error('No response stream')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'tool_call') {
                setAgentSteps((prev) => [...prev, data])
                setLiveSteps((prev) => [...prev, data])
              } else if (data.type === 'tool_result') {
                setAgentSteps((prev) => [...prev, data])
                setLiveSteps((prev) => [...prev, data])
                
                if (data.tool_name === 'create_project' && data.tool_result?.success) {
                  const projectName = data.tool_result.project_name || 'your project'
                  const imageUrl = data.tool_result.imageUrl || ''
                  setCompletedProjectName(projectName)
                  setCompletedProjectImage(imageUrl)
                  setShowCompletionModal(true)
                }
              } else if (data.type === 'progress') {
                setAgentSteps((prev) => [...prev, data])
                setLiveSteps((prev) => [...prev, data])
              } else if (data.type === 'response') {
                finalResponse = data.content
              } else if (data.type === 'done') {
                const assistantMessage: ChatMessage = {
                  role: 'assistant',
                  content: finalResponse || data.response,
                  timestamp: new Date(),
                }
                setMessages((prev) => [...prev, assistantMessage])
              } else if (data.type === 'error') {
                const errorMessage: ChatMessage = {
                  role: 'assistant',
                  content: `Error: ${data.error}`,
                  timestamp: new Date(),
                }
                setMessages((prev) => [...prev, errorMessage])
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Agent error:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }

    setIsLoading(false)
    setAgentSteps([])
    // Keep live steps for Watch Live panel
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !completedProjectName) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('projectName', completedProjectName)

      const response = await fetch('/api/workspace/upload-image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        setCompletedProjectImage(data.imageUrl)
        // Update metadata with image
        await fetch('/api/workspace/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectName: completedProjectName,
            imageUrl: data.imageUrl,
          }),
        })
      }
    } catch (error) {
      console.error('Image upload failed:', error)
    }
    setUploadingImage(false)
  }

  const handleRunApp = async () => {
    try {
      // First check current status
      const statusRes = await fetch('/api/workspace/dev-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: completedProjectName,
          action: 'status',
        }),
      })
      const statusData = await statusRes.json()
      const actuallyRunning = statusData.running
      
      // Determine action based on actual server state
      const action = actuallyRunning ? 'stop' : 'start'
      
      const response = await fetch('/api/workspace/dev-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: completedProjectName,
          action,
        }),
      })
      const data = await response.json()
      
      if (data.success) {
        setServerRunning(action === 'start')
        if (action === 'start') {
          alert(`✅ Development server started!\n\nYour app is running.\nCheck the server terminal for the URL.`)
        } else {
          alert('✅ Development server stopped.')
        }
      } else {
        // Handle error responses
        if (data.error?.includes('already running')) {
          setServerRunning(true)
          alert('Server is already running!')
        } else if (data.error?.includes('No server running')) {
          setServerRunning(false)
          alert('No server is running for this project.')
        } else {
          alert(`Error: ${data.error || 'Failed to manage server'}`)
        }
      }
    } catch (error) {
      console.error('Failed to manage dev server:', error)
      alert('❌ Failed to manage server. See console for details.')
    }
  }

  const handleDownloadApp = async () => {
    try {
      const response = await fetch(`/api/workspace/download?project=${completedProjectName}`)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${completedProjectName}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const currentProgress = agentSteps
    .filter((s) => s.type === 'progress')
    .slice(-1)[0]?.progress

  return (
    <section
      className={`${className}`}
      style={{
        filter: `
          drop-shadow(0 0 30px rgba(16, 243, 254, 0.3))
          drop-shadow(0 0 45px rgba(16, 243, 254, 0.1))
        `,
      }}
    >
      <div className="absolute inset-0 bg-[#10F3FE]" style={{ clipPath }} />
      <div
        className="relative flex h-full w-full flex-col bg-[#002B2F]"
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
        <div className="ml-4 p-4">
          <img src={generalChatIcon.src} alt="General Chat" className="mt-4" />
        </div>

        <div className="relative flex flex-1 flex-col items-center justify-center">
          <div className="text-[22px] font-light text-white">
            Hey <span className="font-bold">{session?.user?.name || session?.user?.email || 'User'}</span>
          </div>
          <div className="text-[22px] font-light text-[#FFFFFF66]">Whats on your mind today</div>

          {messages.length > 0 && (
            <div
              className="absolute overflow-hidden rounded-lg bg-black/20 backdrop-blur-sm transition-all duration-300"
              style={{
                left: '20px',
                right: showWatchLive ? 'calc(50% + 10px)' : '20px',
                top: '60px',
                bottom: '100px',
              }}
            >
              <div className="absolute inset-0 flex flex-col">
                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-20">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-3 py-2 ${
                          message.role === 'user'
                            ? 'bg-[#10F3FE]/90 text-black'
                            : 'bg-black/40 text-white backdrop-blur-sm'
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                        {message.attachedFiles && message.attachedFiles.length > 0 && (
                          <div className="mt-2 space-y-1 border-t border-black/20 pt-2">
                            {message.attachedFiles.map((file, fileIndex) => (
                              <div
                                key={fileIndex}
                                className={`flex items-center gap-2 rounded px-2 py-1 text-xs ${
                                  message.role === 'user'
                                    ? 'bg-black/10 text-black/80'
                                    : 'bg-white/10 text-white/80'
                                }`}
                              >
                                <span>📎</span>
                                <span className="flex-1 truncate font-mono">{file.name}</span>
                                <span className="text-xs opacity-70">({(file.size / 1024).toFixed(1)}KB)</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div
                          className={`mt-1 text-xs opacity-70 ${
                            message.role === 'user' ? 'text-black/70' : 'text-white/70'
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[70%] rounded-lg bg-black/40 px-3 py-2 text-white backdrop-blur-sm">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#10F3FE]/30 border-t-[#10F3FE]"></div>
                            <span className="text-sm font-semibold">...</span>
                          </div>

                          {agentSteps.slice(-3).map((step, index) => (
                            <div key={index} className="text-xs text-white/70">
                              {step.type === 'tool_call' && `🔧 ${step.content}`}
                              {step.type === 'tool_result' && `✓ ${step.content}`}
                              {step.type === 'progress' && step.progress && (
                                <div className="mt-2">
                                  <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-medium text-white">{step.content}</span>
                                    <span className="text-xs font-bold text-[#10F3FE]">{step.progress.percentage}%</span>
                                  </div>
                                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/20">
                                    <div
                                      className="h-full bg-gradient-to-r from-[#10F3FE] to-cyan-400 transition-all duration-300 ease-out"
                                      style={{ width: `${step.progress.percentage}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          {currentProgress && (
                            <div className="mt-2 rounded border border-[#10F3FE]/30 bg-[#10F3FE]/10 px-3 py-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-white">Overall Progress</span>
                                <span className="font-bold text-[#10F3FE]">{currentProgress.percentage}%</span>
                              </div>
                              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                                <div
                                  className="h-full bg-[#10F3FE] transition-all duration-300"
                                  style={{ width: `${currentProgress.percentage}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/20 p-3 backdrop-blur-sm">
                  {/* Uploaded Files Display */}
                  {uploadedFiles.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 rounded-lg border border-[#10F3FE]/30 bg-black/40 px-3 py-1.5 text-xs text-white"
                        >
                          <span className="font-mono text-[#10F3FE]">📎</span>
                          <span className="max-w-[150px] truncate">{file.name}</span>
                          <span className="text-white/50">({(file.size / 1024).toFixed(1)}KB)</span>
                          <button
                            onClick={() => removeUploadedFile(index)}
                            className="ml-1 text-red-400 hover:text-red-300"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <CutoutShell>
                    <div className="relative w-full" style={{ height: '60px' }}>
                      <div className="flex w-full items-center">
                        <img
                          src={searchIcon.src}
                          alt="Search"
                          className="mb-1 ml-3 h-4 w-4 opacity-70"
                        />
                        <input
                          type="text"
                          placeholder={isLoading ? 'AI is working...' : 'Continue the conversation...'}
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={handleKeyPress}
                          disabled={isLoading}
                          className="mb-1 flex-1 border-none bg-transparent px-3 text-sm text-white placeholder:text-white focus:outline-none"
                        />
                        <button
                          onClick={() => chatFileInputRef.current?.click()}
                          disabled={uploadingFiles || isLoading}
                          className="mr-1 rounded-full p-2 transition hover:bg-white/10 disabled:opacity-50"
                          title="Attach files"
                        >
                          {uploadingFiles ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#10F3FE]/30 border-t-[#10F3FE]"></div>
                          ) : (
                            <svg className="h-5 w-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                          )}
                        </button>
                        <input
                          ref={chatFileInputRef}
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          accept=".pdf,.txt,.md,.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.html,.css,.json,.xml,.yaml,.yml,.csv,.png,.jpg,.jpeg,.gif,.svg,.webp"
                          className="hidden"
                        />
                        <div className="mr-1 rounded-full p-2 transition hover:bg-white/10">
                          <img src={micIcon.src} alt="Mic" />
                        </div>
                        <CutoutShell className="-mt-[2px]">
                          <button
                            className={`cursor-pointer p-4 transition hover:bg-cyan-400/30 ${
                              isLoading ? 'cursor-not-allowed opacity-50' : ''
                            }`}
                            style={{ width: '60px', height: '60px' }}
                            onClick={handleSendMessage}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <div className="ml-1 mt-1 h-4 w-4 animate-spin rounded-full border-2 border-[#10F3FE]/30 border-t-[#10F3FE]"></div>
                            ) : (
                              <img src={sendArrowIcon.src} alt="Send" className="ml-1 mt-1" />
                            )}
                          </button>
                        </CutoutShell>
                      </div>
                    </div>
                  </CutoutShell>
                </div>
              </div>

              <button
                onClick={() => {
                  setMessages([])
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('chat-history')
                  }
                }}
                className="absolute right-2 top-2 rounded bg-black/40 px-2 py-1 text-xs text-white backdrop-blur-sm transition hover:bg-black/60"
              >
                Clear
              </button>
            </div>
          )}

          {messages.length === 0 && (
            <div className="mt-8">
              {/* Uploaded Files Display */}
              {uploadedFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-lg border border-[#10F3FE]/30 bg-black/40 px-3 py-1.5 text-xs text-white"
                    >
                      <span className="font-mono text-[#10F3FE]">📎</span>
                      <span className="max-w-[150px] truncate">{file.name}</span>
                      <span className="text-white/50">({(file.size / 1024).toFixed(1)}KB)</span>
                      <button
                        onClick={() => removeUploadedFile(index)}
                        className="ml-1 text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <CutoutShell>
                <div className="relative" style={{ width: '600px', height: '65px' }}>
                  <div className="flex w-full items-center">
                    <img src={searchIcon.src} alt="Search" className="mb-1 ml-3 h-4 w-4 opacity-70" />
                    <input
                      type="text"
                      placeholder={isLoading ? 'AI is thinking...' : 'Ask anything'}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      disabled={isLoading}
                      className="mb-1 flex-1 border-none bg-transparent px-3 text-[14px] text-white outline-none placeholder:text-white focus:shadow-none focus:outline-none focus:ring-0 disabled:opacity-50"
                    />
                    <button
                      onClick={() => chatFileInputRef.current?.click()}
                      disabled={uploadingFiles || isLoading}
                      className="mr-1 rounded-full p-2 transition hover:bg-white/10 disabled:opacity-50"
                      title="Attach files"
                    >
                      {uploadingFiles ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#10F3FE]/30 border-t-[#10F3FE]"></div>
                      ) : (
                        <svg className="h-5 w-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      )}
                    </button>
                    <div className="mr-1 rounded-full p-2 transition hover:bg-white/10">
                      <img src={micIcon.src} alt="Mic" />
                    </div>
                    <CutoutShell className="-mt-[2px]">
                      <button
                        className={`cursor-pointer p-4 transition hover:bg-cyan-400/30 ${
                          isLoading ? 'cursor-not-allowed opacity-50' : ''
                        }`}
                        style={{ width: '70px', height: '65px' }}
                        onClick={handleSendMessage}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="ml-1 mt-1 animate-spin text-lg text-[#10F3FE]">⟳</div>
                        ) : (
                          <img src={sendArrowIcon.src} alt="Send" className="ml-1 mt-1" />
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

      <div className="absolute left-[40%] top-1 z-50 flex gap-4">
        <CutoutShell>
          <div className="flex items-center gap-2 px-4 pb-2" style={{ width: '200px', height: '65px' }}>
            <img src={chatIcon.src} alt="General Chat" className="mt-2" />
            <span className="text-base text-white">General Chat</span>
          </div>
        </CutoutShell>
        <CutoutShell>
          <div className="flex items-center gap-2 px-4 pb-2" style={{ width: '200px', height: '65px' }}>
            <img src={canvasIcon.src} alt="Canvas" className="mt-2" />
            <span className="text-base text-white">Canvas</span>
            <img src={downChevron.src} alt="Dropdown" className="absolute right-4 mt-2" />
          </div>
        </CutoutShell>
        <CutoutShell>
          <button
            onClick={() => setShowWatchLive(!showWatchLive)}
            className="flex w-full items-center gap-2 px-4 pb-2 transition hover:bg-white/10"
            style={{ width: '200px', height: '65px' }}
          >
            <img src={watchIcon.src} alt="Watch Live" className="mt-2" />
            <span className="text-base text-white">Watch Live</span>
          </button>
        </CutoutShell>
      </div>

      <img
        src={borderDesignLeft.src}
        alt="Border Decoration"
        className="pointer-events-none absolute -top-14 left-20 z-50 -rotate-90 select-none"
      />
      <img
        src={borderDesignRight.src}
        alt="Border Decoration"
        className="pointer-events-none absolute bottom-40 right-0 z-50 translate-x-1/2 -rotate-90 select-none"
      />

      {/* Watch Live Panel - Half Width Side by Side */}
      {showWatchLive && (
        <div className="absolute right-4 top-24 z-[100] w-[calc(50%-2rem)]">
          <div className="relative">
            {/* Teal Glowing Border Effect */}
            <div className="absolute inset-0 rounded-lg bg-[#10F3FE] opacity-50 blur-xl"></div>
            <div className="absolute inset-0 rounded-lg border-2 border-[#10F3FE] shadow-[0_0_20px_rgba(16,243,254,0.5)]"></div>
            
            {/* Panel Content */}
            <div className="relative rounded-lg border-2 border-[#10F3FE] bg-[#001a1f]/98 backdrop-blur-md" style={{ height: 'calc(100vh - 280px)' }}>
              <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-[#10F3FE]/30 bg-gradient-to-r from-[#10F3FE]/20 to-transparent p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#10F3FE] shadow-[0_0_10px_rgba(16,243,254,0.8)]"></div>
                    <h3 className="text-sm font-bold text-[#10F3FE]">LIVE CODE GENERATION</h3>
                    {liveSteps.length > 0 && (
                      <span className="rounded-full bg-[#10F3FE]/20 px-2 py-0.5 text-xs font-semibold text-[#10F3FE]">
                        {liveSteps.length} ops
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowWatchLive(false)}
                    className="rounded-md bg-[#10F3FE]/10 px-2.5 py-1 text-xs text-[#10F3FE] transition hover:bg-[#10F3FE]/20"
                  >
                    ✕ Close
                  </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-3">
                  {liveSteps.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-[#10F3FE]/50">
                      <div className="text-center">
                        <div className="mb-3 text-5xl">👀</div>
                        <p className="text-sm">Waiting for AI to start generating...</p>
                        <div className="mt-4 flex justify-center gap-2">
                          <div className="h-2 w-2 animate-pulse rounded-full bg-[#10F3FE]/50"></div>
                          <div className="h-2 w-2 animate-pulse rounded-full bg-[#10F3FE]/50" style={{ animationDelay: '0.2s' }}></div>
                          <div className="h-2 w-2 animate-pulse rounded-full bg-[#10F3FE]/50" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {liveSteps.map((step, index) => (
                        <div
                          key={index}
                          className="group rounded-md border border-[#10F3FE]/30 bg-black/40 p-2.5 transition hover:border-[#10F3FE]/50 hover:bg-black/60"
                        >
                          {/* Tool Call */}
                          {step.type === 'tool_call' && (
                            <div>
                              <div className="mb-1.5 flex items-center gap-2">
                                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]"></div>
                                <span className="text-xs font-bold text-yellow-400">⚡ EXECUTING</span>
                                <span className="text-xs text-white/60">{new Date(step.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <div className="text-xs text-white">
                                🔧 <span className="font-mono font-semibold text-[#10F3FE]">{step.tool_name}</span>
                              </div>
                              {step.tool_args && step.tool_args.file_path && (
                                <div className="mt-1 text-xs text-white/70">
                                  📄 {step.tool_args.file_path}
                                </div>
                              )}
                              {step.tool_args && step.tool_args.project_name && (
                                <div className="mt-1 text-xs text-white/70">
                                  📦 {step.tool_args.project_name}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tool Result - with Code Preview */}
                          {step.type === 'tool_result' && (
                            <div>
                              <div className="mb-1.5 flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                                <span className="text-xs font-bold text-green-400">✓ COMPLETED</span>
                                <span className="text-xs text-white/60">{new Date(step.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <div className="text-xs text-white">
                                ✓ <span className="font-mono font-semibold text-green-400">{step.tool_name}</span>
                              </div>
                              
                              {/* File Path with Folder Structure */}
                              {step.tool_result?.file_path && (
                                <div className="mt-2 space-y-1">
                                  <div className="flex items-center gap-1 text-xs">
                                    {step.tool_result.file_path.split('/').map((part: string, i: number, arr: string[]) => (
                                      <div key={i} className="flex items-center gap-1">
                                        <span className={i === arr.length - 1 ? 'text-[#10F3FE] font-semibold' : 'text-white/50'}>
                                          {i < arr.length - 1 ? '📁' : '📄'} {part}
                                        </span>
                                        {i < arr.length - 1 && <span className="text-white/30">/</span>}
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Code Preview */}
                                  {step.tool_args && step.tool_args.content && step.tool_name === 'write_file' && (
                                    <details className="mt-2 group/code">
                                      <summary className="cursor-pointer text-xs text-[#10F3FE]/70 hover:text-[#10F3FE] flex items-center gap-1">
                                        <span className="group-open/code:rotate-90 transition-transform">▶</span>
                                        View Code
                                      </summary>
                                      <div className="mt-1 max-h-[200px] overflow-auto rounded bg-black/80 p-2 border border-[#10F3FE]/20">
                                        <pre className="text-[10px] text-white/80 font-mono leading-tight">
                                          {step.tool_args.content.substring(0, 500)}
                                          {step.tool_args.content.length > 500 && (
                                            <span className="text-[#10F3FE]/50">\n... ({step.tool_args.content.length - 500} more chars)</span>
                                          )}
                                        </pre>
                                      </div>
                                    </details>
                                  )}
                                </div>
                              )}
                              
                              {step.tool_result?.message && (
                                <div className="mt-1 text-xs text-white/60">
                                  {step.tool_result.message}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Progress */}
                          {step.type === 'progress' && step.progress && (
                            <div>
                              <div className="mb-1.5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10F3FE]"></div>
                                  <span className="text-xs font-semibold text-white">{step.content}</span>
                                </div>
                                <span className="text-xs font-bold text-[#10F3FE]">
                                  {step.progress.percentage}%
                                </span>
                              </div>
                              <div className="relative h-1.5 overflow-hidden rounded-full bg-white/10">
                                <div
                                  className="h-full bg-gradient-to-r from-[#10F3FE] via-cyan-400 to-[#10F3FE] transition-all duration-500 shadow-[0_0_10px_rgba(16,243,254,0.5)]"
                                  style={{ width: `${step.progress.percentage}%` }}
                                />
                              </div>
                              <div className="mt-1 flex items-center justify-between text-xs text-white/60">
                                <span>{step.progress.current} / {step.progress.total} files</span>
                                <span>{new Date(step.timestamp).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      <div ref={liveEndRef} />
                    </div>
                  )}
                </div>

                {/* Footer Stats */}
                <div className="border-t-2 border-[#10F3FE]/30 bg-gradient-to-r from-[#10F3FE]/10 to-transparent p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-white/70">
                      Total: <span className="font-bold text-[#10F3FE]">{liveSteps.length}</span> operations
                    </div>
                    <div className="flex items-center gap-2">
                      {isLoading && (
                        <>
                          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#10F3FE] shadow-[0_0_8px_rgba(16,243,254,0.8)]"></div>
                          <span className="text-xs font-semibold text-[#10F3FE]">Generating...</span>
                        </>
                      )}
                      {!isLoading && liveSteps.length > 0 && (
                        <>
                          <div className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                          <span className="text-xs font-semibold text-green-400">Complete</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCompletionModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-[600px] rounded-lg bg-gradient-to-br from-[#10F3FE]/20 to-[#002B2F] p-8 shadow-2xl">
            <div className="mb-4 text-center text-6xl">🎉</div>
            <h2 className="mb-2 text-center text-3xl font-bold text-white">Your Project is Complete!</h2>
            <p className="mb-6 text-center text-lg text-white/80">
              {completedProjectName} has been successfully generated
            </p>

            {/* Image Upload Section */}
            <div className="mb-6 rounded-lg border border-white/20 bg-black/20 p-4">
              <p className="mb-3 text-center text-sm text-white/80">Would you like to upload an app logo?</p>
              {completedProjectImage ? (
                <div className="flex items-center justify-center gap-4">
                  <img 
                    src={completedProjectImage} 
                    alt="App logo" 
                    className="h-20 w-20 rounded-lg object-cover border-2 border-[#10F3FE]"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-[#10F3FE] hover:underline"
                  >
                    Change Image
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="mx-auto flex items-center gap-2 rounded-lg border border-[#10F3FE] px-4 py-2 text-sm font-semibold text-[#10F3FE] transition hover:bg-[#10F3FE]/10 disabled:opacity-50"
                >
                  {uploadingImage ? 'Uploading...' : '📸 Upload Image'}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Action Question */}
            <p className="mb-4 text-center text-white">What would you like to do?</p>
            
            {/* Action Buttons */}
            <div className="flex gap-3 justify-center mb-4">
              <button
                onClick={handleDownloadApp}
                className="flex-1 rounded-lg border border-[#10F3FE] px-6 py-3 font-semibold text-[#10F3FE] transition hover:bg-[#10F3FE]/10"
              >
                📥 Download App
              </button>
              <button
                onClick={handleRunApp}
                className={`flex-1 rounded-lg px-6 py-3 font-semibold transition ${
                  serverRunning
                    ? 'border border-red-500 bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-[#10F3FE] text-black hover:bg-[#10F3FE]/80'
                }`}
              >
                {serverRunning ? '⏹️ Stop Server' : '▶️ Run App'}
              </button>
            </div>

            {/* Secondary Actions */}
            <div className="flex gap-3 justify-center">
              <a
                href="/workspaces"
                className="text-sm text-white/70 hover:text-white hover:underline"
              >
                View in Workspaces
              </a>
              <button
                onClick={() => setShowCompletionModal(false)}
                className="text-sm text-white/70 hover:text-white hover:underline"
              >
                Continue Chatting
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
