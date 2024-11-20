/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import CopyPlugin from "copy-webpack-plugin";
import dotenv from "dotenv";
import "dotenv/config";
import fs from "fs";
import HtmlWebpackPlugin, { HtmlTagObject } from "html-webpack-plugin";
import MonacoWebpackPlugin from "monaco-editor-webpack-plugin";
import path from "path";
import TerserPlugin from "terser-webpack-plugin";
import { Compilation, Compiler, Configuration, DefinePlugin, WebpackPluginInstance } from "webpack";

dotenv.config({ path: "../../.env" });

export default function (webpackEnv: any): Configuration {
  const isProductionEnvironment = !webpackEnv.development;
  verifyEnvironmentVariables(isProductionEnvironment);

  return {
    mode: isProductionEnvironment ? "production" : "development",
    bail: isProductionEnvironment,
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
            jsx: "automatic",
            target: "es2022",
          },
        },
        {
          test: /\.js$/,
          enforce: "pre",
          use: [
            {
              loader: "source-map-loader",
              options: {
                // TODO: Remove this filter when these packages get updated
                filterSourceMappingUrl: (_url: string, resourcePath: string) => {
                  return !(resourcePath.search(/@itwin[\\\/]imodels-client-management/) || resourcePath.search(/@itwin[\\\/]imodels-access-frontend/));
                },
              },
            },
          ],
        },
        {
          test: /\.(css)$/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(s[ac]ss)$/,
          use: ["style-loader", "css-loader", "sass-loader"],
        },
        {
          test: /\.(eot|ttf|woff|woff2)$/,
          type: "asset/resource",
          generator: {
            filename: "fonts/[name].[hash][ext]",
          },
        },
        {
          test: /\.svg$/,
          type: "asset/resource",
          generator: {
            filename: "svg/[name].[hash][ext]",
          },
        },
        // Patch iTwin.js frontend package to avoid loading Open Sans font twice
        {
          test: /IModeljs-css\.js$/,
          loader: "string-replace-loader",
          options: {
            search: "document.head.prepend(openSans);",
            replace: "// document.head.prepend(openSans); // Our workaround",
            // Throw if replacement hasn't been performed at least once
            strict: true,
          },
        },
      ],
    },
    output: {
      clean: true,
      path: path.resolve("./build"),
      publicPath: "/",
      filename: "[name].[contenthash].js",
      assetModuleFilename: "[name].[contenthash][ext]",
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
      new FontPreloadPlugin({
        assetPatterns: [/OpenSans-subset\.woff2/],
      }),
      new AppMetadataPlugin({
        clientId: process.env.OAUTH_CLIENT_ID ?? "",
        urlPrefix: process.env.IMJS_URL_PREFIX ?? "",
        appInsights: process.env.APPLICATION_INSIGHTS_CONNECTION_STRING ?? "",
      }),
      new MonacoWebpackPlugin({ languages: ["json"] }),
      new DefinePlugin({
        ["process.env.DEPLOYMENT_TYPE"]: JSON.stringify(process.env.DEPLOYMENT_TYPE),
      }),
      new CopyPlugin({
        patterns: [
          { to: "locales", from: "public/locales" },
          { to: ".", from: "node_modules/@itwin/appui-react/lib/public" },
          { to: ".", from: "node_modules/@itwin/components-react/lib/public" },
          { to: ".", from: "node_modules/@itwin/core-frontend/lib/public" },
          { to: ".", from: "node_modules/@itwin/core-react/lib/public" },
          { to: ".", from: "node_modules/@itwin/imodel-components-react/lib/public" },
          { to: ".", from: "node_modules/@itwin/presentation-common/lib/public" },
          { to: ".", from: "node_modules/@itwin/presentation-components/lib/public" },
        ],
      }),
    ],
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
      fallback: {},
    },
    ...(!isProductionEnvironment && {
      cache: {
        type: "filesystem",
        buildDependencies: {
          config: [__filename],
        },
      },
      devServer: {
        // Always serve /index.html instead of 404 status code
        historyApiFallback: true,
        hot: true,
        port: 3000,
        client: {
          overlay: {
            errors: true,
            warnings: false,
            runtimeErrors: (error: Error) => {
              if (error.message.startsWith("ResizeObserver")) {
                return false;
              }
              return true;
            },
          },
        },
      },
      devtool: "cheap-module-source-map",
    }),
  };
}

function verifyEnvironmentVariables(isProductionEnvironment: boolean): void {
  (process.env.DEPLOYMENT_TYPE as any) ??= isProductionEnvironment ? "web" : "dev";
  // Webpack does not resolve correct types in the config for some reason, so no typechecking
  if (!new Set(["dev", "local", "web"]).has(process.env.DEPLOYMENT_TYPE as string)) {
    // eslint-disable-next-line no-console
    console.error(`Error: Environment variable DEPLOYMENT_TYPE has invalid value: '${process.env.DEPLOYMENT_TYPE}'.`);
    process.exit(1);
  }

  const isDevDeployment = process.env.DEPLOYMENT_TYPE === "dev";
  const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID;
  if ((!isDevDeployment && !OAUTH_CLIENT_ID) || OAUTH_CLIENT_ID === "spa-xxxxxxxxxxxxxxxxxxxxxxxxx") {
    // eslint-disable-next-line no-console
    console.error(
      "Error: Environment variable OAUTH_CLIENT_ID has not been set. Instructions in .env.example file \
will guide you through the setup process.",
    );
    process.exit(1);
  }
}

/** Hooks into HtmlWebpackPlugin and adds <link> tags to tell the browser to preload specific resources. */
class FontPreloadPlugin implements WebpackPluginInstance {
  private assetPatterns: RegExp[];
  private assetsToPreload: Array<string> = [];

  constructor({ assetPatterns }: { assetPatterns: RegExp[] }) {
    this.assetPatterns = assetPatterns;
  }

  public apply(compiler: Compiler): void {
    compiler.hooks.compilation.tap(FontPreloadPlugin.name, (compilation) => {
      const publicPath =
        typeof compilation.outputOptions.publicPath === "function" ? compilation.outputOptions.publicPath({}) : compilation.outputOptions.publicPath || "";

      HtmlWebpackPlugin.getHooks(compilation).beforeAssetTagGeneration.tap(FontPreloadPlugin.name, (htmlPluginData) => {
        // Sort assets to ensure consistent ordering
        this.assetsToPreload = findAssets(compilation, this.assetPatterns).sort();
        return htmlPluginData;
      });

      HtmlWebpackPlugin.getHooks(compilation).alterAssetTags.tap(FontPreloadPlugin.name, (htmlPluginData) => {
        const linkElements: HtmlTagObject[] = this.assetsToPreload.map((assetFile) => ({
          tagName: "link",
          voidTag: true,
          attributes: {
            href: `${publicPath}${assetFile}`,
            rel: "preload",
            as: "font",
            // Because we are preloading a font, we need to set crossorigin attribute. Its value should be empty.
            crossorigin: "",
          },
          meta: {},
        }));
        htmlPluginData.assetTags.styles = [...linkElements, ...htmlPluginData.assetTags.styles];
        return htmlPluginData;
      });
    });
  }
}

/** Find assets by testing original file paths with supplied patterns and return list of matched asset identifiers. */
function findAssets(compilation: Compilation, patterns: RegExp[]): string[] {
  const result: Array<string> = [];
  // eslint-disable-next-line guard-for-in
  for (const asset in compilation.assets) {
    const sourceFilename = compilation.assetsInfo.get(asset)?.sourceFilename;
    if (sourceFilename === undefined) {
      continue;
    }

    if (patterns.some((pattern) => pattern.test(sourceFilename))) {
      result.push(asset);
    }
  }

  return result;
}

class AppMetadataPlugin implements WebpackPluginInstance {
  constructor(private metadata: Record<string, string>) {}

  public apply(compiler: Compiler): void {
    compiler.hooks.compilation.tap(AppMetadataPlugin.name, (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).alterAssetTags.tap(AppMetadataPlugin.name, (htmlPluginData) => {
        for (const [key, value] of Object.entries(this.metadata)) {
          htmlPluginData.assetTags.meta.push({
            tagName: "meta",
            voidTag: true,
            attributes: { itemprop: key, content: value },
            meta: {},
          });
        }

        return htmlPluginData;
      });
    });
  }
}
