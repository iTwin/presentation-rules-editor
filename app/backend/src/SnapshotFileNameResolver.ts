/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";
import { IModelHost } from "@itwin/core-backend";

export class SnapshotFileNameResolver {
  public static getIModelsDirectory(): string {
    const assetsDir = IModelHost.appAssetsDir ? IModelHost.appAssetsDir : "assets";
    return path.resolve(path.join(assetsDir, "imodels"));
  }

  public static resolveFileName(imodelName: string): string {
    if (typeof imodelName !== "string" || path.basename(imodelName) !== imodelName || imodelName.includes("\\") || !imodelName.endsWith(".bim")) {
      throw new Error("Expected an iModel filename ending in .bim.");
    }

    const directory = fs.realpathSync(this.getIModelsDirectory());
    const filename = fs.realpathSync(path.join(directory, imodelName));
    const relativePath = path.relative(directory, filename);
    if (
      relativePath === ".." ||
      relativePath.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relativePath) ||
      !filename.endsWith(".bim") ||
      !fs.statSync(filename).isFile()
    ) {
      throw new Error("The iModel must be a .bim file within the iModels directory.");
    }

    return filename;
  }
}
