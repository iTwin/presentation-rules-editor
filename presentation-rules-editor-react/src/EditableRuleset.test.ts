/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Ruleset } from "@itwin/presentation-common";
import { Presentation } from "@itwin/presentation-frontend";
import { EditableRuleset } from "./EditableRuleset.js";
import { stubPresentationManager } from "./TestUtils.js";

describe("EditableRuleset", () => {
  beforeAll(() => {
    stubPresentationManager();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const initialRuleset: Ruleset = {
    id: "ruleset1",
    rules: [],
  };

  describe("constructor", () => {
    it("sets a unique EditableRuleset id", () => {
      const editableRuleset1 = new EditableRuleset({ initialRuleset });
      const editableRuleset2 = new EditableRuleset({ initialRuleset });

      expect(editableRuleset1.id).not.toBe(editableRuleset2.id);

      editableRuleset1[Symbol.dispose]();
      editableRuleset2[Symbol.dispose]();
    });

    it("sets initial ruleset content", () => {
      const editableRuleset = new EditableRuleset({ initialRuleset });
      expect(editableRuleset.rulesetContent).toBe(initialRuleset);

      editableRuleset[Symbol.dispose]();
    });

    it("registers Presentation ruleset", () => {
      const editableRuleset = new EditableRuleset({ initialRuleset });
      const addRuleset = Presentation.presentation.rulesets().add;
      expect(addRuleset).toHaveBeenCalledOnce();
      expect(addRuleset).toHaveBeenCalledWith(expect.objectContaining({ id: editableRuleset.id }));

      editableRuleset[Symbol.dispose]();
    });
  });

  describe("dispose", () => {
    it("unregisters Presentation ruleset", async () => {
      const editableRuleset = new EditableRuleset({ initialRuleset });
      editableRuleset[Symbol.dispose]();
      const registeredRuleset = await Presentation.presentation.rulesets().add({} as any);
      expect(registeredRuleset[Symbol.dispose]).toHaveBeenCalledOnce();
    });

    it("does nothing when called again", async () => {
      const editableRuleset = new EditableRuleset({ initialRuleset });
      expect(editableRuleset.disposed).toBe(false);
      editableRuleset[Symbol.dispose]();
      expect(editableRuleset.disposed).toBe(true);

      // Call again synchronously
      editableRuleset[Symbol.dispose]();
      const registeredRuleset = await Presentation.presentation.rulesets().add({} as any);
      expect(registeredRuleset[Symbol.dispose]).toHaveBeenCalledOnce();

      // Call again in another task
      editableRuleset[Symbol.dispose]();
      expect(registeredRuleset[Symbol.dispose]).toHaveBeenCalledOnce();
    });
  });

  describe("updateRuleset", () => {
    it("modifies inner registered ruleset", async () => {
      const editableRuleset = new EditableRuleset({ initialRuleset });
      await editableRuleset.updateRuleset(initialRuleset);
      const registeredRuleset = await Presentation.presentation.rulesets().add({} as any);
      const modifySpy = Presentation.presentation.rulesets().modify;
      expect(modifySpy).toHaveBeenCalledOnce();
      expect(modifySpy).toHaveBeenCalledWith(registeredRuleset, initialRuleset);

      editableRuleset[Symbol.dispose]();
    });

    it("does nothing when disposed before call", async () => {
      const editableRuleset = new EditableRuleset({ initialRuleset });
      editableRuleset[Symbol.dispose]();
      await editableRuleset.updateRuleset(initialRuleset);
      expect(Presentation.presentation.rulesets().modify).not.toHaveBeenCalled();
    });

    it("does nothing when disposed immediately after the call", () => {
      const editableRuleset = new EditableRuleset({ initialRuleset });
      void editableRuleset.updateRuleset(initialRuleset);
      editableRuleset[Symbol.dispose]();
      expect(Presentation.presentation.rulesets().modify).not.toHaveBeenCalled();
    });

    it("fires onAfterRulesetUpdated event", async () => {
      const editableRuleset = new EditableRuleset({ initialRuleset });
      const fakeEventListener = vi.fn();
      editableRuleset.onAfterRulesetUpdated.addListener(fakeEventListener);
      expect(fakeEventListener).not.toHaveBeenCalled();

      await editableRuleset.updateRuleset(initialRuleset);
      expect(fakeEventListener).toHaveBeenCalledOnce();

      editableRuleset[Symbol.dispose]();
    });
  });
});
