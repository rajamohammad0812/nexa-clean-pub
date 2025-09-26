'use client'
import Header from '../landing/Header'
import LeftSideNav from '../landing/LeftSideNav'
import RightSideNav from '../landing/RightSideNav'

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <div className="nb-bg flex h-screen flex-col overflow-hidden pb-6 pl-4 pr-4 pt-0 text-cyan-100">
      <Header className="min-h-0 flex-shrink-0" />
      <div className="grid min-h-0 flex-1 grid-cols-12 grid-rows-1 gap-4 overflow-hidden">
        <LeftSideNav className="col-span-3 min-w-0 lg:col-span-2" />
        <main className="col-span-6 min-w-0 overflow-hidden lg:col-span-8">{children}</main>
        <RightSideNav className="col-span-3 min-w-0 lg:col-span-2" />
      </div>
    </div>
  )
}
