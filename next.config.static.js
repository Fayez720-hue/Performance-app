/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Ignore API routes during build
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
