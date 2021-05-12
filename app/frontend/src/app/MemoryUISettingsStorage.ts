/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { UiSettingsResult, UiSettingsStatus, UiSettingsStorage } from "@bentley/ui-core";

/** UI settings storage that is persisted in working memory. Resets after page refresh. */
export class MemoryUISettingsStorage implements UiSettingsStorage {
  private settings = new Map<string, Map<string, unknown>>();

  public async getSetting(settingNamespace: string, settingName: string): Promise<UiSettingsResult> {
    const setting = this.settings.get(settingNamespace)?.get(settingName);
    return { status: setting !== undefined ? UiSettingsStatus.Success : UiSettingsStatus.NotFound, setting };
  }

  public async saveSetting(settingNamespace: string, settingName: string, setting: any): Promise<UiSettingsResult> {
    const scopedSettings = this.settings.get(settingNamespace) ?? new Map<string, unknown>();
    scopedSettings.set(settingName, setting);
    this.settings.set(settingNamespace, scopedSettings);
    return { status: UiSettingsStatus.Success };
  }

  public async deleteSetting(settingNamespace: string, settingName: string): Promise<UiSettingsResult> {
    const deleted = !!this.settings.get(settingNamespace)?.delete(settingName);
    return { status: deleted ? UiSettingsStatus.Success : UiSettingsStatus.NotFound };
  }
}
