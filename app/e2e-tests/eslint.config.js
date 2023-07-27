/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
const iTwinPlugin = require("@itwin/eslint-plugin");
const eslintBaseConfig = require("../../eslint.base.config");

module.exports = [
  {
    files: ["**/*.{ts,tsx}"],
    ...iTwinPlugin.configs.iTwinjsRecommendedConfig,
  },
  ...eslintBaseConfig,
];
