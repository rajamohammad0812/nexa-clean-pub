'use client'
import Header from './Header'
import LeftSideNav from './LeftSideNav'
import MainContent from './MainContent'
import RightSideNav from './RightSideNav'

export function LandingLayout() {
  return (
    <div className="nb-bg flex h-screen flex-col overflow-hidden pb-6 pl-4 pr-4 pt-0 text-cyan-100">
      <Header className="min-h-0 flex-shrink-0" />
      <div className="grid min-h-0 flex-1 grid-cols-12 grid-rows-1 gap-4 overflow-hidden">
        <LeftSideNav className="col-span-3 min-w-0 lg:col-span-2" />
        <MainContent className="col-span-6 min-w-0 lg:col-span-8" />
        <RightSideNav className="col-span-3 min-w-0 lg:col-span-2" />
      </div>
    </div>
  )
}
