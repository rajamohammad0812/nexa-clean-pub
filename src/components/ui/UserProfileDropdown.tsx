'use client'
import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'

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

  // Don't render if not authenticated
  if (status === 'loading') {
    return (
      <CutoutShell className={`h-[45px] w-[140px] ${className}`}>
        <div className="flex items-center justify-center px-3 py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#10F3FE] border-t-transparent"></div>
        </div>
      </CutoutShell>
    )
  }

  if (status === 'unauthenticated' || !session) {
    return null
  }

  const userName = session.user?.name || session.user?.email?.split('@')[0] || 'User'
  const userEmail = session.user?.email || ''

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
    setIsOpen(false)
  }

  const handleProfileClick = () => {
    router.push('/profile')
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* User Button */}
      <CutoutShell className="h-[45px] w-[140px] cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
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
      </CutoutShell>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 z-50">
          <CutoutShell className="w-full">
            <div className="py-2">
              {/* User Info Section */}
              <div className="px-4 py-3 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt="User Avatar"
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-[#10F3FE]/20 flex items-center justify-center">
                      <User className="h-6 w-6 text-[#10F3FE]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{userName}</p>
                    <p className="text-gray-400 text-sm truncate">{userEmail}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={handleProfileClick}
                  className="flex items-center gap-3 w-full px-4 py-2 text-left text-white hover:bg-[#10F3FE]/10 transition-colors"
                >
                  <Settings className="h-4 w-4 text-[#10F3FE]" />
                  <span>Profile Settings</span>
                </button>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full px-4 py-2 text-left text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </CutoutShell>
        </div>
      )}
    </div>
  )
}