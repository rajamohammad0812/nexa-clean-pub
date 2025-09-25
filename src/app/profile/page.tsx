'use client'
import { useSession } from 'next-auth/react'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'
import { User, Mail, Calendar, Shield } from 'lucide-react'
import { redirect } from 'next/navigation'

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

export default function ProfilePage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#10F3FE] border-t-transparent" />
            <p className="mt-4 text-cyan-200">Loading profile...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  if (!session) {
    return null
  }

  const userName = session.user?.name || session.user?.email?.split('@')[0] || 'User'
  const userEmail = session.user?.email || ''
  const userImage = session.user?.image

  return (
    <AuthenticatedLayout>
      <div className="flex h-full flex-col overflow-hidden p-6 text-cyan-100">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#10F3FE]">Profile Settings</h1>
          <p className="text-sm text-cyan-200/80">Manage your account settings and preferences</p>
        </div>

        {/* Profile Content */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <CutoutShell className="h-fit">
                <div className="p-6">
                  <div className="text-center">
                    {userImage ? (
                      <img
                        src={userImage}
                        alt="User avatar"
                        className="mx-auto h-24 w-24 rounded-full mb-4"
                      />
                    ) : (
                      <div className="mx-auto h-24 w-24 rounded-full bg-[#10F3FE]/20 flex items-center justify-center mb-4">
                        <User className="h-12 w-12 text-[#10F3FE]" />
                      </div>
                    )}
                    <h2 className="text-xl font-bold text-white mb-2">{userName}</h2>
                    <p className="text-cyan-200/80 text-sm mb-4">{userEmail}</p>
                    
                    <button className="w-full bg-[#10F3FE]/10 border border-[#10F3FE]/30 text-[#10F3FE] px-4 py-2 rounded-lg hover:bg-[#10F3FE]/20 transition-colors">
                      Change Photo
                    </button>
                  </div>
                </div>
              </CutoutShell>
            </div>

            {/* Account Information */}
            <div className="lg:col-span-2">
              <CutoutShell className="h-fit">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
                  
                  <div className="space-y-4">
                    {/* Name Field */}
                    <div className="flex items-center gap-3 p-4 bg-[#10F3FE]/5 rounded-lg border border-[#10F3FE]/20">
                      <User className="h-5 w-5 text-[#10F3FE]" />
                      <div className="flex-1">
                        <span className="text-sm text-cyan-200/80">Display Name</span>
                        <p className="text-white font-medium">{userName}</p>
                      </div>
                    </div>

                    {/* Email Field */}
                    <div className="flex items-center gap-3 p-4 bg-[#10F3FE]/5 rounded-lg border border-[#10F3FE]/20">
                      <Mail className="h-5 w-5 text-[#10F3FE]" />
                      <div className="flex-1">
                        <span className="text-sm text-cyan-200/80">Email Address</span>
                        <p className="text-white font-medium">{userEmail}</p>
                      </div>
                    </div>

                    {/* Account Type */}
                    <div className="flex items-center gap-3 p-4 bg-[#10F3FE]/5 rounded-lg border border-[#10F3FE]/20">
                      <Shield className="h-5 w-5 text-[#10F3FE]" />
                      <div className="flex-1">
                        <span className="text-sm text-cyan-200/80">Account Type</span>
                        <p className="text-white font-medium">Standard User</p>
                      </div>
                    </div>

                    {/* Member Since */}
                    <div className="flex items-center gap-3 p-4 bg-[#10F3FE]/5 rounded-lg border border-[#10F3FE]/20">
                      <Calendar className="h-5 w-5 text-[#10F3FE]" />
                      <div className="flex-1">
                        <span className="text-sm text-cyan-200/80">Member Since</span>
                        <p className="text-white font-medium">
                          {new Date().toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <div className="flex gap-4">
                      <button className="flex-1 bg-[#10F3FE] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#10F3FE]/90 transition-colors">
                        Update Profile
                      </button>
                      <button className="flex-1 bg-red-500/20 text-red-300 px-4 py-2 rounded-lg font-medium hover:bg-red-500/30 transition-colors border border-red-500/30">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </CutoutShell>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}