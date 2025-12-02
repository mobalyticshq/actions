const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './src/index.ts',
  target: 'node',
  mode: 'production',
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

  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },

  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    library: {
      type: 'commonjs2',
    },
  },

  externals: [
    nodeExternals({
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

  optimization: {
    minimize: false,
  },
};
