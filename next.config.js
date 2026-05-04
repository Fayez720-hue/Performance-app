/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',        // ← REQUIRED for static export (Capacitor needs this)
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig