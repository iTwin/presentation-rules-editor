/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import * as React from "react";
import { assert } from "@itwin/core-bentley";

export interface AutoSizerProps {
  children: (size: Size) => React.ReactElement | null;
}

export interface Size {
  width: number;
  height: number;
}

export const AutoSizer = React.forwardRef<HTMLDivElement, AutoSizerProps>(function Autosizer(props, ref) {
  const divRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState<Size>();

  React.useEffect(() => {
    assert(divRef.current !== null);
    const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      assert(entries.length === 1);
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    resizeObserver.observe(divRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return <div ref={mergeRefs(divRef, ref)}>{size && props.children(size)}</div>;
});

function mergeRefs<T>(...refs: Array<React.MutableRefObject<T | null> | React.LegacyRef<T>>): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}
