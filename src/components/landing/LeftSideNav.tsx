'use client'
import Link from 'next/link'
import addNewIcon from '@/components/assets/img/LeftSideNav/addNew.svg'
import searchIcon from '@/components/assets/img/LeftSideNav/search.svg'
import homeIcon from '@/components/assets/img/LeftSideNav/home.svg'
import dashboardIcon from '@/components/assets/img/LeftSideNav/dashboard.svg'
import analyticsIcon from '@/components/assets/img/LeftSideNav/analytics.svg'
import projectsIcon from '@/components/assets/img/LeftSideNav/projects.svg'
import settingsIcon from '@/components/assets/img/LeftSideNav/settings.svg'
import borderDesignIcon from '@/components/assets/img/LeftSideNav/borderDesign.svg'
import hoverDesignIcon from '@/components/assets/img/LeftSideNav/hoverDesign.svg'
import './leftSideNav.css'

type Props = {
  className?: string
}

export default function LeftSideNav({ className = '' }: Props) {
  const clipPath =
    'polygon(0 0, calc(100% - 25px) 0, 100% 25px, 100% 100%, 25px 100%, 0 calc(100% - 25px))'

  return (
    <aside
      className={`relative ${className}`}
      style={{
        filter: `
          drop-shadow(0 0 30px rgba(16, 243, 254, 0.3))
          drop-shadow(0 0 45px rgba(16, 243, 254, 0.1))
        `,
      }}
    >
      {/* Outer container */}
      <div className="absolute inset-0 bg-[#10F3FE]" style={{ clipPath }} />

      {/* Inner container */}
      <div
        className="relative h-full space-y-2 bg-[#002B2F] p-6 pl-0"
        style={{
          clipPath,
          transform: 'translate(2px, 2px)',
          width: 'calc(100% - 4px)',
          height: 'calc(100% - 4px)',
        }}
      >
        <div className="flex cursor-pointer items-center gap-2 pb-2 pl-4 text-[#FFFFFF]">
          <img src={addNewIcon.src} alt="Add New" className="h-4 w-4" />
          Add New Project
        </div>
        <hr
          className="ml-4 h-px border-0"
          style={{
            background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.5) 0%, transparent 100%)',
            width: '100%',
          }}
        />
        {/* Search Input */}
        <div className="relative pl-4 pt-1">
          <img
            src={searchIcon.src}
            alt="Search"
            className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 transform text-white opacity-50"
          />
          <input
            className="w-full border-0 border-b border-transparent bg-transparent py-2 pl-6 text-white placeholder-gray-400 transition-colors focus:border-b-[#10F3FE] focus:shadow-none focus:outline-none focus:ring-0"
            placeholder="Search Projects"
          />
        </div>
        <Link href="/" className="sidebar-item">
          <img src={homeIcon.src} alt="Home" className="h-4 w-4" />
          Home
          <img src={hoverDesignIcon.src} alt="" className="hover-icon" />
        </Link>
        <Link href="/dashboard" className="sidebar-item">
          <img src={dashboardIcon.src} alt="Dashboard" className="h-4 w-4" />
          Dashboard
          <img src={hoverDesignIcon.src} alt="" className="hover-icon" />
        </Link>
        <Link href="/analytics" className="sidebar-item">
          <img src={analyticsIcon.src} alt="Analytics" className="h-4 w-4" />
          Analytics
          <img src={hoverDesignIcon.src} alt="" className="hover-icon" />
        </Link>
        <Link href="/projects" className="sidebar-item">
          <img src={projectsIcon.src} alt="Projects" className="h-4 w-4" />
          Projects
          <img src={hoverDesignIcon.src} alt="" className="hover-icon" />
        </Link>
      </div>
      {/* Settings */}
      <div className="absolute bottom-12 left-6 right-6">
        <Link
          href="#"
          className="flex items-center gap-2 py-2 text-white transition-colors hover:text-[#10F3FE]"
        >
          <img src={settingsIcon.src} alt="Settings" className="h-4 w-4" />
          Settings
        </Link>
      </div>
      {/* Decorative vertical vector on border */}
      <img
        src={borderDesignIcon.src}
        alt="Border Decoration"
        className="pointer-events-none absolute bottom-24 right-0.5 z-50 translate-x-1/2 select-none"
      />
    </aside>
  )
}
