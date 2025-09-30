/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  swcMinify: true,
  typescript: {
    ignoredBuildErrors: true,
  },
  eslint: {
    ignoredDuringBuilds: true,
  },
  // Ensure proper standalone build
  poweredByHeader: false,
  generateEtags: false,
}

export default nextConfig