import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  logging: {
    serverFunctions: false,
  },
};

export default nextConfig;
