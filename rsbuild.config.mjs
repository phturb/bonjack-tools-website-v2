import Dotenv from 'dotenv-webpack';
import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';
const { publicVars, rawPublicVars } = loadEnv({ prefixes: ['PUBLIC_'] });


const ReactCompilerConfig = {};
const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
  html: {
    title: "Bonjack tools",
  },
  source: {
    include: [{ not: /[\\/]core-js[\\/]/ }],
    define: {
      ...publicVars,
      'process.env': JSON.stringify(rawPublicVars),
    },
  },
  plugins: [
    pluginReact({
      swcReactOptions: {
        runtime: 'automatic',
        importSource: '@emotion/react',
      },
      fastRefresh: false,
    }),
    pluginSvgr({ mixedImport: true }),
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
      babelLoaderOptions(opts) {
        opts.plugins?.unshift(
          'babel-plugin-react-compiler',
          ReactCompilerConfig);
      },
    }),
  ].filter(Boolean),
  tools: {
    rspack: {
      plugins: [
      ].filter(Boolean),
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
        ]
      }
    },
  },
});
