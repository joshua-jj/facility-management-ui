import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack(config, { dev }) {
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    // In dev, use in-memory webpack cache instead of filesystem cache.
    // The filesystem cache has been racing with itself (ENOENT on .pack.gz renames,
    // causing "Cannot find module './chunks/vendor-chunks/next.js'") — likely due to
    // the project path containing a space ("EGFM project/"), which trips webpack's
    // rename-on-commit logic on macOS. Memory cache is plenty fast for dev.
    if (dev) {
      config.cache = { type: 'memory' };
    }

    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
