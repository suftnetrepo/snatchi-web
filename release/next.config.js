/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enables SWC-based minification.
  swcMinify: true,

  // Uncomment to enable React strict mode in all React components.
  reactStrictMode: false,

  // If your Next.js app is served from a subpath of your domain, set the basePath.
  // basePath: '/myapp',
  // assetPrefix: '/myapp/',

  // Image optimization settings, necessary if you host images externally or need specific formats
  images: {
    domains: ['tfftech.org'],  // List of domains where images are hosted
    formats: ['image/avif', 'image/webp'],
  },

  // Example of setting HTTP security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'no-referrer-when-downgrade' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },

  // Custom Webpack configuration
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }

    return config;
  },
};

module.exports = nextConfig;
