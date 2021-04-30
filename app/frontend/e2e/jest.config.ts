/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
export default {
  preset: "jest-playwright-preset",
  clearMocks: true,
  slowTestThreshold: 5,
  testMatch: [
    "**/*.test.ts?(x)"
  ],
  testTimeout: 30000,
  transform: {
    "\\.tsx?$": "ts-jest",
  },
  globals: {
    "ts-jest": {
      tsconfig: "./e2e/tsconfig.json",
    },
  },
};
