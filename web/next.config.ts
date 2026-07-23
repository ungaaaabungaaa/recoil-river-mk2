import path from 'node:path';
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd(), '..'),
  transpilePackages: ['@recoil-river/backend', '@recoil-river/graph'],
};

export default nextConfig;
