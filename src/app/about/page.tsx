export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 prose dark:prose-invert">
      <h1>About</h1>
      <p>
        This starter is crafted for reliability, DX, performance, and maintainability. It
        features Next.js 14 App Router, Tailwind CSS, HeroUI, Zustand, Zod, Pino, and a strong
        lint/format/test toolchain.
      </p>
      <h2>Folder structure</h2>
      <pre>
{`src/
  app/           # routes, API, pages
  components/    # ui, common, icons
  lib/           # env, logger, seo, store, utils
  styles/        # optional extra styles
`}
      </pre>
    </div>
  )
}
