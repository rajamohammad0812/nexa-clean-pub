'use client'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'
import { BarChart3, Users, Zap, TrendingUp } from 'lucide-react'

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

export default function DashboardPage() {
  return (
    <AuthenticatedLayout>
      <div className="flex h-full flex-col overflow-hidden p-6 text-cyan-100">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#10F3FE]">Dashboard</h1>
          <p className="text-sm text-cyan-200/80">Overview of your automation platform</p>
        </div>

        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <CutoutShell className="h-24">
            <div className="flex h-full items-center justify-between p-4">
              <div>
                <p className="text-xs text-cyan-200/80">Total Projects</p>
                <p className="text-xl font-bold text-[#10F3FE]">12</p>
              </div>
              <BarChart3 className="h-8 w-8 text-cyan-300" />
            </div>
          </CutoutShell>

          <CutoutShell className="h-24">
            <div className="flex h-full items-center justify-between p-4">
              <div>
                <p className="text-xs text-cyan-200/80">Active Deployments</p>
                <p className="text-xl font-bold text-[#10F3FE]">8</p>
              </div>
              <Zap className="h-8 w-8 text-green-400" />
            </div>
          </CutoutShell>

          <CutoutShell className="h-24">
            <div className="flex h-full items-center justify-between p-4">
              <div>
                <p className="text-xs text-cyan-200/80">Success Rate</p>
                <p className="text-xl font-bold text-[#10F3FE]">98.5%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CutoutShell>

          <CutoutShell className="h-24">
            <div className="flex h-full items-center justify-between p-4">
              <div>
                <p className="text-xs text-cyan-200/80">Total Users</p>
                <p className="text-xl font-bold text-[#10F3FE]">1</p>
              </div>
              <Users className="h-8 w-8 text-cyan-300" />
            </div>
          </CutoutShell>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <CutoutShell className="h-full">
            <div className="flex h-full items-center justify-center p-6">
              <div className="text-center">
                <div className="mb-4 text-6xl text-[#10F3FE]/20">📊</div>
                <h3 className="mb-2 text-xl font-semibold text-white">Dashboard Overview</h3>
                <p className="text-cyan-200/80">
                  Your automation platform dashboard is coming soon!
                </p>
              </div>
            </div>
          </CutoutShell>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
