/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              // Allow everything from same origin
              "default-src 'self' * data: blob:",
              
              // Allow all scripts and eval
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' * blob:",
              
              // Allow all styles
              "style-src 'self' 'unsafe-inline' *",
              
              // Allow all connections
              "connect-src 'self' * data: blob: ws: wss:",
              
              // Allow workers and blobs
              "worker-src 'self' blob:",
              
              // Allow all frames
              "frame-src 'self' *",
              
              // Allow images from anywhere
              "img-src 'self' * data: blob:",
              
              // Allow fonts from anywhere
              "font-src 'self' * data:",
              
              // Block object sources
              "object-src 'none'"
            ].join('; '),
          },
        ],
      },
    ];
  }
};

module.exports = nextConfig; 