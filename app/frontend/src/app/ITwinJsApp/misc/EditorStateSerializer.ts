/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";

export function serializeEditorState(editorContent: string): string {
  const encodedContent = compressToEncodedURIComponent(JSON.stringify({ ruleset: editorContent }));
  return `#editor/${encodedContent}`;
}

export function parseEditorState(serializedEditorState: string): { ruleset: string } | undefined {
  if (!serializedEditorState.startsWith("#editor/")) {
    return undefined;
  }

  try {
    const raw = decompressFromEncodedURIComponent(serializedEditorState.substring("#editor/".length)) ?? "";
    return JSON.parse(raw);
  } catch {
    return { ruleset: "<invalid ruleset>" };
  }
}
