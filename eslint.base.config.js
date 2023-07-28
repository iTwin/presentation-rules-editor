/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
module.exports = [
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@itwin/no-internal": [
        "error",
        {
          tag: ["internal"],
        },
      ],
      "@typescript-eslint/object-curly-spacing": [
        "error",
        "always",
      ],
      "jsx-a11y/no-onchange": "off",
      "object-curly-spacing": [
        "error",
        "always",
      ],
    },
  },
];
