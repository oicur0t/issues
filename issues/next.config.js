const fs = require('fs')
const path = require('path')

// Build number lives in BUILD_NUMBER and is bumped by scripts/sync.sh
let buildNumber = 'dev'
try {
  buildNumber = fs.readFileSync(path.join(__dirname, 'BUILD_NUMBER'), 'utf8').trim() || 'dev'
} catch {
  // Missing file (e.g. odd build context): fall back to "dev"
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_NUMBER: buildNumber,
  },
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
