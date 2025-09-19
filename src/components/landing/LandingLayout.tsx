"use client"
import Header from './Header'
import LeftSideNav from './LeftSideNav'
import MainContent from './MainContent'
import RightSideNav from './RightSideNav'

export function LandingLayout() {
  return (
    <div className="min-h-screen pt-0 pb-6 pr-4 pl-4 nb-bg text-cyan-100 flex flex-col">
      <Header />
      <div className="flex-1 min-h-0 grid grid-cols-12 grid-rows-1 gap-4">
        <LeftSideNav className="col-span-3 lg:col-span-2" />
        <MainContent className="col-span-6 lg:col-span-8" />
        <RightSideNav className="col-span-3 lg:col-span-2" />
      </div>
    </div>
  )
}
