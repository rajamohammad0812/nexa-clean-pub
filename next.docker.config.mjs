/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  swcMinify: true,
  poweredByHeader: false,
  generateEtags: false,
  // Skip TypeScript and ESLint checks completely
  typescript: {
    ignoredBuildErrors: true,
  },
  eslint: {
    ignoredDuringBuilds: true,
  },
}

export default nextConfig