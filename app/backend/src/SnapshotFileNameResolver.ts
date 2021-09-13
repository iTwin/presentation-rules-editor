/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as path from "path";
import { FileNameResolver, IModelHost } from "@bentley/imodeljs-backend";

export class SnapshotFileNameResolver extends FileNameResolver {
  public override tryResolveFileName(inFileName: string): string | undefined {
    return path.resolve(SnapshotFileNameResolver.getIModelsDirectory(), inFileName);
  }

  public static getIModelsDirectory(): string {
    const assetsDir = IModelHost.appAssetsDir ? IModelHost.appAssetsDir : "assets";
    return path.join(assetsDir, "imodels");
  }
}
