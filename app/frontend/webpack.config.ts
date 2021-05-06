/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import HtmlWebpackPlugin from "html-webpack-plugin";
import path from "path";
import { Configuration, ProvidePlugin } from "webpack";

const config: Configuration & { devServer: any; } = {
  mode: "development",
  entry: {
    app: "./src/index.tsx",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "esbuild-loader",
        options: {
          loader: "tsx",
          target: "es2020",
        },
      },
      {
        test: /\.(s[ac]ss|css)$/,
        use: [
          "style-loader",
          "css-loader",
          "sass-loader",
        ],
      },
      {
        test: /\.(svg|eot|ttf|woff|woff2)\??/,
        type: "asset/inline",
      },
    ],
  },
  output: {
    // Source maps are not being found on Windows due to non-Unix path separator
    devtoolModuleFilenameTemplate: (info: any) => path.resolve(info.absoluteResourcePath).replace(/\\/g, '/'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "iTwin.js Presentation Rules Editor",
      favicon: "public/favicon.ico",
    }),
    new ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser",
    }),
  ],
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    fallback: {
      buffer: "buffer",
      http: "stream-http",
      https: "https-browserify",
      os: false,
      path: false,
      process: "process/browser",
      stream: "stream-browserify",
    },
  },
  cache: {
    type: "filesystem",
    buildDependencies: {
      config: [__filename],
    },
  },
  devServer: {
    contentBase: [
      path.join(__dirname, "public/"),
      path.join(__dirname, "node_modules/@bentley/imodeljs-frontend/lib/public/"),
      path.join(__dirname, "node_modules/@bentley/presentation-common/lib/public/"),
      path.join(__dirname, "node_modules/@bentley/presentation-components/lib/public/"),
      path.join(__dirname, "node_modules/@bentley/ui-abstract/lib/public/"),
      path.join(__dirname, "node_modules/@bentley/ui-components/lib/public/"),
      path.join(__dirname, "node_modules/@bentley/ui-core/lib/public/"),
    ],
  },
  devtool: "cheap-module-source-map",
};

export default config;
