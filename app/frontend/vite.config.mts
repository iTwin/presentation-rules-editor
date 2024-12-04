/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import monacoEditorPlugin from "vite-plugin-monaco-editor";
import { viteStaticCopy } from "vite-plugin-static-copy";

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
          { src: "public/locales", dest: "locales" },
        ],
      }),
      monacoEditorPlugin.default({}),
    ],
    server: {
      port: 3000,
      strictPort: true,
    },
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ["mixed-decls", "color-functions", "global-builtin", "import"],
        },
      },
    },
    logLevel: "error",
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

function verifyEnvironmentVariables(mode: string): void {
  const isProductionEnvironment = mode === "production";
  (process.env.VITE_DEPLOYMENT_TYPE as any) ??= isProductionEnvironment || process.env.WEB_TEST ? "web" : "dev";

  const env = loadEnv(mode, process.cwd(), "");

  if (!new Set(["dev", "local", "web"]).has(env.VITE_DEPLOYMENT_TYPE)) {
    throw new Error(`Environment variable VITE_DEPLOYMENT_TYPE has invalid value: '${process.env.VITE_DEPLOYMENT_TYPE}'.`);
  }

  if ((env.VITE_DEPLOYMENT_TYPE !== "dev" && !env.VITE_OAUTH_CLIENT_ID) || env.VITE_OAUTH_CLIENT_ID === "spa-xxxxxxxxxxxxxxxxxxxxxxxxx") {
    // eslint-disable-next-line no-console
    throw new Error(`Environment variable VITE_OAUTH_CLIENT_ID has not been set. Instructions in .env.example file \
will guide you through the setup process.`);
  }
}
