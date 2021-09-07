/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import dotenv from "dotenv";
import fs from "fs";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MonacoWebpackPlugin from "monaco-editor-webpack-plugin";
import path from "path";
import { Configuration, DefinePlugin, ProvidePlugin } from "webpack";

dotenv.config({ path: "../../.env" });
if (process.env.OAUTH_CLIENT_ID === "spa-xxxxxxxxxxxxxxxxxxxxxxxxx") {
  // eslint-disable-next-line no-console
  console.error("Error: Environment variable OAUTH_CLIENT_ID has not been set. Instructions in .env.example file will guide you through the setup.");
  process.exit(1);
}

const config: Configuration & { devServer: any } = {
  mode: "development",
  entry: {
    app: "./src/index.ts",
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
        test: /\.js$/,
        enforce: "pre",
        use: ["source-map-loader"],
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
        test: /\.(svg|eot|ttf|woff|woff2)$/,
        type: "asset/inline",
      },
    ],
  },
  output: {
    publicPath: "/",
    filename: "[name].bundle.js",
    devtoolModuleFilenameTemplate: (info: any) => {
      // Source maps are not being found on Windows due to non-Unix path separator
      const fixedPath = path.resolve(info.absoluteResourcePath).replace(/\\/g, "/");
      // Resolve real path to make source maps work with symlinked imodeljs repository
      return fs.existsSync(fixedPath) ? fs.realpathSync(fixedPath) : fixedPath;
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "Presentation Rules Editor",
      favicon: "public/favicon.ico",
    }),
    new ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser",
    }),
    new MonacoWebpackPlugin({ languages: ["json"] }),
    new DefinePlugin({
      ["process.env.OAUTH_CLIENT_ID"]: JSON.stringify(process.env.OAUTH_CLIENT_ID),
      ["process.env.IMJS_URL_PREFIX"]: JSON.stringify(process.env.IMJS_URL_PREFIX),
    }),
  ],
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    fallback: {
      assert: false,
      buffer: "buffer",
      http: "stream-http",
      https: "https-browserify",
      os: false,
      path: false,
      process: "process/browser",
      stream: "stream-browserify",
      timers: "timers-browserify",
    },
  },
  cache: {
    type: "filesystem",
    buildDependencies: {
      config: [__filename],
    },
  },
  devServer: {
    static:  [
      path.join(__dirname, "public/"),
      path.join(__dirname, "node_modules/@bentley/imodeljs-frontend/lib/public/"),
      path.join(__dirname, "node_modules/@bentley/presentation-common/lib/public/"),
      path.join(__dirname, "node_modules/@bentley/presentation-components/lib/public/"),
      path.join(__dirname, "node_modules/@bentley/ui-abstract/lib/public/"),
      path.join(__dirname, "node_modules/@bentley/ui-components/lib/public/"),
      path.join(__dirname, "node_modules/@bentley/ui-core/lib/public/"),
      path.join(__dirname, "node_modules/@bentley/ui-framework/lib/public/"),
      path.join(__dirname, "node_modules/@bentley/ui-imodel-components/lib/public/"),
    ],
    // Always serve /index.html instead of 404 status code
    historyApiFallback: true,
    hot: true,
    proxy: {
      // IModelApp always requests PSEUDO localizations in dev builds but we do not have one for the app
      "/locales/en-PSEUDO": {
        target: "http://localhost:8080",
        pathRewrite: { "^/locales/en-PSEUDO": "/locales/en" },
      },
    },
  },
  devtool: "cheap-module-source-map",
};

export default config;
