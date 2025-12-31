/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for Docker deployment
  reactStrictMode: true,
  images: {
    domains: [],
  },
};

module.exports = nextConfig;
