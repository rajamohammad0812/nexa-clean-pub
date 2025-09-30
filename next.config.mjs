import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
	enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: false,
	output: 'standalone',
	swcMinify: true,
	eslint: {
		dirs: [],
	},
	typescript: {
		ignoredBuildErrors: true,
	},
	// Ensure proper standalone build
	poweredByHeader: false,
	generateEtags: false,
}

export default withBundleAnalyzer(nextConfig)
