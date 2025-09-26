/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { BeEvent } from "@itwin/core-bentley";
import { RegisteredRuleset, Ruleset } from "@itwin/presentation-common";
import { Presentation } from "@itwin/presentation-frontend";

export interface EditableRulesetParams {
  /** Initial content of {@linkcode EditableRuleset}. Ruleset id does not need to be unique. */
  initialRuleset: Ruleset;
}

/**
 * Represents a ruleset with dynamic content. Instances of this class hold global resources until {@linkcode dispose}
 * method is called.
 */
export class EditableRuleset implements Disposable {
  private static _numCreatedRulesets = 0;

  private _registeredRulesetPromise: Promise<RegisteredRuleset>;
  private _disposed = false;
  private _rulesetContent: Ruleset;

  constructor(params: EditableRulesetParams) {
    this.id = `EditableRuleset-${EditableRuleset._numCreatedRulesets}`;
    EditableRuleset._numCreatedRulesets += 1;

    this._rulesetContent = params.initialRuleset;
    this._registeredRulesetPromise = Presentation.presentation.rulesets().add({ ...this._rulesetContent, id: this.id });
  }

  /** Unique identifier for this {@linkcode EditableRuleset}. Has no relation to ruleset id. */
  public readonly id: string;

  /** Fires after a completed ruleset update. */
  public readonly onAfterRulesetUpdated = new BeEvent<() => void>();

  /** Tells whether {@linkcode dispose} method has been called on this object. */
  public get disposed(): boolean {
    return this._disposed;
  }

  /** Current ruleset content. */
  public get rulesetContent(): Ruleset {
    return this._rulesetContent;
  }

  public [Symbol.dispose](): void {
    if (this._disposed) {
      return;
    }

    this._disposed = true;
    void (async () => (await this._registeredRulesetPromise)[Symbol.dispose]())();
  }

  /**
   * Changes ruleset content to the provided value.
   * @param newContent Updated content for this ruleset.
   * @returns Promise that resolves after ruleset change takes effect.
   */
  public async updateRuleset(newContent: Ruleset): Promise<void> {
    if (this._disposed) {
      return;
    }

    const registeredRuleset = await this._registeredRulesetPromise;
    if (this._disposed) {
      return;
    }

    this._rulesetContent = newContent;
    this._registeredRulesetPromise = Presentation.presentation.rulesets().modify(registeredRuleset, newContent);
    await this._registeredRulesetPromise;
    this.onAfterRulesetUpdated.raiseEvent();
  }
}
