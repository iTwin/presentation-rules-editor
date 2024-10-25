/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { execFileSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as prettyBytes from "pretty-bytes";
import { IModelMetadata, PresentationRulesEditorRpcInterface } from "@app/common";
import { RpcManager } from "@itwin/core-common";
import { SnapshotFileNameResolver } from "./SnapshotFileNameResolver";

/** The backend implementation of PresentationRulesEditorRpcInterface. */
export class PresentationRulesEditorRpcImpl extends PresentationRulesEditorRpcInterface {
  public static register(): void {
    RpcManager.registerImpl(PresentationRulesEditorRpcInterface, PresentationRulesEditorRpcImpl);
  }

  public override async getAvailableIModels(): Promise<IModelMetadata[]> {
    const dir = SnapshotFileNameResolver.getIModelsDirectory();
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && (entry.name.endsWith(".ibim") || entry.name.endsWith(".bim")))
      .map((file) => {
        const entry = fs.statSync(path.join(dir, file.name));
        return { name: file.name, dateModified: entry.mtime, size: prettyBytes(entry.size) };
      });
  }

  public override async openIModelsDirectory(): Promise<void> {
    let command: string;
    let args: string[];
    const iModelsDirectory = SnapshotFileNameResolver.getIModelsDirectory();
    switch (process.platform) {
      case "darwin":
        command = "open";
        args = [iModelsDirectory];
        break;

      case "win32":
        // "start" will switch focus to the explorer window
        command = "start";
        args = ["explorer", iModelsDirectory];
        break;

      case "linux":
        // Check if we are running under WSL
        if (os.release().includes("microsoft")) {
          command = "powershell.exe";
          args = ["start", "explorer.exe", iModelsDirectory.split("/").join("\\\\")];
        } else {
          command = "xdg-open";
          args = [iModelsDirectory];
        }
        break;

      default:
        command = "xdg-open";
        args = [iModelsDirectory];
    }

    execFileSync(command, args, { shell: true });
  }
}
