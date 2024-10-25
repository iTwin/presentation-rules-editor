/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

const prettierConfig = require("eslint-config-prettier");

module.exports = [
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      ...prettierConfig.rules,
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@itwin/no-internal": [
        "error",
        {
          tag: ["internal"],
        },
      ],
      "@typescript-eslint/no-unsafe-enum-comparison": "off",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowAny: true,
          allowBoolean: true,
          allowNever: false,
          allowNullish: false,
          allowNumber: true,
          allowRegExp: false,
        },
      ],
      curly: ["error", "all"],
    },
  },
];
