import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /*
   * Standalone output creates a self-contained production
   * runtime containing only the dependencies required by
   * the Next.js application.
   *
   * This is particularly useful for Docker because the
   * final image does not need the complete node_modules
   * tree from the monorepo.
   */
  output: 'standalone',
};

export default nextConfig;