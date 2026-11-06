/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { type Mock, vi } from "vitest";
import { Presentation } from "@itwin/presentation-frontend";

export type MockFunction<T extends (...args: any[]) => any> = Mock<T>;

/** Stubs all {@linkcode Presentation.presentation} methods. */
export function stubPresentationManager(): void {
  const registeredRuleset = {
    [Symbol.dispose]: vi.fn(),
  };
  const rulesetManager = {
    add: vi.fn().mockResolvedValue(registeredRuleset),
    modify: vi.fn().mockResolvedValue(registeredRuleset),
  };

  vi.spyOn(Presentation, "presentation", "get").mockReturnValue({
    rulesets: () => rulesetManager,
  } as any);
}
