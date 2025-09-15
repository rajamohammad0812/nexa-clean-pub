"use client"
import { Header, LeftSidebar, MainContent, RightSidebar } from "./index";

export function LandingLayout() {
  return (
    <div className="min-h-screen pt-0 pb-4 pr-4 pl-4 nb-bg text-cyan-100 flex flex-col">
      <Header />
      <div className="flex-1 min-h-0 grid grid-cols-12 grid-rows-1 gap-4">
        <LeftSidebar className="col-span-3 lg:col-span-2" />
        <MainContent className="col-span-6 lg:col-span-8" />
        <RightSidebar className="col-span-3 lg:col-span-2" />
      </div>
    </div>
  )
}
