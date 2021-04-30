/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
module.exports = {
  serverOptions: [
    {
      command: "npm start",
      port: 8080,
      usedPortAction: "ignore",
      launchTimeout: 30000,
      // Display console output when debugging
      debug: process.env.PWDEBUG,
    },
    {
      command: "npm start --prefix ../backend",
      port: 3001,
      usedPortAction: "ignore",
      launchTimeout: 10000,
      // Display console output when debugging
      debug: process.env.PWDEBUG,
    },
  ],
};
