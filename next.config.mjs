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
    // Only apply aggressive fallbacks during Static Export (APK build)
    // For Cloudflare/Production build, we need these modules for NextAuth
    if (isServer && process.env.STATIC_BUILD === 'true') {
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
    }
    return config;
  },
}

export default nextConfig
