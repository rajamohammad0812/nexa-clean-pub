"use client"

type Props = {
  className?: string
}

export default function MainContent({ className = "" }: Props) {
  return (
    <section className={`nb-panel rounded-md p-4 flex flex-col ${className}`}>
      <div className="flex items-center gap-2 pb-4 border-b border-[color:var(--nb-border)]">
        <div className="font-semibold tracking-widest nb-neon-text">GENERAL CHAT</div>
        <div className="ml-auto flex gap-2 text-sm">
          <button className="nb-btn">General Chat</button>
          <button className="nb-btn">Canvas</button>
          <button className="nb-btn">Watch Live</button>
        </div>
      </div>
      <div className="flex-1 grid place-items-center">
        <div className="text-center space-y-4 max-w-xl">
          <div className="text-2xl nb-neon-text">Hey User Name</div>
          <div className="text-sm text-cyan-200/60">Whats on your mind today</div>
            <div className="flex items-stretch rounded-sm overflow-hidden border border-[color:var(--nb-border)]">
              <input className="flex-1 p-3 outline-none bg-transparent text-cyan-100 placeholder:text-cyan-200/50" placeholder="Ask anything" />
              <button className="px-3 border-l border-[color:var(--nb-border)]">🎤</button>
              <button className="px-4 nb-neon-text">➤</button>
            </div>
        </div>
      </div>
    </section>
  )
}
