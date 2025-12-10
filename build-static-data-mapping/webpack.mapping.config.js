const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './build/mapping/index.ts',
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
    path: path.resolve(__dirname, 'build/dist'),
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

  optimization: {
    minimize: true,
  },
};

