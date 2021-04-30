/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { render } from "@testing-library/react";
import { TestComponent } from "./TestComponent";

describe("TestComponent", () => {
  it("renders text", () => {
    const { getByText } = render(<TestComponent />);
    expect(getByText("TestComponent")).not.toBeNull();
  });
});
