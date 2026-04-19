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
  serverExternalPackages: [],
  staticPageGenerationTimeout: 1000, // Prevent hangs during build
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        crypto: 'node:crypto',
        http: 'node:http',
        https: 'node:https',
        zlib: 'node:zlib',
        stream: 'node:stream',
        buffer: 'node:buffer',
        events: 'node:events',
        util: 'node:util',
        url: 'node:url',
      };
    }
    return config;
  },
}

export default nextConfig
