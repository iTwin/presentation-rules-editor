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

export function AutoSizer({ children }: AutoSizerProps): React.ReactElement {
  const divRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState<Size>();

  React.useEffect(
    () => {
      assert(divRef.current !== null);
      const resizeObserver = new ResizeObserver(
        (entries: ResizeObserverEntry[]) => {
          assert(entries.length === 1);
          const { width, height } = entries[0].contentRect;
          setSize({ width, height });
        },
      );
      resizeObserver.observe(divRef.current);
      return () => resizeObserver.disconnect();
    },
    [],
  );

  return <div ref={divRef}>{size && children(size)}</div>;
}
