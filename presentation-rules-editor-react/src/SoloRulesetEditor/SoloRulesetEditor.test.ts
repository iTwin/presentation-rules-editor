/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import * as monaco from "monaco-editor";
import * as sinon from "sinon";
import { EditableRuleset } from "../EditableRuleset.js";
import { SinonStub, stubPresentationManager } from "../TestUtils.js";
import { SoloRulesetEditor } from "./SoloRulesetEditor.js";

describe("SoloRulesetEditor", () => {
  let editableRuleset: EditableRuleset;

  before(() => {
    stubPresentationManager();
    editableRuleset = new EditableRuleset({ initialRuleset: { id: "", rules: [] } });
  });

  after(() => {
    editableRuleset.dispose();
    sinon.restore();
  });

  let stubGetModel: SinonStub<(typeof monaco.editor)["getModel"]>;
  let stubCreateModel: SinonStub<(typeof monaco.editor)["createModel"]>;
  let monacoModule: DeepPartial<typeof monaco>;

  type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

  beforeEach(() => {
    stubGetModel = sinon.stub();
    stubCreateModel = sinon.stub();

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
      stubGetModel.callsFake(() => ({}) as any);

      new SoloRulesetEditor({ editableRuleset, monaco: monacoModule as typeof monaco });

      expect(monacoModule.editor!.getModel).to.have.been.calledOnceWithExactly(`presentation-rules-editor://rulesets/${editableRuleset.id}.ruleset.json`);
      expect(monacoModule.editor!.createModel).not.to.have.been.called;
    });

    it("creates new model of one doesn't exist", () => {
      new SoloRulesetEditor({ editableRuleset, monaco: monacoModule as typeof monaco });

      expect(monacoModule.editor!.getModel).to.have.been.calledOnceWithExactly(`presentation-rules-editor://rulesets/${editableRuleset.id}.ruleset.json`);
      expect(monacoModule.editor!.createModel).to.have.been.calledOnce;
    });
  });

  describe("dispose", () => {
    it("disposes underlying model", () => {
      const stubModel = sinon.spy({
        disposed: false,
        dispose() {
          this.disposed = true;
        },
        isDisposed() {
          return this.disposed;
        },
      });
      stubGetModel.callsFake(() => stubModel as any);

      const rulesetEditor = new SoloRulesetEditor({ editableRuleset, monaco: monacoModule as typeof monaco });
      expect(rulesetEditor.disposed).to.be.false;
      expect(stubModel.dispose).not.to.have.been.called;

      rulesetEditor.dispose();
      expect(rulesetEditor.disposed).to.be.true;
      expect(stubModel.dispose).to.have.been.calledOnce;
    });
  });
});
