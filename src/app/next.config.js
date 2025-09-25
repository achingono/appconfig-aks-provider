/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Allow serving the app on any host (for Docker)
  async rewrites() {
    return [
      // Proxy API requests to backend
      {
        source: '/api/:path*',
        destination: process.env.REACT_APP_API_BASE_URL ? `${process.env.REACT_APP_API_BASE_URL}/:path*` : 'http://localhost:5100/api/:path*',
      },
    ]
  },
  // Enable server-side rendering
  output: 'standalone',
}

module.exports = nextConfig
