"use client"
import Link from 'next/link'
import addNewIcon from '@/components/assets/img/LeftSideNav/addNew.svg'
import searchIcon from '@/components/assets/img/LeftSideNav/search.svg'
import homeIcon from '@/components/assets/img/LeftSideNav/home.svg'
import dashboardIcon from '@/components/assets/img/LeftSideNav/dashboard.svg'
import analyticsIcon from '@/components/assets/img/LeftSideNav/analytics.svg'
import chatsIcon from '@/components/assets/img/LeftSideNav/chats.svg'
import projectsIcon from '@/components/assets/img/LeftSideNav/projects.svg'
import settingsIcon from '@/components/assets/img/LeftSideNav/settings.svg'
import borderDesignIcon from '@/components/assets/img/LeftSideNav/borderDesign.svg'
import hoverDesignIcon from '@/components/assets/img/LeftSideNav/hoverDesign.svg'
import './leftSideNav.css'


type Props = {
  className?: string
}

export default function LeftSidebar({ className = "" }: Props) {
  const clipPath = "polygon(0 0, calc(100% - 25px) 0, 100% 25px, 100% 100%, 25px 100%, 0 calc(100% - 25px))"

  return (
    <aside className={`relative ${className}`}
      style={{
        filter: `
          drop-shadow(0 0 30px rgba(16, 243, 254, 0.3))
          drop-shadow(0 0 45px rgba(16, 243, 254, 0.1))
        `
      }}
    >
      {/* Outer container */}
      <div
        className="absolute inset-0 bg-[#10F3FE]"
        style={{ clipPath }}
      />
      

      {/* Inner container */}
      <div
        className="relative bg-[#05181E] p-6 pl-0 space-y-2 h-full"
        style={{
          clipPath,
          transform: 'translate(2px, 2px)',
          width: 'calc(100% - 4px)',
          height: 'calc(100% - 4px)'
        }}
      >
        <div className="cursor-pointer pl-4 pb-2 flex items-center gap-2 text-[#FFFFFF]">
          <img src={addNewIcon.src} alt="Add New" className="w-4 h-4" />
          Add New Project
        </div>
        <hr
          className=" ml-4 border-0 h-px"
          style={{
            background: "linear-gradient(90deg, rgba(255, 255, 255, 0.5) 0%, transparent 100%)",
            width: "100%",
          }}
        />
        {/* Search Input */}
        <div className="relative pl-4 pt-1">
          <img
            src={searchIcon.src}
            alt="Search"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white opacity-50"
          />
          <input
            className="w-full bg-transparent text-white placeholder-gray-400 pl-6 py-2 border-0 border-b border-transparent focus:border-b-[#10F3FE] focus:outline-none focus:ring-0 focus:shadow-none transition-colors"
            placeholder="Search Projects"
          />
        </div>
        <div className="sidebar-item">
          <img src={homeIcon.src} alt="Home" className="w-4 h-4" />
          Home
          <img src={hoverDesignIcon.src} alt="" className="hover-icon" />
        </div>
        <div className="sidebar-item">
          <img src={dashboardIcon.src} alt="Dashboard" className="w-4 h-4" />
          Dashboard
          <img src={hoverDesignIcon.src} alt="" className="hover-icon" />
        </div>
        <div className="sidebar-item">
          <img src={analyticsIcon.src} alt="Analytics" className="w-4 h-4" />
          Analytics
          <img src={hoverDesignIcon.src} alt="" className="hover-icon" />
        </div>
        <div className="sidebar-item">
          <img src={chatsIcon.src} alt="Chats/Programs" className="w-4 h-4" />
          Chats/Programs
          <img src={hoverDesignIcon.src} alt="" className="hover-icon" />
        </div>
        <div className="sidebar-item">
          <img src={projectsIcon.src} alt="Projects list" className="w-4 h-4" />
          Projects list
          <img src={hoverDesignIcon.src} alt="" className="hover-icon" />
        </div>
      </div>
      {/* Settings */}
      <div className="absolute bottom-12 left-6 right-6">
        <Link href="#" className="flex items-center gap-2 text-white hover:text-[#10F3FE] transition-colors py-2">
          <img src={settingsIcon.src} alt="Settings" className="w-4 h-4" />
          Settings
        </Link>
      </div>
      {/* Decorative vertical vector on border */}
      <img
        src={borderDesignIcon.src}
        alt="Border Decoration"
        className="absolute right-0.5 bottom-24 translate-x-1/2 z-50 pointer-events-none select-none"
      />
    </aside>
  )
}
