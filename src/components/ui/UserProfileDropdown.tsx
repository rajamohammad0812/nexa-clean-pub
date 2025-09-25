'use client'
import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User, Settings, LogOut, ChevronDown, Key } from 'lucide-react'

const CLIP = "polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)"

function CutoutShell({
  clip = CLIP,
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
      <div className="absolute inset-0 bg-[#10F3FE]" style={{ clipPath: clip }} />
      <div
        className={`relative bg-[#000000] ${innerClassName}`}
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

interface UserProfileDropdownProps {
  className?: string
}

export default function UserProfileDropdown({ className = "" }: UserProfileDropdownProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debug logging
  console.log('UserProfileDropdown - Session status:', status)
  console.log('UserProfileDropdown - Session data:', session)
  console.log('UserProfileDropdown - Dropdown open:', isOpen)

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Button clicked, current state:', isOpen)
    setIsOpen(!isOpen)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Always show the dropdown for now (for testing)
  if (status === 'loading') {
    return (
      <CutoutShell className={`h-[45px] w-[140px] ${className}`}>
        <div className="flex items-center justify-center px-3 py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#10F3FE] border-t-transparent"></div>
          <span className="ml-2 text-white text-sm">Loading...</span>
        </div>
      </CutoutShell>
    )
  }

  // Show a placeholder if not authenticated (for testing purposes)
  if (status === 'unauthenticated' || !session) {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button 
          onClick={handleButtonClick}
          className="h-[45px] w-[140px] bg-black border-2 border-[#10F3FE] flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-[#10F3FE]/10 transition-colors"
          style={{
            clipPath: CLIP
          }}
        >
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-[#10F3FE]" />
            <span className="text-white text-sm font-medium">Guest</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-[#10F3FE] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Simple test dropdown */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-black border-2 border-[#10F3FE] rounded-lg shadow-2xl z-[9999]">
            <div className="p-4">
              <p className="text-white text-sm mb-2">You are not logged in</p>
              <button 
                onClick={() => router.push('/auth/signin')}
                className="w-full bg-[#10F3FE] text-black px-4 py-2 rounded text-sm font-medium hover:bg-[#10F3FE]/80 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const userName = session.user?.name || session.user?.email?.split('@')[0] || 'User'
  const userEmail = session.user?.email || ''

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
    setIsOpen(false)
  }

  const handleProfileClick = () => {
    router.push('/profile')
    setIsOpen(false)
  }

  const handleResetPassword = () => {
    // For now, just redirect to profile page where they can change password
    // In the future, you might want a separate reset password flow
    router.push('/profile?tab=password')
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* User Button */}
      <button 
        onClick={handleButtonClick}
        className="h-[45px] w-[140px] bg-black border-2 border-[#10F3FE] cursor-pointer hover:bg-[#10F3FE]/10 transition-colors"
        style={{
          clipPath: CLIP
        }}
      >
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            {session.user?.image ? (
              <img
                src={session.user.image}
                alt="User Avatar"
                className="h-6 w-6 rounded-full"
              />
            ) : (
              <User className="h-5 w-5 text-[#10F3FE]" />
            )}
            <span className="text-white text-sm font-medium truncate max-w-[60px]">
              {userName}
            </span>
          </div>
          <ChevronDown 
            className={`h-4 w-4 text-[#10F3FE] transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </button>

      {/* Dropdown Menu - Simplified for better visibility */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-[#05181E] border-2 border-[#10F3FE] rounded-lg shadow-2xl z-[9999]">
          <div className="relative">
              <div className="py-2">
                {/* User Info Section */}
                <div className="px-4 py-3 border-b border-[#10F3FE]/20">
                  <div className="flex items-center gap-3">
                    {session.user?.image ? (
                      <img
                        src={session.user.image}
                        alt="User Avatar"
                        className="h-10 w-10 rounded-full border-2 border-[#10F3FE]/30"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-[#10F3FE]/20 border-2 border-[#10F3FE]/30 flex items-center justify-center">
                        <User className="h-6 w-6 text-[#10F3FE]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate text-sm">{userName}</p>
                      <p className="text-cyan-300/70 text-xs truncate">{userEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-[#10F3FE]/10 transition-all duration-200 hover:text-[#10F3FE]"
                  >
                    <User className="h-4 w-4 text-[#10F3FE]" />
                    <span className="font-medium">Profile</span>
                  </button>

                  <button
                    onClick={handleResetPassword}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-[#10F3FE]/10 transition-all duration-200 hover:text-[#10F3FE]"
                  >
                    <Key className="h-4 w-4 text-[#10F3FE]" />
                    <span className="font-medium">Reset Password</span>
                  </button>

                  <div className="border-t border-[#10F3FE]/20 mt-1 pt-1">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-4 py-3 text-left text-red-300 hover:bg-red-500/10 transition-all duration-200 hover:text-red-200"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
          </div>
        </div>
      )}
    </div>
  )
}