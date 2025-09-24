'use client'
import { useSession } from 'next-auth/react'
import { LandingLayout } from '@/components/landing/LandingLayout'
import LoginPage from '@/components/auth/LoginPage'

export default function Home() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="nb-bg flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#10F3FE] border-t-transparent" />
      </div>
    )
  }

  if (!session) {
    return <LoginPage />
  }

  return <LandingLayout />
}
