"use client"
import appLogo from '@/components/assets/img/appLogo.svg'
import menuIcon from '@/components/assets/img/Header/menu.svg'
import shareIcon from '@/components/assets/img/Header/share.svg'
// import { CutoutShell } from '../ui/cutOut'
type Props = {
  className?: string
}

const CLIP = "polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)"

function CutoutShell({
  clip = CLIP,
  className = "",
  innerClassName = "",
  children,
}: {
  clip?: string
  className?: string
  innerClassName?: string
  children?: React.ReactNode
}) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-[#10F3FE]" style={{ clipPath: clip }} />
      <div
        className={`relative bg-[#000000] ${innerClassName}`}
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

export default function Header({ className = "" }: Props) {
  return (
    <header className={`rounded-md flex items-center relative ${className}`}>
      {/* <div className="text-lg font-semibold nb-neon-text">NexaBuilderΩ</div> */}
      <img src={appLogo.src} alt="NexaBuilder Logo" />
      <div className="ml-auto flex items-center gap-4">
        <CutoutShell className="h-[45px] w-[119px]">
          <div className="flex items-center px-2">
            <img src={shareIcon.src} alt="Share" className='pt-1'/>
            <span className="text-white text-base">Share</span>
          </div>
        </CutoutShell>
        <CutoutShell className="h-[45px] w-[50px]">
          <div>
            <img src={menuIcon.src} alt="Menu" className='pt-2 pl-1' />
          </div>
        </CutoutShell>
      </div>
    </header>
  )
}
