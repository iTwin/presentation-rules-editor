/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { IModelHost, SnapshotDb } from "@itwin/core-backend";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PresentationRulesEditorRpcImpl } from "../PresentationRulesEditorRpcImpl.js";

describe("Local snapshot files", () => {
  const rpc = new PresentationRulesEditorRpcImpl();
  let directory: string;
  let imodelsDirectory: string;
  let outsidePath: string;
  let snapshotPaths: string[];

  beforeAll(async () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "presentation-rules-editor-"));
    const assetsDirectory = path.join(directory, "assets");
    imodelsDirectory = path.join(assetsDirectory, "imodels");
    fs.mkdirSync(imodelsDirectory, { recursive: true });
    // This sibling shares the directory prefix but must not be treated as inside `imodels`.
    fs.mkdirSync(`${imodelsDirectory}-outside`);
    outsidePath = path.join(`${imodelsDirectory}-outside`, "outside.bim");
    await IModelHost.startup({ appAssetsDir: assetsDirectory, cacheDir: path.join(directory, "cache") });

    snapshotPaths = [path.join(imodelsDirectory, "allowed.bim"), path.join(imodelsDirectory, "other.txt"), outsidePath];
    for (const filename of snapshotPaths) {
      SnapshotDb.createEmpty(filename, { rootSubject: { name: "Local RPC test" } }).close();
    }

    // Verify containment and extension checks against the resolved symlink targets, not just their names.
    fs.symlinkSync(outsidePath, path.join(imodelsDirectory, "outside-link.bim"));
    fs.symlinkSync(path.join(imodelsDirectory, "other.txt"), path.join(imodelsDirectory, "wrong-extension-link.bim"));
    fs.symlinkSync(path.join(imodelsDirectory, "allowed.bim"), path.join(imodelsDirectory, "inside-link.bim"));
    fs.mkdirSync(path.join(imodelsDirectory, "directory.bim"));
  });

  afterEach(() => {
    // SnapshotDb caches open files, so close them between cases to keep the tests independent.
    for (const filename of snapshotPaths) {
      SnapshotDb.findByFilename(filename)?.close();
    }
  });

  afterAll(async () => {
    await IModelHost.shutdown();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it("rejects opening an absolute path outside the model directory", async () => {
    await expect(rpc.getConnectionProps(outsidePath)).rejects.toThrow(/iModel/);
  });

  it("rejects closing an absolute path outside the model directory", async () => {
    const db = SnapshotDb.openFile(outsidePath);
    await expect(rpc.closeConnection(outsidePath)).rejects.toThrow(/iModel/);
    // A rejected close must not affect a database the caller already had open.
    expect(SnapshotDb.findByFilename(outsidePath)).toBe(db);
  });

  it.each(["allowed.bim", "inside-link.bim"])("opens and closes %s using its canonical path", async (name) => {
    const props = await rpc.getConnectionProps(name);
    // The in-directory symlink is valid, but the database itself is keyed by its resolved path.
    const filename = fs.realpathSync(path.join(imodelsDirectory, name));
    expect(SnapshotDb.findByFilename(filename)?.key).toBe(props.key);
    await rpc.closeConnection(name);
    expect(SnapshotDb.findByFilename(filename)).toBeUndefined();
  });

  it.each([
    "../imodels-outside/outside.bim",
    "..\\imodels-outside\\outside.bim",
    "outside-link.bim",
    "wrong-extension-link.bim",
    "directory.bim",
    "other.txt",
    "",
  ])("rejects invalid snapshot name %j for open and close", async (name) => {
    await expect(rpc.getConnectionProps(name)).rejects.toThrow(/iModel/);
    await expect(rpc.closeConnection(name)).rejects.toThrow(/iModel/);
  });

  // Windows does not allow renaming an open snapshot.
  it.skipIf(process.platform === "win32")("closes a snapshot that was renamed while open", async () => {
    SnapshotDb.createEmpty(path.join(imodelsDirectory, "renamed.bim"), { rootSubject: { name: "Renamed" } }).close();
    const filename = fs.realpathSync(path.join(imodelsDirectory, "renamed.bim"));
    await rpc.getConnectionProps("renamed.bim");
    fs.renameSync(filename, path.join(directory, "renamed.bim"));
    await rpc.closeConnection("renamed.bim");
    expect(SnapshotDb.findByFilename(filename)).toBeUndefined();
  });

  it("lists only regular snapshot files", async () => {
    const imodels = await rpc.getAvailableIModels();
    expect(imodels.map((imodel) => imodel.name)).toEqual(["allowed.bim"]);
  });
});
