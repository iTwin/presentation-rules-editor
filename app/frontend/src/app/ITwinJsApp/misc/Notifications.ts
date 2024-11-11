/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { OutputMessagePriority } from "@itwin/core-frontend";

export function displayToast(toaster: Toaster, messageType: OutputMessagePriority, messageShort: string, _messageDetail?: string): void {
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
}

export type ToasterType = "warning" | "negative" | "positive" | "informational";

export type Toaster = Record<
  ToasterType,
  (
    content: React.ReactNode,
    options?: ToastOptions,
  ) => {
    close: () => void;
  }
> & { setSettings: (settings: { placement: "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" }) => void };

export interface ToastOptions {
  duration?: number;
}
