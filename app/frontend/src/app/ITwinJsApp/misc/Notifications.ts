/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { MessageManager } from "@itwin/appui-react";
import { NotifyMessageDetails, OutputMessagePriority, OutputMessageType } from "@itwin/core-frontend";

export function displayToast(messageType: OutputMessagePriority, messageShort: string, messageDetail?: string): void {
  const messageDetails = new NotifyMessageDetails(messageType, messageShort, messageDetail, OutputMessageType.Toast);
  MessageManager.outputMessage(messageDetails);
}
