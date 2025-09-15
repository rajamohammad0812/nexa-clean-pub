'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10 prose dark:prose-invert">
      <h1>Something went wrong</h1>
      <pre>{error.message}</pre>
      <button className="btn" onClick={() => reset()}>Try again</button>
    </div>
  )
}
