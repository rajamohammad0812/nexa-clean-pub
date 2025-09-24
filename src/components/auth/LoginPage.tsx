'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff, User, Lock } from 'lucide-react'
import { Github, Mail, Chrome } from 'lucide-react'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        console.error('Login failed:', result.error)
        // You can add error handling here
      }
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = (provider: 'google' | 'github' | 'azure-ad') => {
    signIn(provider, { callbackUrl: '/' })
  }

  const fullScreenClipPath =
    'polygon(0 0, calc(100% - 50px) 0, 100% 50px, 100% 100%, 50px 100%, 0 calc(100% - 50px))'
  const loginBoxClipPath =
    'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))'

  return (
    <div className="nb-bg flex h-screen overflow-hidden p-4">
      {/* Fullscreen Frame Container */}
      <div
        className="relative h-full w-full"
        style={{
          filter: `
            drop-shadow(0 0 30px rgba(16, 243, 254, 0.3))
            drop-shadow(0 0 45px rgba(16, 243, 254, 0.1))
          `,
        }}
      >
        {/* Outer Frame Border */}
        <div className="absolute inset-0 bg-[#10F3FE]" style={{ clipPath: fullScreenClipPath }} />

        {/* Inner Frame Background */}
        <div
          className="relative flex h-full w-full items-center justify-center bg-[#002B2F]"
          style={{
            clipPath: fullScreenClipPath,
            transform: 'translate(2px, 2px)',
            width: 'calc(100% - 4px)',
            height: 'calc(100% - 4px)',
          }}
        >
          {/* Background Grid Pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(16, 243, 254, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(16, 243, 254, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />

          {/* Login Box */}
          <div
            className="relative z-10"
            style={{
              filter: `
                drop-shadow(0 0 20px rgba(16, 243, 254, 0.4))
                drop-shadow(0 0 30px rgba(16, 243, 254, 0.2))
              `,
            }}
          >
            {/* Login Box Outer Border */}
            <div className="h-[500px] w-96 bg-[#10F3FE]" style={{ clipPath: loginBoxClipPath }} />

            {/* Login Box Inner Container */}
            <div
              className="absolute left-0 top-0 flex h-[500px] w-96 flex-col justify-center bg-[#001A1D] p-8"
              style={{
                clipPath: loginBoxClipPath,
                transform: 'translate(2px, 2px)',
                width: 'calc(100% - 4px)',
                height: 'calc(100% - 4px)',
              }}
            >
              {/* Logo/Brand */}
              <div className="mb-8 text-center">
                <h1 className="mb-2 text-3xl font-bold text-[#10F3FE]">Nexa Builder</h1>
                <p className="text-sm text-cyan-200 opacity-80">
                  Next Generation Automation Platform
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-cyan-100">
                    Email or Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-cyan-300" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-[#10F3FE]/30 bg-[#002B2F] py-3 pl-10 pr-4 text-white placeholder-gray-400 transition-colors focus:border-[#10F3FE] focus:outline-none focus:ring-1 focus:ring-[#10F3FE]/50"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-cyan-100">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-cyan-300" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-[#10F3FE]/30 bg-[#002B2F] py-3 pl-10 pr-12 text-white placeholder-gray-400 transition-colors focus:border-[#10F3FE] focus:outline-none focus:ring-1 focus:ring-[#10F3FE]/50"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transform text-cyan-300 transition-colors hover:text-[#10F3FE]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center text-cyan-200">
                    <input
                      type="checkbox"
                      className="mr-2 h-4 w-4 rounded border border-[#10F3FE]/30 bg-[#002B2F] text-[#10F3FE] focus:ring-1 focus:ring-[#10F3FE]/50"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    className="text-[#10F3FE] transition-colors hover:text-cyan-200"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center rounded-lg bg-[#10F3FE] py-3 font-medium text-black transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              {/* Social Login Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white py-3 font-medium text-black transition-colors hover:bg-gray-100"
                >
                  <Chrome className="h-5 w-5" />
                  Continue with Google
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('github')}
                  className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#24292e] py-3 font-medium text-white transition-colors hover:bg-[#1a1e22]"
                >
                  <Github className="h-5 w-5" />
                  Continue with GitHub
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('azure-ad')}
                  className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#0078d4] py-3 font-medium text-white transition-colors hover:bg-[#106ebe]"
                >
                  <Mail className="h-5 w-5" />
                  Continue with Microsoft
                </button>
              </div>

              {/* Divider */}
              <div className="my-6 flex items-center">
                <hr className="flex-1 border-[#10F3FE]/30" />
                <span className="px-4 text-sm text-cyan-200">or</span>
                <hr className="flex-1 border-[#10F3FE]/30" />
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <span className="text-sm text-cyan-200">
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    className="font-medium text-[#10F3FE] transition-colors hover:text-cyan-300"
                  >
                    Sign up here
                  </button>
                </span>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute left-10 top-10 h-20 w-20 rotate-45 transform border border-[#10F3FE]/20" />
          <div className="absolute bottom-10 right-10 h-16 w-16 rotate-45 transform border border-[#10F3FE]/20" />

          {/* Corner Accent Lines */}
          <div className="absolute left-0 top-0 h-20 w-20">
            <div className="absolute left-8 top-8 h-0.5 w-12 bg-[#10F3FE]/60" />
            <div className="absolute left-8 top-8 h-12 w-0.5 bg-[#10F3FE]/60" />
          </div>
          <div className="absolute right-0 top-0 h-20 w-20">
            <div className="absolute right-8 top-8 h-0.5 w-12 bg-[#10F3FE]/60" />
            <div className="absolute right-8 top-8 h-12 w-0.5 bg-[#10F3FE]/60" />
          </div>
          <div className="absolute bottom-0 left-0 h-20 w-20">
            <div className="absolute bottom-8 left-8 h-0.5 w-12 bg-[#10F3FE]/60" />
            <div className="absolute bottom-8 left-8 h-12 w-0.5 bg-[#10F3FE]/60" />
          </div>
          <div className="absolute bottom-0 right-0 h-20 w-20">
            <div className="absolute bottom-8 right-8 h-0.5 w-12 bg-[#10F3FE]/60" />
            <div className="absolute bottom-8 right-8 h-12 w-0.5 bg-[#10F3FE]/60" />
          </div>
        </div>
      </div>
    </div>
  )
}
