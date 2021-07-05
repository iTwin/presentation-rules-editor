/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { PresentationRulesEditorRpcInterface } from "@app/common";
import { IModelHost } from "@bentley/imodeljs-backend";
import { RpcManager } from "@bentley/imodeljs-common";

/** The backend implementation of PresentationRulesEditorRpcInterface. */
export class PresentationRulesEditorRpcImpl extends PresentationRulesEditorRpcInterface {
  public static register(): void {
    RpcManager.registerImpl(PresentationRulesEditorRpcInterface, PresentationRulesEditorRpcImpl);
  }

  public override async getAvailableIModels(): Promise<string[]> {
    const dir = getIModelsDirectory();
    const files = fs.readdirSync(dir);
    return files
      .filter((name) => name.endsWith(".ibim") || name.endsWith(".bim"))
      .map((name) => path.resolve(dir, name));
  }

  public override async openIModelsDirectory(): Promise<void> {
    let command: string;
    switch (process.platform) {
      case "darwin":
        command = "open";
        break;

      case "win32":
        // "start" will switch focus to the explorer window
        command = "start explorer";
        break;

      default:
        command = "xdg-open";
    }

    execSync(`${command} ${getIModelsDirectory()}`);
  }
}

function getIModelsDirectory(): string {
  const assetsDir = IModelHost.appAssetsDir ? IModelHost.appAssetsDir : "assets";
  return path.join(assetsDir, "imodels");
}
