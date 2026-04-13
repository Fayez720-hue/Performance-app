/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Use 'export' only when building for the Android APK
  output: process.env.STATIC_BUILD === 'true' ? 'export' : undefined,

  webpack: (config, { isServer }) => {
    if (isServer) {
      if (process.env.STATIC_BUILD === 'true') {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          crypto: false,
          buffer: false,
          stream: false,
          path: false,
          fs: false,
          net: false,
          tls: false,
          child_process: false,
          http: false,
          https: false,
          url: false,
          querystring: false,
          util: false,
          zlib: false,
          os: false,
        };
      } else {
        // For Cloudflare, we must ensure Node.js modules are available.
        // We alias them to the 'node:' prefix which Cloudflare nodejs_compat provides.
        config.resolve.alias = {
          ...config.resolve.alias,
          'crypto': 'node:crypto',
          'buffer': 'node:buffer',
          'stream': 'node:stream',
          'util': 'node:util',
          'events': 'node:events',
          'path': 'node:path',
          'fs': 'node:fs',
        };
      }
    }
    return config;
  },
}

export default nextConfig
