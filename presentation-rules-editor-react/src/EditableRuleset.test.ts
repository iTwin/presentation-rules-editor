/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import * as sinon from "sinon";
import { Ruleset } from "@itwin/presentation-common";
import { Presentation } from "@itwin/presentation-frontend";
import { EditableRuleset } from "./EditableRuleset.js";
import { stubPresentationManager } from "./TestUtils.js";

describe("EditableRuleset", () => {
  before(() => {
    stubPresentationManager();
  });

  after(() => {
    sinon.reset();
  });

  beforeEach(() => {
    sinon.resetHistory();
  });

  const initialRuleset: Ruleset = {
    id: "ruleset1",
    rules: [],
  };

  describe("constructor", () => {
    it("sets a unique EditableRuleset id", () => {
      const editableRuleset1 = new EditableRuleset({ initialRuleset });
      const editableRuleset2 = new EditableRuleset({ initialRuleset });

      expect(editableRuleset1.id).not.to.be.equal(editableRuleset2.id);

      editableRuleset1.dispose();
      editableRuleset2.dispose();
    });

    it("sets initial ruleset content", () => {
      const editableRuleset = new EditableRuleset({ initialRuleset });
      expect(editableRuleset.rulesetContent).to.be.equal(initialRuleset);

      editableRuleset.dispose();
    });

    it("registers Presentation ruleset", () => {
      const editableRuleset = new EditableRuleset({ initialRuleset });
      expect(Presentation.presentation.rulesets().add).to.have.been.calledOnce.and.calledWithMatch(sinon.match({ id: editableRuleset.id }));

      editableRuleset.dispose();
    });
  });

  describe("dispose", () => {
    it("unregisters Presentation ruleset", async () => {
      const editableRuleset = new EditableRuleset({ initialRuleset });
      editableRuleset.dispose();
      const registeredRuleset = await Presentation.presentation.rulesets().add({} as any);
      expect(registeredRuleset.dispose).to.have.been.calledOnce;
    });

    it("does nothing when called again", async () => {
      const editableRuleset = new EditableRuleset({ initialRuleset });
      expect(editableRuleset.disposed).to.be.false;
      editableRuleset.dispose();
      expect(editableRuleset.disposed).to.be.true;

      // Call again synchronously
      editableRuleset.dispose();
      const registeredRuleset = await Presentation.presentation.rulesets().add({} as any);
      expect(registeredRuleset.dispose).to.have.been.calledOnce;

      // Call again in another task
      editableRuleset.dispose();
      expect(registeredRuleset.dispose).to.have.been.calledOnce;
    });
  });

  describe("updateRuleset", () => {
    it("modifies inner registered ruleset", async () => {
      const editableRuleset = new EditableRuleset({ initialRuleset });
      await editableRuleset.updateRuleset(initialRuleset);
      const registeredRuleset = await Presentation.presentation.rulesets().add({} as any);
      const modifySpy = Presentation.presentation.rulesets().modify;
      expect(modifySpy).to.have.been.calledOnceWithExactly(registeredRuleset, initialRuleset);

      editableRuleset.dispose();
    });

    it("does nothing when disposed before call", async () => {
      const editableRuleset = new EditableRuleset({ initialRuleset });
      editableRuleset.dispose();
      await editableRuleset.updateRuleset(initialRuleset);
      expect(Presentation.presentation.rulesets().modify).to.not.have.been.called;
    });

    it("does nothing when disposed immediately after the call", () => {
      const editableRuleset = new EditableRuleset({ initialRuleset });
      void editableRuleset.updateRuleset(initialRuleset);
      editableRuleset.dispose();
      expect(Presentation.presentation.rulesets().modify).to.not.have.been.called;
    });

    it("fires onAfterRulesetUpdated event", async () => {
      const editableRuleset = new EditableRuleset({ initialRuleset });
      const fakeEventListener = sinon.fake();
      editableRuleset.onAfterRulesetUpdated.addListener(fakeEventListener);
      expect(fakeEventListener).not.to.have.been.called;

      await editableRuleset.updateRuleset(initialRuleset);
      expect(fakeEventListener).to.have.been.calledOnce;

      editableRuleset.dispose();
    });
  });
});
