/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { PresentationRulesEditorRpcInterface } from "common";
import * as fs from "fs";
import * as path from "path";
import { IModelHost } from "@bentley/imodeljs-backend";
import { RpcManager } from "@bentley/imodeljs-common";

/** The backend implementation of PresentationRulesEditorRpcInterface. */
export class PresentationRulesEditorRpcImpl extends PresentationRulesEditorRpcInterface {
  public static register(): void {
    RpcManager.registerImpl(PresentationRulesEditorRpcInterface, PresentationRulesEditorRpcImpl);
  }

  public async getAvailableIModels(): Promise<string[]> {
    const dir = path.join(this.getAssetsDir(), "imodels");
    const files = fs.readdirSync(dir);
    return files
      .filter((name) => name.endsWith(".ibim") || name.endsWith(".bim"))
      .map((name) => path.resolve(dir, name));
  }

  private getAssetsDir(): string {
    return IModelHost.appAssetsDir ? IModelHost.appAssetsDir : "assets";
  }
}
