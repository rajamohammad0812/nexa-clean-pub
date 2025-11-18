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
}

interface AgentStep {
  type: 'tool_call' | 'tool_result' | 'response' | 'progress'
  content: string
  tool_name?: string
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const clipPath =
    'polygon(25px 0, 35% 0, calc(35% + 25px) 25px, calc(35% + 25px) 70px, 39% 90px, 97.5% 90px, 100% 110px, 100% calc(100% - 25px), calc(100% - 25px) 100%, 0 100%, 0 25px)'
  const clipPathInner =
    'polygon(25px 0, 34.8% 0, calc(35% + 22px) 25px, calc(35% + 22px) 70px, 38.8% 90px, 97.5% 90px, 100% 110px, 100% calc(100% - 25px), calc(100% - 25px) 100%, 0 100%, 0 25px)'

  useEffect(() => {
    if (messagesEndRef.current) {
      const chatContainer = messagesEndRef.current.closest('.overflow-y-auto')
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    }
  }, [messages, agentSteps])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue('')

    const newMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
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
              } else if (data.type === 'tool_result') {
                setAgentSteps((prev) => [...prev, data])
                
                if (data.tool_name === 'create_project' && data.tool_result?.success) {
                  const projectName = data.tool_result.project_name || 'your project'
                  setCompletedProjectName(projectName)
                  setShowCompletionModal(true)
                }
              } else if (data.type === 'progress') {
                setAgentSteps((prev) => [...prev, data])
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
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
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
              className="absolute overflow-hidden rounded-lg bg-black/20 backdrop-blur-sm"
              style={{
                left: '20px',
                right: '20px',
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
                            <span className="text-sm">AI Agent working...</span>
                          </div>

                          {agentSteps.slice(-3).map((step, index) => (
                            <div key={index} className="text-xs text-white/70">
                              {step.type === 'tool_call' && `🔧 ${step.content}`}
                              {step.type === 'tool_result' && `✓ ${step.content}`}
                              {step.type === 'progress' && step.progress && (
                                <div className="mt-1">
                                  <div className="mb-1 text-xs">{step.content}</div>
                                  <div className="h-2 w-48 overflow-hidden rounded-full bg-white/10">
                                    <div
                                      className="h-full bg-[#10F3FE] transition-all"
                                      style={{ width: `${step.progress.percentage}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          {currentProgress && (
                            <div className="text-xs text-[#10F3FE]">
                              Progress: {currentProgress.percentage}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/20 p-3 backdrop-blur-sm">
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
                onClick={() => setMessages([])}
                className="absolute right-2 top-2 rounded bg-black/40 px-2 py-1 text-xs text-white backdrop-blur-sm transition hover:bg-black/60"
              >
                Clear
              </button>
            </div>
          )}

          {messages.length === 0 && (
            <div className="mt-8">
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
          <div className="flex items-center gap-2 px-4 pb-2" style={{ width: '200px', height: '65px' }}>
            <img src={watchIcon.src} alt="Watch Live" className="mt-2" />
            <span className="text-base text-white">Watch Live</span>
          </div>
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

      {showCompletionModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-[500px] rounded-lg bg-gradient-to-br from-[#10F3FE]/20 to-[#002B2F] p-8 text-center shadow-2xl">
            <div className="mb-4 text-6xl">🎉</div>
            <h2 className="mb-2 text-3xl font-bold text-white">Project Created!</h2>
            <p className="mb-6 text-lg text-white/80">
              {completedProjectName} has been successfully generated
            </p>
            <div className="flex gap-3 justify-center">
              <a
                href="/workspaces"
                className="rounded-lg bg-[#10F3FE] px-6 py-3 font-semibold text-black transition hover:bg-[#10F3FE]/80"
              >
                View in Workspaces
              </a>
              <button
                onClick={() => setShowCompletionModal(false)}
                className="rounded-lg border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
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
