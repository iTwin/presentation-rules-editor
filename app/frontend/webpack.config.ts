/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import dotenv from "dotenv";
import fs from "fs";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MonacoWebpackPlugin from "monaco-editor-webpack-plugin";
import path from "path";
import TerserPlugin from "terser-webpack-plugin";
import { Configuration, DefinePlugin, ProvidePlugin } from "webpack";

dotenv.config({ path: "../../.env" });

export default function (webpackEnv: any): Configuration & { devServer?: any } {
  const isProductionEnvironment = !webpackEnv.development;
  verifyEnvironmentVariables(isProductionEnvironment);

  return {
    mode: isProductionEnvironment ? "production" : "development",
    bail: isProductionEnvironment,
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
      path: path.resolve("./build"),
      publicPath: "/",
      filename: "[name].[contenthash:8].js",
      devtoolModuleFilenameTemplate: (info: any) => {
        // Source maps are not being found on Windows due to non-Unix path separator
        const fixedPath = path.resolve(info.absoluteResourcePath).replace(/\\/g, "/");
        // Resolve real path to make source maps work with symlinked imodeljs repository
        return fs.existsSync(fixedPath) ? fs.realpathSync(fixedPath) : fixedPath;
      },
    },
    optimization: {
      minimize: isProductionEnvironment,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            ecma: 2020,
            module: true,
            // iTwin.js RPC mechanism depends on unmangled names
            keep_classnames: true,
            keep_fnames: true,
          },
        }),
      ],
      splitChunks: {
        chunks: "all",
        name: false,
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
        ["process.env.DEPLOYMENT_TYPE"]: JSON.stringify(process.env.DEPLOYMENT_TYPE),
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
    ...(!isProductionEnvironment && {
      cache: {
        type: "filesystem",
        buildDependencies: {
          config: [__filename],
        },
      },
      devServer: {
        static: [
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
    }),
  };
}

function verifyEnvironmentVariables(isProductionEnvironment: boolean): void {
  process.env.DEPLOYMENT_TYPE ??= isProductionEnvironment ? "web" : "dev";
  if (!new Set(["dev", "local", "web"]).has(process.env.DEPLOYMENT_TYPE)) {
    // eslint-disable-next-line no-console
    console.error(`Error: Environment variable DEPLOYMENT_TYPE has invalid value: '${process.env.DEPLOYMENT_TYPE}'.`);
    process.exit(1);
  }

  const isDevDeployment = process.env.DEPLOYMENT_TYPE === "dev";
  const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID;
  if ((!isDevDeployment && !OAUTH_CLIENT_ID) || OAUTH_CLIENT_ID === "spa-xxxxxxxxxxxxxxxxxxxxxxxxx") {
    // eslint-disable-next-line no-console
    console.error("Error: Environment variable OAUTH_CLIENT_ID has not been set. Instructions in .env.example file \
will guide you through the setup process.");
    process.exit(1);
  }
}
