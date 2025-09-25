'use client'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'
import { User, Mail, Calendar, Shield, Key, Eye, EyeOff } from 'lucide-react'
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
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)

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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    })
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    setIsPasswordLoading(true)

    try {
      // Validate passwords match on client side
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordError('New passwords do not match')
        return
      }

      // Validate password length
      if (passwordForm.newPassword.length < 8) {
        setPasswordError('Password must be at least 8 characters long')
        return
      }

      // Call the password change API
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordForm),
      })

      const data = await response.json()

      if (response.ok) {
        setPasswordSuccess(data.message || 'Password updated successfully!')
        // Clear the form
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        setPasswordError(data.error || 'Failed to update password')
      }
    } catch (error) {
      console.error('Password change error:', error)
      setPasswordError('An error occurred while updating password')
    } finally {
      setIsPasswordLoading(false)
    }
  }

  return (
    <AuthenticatedLayout>
      <div className="flex h-full flex-col overflow-hidden p-6 text-cyan-100">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#10F3FE]">Profile Settings</h1>
          <p className="text-sm text-cyan-200/80">Manage your account settings and preferences</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <CutoutShell className="h-fit w-fit">
            <div className="flex">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'general'
                    ? 'text-[#10F3FE] bg-[#10F3FE]/10'
                    : 'text-cyan-200/80 hover:text-white hover:bg-[#10F3FE]/5'
                }`}
              >
                <User className="inline h-4 w-4 mr-2" />
                General
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'password'
                    ? 'text-[#10F3FE] bg-[#10F3FE]/10'
                    : 'text-cyan-200/80 hover:text-white hover:bg-[#10F3FE]/5'
                }`}
              >
                <Key className="inline h-4 w-4 mr-2" />
                Password
              </button>
            </div>
          </CutoutShell>
        </div>

        {/* Profile Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'general' && (
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
          )}

          {activeTab === 'password' && (
            <div className="max-w-2xl mx-auto">
              <CutoutShell className="h-fit">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
                  <p className="text-cyan-200/80 text-sm mb-6">
                    Update your password to keep your account secure.
                  </p>
                  
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    {/* Current Password */}
                    <div className="space-y-2">
                      <label htmlFor="currentPassword" className="text-sm font-medium text-cyan-200">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          id="currentPassword"
                          name="currentPassword"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordChange}
                          className="w-full bg-[#10F3FE]/5 border border-[#10F3FE]/20 rounded-lg px-4 py-3 text-white placeholder-cyan-300/50 focus:outline-none focus:border-[#10F3FE] focus:ring-1 focus:ring-[#10F3FE]/50 transition-colors"
                          placeholder="Enter current password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-300/70 hover:text-[#10F3FE] transition-colors"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                      <label htmlFor="newPassword" className="text-sm font-medium text-cyan-200">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          id="newPassword"
                          name="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full bg-[#10F3FE]/5 border border-[#10F3FE]/20 rounded-lg px-4 py-3 text-white placeholder-cyan-300/50 focus:outline-none focus:border-[#10F3FE] focus:ring-1 focus:ring-[#10F3FE]/50 transition-colors"
                          placeholder="Enter new password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-300/70 hover:text-[#10F3FE] transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="text-sm font-medium text-cyan-200">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full bg-[#10F3FE]/5 border border-[#10F3FE]/20 rounded-lg px-4 py-3 text-white placeholder-cyan-300/50 focus:outline-none focus:border-[#10F3FE] focus:ring-1 focus:ring-[#10F3FE]/50 transition-colors"
                          placeholder="Confirm new password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-300/70 hover:text-[#10F3FE] transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-[#10F3FE]/5 border border-[#10F3FE]/20 rounded-lg p-4 mt-4">
                      <h4 className="text-sm font-medium text-cyan-200 mb-2">Password Requirements:</h4>
                      <ul className="text-xs text-cyan-300/70 space-y-1">
                        <li>• At least 8 characters long</li>
                        <li>• Contains at least one uppercase letter</li>
                        <li>• Contains at least one lowercase letter</li>
                        <li>• Contains at least one number</li>
                        <li>• Contains at least one special character</li>
                      </ul>
                    </div>

                    {/* Success Message */}
                    {passwordSuccess && (
                      <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3 text-center text-sm text-green-300">
                        {passwordSuccess}
                      </div>
                    )}

                    {/* Error Message */}
                    {passwordError && (
                      <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-center text-sm text-red-300">
                        {passwordError}
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex gap-4 pt-6">
                      <button
                        type="submit"
                        disabled={isPasswordLoading}
                        className="flex-1 bg-[#10F3FE] text-black px-4 py-3 rounded-lg font-medium hover:bg-[#10F3FE]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isPasswordLoading ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                            Updating...
                          </>
                        ) : (
                          'Update Password'
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={isPasswordLoading}
                        onClick={() => {
                          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                          setPasswordError('')
                          setPasswordSuccess('')
                        }}
                        className="flex-1 bg-gray-600/20 text-gray-300 px-4 py-3 rounded-lg font-medium hover:bg-gray-600/30 transition-colors border border-gray-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </CutoutShell>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}