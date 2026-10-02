/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    'electric-cassette-supporting-changed.trycloudflare.com',
    '*.trycloudflare.com',
    '10.14.91.227:3000',
    'localhost:3000',
  ],
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8001';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
