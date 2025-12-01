const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  // Entry point for the GitHub Action
  entry: './src/index.ts',
  
  // Target Node.js environment (GitHub Actions uses node20)
  target: 'node',
  
  // Production mode for optimization and minification
  mode: 'production',
  
  // Enable source maps for debugging
  devtool: 'source-map',
  
  // Module resolution
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  
  // Resolve TypeScript and JavaScript files
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      // Map @shared to the parent shared directory
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  
  // Output configuration
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true, // Clean dist folder before each build
    library: {
      type: 'commonjs2',
    },
  },
  
  // External dependencies (not bundled)
  // Use webpack-node-externals to automatically exclude all node_modules
  externals: [
    nodeExternals({
      // Allow bundling of packages that need to be included
      allowlist: [],
    }),
  ],
  
  // Plugins
  plugins: [
    // Copy .md files from src/steps to dist
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/steps/**/*.md',
          to: '[name][ext]',
        },
      ],
    }),
  ],
  
  // Optimization settings
  optimization: {
    minimize: false,
  },
};

