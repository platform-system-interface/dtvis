/** @type {import('next').NextConfig} */
const path = require('path');
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');

module.exports = {
  output: "export",
  basePath: "/dtvis",
  // Because we get an error even though tsconfig has target ES6 configured:
  // Type error: Type 'Uint8Array' can only be iterated through when using the
  // '--downlevelIteration' flag or with a '--target' of 'es2015' or higher.
  ignoreBuildErrors: true, // FIXME
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
