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
      // If we are building for the Android APK, we mock node modules
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
        // For Cloudflare build, we use nodejs_compat aliases
        // This helps next-auth find the crypto/buffer modules provided by Cloudflare
        config.resolve.alias = {
          ...config.resolve.alias,
          'crypto': 'node:crypto',
          'buffer': 'node:buffer',
          'stream': 'node:stream',
          'util': 'node:util',
          'events': 'node:events',
        };
      }
    }
    return config;
  },
}

export default nextConfig
