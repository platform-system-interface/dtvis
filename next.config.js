/** @type {import('next').NextConfig} */
const path = require('path');
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');

const nextConfig = {
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) => ({
    ...config,
    experiments: {
      asyncWebAssembly: true,
      layers: true,
    },
    plugins: [
      ...config.plugins,
      // Check https://rustwasm.github.io/wasm-pack/book/commands/build.html
      // for the available set of arguments.
      new WasmPackPlugin({
        crateDirectory: path.resolve(__dirname, 'parser'),
        args: '--log-level info --verbose',
      }),
    ],
  }),
};

module.exports = nextConfig;
