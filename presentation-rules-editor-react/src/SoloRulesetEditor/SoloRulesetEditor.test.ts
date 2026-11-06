/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import * as monaco from "monaco-editor";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { EditableRuleset } from "../EditableRuleset.js";
import { MockFunction, stubPresentationManager } from "../TestUtils.js";
import { SoloRulesetEditor } from "./SoloRulesetEditor.js";

describe("SoloRulesetEditor", () => {
  let editableRuleset: EditableRuleset;

  beforeAll(() => {
    stubPresentationManager();
    editableRuleset = new EditableRuleset({ initialRuleset: { id: "", rules: [] } });
  });

  afterAll(() => {
    editableRuleset[Symbol.dispose]();
    vi.restoreAllMocks();
  });

  let stubGetModel: MockFunction<(typeof monaco.editor)["getModel"]>;
  let stubCreateModel: MockFunction<(typeof monaco.editor)["createModel"]>;
  let monacoModule: DeepPartial<typeof monaco>;

  type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

  beforeEach(() => {
    stubGetModel = vi.fn();
    stubCreateModel = vi.fn();

    monacoModule = {
      Uri: {
        parse(uri: string) {
          return uri;
        },
      },
      editor: {
        getModel: stubGetModel,
        createModel: stubCreateModel,
      },
    };
  });

  describe("constructor", () => {
    it("grabs existing model if one exists", () => {
      stubGetModel.mockImplementation(() => ({}) as any);

      new SoloRulesetEditor({ editableRuleset, monaco: monacoModule as typeof monaco });

      expect(monacoModule.editor?.getModel).toHaveBeenCalledOnce();
      expect(monacoModule.editor?.getModel).toHaveBeenCalledWith(`presentation-rules-editor://rulesets/${editableRuleset.id}.ruleset.json`);
      expect(monacoModule.editor?.createModel).not.toHaveBeenCalled();
    });

    it("creates new model of one doesn't exist", () => {
      new SoloRulesetEditor({ editableRuleset, monaco: monacoModule as typeof monaco });

      expect(monacoModule.editor?.getModel).toHaveBeenCalledOnce();
      expect(monacoModule.editor?.getModel).toHaveBeenCalledWith(`presentation-rules-editor://rulesets/${editableRuleset.id}.ruleset.json`);
      expect(monacoModule.editor?.createModel).toHaveBeenCalledOnce();
    });
  });

  describe("dispose", () => {
    it("disposes underlying model", () => {
      const stubModel = {
        disposed: false,
        dispose() {
          this.disposed = true;
        },
        isDisposed() {
          return this.disposed;
        },
      };
      const disposeSpy = vi.spyOn(stubModel, "dispose");
      stubGetModel.mockImplementation(() => stubModel as any);

      const rulesetEditor = new SoloRulesetEditor({ editableRuleset, monaco: monacoModule as typeof monaco });
      expect(rulesetEditor.disposed).toBe(false);
      expect(disposeSpy).not.toHaveBeenCalled();

      rulesetEditor[Symbol.dispose]();
      expect(rulesetEditor.disposed).toBe(true);
      expect(disposeSpy).toHaveBeenCalledOnce();
    });
  });
});
