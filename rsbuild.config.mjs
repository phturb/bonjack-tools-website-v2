import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';
import { pluginTypeCheck } from '@rsbuild/plugin-type-check';
import Dotenv from 'dotenv-webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import ReactRefreshPlugin from '@rspack/plugin-react-refresh';

const { publicVars, rawPublicVars } = loadEnv({ prefixes: ['PUBLIC_'] });
const ReactCompilerConfig = {
  /* ... */
};

export default defineConfig({
  output: {
    distPath: {
      root: 'build',
    },
    polyfill: 'usage',
  },
  source: {
    include: [{ not: /[\\/]core-js[\\/]/ }],
    define: {
      ...publicVars,
      'process.env': JSON.stringify(rawPublicVars),
    },
  },
  html: {
    template: './public/index.html'
  },
  plugins: [
    pluginReact({
      swcReactOptions: {
        runtime: 'automatic',
        importSource: '@emotion/react',
      },
    }),
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
      babelLoaderOptions(opts) {
        opts.plugins?.unshift('babel-plugin-react-compiler');
      },
    }),
    pluginSvgr({ mixedImport: true }),
    pluginNodePolyfill(),
  ].filter(Boolean),
  tools: {
    rspack: {
      plugins: [
      ],
      module: {
        rules: [
          {
            // Match .png asset
            // You can change this regular expression to match different types of files
            test: /\.png$/,
            type: 'asset/resource',
            generator: {
              filename: 'static/media/[name].[hash][ext]',
            },
          },
          {
            test: /\.js$/,
            use: [
              {
                loader: 'builtin:swc-loader',
                options: {
                  // SWC options for JS
                },
              },
            ],
          },
          {
            test: /\.jsx$/,
            use: [
              {
                loader: 'builtin:swc-loader',
                options: {
                  // SWC options for JSX
                },
              },
              { loader: 'babel-loader' },
            ],
          },
        ]
      }
    },
  },
});
