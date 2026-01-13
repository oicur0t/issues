/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  serverExternalPackages: ['mongodb'], // Moved out of experimental for Next.js 15
  images: {
    domains: ['localhost','wopr'],
  },
  output: 'standalone',

  // Enable detailed error messages for internal tool
  productionBrowserSourceMaps: true,

  // Show full error stack traces
  compiler: {
    removeConsole: false, // Keep console logs in production
  },
}

module.exports = nextConfig
