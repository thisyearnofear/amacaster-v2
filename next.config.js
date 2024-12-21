/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
      },
    ],
    minimumCacheTTL: 60,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false }
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })
    return config
  },
  // Performance optimizations
  experimental: {
    optimizeCss: true, // Enable CSS optimization
    scrollRestoration: true, // Improve scroll restoration
    workerThreads: true, // Enable worker threads for better performance
    optimizePackageImports: [
      '@rainbow-me/rainbowkit',
      '@tanstack/react-query',
      'wagmi',
    ],
  },
  // Cache optimization
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000, // 1 hour
    pagesBufferLength: 5,
  },
  // Compression
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
}

module.exports = nextConfig
