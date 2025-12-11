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
        use: {
          loader: 'ts-loader',
          options: {
            // Используем отдельный tsconfig только для маппинга
            configFile: path.resolve(__dirname, 'tsconfig.mapping.json'),
            // Компилируем только файлы, которые реально используются в bundle
            onlyCompileBundledFiles: true,
            // Не проверяем файлы вне build/mapping
            projectReferences: false,
          },
        },
        // Исключаем все файлы кроме build/mapping
        exclude: [
          /node_modules/,
          /src/,
          /dist/,
          /build\/(?!mapping)/, // Исключаем все в build кроме mapping
        ],
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
      type: 'module',
      export: 'default' 
    },
    chunkFormat: 'module',
  },

  experiments: {
    outputModule: true,
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
