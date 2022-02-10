/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as sinon from "sinon";
import { Presentation } from "@itwin/presentation-frontend";

export type SinonSpy<T extends (...args: any) => any> = sinon.SinonSpy<Parameters<T>, ReturnType<T>>;
export type SinonStub<T extends (...args: any) => any> = sinon.SinonStub<Parameters<T>, ReturnType<T>>;

/** Stubs all {@linkcode Presentation.presentation} methods. */
export function stubPresentationManager(): void {
  const rulesetManager = {
    add: sinon.stub().resolves({
      dispose: sinon.spy(),
    }),
    modify: sinon.stub().resolves(Promise.resolve({})),
  };

  sinon.stub(Presentation, "presentation").get(() => ({
    rulesets: () => rulesetManager,
  }));
}
