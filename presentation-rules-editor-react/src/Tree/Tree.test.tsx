/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import * as React from "react";
import * as sinon from "sinon";
import * as componentsReact from "@itwin/components-react";
import * as presentationComponents from "@itwin/presentation-components";
import { render } from "@testing-library/react";
import { EditableRuleset } from "../EditableRuleset";
import { stubPresentationManager } from "../TestUtils";
import { Tree } from "./Tree";

describe("Tree", () => {
  before(() => {
    stubPresentationManager();

    sinon.stub(presentationComponents, "usePresentationTreeNodeLoader")
      .callsFake(() => ({ nodeLoader: { modelSource: undefined }, onItemsRendered: undefined }) as any);
    sinon.stub(presentationComponents, "useUnifiedSelectionTreeEventHandler").callsFake(() => ({}) as any);
    sinon.stub(componentsReact, "useTreeModel").callsFake(() => ({}) as any);
    sinon.stub(componentsReact, "ControlledTree").callsFake(() => <></>);
  });

  beforeEach(() => {
    sinon.resetHistory();
  });

  after(() => {
    sinon.restore();
  });

  it("enables hierarchy auto update", () => {
    const editableRuleset = new EditableRuleset({ initialRuleset: { id: "", rules: [] } });
    render(<Tree width={100} height={100} iModel={{} as any} editableRuleset={editableRuleset} />);
    expect(presentationComponents.usePresentationTreeNodeLoader).to.have.been.calledOnce.and.calledWithMatch(
      sinon.match({ ruleset: editableRuleset.id, enableHierarchyAutoUpdate: true }),
    );
  });
});
