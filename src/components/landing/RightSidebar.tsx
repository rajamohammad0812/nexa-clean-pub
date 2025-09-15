"use client"

type Props = {
  className?: string
}

export default function RightSidebar({ className = "" }: Props) {
  return (
    <aside className={`nb-panel rounded-md p-4 flex flex-col gap-3 ${className}`}>
      <div className="rounded-md border border-[color:var(--nb-border)] p-4 text-center space-y-2">
        <div className="text-sm font-semibold nb-neon-text">Zbair Prime</div>
        <div className="text-xs text-cyan-200/60">NexaBuilderΩ AI assistant</div>
        <div className="grid place-items-center h-24"></div>
        <p className="text-xs text-cyan-100/80">Lets continue working on sept 18, definition of example project</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <button className="nb-btn py-2">Self Heal</button>
        <button className="nb-btn py-2">Shadow Mode</button>
      </div>
    </aside>
  )
}
