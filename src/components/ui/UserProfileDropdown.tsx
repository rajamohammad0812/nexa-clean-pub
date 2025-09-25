'use client'
import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User, LogOut, ChevronDown, Key } from 'lucide-react'

const CLIP =
  'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)'

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

export default function UserProfileDropdown({ className = '' }: UserProfileDropdownProps) {
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
          <span className="ml-2 text-sm text-white">Loading...</span>
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
          className="flex h-[45px] w-[140px] cursor-pointer items-center justify-between border-2 border-[#10F3FE] bg-black px-3 py-2 transition-colors hover:bg-[#10F3FE]/10"
          style={{
            clipPath: CLIP,
          }}
        >
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-[#10F3FE]" />
            <span className="text-sm font-medium text-white">Guest</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-[#10F3FE] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Simple test dropdown */}
        {isOpen && (
          <div className="absolute right-0 top-full z-[9999] mt-2 w-64 rounded-lg border-2 border-[#10F3FE] bg-black shadow-2xl">
            <div className="p-4">
              <p className="mb-2 text-sm text-white">You are not logged in</p>
              <button
                onClick={() => router.push('/auth/signin')}
                className="w-full rounded bg-[#10F3FE] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-[#10F3FE]/80"
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
        className="h-[45px] w-[140px] cursor-pointer border-2 border-[#10F3FE] bg-black transition-colors hover:bg-[#10F3FE]/10"
        style={{
          clipPath: CLIP,
        }}
      >
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            {session.user?.image ? (
              <img src={session.user.image} alt="User Avatar" className="h-6 w-6 rounded-full" />
            ) : (
              <User className="h-5 w-5 text-[#10F3FE]" />
            )}
            <span className="max-w-[60px] truncate text-sm font-medium text-white">{userName}</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-[#10F3FE] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Menu - Simplified for better visibility */}
      {isOpen && (
        <div className="absolute right-0 top-full z-[9999] mt-2 w-64 rounded-lg border-2 border-[#10F3FE] bg-[#05181E] shadow-2xl">
          <div className="relative">
            <div className="py-2">
              {/* User Info Section */}
              <div className="border-b border-[#10F3FE]/20 px-4 py-3">
                <div className="flex items-center gap-3">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt="User Avatar"
                      className="h-10 w-10 rounded-full border-2 border-[#10F3FE]/30"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#10F3FE]/30 bg-[#10F3FE]/20">
                      <User className="h-6 w-6 text-[#10F3FE]" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{userName}</p>
                    <p className="truncate text-xs text-cyan-300/70">{userEmail}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={handleProfileClick}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-white transition-all duration-200 hover:bg-[#10F3FE]/10 hover:text-[#10F3FE]"
                >
                  <User className="h-4 w-4 text-[#10F3FE]" />
                  <span className="font-medium">Profile</span>
                </button>

                <button
                  onClick={handleResetPassword}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-white transition-all duration-200 hover:bg-[#10F3FE]/10 hover:text-[#10F3FE]"
                >
                  <Key className="h-4 w-4 text-[#10F3FE]" />
                  <span className="font-medium">Reset Password</span>
                </button>

                <div className="mt-1 border-t border-[#10F3FE]/20 pt-1">
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-red-300 transition-all duration-200 hover:bg-red-500/10 hover:text-red-200"
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
