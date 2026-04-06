/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    turbopackFileSystemCacheForDev: true  // Helps with caching even with webpack
  }
}

export default nextConfig