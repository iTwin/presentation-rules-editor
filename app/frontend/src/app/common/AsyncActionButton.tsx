/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import "./AsyncActionButton.scss";
import * as React from "react";
import { Button, ProgressRadial } from "@itwin/itwinui-react";

export interface AsyncActionButtonProps {
  onClick: () => Promise<void>;
  children: React.ReactNode;
}

/** Button that fires an async action and displays a spinning animation. */
export function AsyncActionButton(props: AsyncActionButtonProps): React.ReactElement {
  const [actionInProgress, setActionInProgress] = React.useState(false);

  async function handleButtonClick() {
    try {
      setActionInProgress(true);
      await props.onClick();
    } finally {
      setActionInProgress(false);
    }
  }

  return (
    <div className="async-action-button">
      {/* <Button disabled={actionInProgress} onClick={handleButtonClick}>
        {props.children}
      </Button>
      {actionInProgress && <ProgressRadial indeterminate={true} size="small" />} */}
      <Button disabled={actionInProgress} onClick={handleButtonClick}>
        {props.children}
      </Button>
      <ProgressRadial className="action-in-progress-radial" indeterminate={true} size="small" />
    </div>
  );
}
