// Render sets RENDER=true; its builders are memory-constrained, so build lean there.
const isLowMemoryBuild = process.env.SENTRY_SKIP_UPLOAD === '1' || process.env.RENDER === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['mongoose', 'mongodb', 'mjml', 'bunyan'],
  turbopack: {
    resolveAlias: {
      prettier: './stubs/empty-module.js',
      'cli-highlight': './stubs/empty-module.js'
    }
  },
  experimental: {
    webpackBuildWorker: !isLowMemoryBuild,
    webpackMemoryOptimizations: true,
    serverSourceMaps: !isLowMemoryBuild
  },
  productionBrowserSourceMaps: false,
  enablePrerenderSourceMaps: !isLowMemoryBuild,
  reactStrictMode: false,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'snatchi.org' }],
    formats: ['image/avif', 'image/webp']
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, DELETE, PATCH, POST, PUT' },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
          }
        ]
      }
    ];
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        'source-map-support': false,
        'dtrace-provider': false
      };
    }

    config.resolve.fallback = {
      ...config.resolve.fallback,
      prettier: false,
      'cli-highlight': false
    };

    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push('source-map-support', 'dtrace-provider');
    }

    // Ignore fastest-validator critical dependency warnings.
    config.module.exprContextCritical = false;

    return config;
  }
};

// Skip source-map processing on memory-constrained builds. Runtime Sentry
// instrumentation remains active.
if (isLowMemoryBuild) {
  module.exports = nextConfig;
} else try {
  const { withSentryConfig } = require('@sentry/nextjs/config');

  module.exports = withSentryConfig(nextConfig, {
    org: 'suftnetcom',
    project: 'snatchi',
    silent: !process.env.CI,
    // Widened uploads generate source maps for many more chunks and can push
    // constrained Render builders past their heap limit.
    widenClientFileUpload: false,
    sourcemaps: {
      disable: process.env.SENTRY_SKIP_UPLOAD === '1'
    },
    webpack: {
      unstable_sentryWebpackPluginOptions: {
        disable: process.env.SENTRY_SKIP_UPLOAD === '1'
      },
      treeshake: { removeDebugLogging: true },
      automaticVercelMonitors: true
    }
  });
} catch (error) {
  console.warn('⚠️ Sentry is not installed. Skipping Sentry configuration.');
  module.exports = nextConfig;
}
