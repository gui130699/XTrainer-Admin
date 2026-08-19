import type { NextConfig } from "next";
const pages = process.env.GITHUB_ACTIONS === "true";
const nextConfig: NextConfig = { agentRules: false, output: "export", trailingSlash: true, reactStrictMode: true, basePath: pages ? "/XTrainer-Admin" : "", assetPrefix: pages ? "/XTrainer-Admin/" : undefined };
export default nextConfig;
