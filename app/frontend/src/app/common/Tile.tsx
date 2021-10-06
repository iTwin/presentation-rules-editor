/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./Tile.scss";
import * as React from "react";
import { Tile as ITwinUITile, TileProps as ITwinUITileProps } from "@itwin/itwinui-react";

export type TileProps = Omit<ITwinUITileProps, "className"> & { thumbnail: React.ReactElement };

/** Tile that is meant to be clicked on. */
export function Tile(props: TileProps): React.ReactElement {
  return (
    <ITwinUITile
      {...props}
      className="clickable"
      thumbnail={React.cloneElement(props.thumbnail, { className: "iui-picture" })}
    />
  );
}

/** Tile that appears as if not fully loaded yet. */
export function TileSkeleton(): React.ReactElement {
  const skeletonDiv = <div className="iui-skeleton" />;
  return <ITwinUITile className="skeleton" name={skeletonDiv} thumbnail={skeletonDiv} />;
}
