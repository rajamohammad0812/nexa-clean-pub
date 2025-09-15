"use client"
import Link from 'next/link'

type Props = {
  className?: string
}

export default function LeftSidebar({ className = "" }: Props) {
  return (
    <aside className={`nb-panel rounded-md p-4 space-y-4 relative overflow-hidden ${className}`}>
      <button className="w-full text-left">Add New Project</button>
      <input className="nb-input p-2" placeholder="Search Projects" />
    <nav className="text-sm space-y-2 flex flex-col">
      <Link href="#">Home</Link>
      <div className="space-y-1 pl-2 flex flex-col">
        <Link href="#">Dashboard</Link>
        <Link href="#">Build Logs</Link>
        <Link href="#">System Monitor</Link>
        <Link href="#">Feature Flags</Link>
        <Link href="#">Analytics</Link>
        <Link href="#">Chats/Programs</Link>
        <Link href="#">Projects list</Link>
      </div>
    </nav>
      <div className="mt-auto pt-4 border-t border-[color:var(--nb-border)]">
        <Link href="#" className="text-sm">Settings</Link>
      </div>
    </aside>
  )
}
