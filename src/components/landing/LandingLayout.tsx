'use client'
import { AuthenticatedLayout } from '../layout/AuthenticatedLayout'
import MainContent from './MainContent'

export function LandingLayout() {
  return (
    <AuthenticatedLayout>
      <MainContent className="h-full" />
    </AuthenticatedLayout>
  )
}
