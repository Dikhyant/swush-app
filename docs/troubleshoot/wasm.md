
## Analysis: WASM Configuration for Next.js

Based on your Vite config, here's what's configured for handling Paraspell SDK and HydraDX WASM modules, and how to adapt it for Next.js:

### **Current Vite Configuration**

In this Vite project, three key configurations handle the WASM and Paraspell SDK:

1. **`vite-plugin-wasm`** - Handles WASM module loading
2. **`vite-plugin-node-polyfills`** - Provides Node.js polyfills for browser
3. **`target: "esnext"`** - Ensures modern JavaScript features including async/await support

```ts:8:16:vite.config.ts
plugins: [react(), nodePolyfills(), wasm()],
build: {
  target: "esnext",
},
optimizeDeps: {
  esbuildOptions: {
    target: "esnext",
  },
},
```

### **The Problem in Next.js**

The error indicates that:
1. **WebAssembly is being loaded as `asyncWebAssembly`** - which requires async/await support
2. **Your Next.js build target doesn't support async/await** - likely targeting ES5 or older
3. **`@galacticcouncil/math-xyk`** package contains WASM binaries that need special handling

### **Solution for Next.js**

Here's the complete `next.config.js` configuration you need:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable WASM support
  webpack: (config, { isServer }) => {
    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Add WASM loader rule
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Polyfills for Node.js modules (if needed in browser)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    return config;
  },

  // Ensure modern JavaScript target
  // This is crucial - it enables async/await support
  experimental: {
    esmExternals: 'loose', // Allow ESM packages
  },

  // Transpile specific packages that use WASM
  transpilePackages: [
    '@galacticcouncil/math-xyk',
    '@galacticcouncil/sdk',
    '@paraspell/xcm-router',
    '@paraspell/sdk',
  ],
};

module.exports = nextConfig;
```

### **Additional Configuration for TypeScript**

Update your `tsconfig.json` to support modern JavaScript:

```json
{
  "compilerOptions": {
    "target": "ES2020", // or "ESNext"
    "module": "esnext",
    "lib": ["ES2020", "dom"],
    // ... other options
  }
}
```

### **If Using Next.js 13+ App Router**

You may also need to mark components using WASM as client components:

```tsx
'use client'; // Add this at the top of files using ParaSpell

import { useXcmTokens } from './hooks/useXcmTokens';
```

### **Alternative: Dynamic Import Strategy**

If the above doesn't fully resolve it, use dynamic imports to load WASM modules only on the client side:

```tsx
'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

export function SwapContainer() {
  const [RouterBuilder, setRouterBuilder] = useState(null);

  useEffect(() => {
    // Dynamically import only on client side
    import('@paraspell/xcm-router').then((module) => {
      setRouterBuilder(() => module.RouterBuilder);
    });
  }, []);

  if (!RouterBuilder) return <div>Loading...</div>;

  // Use RouterBuilder here
}
```

### **Key Differences from Vite**

| Aspect | Vite | Next.js |
|--------|------|---------|
| WASM Plugin | `vite-plugin-wasm` | Webpack `asyncWebAssembly` experiment |
| Polyfills | `vite-plugin-node-polyfills` | Manual `resolve.fallback` config |
| Target | `build.target: "esnext"` | `tsconfig target: "ES2020"` + webpack config |
| ESM Support | Native | `transpilePackages` needed |

### **Troubleshooting Steps**

1. **Install required dependencies** (if not already):
   ```bash
   pnpm add @paraspell/sdk @paraspell/xcm-router @galacticcouncil/sdk
   ```

2. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   pnpm dev
   ```

3. **Verify your `package.json` has** `"type": "module"` if using ESM

4. **Check Node.js version** - ensure you're using Node 18+ which has better WASM support

The core issue is that Next.js's default webpack configuration doesn't enable `asyncWebAssembly` experiments, which is what Vite's `vite-plugin-wasm` does automatically. The configuration above replicates that functionality for Next.js.