/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import * as componentsReact from "@itwin/components-react";
import * as presentationComponents from "@itwin/presentation-components";
import { render } from "@testing-library/react";
import { expect } from "chai";
import * as sinon from "sinon";
import * as td from "testdouble";
import { EditableRuleset } from "../EditableRuleset.js";
import { stubPresentationManager } from "../TestUtils.js";
import { TreeProps } from "./Tree.js";

const presentationComponentsModulePath = import.meta.resolve("@itwin/presentation-components");

describe("Tree", () => {
  let Tree: (props: TreeProps) => React.JSX.Element | null;
  let usePresentationTreeStateStub: sinon.SinonStub<
    [presentationComponents.UsePresentationTreeStateProps],
    presentationComponents.UsePresentationTreeStateResult | undefined
  >;
  let presentationTreeRendererStub: sinon.SinonStub<[presentationComponents.PresentationTreeRendererProps], React.JSX.Element>;
  let PresentationTreeStub: sinon.SinonStub<[presentationComponents.PresentationTreeProps<componentsReact.TreeEventHandler>], React.JSX.Element>;
  beforeEach(async () => {
    stubPresentationManager();

    usePresentationTreeStateStub = sinon
      .stub<[presentationComponents.UsePresentationTreeStateProps], presentationComponents.UsePresentationTreeStateResult | undefined>()
      .callsFake(() => ({ nodeLoader: { modelSource: undefined }, onItemsRendered: undefined, eventHandler: {} }) as any);
    presentationTreeRendererStub = sinon.stub<[presentationComponents.PresentationTreeRendererProps], React.JSX.Element>().callsFake(() => <></>);
    PresentationTreeStub = sinon
      .stub<[presentationComponents.PresentationTreeProps<componentsReact.TreeEventHandler>], React.JSX.Element>()
      .callsFake(() => <></>);
    await td.replaceEsm(presentationComponentsModulePath, {
      ...presentationComponents,
      usePresentationTreeState: usePresentationTreeStateStub,
      PresentationTreeRenderer: presentationTreeRendererStub,
      PresentationTree: PresentationTreeStub,
    });

    Tree = (await import("./Tree.js")).Tree;
  });

  afterEach(() => {
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
        expect(presentationTreeRendererStub).to.not.be.called;
        render(props.treeRenderer!({} as any));
        expect(presentationTreeRendererStub).to.be.calledOnce;
        return true;
      }),
    );
  });
});
