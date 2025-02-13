/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { defineConfig, HtmlTagDescriptor, loadEnv, Plugin } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  verifyEnvironmentVariables(mode);

  return {
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          {
            // copy assets from `@itwin` dependencies
            src: "./node_modules/@itwin/*/lib/public/*",
            dest: ".",
          },
        ],
      }),
      injectAppMetadata(mode),
    ],
    server: {
      port: 3000,
      strictPort: true,
    },
    build: {
      target: "es2022",
    },
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ["mixed-decls", "color-functions", "global-builtin", "import"],
        },
      },
    },
    envPrefix: ["DEPLOYMENT_", "OAUTH_", "IMJS_", "APPLICATION_"],
    resolve: {
      alias: [
        {
          // Resolve SASS tilde imports.
          find: /^~(.*)$/,
          replacement: "$1",
        },
      ],
    },
  };
});

function injectAppMetadata(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    name: "inject-app-metadata",
    transformIndexHtml: () => {
      const tags: HtmlTagDescriptor[] = [
        {
          tag: "meta",
          attrs: { name: "clientId", content: env.OAUTH_CLIENT_ID },
          injectTo: "head",
        },
      ];
      if (env.IMJS_URL_PREFIX) {
        tags.push({
          tag: "meta",
          attrs: { name: "urlPrefix", content: env.IMJS_URL_PREFIX },
          injectTo: "head",
        });
      }
      if (env.APPLICATION_INSIGHTS_CONNECTION_STRING) {
        tags.push({
          tag: "meta",
          attrs: { name: "appInsights", content: env.APPLICATION_INSIGHTS_CONNECTION_STRING },
          injectTo: "head",
        });
      }

      return tags;
    },
  };
}

function verifyEnvironmentVariables(mode: string): void {
  const isProductionEnvironment = mode === "production";
  (process.env.DEPLOYMENT_TYPE as any) ??= isProductionEnvironment || process.env.WEB_TEST ? "web" : "dev";

  const env = loadEnv(mode, process.cwd(), "");

  if (!new Set(["dev", "local", "web"]).has(env.DEPLOYMENT_TYPE)) {
    throw new Error(`Environment variable DEPLOYMENT_TYPE has invalid value: '${process.env.DEPLOYMENT_TYPE}'.`);
  }

  if ((env.DEPLOYMENT_TYPE !== "dev" && !env.OAUTH_CLIENT_ID) || env.OAUTH_CLIENT_ID === "spa-xxxxxxxxxxxxxxxxxxxxxxxxx") {
    throw new Error(`Environment variable OAUTH_CLIENT_ID has not been set. Instructions in .env file \
will guide you through the setup process.`);
  }
}
