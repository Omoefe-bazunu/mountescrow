import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
     domains: ["source.unsplash.com", "firebasestorage.googleapis.com"],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Configure webpack to handle WebAssembly modules
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Enable WebAssembly experiments for client-side builds
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };
    }
    
    // Handle node: protocol imports
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };
    
    return config;
  },
  // Updated external packages configuration
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;