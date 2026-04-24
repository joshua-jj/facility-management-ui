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
      // Print preview pages are intentionally embedded in a same-origin
      // iframe by the detail page, so they need SAMEORIGIN instead of the
      // blanket DENY above. Declared after the general rule so this key
      // overrides it on this route.
      {
        source: '/admin/:section*/print',
        headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }],
      },
      {
        source: '/admin/:section*/:id/print',
        headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/admin/account-settings',
        destination: '/admin/settings/profile',
        permanent: true,
      },
      {
        source: '/admin/roles',
        destination: '/admin/settings/access',
        permanent: true,
      },
      {
        source: '/admin/roles/new',
        destination: '/admin/settings/access/roles/new',
        permanent: true,
      },
      {
        source: '/admin/roles/:id',
        destination: '/admin/settings/access/roles/:id',
        permanent: true,
      },
      {
        source: '/admin/roles/:id/users',
        destination: '/admin/settings/access/roles/:id/users',
        permanent: true,
      },
      {
        source: '/admin/permissions',
        destination: '/admin/settings/access',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
