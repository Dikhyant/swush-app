/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Remove static export for Vercel deployment
  // output: 'export',
  // basePath: process.env.NODE_ENV === 'production' ? '/swush-me-app' : '',
  
  // Enable WebAssembly support for ParaSpell XCM Router & GalacticCouncil SDK
  webpack: (config, { isServer }) => {
    // CRITICAL: Set the output target to support async/await for WASM
    config.output.environment = {
      ...config.output.environment,
      asyncFunction: true,
    };

    // Enable async WebAssembly and layers (required for WASM modules)
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Configure WASM file handling
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Optimize WASM module output
    if (!isServer) {
      config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm';
    } else {
      config.output.webassemblyModuleFilename = './../static/wasm/[modulehash].wasm';
    }

    // Ignore node-specific modules in client bundle
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },

  // Ensure modern JavaScript target
  experimental: {
    esmExternals: 'loose', // Allow ESM packages
  },

  // Transpile specific packages that use WASM
  transpilePackages: [
    '@galacticcouncil/math-hsm',
    '@galacticcouncil/math-xyk',
    '@galacticcouncil/math-lbp',
    '@galacticcouncil/math-liquidity-mining',
    '@galacticcouncil/math-omnipool',
    '@galacticcouncil/math-stableswap',
    '@galacticcouncil/sdk',
    '@paraspell/xcm-router',
    '@paraspell/sdk',
  ],
};

export default nextConfig;
