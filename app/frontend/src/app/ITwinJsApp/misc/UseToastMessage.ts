/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import * as React from "react";
import { OutputMessagePriority } from "@itwin/core-frontend";
import { useToaster } from "@itwin/itwinui-react";

export function useToastMessage() {
  const toaster = useToaster();

  return React.useCallback(
    (messageType: OutputMessagePriority, messageShort: string) => {
      toaster.setSettings({ placement: "top" });
      switch (messageType) {
        case OutputMessagePriority.Fatal:
        case OutputMessagePriority.Error:
          toaster.negative(messageShort);
          break;
        case OutputMessagePriority.Warning:
          toaster.warning(messageShort, { duration: 3000 });
          break;
        case OutputMessagePriority.Info:
        case OutputMessagePriority.Debug:
        case OutputMessagePriority.None:
          toaster.informational(messageShort, { duration: 3000 });
          break;
        case OutputMessagePriority.Success:
          toaster.positive(messageShort, { duration: 3000 });
          break;
      }
    },
    [toaster],
  );
}
