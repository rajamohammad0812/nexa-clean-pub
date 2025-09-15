"use client"
import appLogo from '@/components/assets/img/appLogo.svg'
type Props = {
  className?: string
}

export default function Header({ className = "" }: Props) {
  return (
    <header className={`rounded-md flex items-center ${className}`}>
      {/* <div className="text-lg font-semibold nb-neon-text">NexaBuilderΩ</div> */}
      <img src={appLogo.src} alt="NexaBuilder Logo" />
      <div className="ml-auto flex items-center gap-2">
        <button className="nb-btn">Share</button>
        <button className="nb-btn">⋯</button>
      </div>
    </header>
  )
}
