"use client"
import generalChatIcon from '@/components/assets/img/MainContent/generalChat.svg'
import searchIcon from '@/components/assets/img/MainContent/search.svg'
import micIcon from '@/components/assets/img/MainContent/mic.svg'
import sendArrowIcon from '@/components/assets/img/MainContent/sendArrow.svg'
import backgroundPattern from '@/components/assets/img/MainContent/backgroundPattern.svg'
import starsPattern from '@/components/assets/img/MainContent/starsPattern.svg'
import chatIcon from '@/components/assets/img/MainContent/chat.svg'
import canvasIcon from '@/components/assets/img/MainContent/canvas.svg'
import watchIcon from '@/components/assets/img/MainContent/watch.svg'
import downChevron from '@/components/assets/img/MainContent/downChevron.svg'
import borderDesignLeft from '@/components/assets/img/LeftSideNav/borderDesign.svg'
import borderDesignRight from '@/components/assets/img/RightSideNav/borderDesign.svg'

type Props = {
  className?: string
}

const ROW_CLIP = "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)"

function CutoutShell({
  clip = ROW_CLIP,
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
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#6FDBFF_0%,#E5F9FF_50%,#6FDBFF_75%,#E5F9FF_100%)]" style={{ clipPath: clip }} />
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

export default function MainContent({ className = "" }: Props) {
  const clipPath = "polygon(25px 0, 35% 0, calc(35% + 25px) 25px, calc(35% + 25px) 70px, 39% 90px, 97.5% 90px, 100% 110px, 100% calc(100% - 25px), calc(100% - 25px) 100%, 0 100%, 0 25px)"
  const clipPathInner = "polygon(25px 0, 34.8% 0, calc(35% + 22px) 25px, calc(35% + 22px) 70px, 38.8% 90px, 97.5% 90px, 100% 110px, 100% calc(100% - 25px), calc(100% - 25px) 100%, 0 100%, 0 25px)"

  return (
    <section className={`${className}`} style={{
      filter: `
          drop-shadow(0 0 30px rgba(16, 243, 254, 0.3))
          drop-shadow(0 0 45px rgba(16, 243, 254, 0.1))
        `
    }}>
      <div
        className="absolute inset-0 bg-[#10F3FE]"
        style={{ clipPath }}
      />
      <div
        className="relative bg-[#002B2F] h-full w-full flex flex-col"
        style={{
          clipPath: clipPathInner,
          transform: 'translate(2px, 2px)',
          width: 'calc(100% - 4px)',
          height: 'calc(100% - 4px)',
          backgroundImage: `url(${backgroundPattern.src}), url(${starsPattern.src})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom',
          backgroundSize: '100% auto',
        }}
      >
        {/* Top: General Chat icon */}
        <div className="p-4 ml-4">
          <img
            src={generalChatIcon.src}
            alt="General Chat"
            className="mt-4"
          />
        </div>

        {/* Center block */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-[22px] font-light text-white">
            Hey <span className="font-bold">User Name</span>
          </div>
          <div className="text-[#FFFFFF66] text-[22px] font-light">
            Whats on your mind today
          </div>

          {/* Search bar */}
          <CutoutShell className='mt-8'>
            <div className="relative w-full max-w-xl" style={{ width: '600px', height: '65px' }}>
              <div className="flex items-center w-full">
                {/* Left search icon */}
                <img
                  src={searchIcon.src}
                  alt="Search"
                  className="w-4 h-4 ml-3 mb-1 opacity-70"
                />

                {/* Input */}
                <input
                  type="text"
                  placeholder="Ask anything"
                  className="flex-1 px-3 mb-1 bg-transparent border-none text-white text-[14px] placeholder:text-white focus:outline-none focus:ring-0 focus:shadow-none outline-none"
                />

                {/* Mic */}
                <div className="p-2 mr-1 rounded-full hover:bg-white/10 transition">
                  <img src={micIcon.src} alt="Mic" />
                </div>

                {/* Send */}
                <CutoutShell className="-mt-[2px]">
                  <div
                    className="p-4 hover:bg-cyan-400/30 transition cursor-pointer"
                    style={{
                      width: '70px',
                      height: '65px',
                    }}
                  >
                    <img src={sendArrowIcon.src} alt="Send" className='ml-1 mt-1' />
                  </div>
                </CutoutShell>
              </div>
            </div>
          </CutoutShell>
        </div>
      </div>
      <div className=' absolute top-1 left-[40%] flex gap-4'>
        <CutoutShell>
          <div className="flex items-center pb-2 px-4 gap-2" style={{ width: '200px', height: '65px' }}>
            <img src={chatIcon.src} alt="General Chat" className='mt-2' />
            <span className="text-white text-base">General Chat</span>
          </div>
        </CutoutShell>
        <CutoutShell>
          <div className="flex items-center px-4 pb-2 gap-2" style={{ width: '200px', height: '65px' }}>
            <img src={canvasIcon.src} alt="Canvas" className='mt-2' />
            <span className="text-white text-base">Canvas</span>
            <img src={downChevron.src} alt="Dropdown" className='absolute right-4 mt-2' />
          </div>
        </CutoutShell>
        <CutoutShell>
          <div className="flex items-center px-4 pb-2 gap-2" style={{ width: '200px', height: '65px' }}>
            <img src={watchIcon.src} alt="Watch Live" className='mt-2' />
            <span className="text-white text-base">Watch Live</span>
          </div>
        </CutoutShell>
      </div>
      <img
        src={borderDesignLeft.src}
        alt="Border Decoration"
        className="absolute -top-14 left-20 z-50 pointer-events-none select-none -rotate-90"
      />
      <img
        src={borderDesignRight.src}
        alt="Border Decoration"
        className="absolute right-0 bottom-40 translate-x-1/2 z-50 pointer-events-none select-none -rotate-90"
      />
    </section>
  )
}
