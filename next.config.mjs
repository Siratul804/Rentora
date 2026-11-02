/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbopackPluginRuntimeStrategy: "workerThreads",
  },
};

export default nextConfig;
