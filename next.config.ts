import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep `ravendb` out of the application bundle — bundling it breaks dynamic
  // routes on Vercel's serverless runtime with `AssertionError [ERR_ASSERTION]:
  // null == true` inside the internal fetch. Confirmed by RavenDB:
  // https://github.com/ravendb/ravendb/issues/20455
  serverExternalPackages: ["ravendb"],
};

export default nextConfig;
