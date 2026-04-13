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
  // Use 'export' ONLY for APK. Cloudflare build needs default (no output setting).
  output: process.env.STATIC_BUILD === 'true' ? 'export' : undefined,

  // Force bundling of problematic packages for OpenNext
  transpilePackages: ["next-auth", "jose", "@panva/hkdf", "openid-client"],

  webpack: (config, { isServer }) => {
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
