/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // Required for workspace packages to work with Next.js
  transpilePackages: ["@chatapp/db", "@chatapp/shared-types"],

  output: "standalone",
};

export default nextConfig;