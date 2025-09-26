import fs from 'fs/promises'
import path from 'path'
import { ProjectAnalysis } from '@/types/ai-analysis'
import { getProjectPath, validateProjectPath } from './project-config'

export interface ProjectTemplate {
  name: string
  framework: string
  description: string
  files: ProjectFile[]
}

export interface ProjectFile {
  path: string
  content: string
  type: 'file' | 'directory'
}

// Project templates for different frameworks
export const PROJECT_TEMPLATES: Record<string, ProjectTemplate> = {
  'nextjs-fullstack': {
    name: 'Next.js Fullstack',
    framework: 'NEXTJS',
    description:
      'Complete Next.js application with TypeScript, Tailwind CSS, and database integration',
    files: [
      // Package.json
      {
        path: 'package.json',
        type: 'file',
        content: JSON.stringify(
          {
            name: '{{PROJECT_NAME}}',
            version: '0.1.0',
            private: true,
            scripts: {
              dev: 'next dev',
              build: 'next build',
              start: 'next start',
              lint: 'next lint',
            },
            dependencies: {
              next: '14.2.7',
              react: '^18',
              'react-dom': '^18',
              '@types/node': '^20',
              '@types/react': '^18',
              '@types/react-dom': '^18',
              typescript: '^5',
              tailwindcss: '^3.4.0',
              autoprefixer: '^10.0.1',
              postcss: '^8',
            },
            devDependencies: {
              eslint: '^8',
              'eslint-config-next': '14.2.7',
            },
          },
          null,
          2,
        ),
      },

      // Next.js config
      {
        path: 'next.config.js',
        type: 'file',
        content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig`,
      },

      // TypeScript config
      {
        path: 'tsconfig.json',
        type: 'file',
        content: JSON.stringify(
          {
            compilerOptions: {
              target: 'es5',
              lib: ['dom', 'dom.iterable', 'es6'],
              allowJs: true,
              skipLibCheck: true,
              strict: true,
              noEmit: true,
              esModuleInterop: true,
              module: 'esnext',
              moduleResolution: 'bundler',
              resolveJsonModule: true,
              isolatedModules: true,
              jsx: 'preserve',
              incremental: true,
              plugins: [
                {
                  name: 'next',
                },
              ],
              baseUrl: '.',
              paths: {
                '@/*': ['./src/*'],
              },
            },
            include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
            exclude: ['node_modules'],
          },
          null,
          2,
        ),
      },

      // Tailwind config
      {
        path: 'tailwind.config.js',
        type: 'file',
        content: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
}`,
      },

      // PostCSS config
      {
        path: 'postcss.config.js',
        type: 'file',
        content: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      },

      // App directory structure
      {
        path: 'src',
        type: 'directory',
        content: '',
      },
      {
        path: 'src/app',
        type: 'directory',
        content: '',
      },
      {
        path: 'src/components',
        type: 'directory',
        content: '',
      },
      {
        path: 'src/lib',
        type: 'directory',
        content: '',
      },

      // Main layout
      {
        path: 'src/app/layout.tsx',
        type: 'file',
        content: `import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "{{PROJECT_NAME}}",
  description: "{{PROJECT_DESCRIPTION}}",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`,
      },

      // Main page
      {
        path: 'src/app/page.tsx',
        type: 'file',
        content: `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to {{PROJECT_NAME}}
        </h1>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
          <h2 className="mb-3 text-2xl font-semibold">
            Features{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            {{FEATURES_LIST}}
          </p>
        </div>

        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
          <h2 className="mb-3 text-2xl font-semibold">
            Tech Stack{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Next.js 14, TypeScript, Tailwind CSS
          </p>
        </div>

        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
          <h2 className="mb-3 text-2xl font-semibold">
            Deploy{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Ready for deployment on Vercel, Netlify, or any platform.
          </p>
        </div>

        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30">
          <h2 className="mb-3 text-2xl font-semibold">
            Get Started{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Run npm install && npm run dev to start development.
          </p>
        </div>
      </div>
    </main>
  )
}`,
      },

      // Global CSS
      {
        path: 'src/app/globals.css',
        type: 'file',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}`,
      },

      // README
      {
        path: 'README.md',
        type: 'file',
        content: `# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Features

{{FEATURES_LIST}}

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Ready for Vercel/Netlify

## Getting Started

First, install dependencies:

\`\`\`bash
npm install
# or
yarn install
# or
pnpm install
\`\`\`

Then, run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

\`\`\`
{{PROJECT_NAME}}/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   └── lib/
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
\`\`\`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
`,
      },

      // Environment example
      {
        path: '.env.example',
        type: 'file',
        content: `# Environment Variables
NEXT_PUBLIC_APP_NAME={{PROJECT_NAME}}
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Add your environment variables here
# DATABASE_URL=
# API_KEY=
`,
      },

      // .gitignore
      {
        path: '.gitignore',
        type: 'file',
        content: `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
`,
      },
    ],
  },

  'streaming-app': {
    name: 'Streaming Application',
    framework: 'NEXTJS',
    description:
      'Netflix-like streaming application with user authentication and content management',
    files: [
      // Additional streaming-specific components
      {
        path: 'src/components/VideoPlayer.tsx',
        type: 'file',
        content: `'use client'
import { useState } from 'react'

interface VideoPlayerProps {
  src: string
  title: string
  poster?: string
}

export default function VideoPlayer({ src, title, poster }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      <video
        className="w-full h-full object-cover"
        poster={poster}
        controls
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <button
            className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition"
            onClick={() => setIsPlaying(true)}
          >
            <div className="w-0 h-0 border-l-8 border-r-0 border-t-4 border-b-4 border-l-white border-t-transparent border-b-transparent ml-1"></div>
          </button>
        </div>
      )}
      
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <h3 className="text-white text-xl font-semibold">{title}</h3>
      </div>
    </div>
  )
}`,
      },

      {
        path: 'src/components/ContentGrid.tsx',
        type: 'file',
        content: `'use client'
import Image from 'next/image'

interface Content {
  id: string
  title: string
  poster: string
  duration: string
  genre: string
}

interface ContentGridProps {
  title: string
  content: Content[]
}

export default function ContentGrid({ title, content }: ContentGridProps) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {content.map((item) => (
          <div
            key={item.id}
            className="relative group cursor-pointer transition-transform hover:scale-105"
          >
            <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-gray-800">
              <Image
                src={item.poster}
                alt={item.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="w-0 h-0 border-l-4 border-r-0 border-t-2 border-b-2 border-l-white border-t-transparent border-b-transparent ml-0.5"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-white text-sm font-medium truncate">{item.title}</h3>
              <p className="text-gray-400 text-xs">{item.duration} • {item.genre}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}`,
      },
    ],
  },
}

// Get template with inheritance
function getTemplate(templateName: string): ProjectTemplate {
  const template = PROJECT_TEMPLATES[templateName]
  if (!template) {
    return PROJECT_TEMPLATES['nextjs-fullstack']
  }

  // Handle template inheritance
  if (templateName === 'streaming-app') {
    const baseTemplate = PROJECT_TEMPLATES['nextjs-fullstack']
    return {
      ...template,
      files: [...baseTemplate.files, ...template.files],
    }
  }

  return template
}

// Generate project files based on template and customization
export async function generateProjectFiles(
  projectId: string,
  projectName: string,
  description: string,
  template: string,
  analysis?: ProjectAnalysis,
  features: string[] = [],
  customPath?: string,
): Promise<string> {
  // Use configurable project path
  const projectDir = getProjectPath(projectId, customPath)
  const baseDir = path.dirname(projectDir)

  // Validate the path
  const validation = validateProjectPath(baseDir)
  if (!validation.isValid) {
    throw new Error(`Invalid project path: ${validation.error}`)
  }

  // Ensure base directory exists
  await fs.mkdir(baseDir, { recursive: true })

  // Create project directory
  await fs.mkdir(projectDir, { recursive: true })

  // Get template
  const templateConfig = getTemplate(template)

  // Template variables for replacement
  const variables = {
    '{{PROJECT_NAME}}': projectName,
    '{{PROJECT_DESCRIPTION}}': description,
    '{{FEATURES_LIST}}':
      features.length > 0 ? features.join(', ') : 'Modern web application features',
    '{{PROJECT_TYPE}}': analysis?.projectType || 'web application',
    '{{FRAMEWORK}}': templateConfig.framework,
  }

  // Generate all files
  for (const file of templateConfig.files) {
    const fullPath = path.join(projectDir, file.path)

    if (file.type === 'directory') {
      await fs.mkdir(fullPath, { recursive: true })
    } else {
      // Ensure parent directory exists
      const parentDir = path.dirname(fullPath)
      await fs.mkdir(parentDir, { recursive: true })

      // Replace template variables in content
      let content = file.content
      for (const [placeholder, value] of Object.entries(variables)) {
        content = content.replace(new RegExp(placeholder, 'g'), value)
      }

      // Write file
      await fs.writeFile(fullPath, content, 'utf8')
    }
  }

  return projectDir
}

// Get project file tree for display
export async function getProjectFileTree(
  projectId: string,
  customPath?: string,
): Promise<Record<string, unknown> | null> {
  const projectDir = getProjectPath(projectId, customPath)

  try {
    const tree = await buildFileTree(projectDir, projectDir)
    return tree
  } catch (error) {
    console.error('Error reading project files:', error)
    return null
  }
}

async function buildFileTree(dirPath: string, basePath: string): Promise<Record<string, unknown>> {
  const items = await fs.readdir(dirPath, { withFileTypes: true })
  const tree: Record<string, unknown> = {}

  for (const item of items) {
    const itemPath = path.join(dirPath, item.name)
    const relativePath = path.relative(basePath, itemPath)

    if (item.isDirectory()) {
      tree[item.name] = {
        type: 'directory',
        children: await buildFileTree(itemPath, basePath),
      }
    } else {
      tree[item.name] = {
        type: 'file',
        path: relativePath,
      }
    }
  }

  return tree
}

// Read a specific project file
export async function getProjectFile(
  projectId: string,
  filePath: string,
  customPath?: string,
): Promise<string | null> {
  const projectDir = getProjectPath(projectId, customPath)
  const fullPath = path.join(projectDir, filePath)

  // Security check - ensure file is within project directory
  if (!fullPath.startsWith(projectDir)) {
    throw new Error('Invalid file path')
  }

  try {
    const content = await fs.readFile(fullPath, 'utf8')
    return content
  } catch (error) {
    console.error('Error reading file:', error)
    return null
  }
}
