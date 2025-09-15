import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { baseMetadata } from '@/lib/seo'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = baseMetadata()

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <a href="#main" className="sr-only focus:not-sr-only">
          Skip to content
        </a>
        <ThemeProvider>
          <main id="main" className="min-h-screen nb-bg text-foreground">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
