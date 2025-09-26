/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import * as chai from "chai";
import globalJsdom from "global-jsdom";
import * as jsdom from "jsdom";
import sinonChai from "sinon-chai";

chai.use(sinonChai);

globalJsdom(undefined, {
  // @ts-expect-error types are outdated
  virtualConsole: new jsdom.VirtualConsole().forwardTo(console, { omitJSDOMErrors: true }),
});
