/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import * as React from "react";

/** Retrieves the value in local storage under the specified key. The key value change is not tracked by this hook. */
export function useLocalStorage<T>(key: string, init: (initialValue: {} | string | undefined) => T): [T, (action: React.SetStateAction<T>) => void] {
  const [state, setState] = React.useState<T>(() => {
    const initialValue = init(getLocalStorageValue(key));
    localStorage.setItem(normalizeKey(key), JSON.stringify(initialValue));
    return initialValue;
  });
  const setValue = React.useRef((action: React.SetStateAction<T>) => {
    setState((prevState) => {
      const value = action instanceof Function ? action(prevState) : action;
      const stringifiedValue = JSON.stringify(value);
      localStorage.setItem(normalizeKey(key), stringifiedValue);
      // Unstringified value may differ from original
      return JSON.parse(stringifiedValue);
    });
  }).current;
  return [state, setValue];
}

function getLocalStorageValue(key: string): {} | string | undefined {
  const value = localStorage.getItem(normalizeKey(key));
  try {
    // JSON.parse returns null when the input is null
    return JSON.parse(value!) ?? undefined;
  } catch {
    return undefined;
  }
}

function normalizeKey(key: string): string {
  return `presentation-rules-editor/${key}`;
}
