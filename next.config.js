/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push('pino-pretty', 'encoding');
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://walletconnect.com https://cloudflare-ipfs.com; connect-src 'self' https://*.alchemy.com https://eth-mainnet.g.alchemy.com https://polygon-mainnet.g.alchemy.com https://arb1.g.alchemy.com https://opt-mainnet.g.alchemy.com https://base-mainnet.g.alchemy.com https://walletconnect.com https://cloudflare-ipfs.com wss://*.alchemy.com wss://eth-mainnet.g.alchemy.com wss://polygon-mainnet.g.alchemy.com wss://arb1.g.alchemy.com wss://opt-mainnet.g.alchemy.com wss://base-mainnet.g.alchemy.com; img-src 'self' data: https: blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src 'self' https://walletconnect.com; object-src 'none'; base-uri 'self'; form-action 'self';",
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), ambient-light-sensor=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
