/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as componentsReact from "@itwin/components-react";
import * as presentationComponents from "@itwin/presentation-components";
import { cleanup, render } from "@testing-library/react";
import { EditableRuleset } from "../EditableRuleset.js";
import { MockFunction, stubPresentationManager } from "../TestUtils.js";
import { Tree } from "./Tree.js";

const treeMocks = vi.hoisted(() => ({
  usePresentationTreeState: vi.fn(),
  presentationTreeRenderer: vi.fn(() => null),
  presentationTree: vi.fn(() => null),
  unifiedSelectionTreeEventHandler: vi.fn(),
}));

vi.mock("@itwin/presentation-components", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@itwin/presentation-components")>()),
  usePresentationTreeState: treeMocks.usePresentationTreeState,
  PresentationTreeRenderer: treeMocks.presentationTreeRenderer,
  PresentationTree: treeMocks.presentationTree,
  UnifiedSelectionTreeEventHandler: treeMocks.unifiedSelectionTreeEventHandler,
}));

/* eslint-disable @typescript-eslint/no-deprecated */

describe("Tree", () => {
  const usePresentationTreeStateStub = treeMocks.usePresentationTreeState as MockFunction<
    (props: presentationComponents.UsePresentationTreeStateProps) => presentationComponents.UsePresentationTreeStateResult | undefined
  >;
  const PresentationTreeRendererStub = treeMocks.presentationTreeRenderer as MockFunction<
    (props: presentationComponents.PresentationTreeRendererProps) => React.JSX.Element | null
  >;
  const PresentationTreeStub = treeMocks.presentationTree as MockFunction<
    (props: presentationComponents.PresentationTreeProps<componentsReact.TreeEventHandler>) => React.JSX.Element | null
  >;
  beforeEach(() => {
    stubPresentationManager();

    usePresentationTreeStateStub.mockImplementation(() => ({ nodeLoader: { modelSource: undefined }, onItemsRendered: undefined, eventHandler: {} }) as any);
    PresentationTreeRendererStub.mockImplementation(() => null);
    PresentationTreeStub.mockImplementation(() => null);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.resetAllMocks();
  });

  it("enables hierarchy auto update", () => {
    const editableRuleset = new EditableRuleset({ initialRuleset: { id: "", rules: [] } });
    render(<Tree width={100} height={100} iModel={{} as any} editableRuleset={editableRuleset} />);
    expect(usePresentationTreeStateStub).toHaveBeenCalledOnce();
    expect(usePresentationTreeStateStub).toHaveBeenCalledWith(expect.objectContaining({ ruleset: editableRuleset.id }));
  });

  it("uses a unified-selection tree event handler", () => {
    const editableRuleset = new EditableRuleset({ initialRuleset: { id: "", rules: [] } });
    render(<Tree width={100} height={100} iModel={{} as any} editableRuleset={editableRuleset} />);
    const eventHandlerFactory = usePresentationTreeStateStub.mock.calls[0][0].eventHandlerFactory;
    expect(eventHandlerFactory).toBeDefined();
    eventHandlerFactory?.({} as any);
    expect(treeMocks.unifiedSelectionTreeEventHandler).toHaveBeenCalledOnce();
  });

  it("renders nothing when tree state is unavailable", () => {
    const editableRuleset = new EditableRuleset({ initialRuleset: { id: "", rules: [] } });
    usePresentationTreeStateStub.mockReturnValueOnce(undefined);
    const { container } = render(<Tree width={100} height={100} iModel={{} as any} editableRuleset={editableRuleset} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders with `PresentationTreeRenderer`", () => {
    const editableRuleset = new EditableRuleset({ initialRuleset: { id: "", rules: [] } });
    render(<Tree width={100} height={100} iModel={{} as any} editableRuleset={editableRuleset} />);
    expect(PresentationTreeStub).toHaveBeenCalledOnce();
    const props = PresentationTreeStub.mock.calls[0][0];
    expect(props.treeRenderer).toBeDefined();
    expect(PresentationTreeRendererStub).not.toHaveBeenCalled();
    render(props.treeRenderer?.({} as any));
    expect(PresentationTreeRendererStub).toHaveBeenCalledOnce();
  });
});
