import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';
import webpack from 'webpack';

const graphqlTagPlugin = require('babel-plugin-graphql-tag');
const nodeExternals = require('webpack-node-externals');

const queryDir = 'build/gql/query';
const outputDir = 'build/dist';
const entryFileName = 'static-data-query.gql.ts';
const outputFileName = 'static-data-query.js';

export async function compileQuery(): Promise<void> {
  const absoluteQueryDir = path.resolve(process.cwd(), queryDir);
  const absoluteOutputDir = path.resolve(process.cwd(), outputDir);
  const entryFile = path.join(absoluteQueryDir, entryFileName);

  if (!fs.existsSync(absoluteQueryDir)) {
    throw new Error(`Query directory does not exist: ${absoluteQueryDir}`);
  }

  if (!fs.existsSync(entryFile)) {
    const errorMessage = `Entry file does not exist: ${entryFile}`;
    core.setFailed(errorMessage);
    throw new Error(errorMessage);
  }

  core.info(`Bundling query file: ${path.relative(process.cwd(), entryFile)}`);

  // Create output directory if it doesn't exist
  if (!fs.existsSync(absoluteOutputDir)) {
    fs.mkdirSync(absoluteOutputDir, { recursive: true });
    core.info(`Created output directory: ${absoluteOutputDir}`);
  }

  // Webpack configuration
  const webpackConfig: webpack.Configuration = {
    mode: 'production',
    entry: entryFile,
    target: 'node',
    output: {
      path: absoluteOutputDir,
      filename: outputFileName,
      library: {
        type: 'module',
      },
      module: true,
      chunkFormat: 'module',
    },
    experiments: {
      outputModule: true,
    },
    resolve: {
      extensions: ['.ts', '.js', '.gql.ts'],
      modules: ['node_modules', path.resolve(process.cwd(), 'build/gql')],
    },
    module: {
      rules: [
        {
          test: /\.gql\.ts$/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      modules: false,
                      targets: {
                        node: 'current',
                      },
                    },
                  ],
                  [
                    '@babel/preset-typescript',
                    {
                      isTSX: false,
                      allExtensions: false,
                    },
                  ],
                ],
                plugins: [[graphqlTagPlugin]],
              },
            },
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      modules: false,
                      targets: {
                        node: 'current',
                      },
                    },
                  ],
                  [
                    '@babel/preset-typescript',
                    {
                      isTSX: false,
                      allExtensions: false,
                    },
                  ],
                ],
              },
            },
          ],
          exclude: /node_modules/,
        },
      ],
    },
    optimization: {
      minimize: true,
    },
    externals: [
      nodeExternals({
        allowlist: [],
      }),
    ],
  };

  // Run webpack
  return new Promise<void>((resolve, reject) => {
    webpack(webpackConfig, (err, stats) => {
      if (err) {
        const errorMessage = `Webpack compilation failed: ${err.message}`;
        core.setFailed(errorMessage);
        reject(new Error(errorMessage));
        return;
      }

      if (!stats) {
        const errorMessage = 'Webpack compilation returned no stats';
        core.setFailed(errorMessage);
        reject(new Error(errorMessage));
        return;
      }

      if (stats.hasErrors()) {
        const errors = stats.compilation.errors.map(e => e.message).join('\n');
        const errorMessage = `Webpack compilation errors:\n${errors}`;
        core.setFailed(errorMessage);
        reject(new Error(errorMessage));
        return;
      }

      if (stats.hasWarnings()) {
        const warnings = stats.compilation.warnings.map(w => w.message).join('\n');
        core.warning(`Webpack compilation warnings:\n${warnings}`);
      }

      const outputPath = path.join(absoluteOutputDir, outputFileName);
      core.info(`✓ Successfully bundled query to: ${path.relative(process.cwd(), outputPath)}`);
      resolve();
    });
  });
}
