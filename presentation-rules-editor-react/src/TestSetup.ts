/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import * as chai from "chai";
import m from "module";
import sinonChai from "sinon-chai";

chai.use(sinonChai);

// The following makes stubbing package exports possible
const originalCompile = (m as any).prototype._compile;
(m as any).prototype._compile = function (content: any, filename: any) {
  // Obtain exports from the loaded script
  originalCompile.call(this, content, filename);

  // Process the exports if and only if a plain object was exported
  const exportsIsPlainObject = Object.getPrototypeOf(this.exports) === Object.prototype;
  const exportsIsSettable = Object.getOwnPropertyDescriptor(this, "exports")?.configurable;
  if (exportsIsPlainObject && exportsIsSettable) {
    // Make properties writable
    const relaxedExports: any = {};
    for (const [key, value] of Object.entries(this.exports)) {
      relaxedExports[key] = value;
    }

    // Object.entries does not list non-enumerable properties
    for (const key of Object.getOwnPropertyNames(this.exports)) {
      if (!(key in relaxedExports)) {
        Object.defineProperty(relaxedExports, key, { configurable: true, enumerable: false, writable: true, value: this.exports[key] });
      }
    }

    this.exports = relaxedExports;
  }
};

// Remove query appendix from SVG file requests that come from iTwin.js
const originalLoad = (m as any)._load;
(m as any)._load = (request: string, parent: any, isMain: any) => {
  return originalLoad(request.replace("?sprite", ""), parent, isMain);
};
