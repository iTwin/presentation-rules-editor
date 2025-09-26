/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import * as sinon from "sinon";
import * as td from "testdouble";
import * as componentsReact from "@itwin/components-react";
import * as presentationComponents from "@itwin/presentation-components";
import { render } from "@testing-library/react";
import { EditableRuleset } from "../EditableRuleset.js";
import { stubPresentationManager } from "../TestUtils.js";
import { TreeProps } from "./Tree.js";

const presentationComponentsModulePath = import.meta.resolve("@itwin/presentation-components");

/* eslint-disable @typescript-eslint/no-deprecated */

describe("Tree", () => {
  let Tree: (props: TreeProps) => React.JSX.Element | null;
  const usePresentationTreeStateStub = sinon.stub<
    [presentationComponents.UsePresentationTreeStateProps],
    presentationComponents.UsePresentationTreeStateResult | undefined
  >();
  const PresentationTreeRendererStub = sinon.stub<[presentationComponents.PresentationTreeRendererProps], React.JSX.Element>();
  const PresentationTreeStub = sinon.stub<[presentationComponents.PresentationTreeProps<componentsReact.TreeEventHandler>], React.JSX.Element>();
  beforeEach(async () => {
    stubPresentationManager();

    usePresentationTreeStateStub.callsFake(() => ({ nodeLoader: { modelSource: undefined }, onItemsRendered: undefined, eventHandler: {} }) as any);
    PresentationTreeRendererStub.callsFake(() => <></>);
    PresentationTreeStub.callsFake(() => <></>);
    await td.replaceEsm(presentationComponentsModulePath, {
      ...presentationComponents,
      usePresentationTreeState: usePresentationTreeStateStub,
      PresentationTreeRenderer: PresentationTreeRendererStub,
      PresentationTree: PresentationTreeStub,
    });

    Tree = (await import("./Tree.js")).Tree;
  });

  afterEach(() => {
    sinon.reset();
    td.reset();
  });

  it("enables hierarchy auto update", () => {
    const editableRuleset = new EditableRuleset({ initialRuleset: { id: "", rules: [] } });
    render(<Tree width={100} height={100} iModel={{} as any} editableRuleset={editableRuleset} />);
    expect(usePresentationTreeStateStub).to.have.been.calledOnce.and.calledWithMatch(sinon.match({ ruleset: editableRuleset.id }));
  });

  it("renders with `PresentationTreeRenderer`", () => {
    const editableRuleset = new EditableRuleset({ initialRuleset: { id: "", rules: [] } });
    render(<Tree width={100} height={100} iModel={{} as any} editableRuleset={editableRuleset} />);
    expect(PresentationTreeStub).to.have.been.calledOnce.and.calledWith(
      sinon.match((props: presentationComponents.PresentationTreeProps<any>) => {
        expect(props.treeRenderer).to.not.be.undefined;
        expect(PresentationTreeRendererStub).to.not.be.called;
        render(props.treeRenderer?.({} as any));
        expect(PresentationTreeRendererStub).to.be.calledOnce;
        return true;
      }),
    );
  });
});
