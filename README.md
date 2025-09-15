# Nexa Builder – Next.js 14 Starter

Production-ready Next.js 14 (App Router) + TypeScript starter with Tailwind CSS and HeroUI. Strong DX guardrails, testing, CI, and docs.

## Features
- Next.js 14 App Router, TypeScript
- Tailwind CSS (+ forms, typography, aspect-ratio)
- HeroUI (@heroui/react)
- Zustand sample store
- Zod-typed env helpers
- Pino logging (server) + small client logger
- ESLint (Next, TS, a11y) + Prettier
- Vitest + Testing Library
- Husky + lint-staged + commitlint
- Bundle analyzer (opt-in)
- Vercel and Docker ready
 - robots and sitemap routes

## Getting started
- Node: use LTS (see `.nvmrc`), recommend v18.20+
- Install deps:

```bash
npm ci
```

- Dev server:

```bash
npm run dev
```

- Typecheck, lint, test, build:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Environment
Copy `.env.example` to `.env.local` and fill values. Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Scripts
- dev, build, start
- typecheck
- lint, lint:fix
- format, format:check
- test, test:watch
- prepare (husky)
- precommit (lint-staged)
- audit
- analyze (set ANALYZE=true)

## Deployment
- Vercel: import the repo and deploy. Set env vars in the dashboard.
- Docker: build and run the container.

## Architecture
- `src/app`: routes and API
- `src/components`: UI wrappers, common components
- `src/lib`: env, logger, seo, store, utils

## Neon theme (UI)
The landing page uses a lightweight neon sci‑fi look without adding new deps. Utility classes are defined in `src/app/globals.css`:
- `nb-bg` — page background with subtle grid and radial glows
- `nb-panel` — translucent panel with cyan border and glow
- `nb-neon-text` — cyan text glow
- `nb-btn`, `nb-input` — minimal neon‑styled controls
- `nb-corner-tl`, `nb-corner-br` — decorative corner brackets
- `nb-notch-left-*` — absolute‑positioned notch cutouts to replicate the sidebar edge design

The notches are small absolutely positioned elements that match the panel background to visually “cut” the outer border, creating the sci‑fi corner/edge effect. See `LandingLayout.tsx` for usage.

## Accessibility
- Landmarks, skip link, focus styles
- eslint-plugin-jsx-a11y enabled

See `docs/` for more guides.

---
MIT License. See `LICENSE`.
This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
