/** @type {import('next').NextConfig} */
const nextConfig = {
  // @muslimspaces/ui ships raw .tsx source (not pre-compiled) — Next
  // normally skips its own transform for anything resolved through
  // node_modules (perf default), so workspace packages consumed as raw
  // source need to be listed here explicitly.
  transpilePackages: ["@muslimspaces/ui"],
};

export default nextConfig;
