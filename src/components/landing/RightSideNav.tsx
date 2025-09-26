'use client'
import { useState } from 'react'
import zbairAvatar from '@/components/assets/img/RightSideNav/zbairAvatar.svg'
import zbairDecorator from '@/components/assets/img/RightSideNav/zbairDecorator.svg'
import selfHealIcon from '@/components/assets/img/RightSideNav/selfHeal.svg'
import shadowModeIcon from '@/components/assets/img/RightSideNav/shadowMode.svg'
import borderDesignIcon from '@/components/assets/img/RightSideNav/borderDesign.svg'

type Props = { className?: string }

// Shared cutout shapes
const OUT_CLIP =
  'polygon(0 0, calc(100% - 25px) 0, 100% 25px, 100% 100%, 25px 100%, 0 calc(100% - 25px))'
const CARD_CLIP = OUT_CLIP
const ROW_CLIP =
  'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)'
const TOGGLE_CLIP =
  'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)'
const TOGGLE_INNER_CLIP_ON =
  'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 0)'
const TOGGLE_INNER_CLIP_OFF = 'polygon(10px 0, 100% 0, 100% 100%, 100% 100%, 0 100%, 0 10px)'

// Reusable cutout shell (cyan outer, dark inner)
function CutoutShell({
  clip = ROW_CLIP,
  className = '',
  innerClassName = '',
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

// Small inner toggle with the same cutout look
function CutoutToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      className="relative h-[29px] w-[56px] cursor-pointer select-none"
      onClick={onToggle}
      onKeyDown={(e) => e.key === 'Enter' && onToggle()}
      tabIndex={0}
      role="button"
      aria-pressed={on}
    >
      {/* Outer border (semi-transparent white) */}
      <div className="absolute inset-0 bg-[#FFFFFF66]" style={{ clipPath: TOGGLE_CLIP }} />

      {/* Inner container */}
      <div
        className="relative flex h-full items-center justify-between bg-[#05181E] px-2 text-sm text-white"
        style={{
          clipPath: TOGGLE_CLIP,
          transform: 'translate(1px, 1px)',
          width: 'calc(100% - 2px)',
          height: 'calc(100% - 2px)',
        }}
      >
        {/* Sliding block */}
        <div
          className="absolute"
          style={{
            left: on ? 'calc(100% - 25px)' : '5px',
            top: '50%',
            transform: 'translateY(-50%)',
            filter: on ? `drop-shadow(0 0 10px #6FDBFF)` : undefined,
          }}
        >
          <div
            style={{
              clipPath: on ? TOGGLE_INNER_CLIP_ON : TOGGLE_INNER_CLIP_OFF,
              width: '20px',
              height: '20px',
              background: on ? '#ffffff' : '#ffffff66',
            }}
          />
        </div>
        {/* Label */}
        {on ? (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[12px]">On</span>
        ) : (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[12px] text-[#ffffff66]">
            Off
          </span>
        )}
      </div>
    </div>
  )
}

export default function RightSideNav({ className = '' }: Props) {
  const [selfHealOn, setSelfHealOn] = useState(false)
  const [shadowModeOn, setShadowModeOn] = useState(false)

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
      <div className="absolute inset-0 bg-[#10F3FE]" style={{ clipPath: CARD_CLIP }} />
      <div
        className="relative h-full space-y-2 bg-[#002B2F] p-4"
        style={{
          clipPath: CARD_CLIP,
          transform: 'translate(2px, 2px)',
          width: 'calc(100% - 4px)',
          height: 'calc(100% - 4px)',
        }}
      >
        {/* Header */}
        <div className="mt-12 flex flex-col items-center">
          <div className="flex items-center">
            <img src={zbairDecorator.src} alt="Left Decorator" />
            <div className="flex flex-col items-center self-start">
              <div className="nb-neon-text text-[22px] font-semibold">Zbair Prime</div>
              <div className="text-xs">NexaBuilder&apos;s AI assistant</div>
            </div>
            <img src={zbairDecorator.src} alt="Right Decorator" className="scale-x-[-1]" />
          </div>
          <img src={zbairAvatar.src} alt="Zbair Avatar" className="-mt-10" />
        </div>

        {/* Message */}
        <div className="grid h-24 place-items-center">
          <p className="ml-6 mr-6">
            Lets continue working on sept 18, definition of example project
          </p>
        </div>

        {/* Actions */}
        {/* Bottom actions container */}
        <div className="absolute bottom-6 left-0 w-full px-6">
          <div className="grid w-full grid-cols-1 gap-3 text-sm">
            {/* Self Heal row */}
            <CutoutShell>
              <div className="flex h-12 items-center justify-between px-4">
                <div className="flex items-center gap-2 pb-2">
                  <img src={selfHealIcon.src} alt="Self Heal" />
                  <span className="text-base text-white">Self Heal</span>
                </div>
                <div className="pb-1">
                  <CutoutToggle on={selfHealOn} onToggle={() => setSelfHealOn((v) => !v)} />
                </div>
              </div>
            </CutoutShell>

            {/* Shadow Mode row */}
            <CutoutShell>
              <div className="flex h-12 items-center justify-between px-4">
                <div className="flex items-center gap-2 pb-2">
                  <img src={shadowModeIcon.src} alt="Shadow Mode" />
                  <span className="text-base text-white">Shadow Mode</span>
                </div>
                <div className="pb-1">
                  <CutoutToggle on={shadowModeOn} onToggle={() => setShadowModeOn((v) => !v)} />
                </div>
              </div>
            </CutoutShell>
          </div>
        </div>
      </div>
      {/* Decorative vertical vector on border */}
      <img
        src={borderDesignIcon.src}
        alt="Border Decoration"
        className="pointer-events-none absolute bottom-0.5 right-0 z-50 translate-y-1/2 select-none"
      />
    </aside>
  )
}
