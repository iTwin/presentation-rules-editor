/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { OutputMessagePriority } from "@itwin/core-frontend";
import { toaster, ToastOptions } from "@itwin/itwinui-react";

export function displayToast(messageType: OutputMessagePriority, messageShort: string, _messageDetail?: string): void {
  const settings: ToastOptions = {
    placementPosition: "top",
  };

  switch (messageType) {
    case OutputMessagePriority.Fatal:
    case OutputMessagePriority.Error:
      toaster.negative(messageShort, settings);
      break;
    case OutputMessagePriority.Warning:
      toaster.warning(messageShort, { ...settings, duration: 3000 });
      break;
    case OutputMessagePriority.Info:
    case OutputMessagePriority.Debug:
    case OutputMessagePriority.None:
      toaster.informational(messageShort, { ...settings, duration: 3000 });
      break;
    case OutputMessagePriority.Success:
      toaster.positive(messageShort, { ...settings, duration: 3000 });
      break;
  }
}
