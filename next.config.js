const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Skip type checking during build (types are checked in development)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during build (linting is checked in development)
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['public.blob.vercel-storage.com'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '.'),
    }
    return config
  },
}

module.exports = nextConfig
