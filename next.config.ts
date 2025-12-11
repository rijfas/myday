import type { NextConfig } from "next";

const repoBase = "/myday";
const isGhActions = process.env.GITHUB_ACTIONS === "true";
const basePathEnv = process.env.NEXT_PUBLIC_BASE_PATH;
const basePath = basePathEnv || (isGhActions ? repoBase : "");

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
};

export default nextConfig;
