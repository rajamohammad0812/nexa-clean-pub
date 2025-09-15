import type { Metadata } from 'next'

export const siteConfig = {
  name: 'Nexa Builder',
  description: 'Production-ready Next.js 14 starter with Tailwind and HeroUI',
  url: 'https://example.com',
}

export function baseMetadata(overrides?: Partial<Metadata>): Metadata {
  const meta: Metadata = {
    title: {
      default: siteConfig.name,
      template: `%s · ${siteConfig.name}`,
    },
    description: siteConfig.description,
    metadataBase: new URL(siteConfig.url),
    openGraph: {
      siteName: siteConfig.name,
      type: 'website',
      title: siteConfig.name,
      description: siteConfig.description,
      url: siteConfig.url,
    },
    twitter: {
      card: 'summary_large_image',
      title: siteConfig.name,
      description: siteConfig.description,
    },
  }
  return { ...meta, ...overrides }
}
