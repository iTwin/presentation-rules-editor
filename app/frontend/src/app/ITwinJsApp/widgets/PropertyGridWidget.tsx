/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./PropertyGridWidget.scss";
import * as React from "react";
import { IModelApp, IModelConnection } from "@itwin/core-frontend";
import { Button, IconButton } from "@itwin/itwinui-react";
import { EditableRuleset, PropertyGrid, PropertyGridAttributes } from "@itwin/presentation-rules-editor-react";
import { appLayoutContext, AppTab } from "../../AppContext";
import { VerticalStack } from "../../common/CenteredStack";
import { AutoSizer } from "../common/AutoSizer";
import { LoadingHint } from "../common/LoadingHint";
import { OpeningIModelHint } from "../common/OpeningIModelHint";
import { SvgCollapseAll, SvgExpandAll } from "@itwin/itwinui-icons-react";
import { LoadingIndicator } from "../../common/LoadingIndicator";

export interface PropertyGridProps {
  imodel: IModelConnection | undefined;
  ruleset: EditableRuleset | undefined;
}

export function PropertyGridWidget(props: PropertyGridProps): React.ReactElement {
  if (props.imodel === undefined) {
    return <OpeningIModelHint />;
  }

  if (props.ruleset === undefined) {
    return <LoadingHint />;
  }

  return <LoadedPropertyGrid iModel={props.imodel} ruleset={props.ruleset} />;
}

interface LoadedPropertyGridProps {
  iModel: IModelConnection;
  ruleset: EditableRuleset;
}

function LoadedPropertyGrid(props: LoadedPropertyGridProps): React.ReactElement {
  const divRef = React.useRef<HTMLDivElement>(null);
  const propertyGridRef = React.useRef<PropertyGridAttributes>(null);

  const [suppressControls, setSuppressControls] = React.useState(false);
  const hovered = useHover(divRef);
  const [keepExpanded, setKeepExpanded] = React.useState(true);

  const handleCollapseClick = () => {
    setKeepExpanded(false);
    propertyGridRef.current?.collapseAllCategories();
  };

  const handleExpandClick = () => {
    if (!keepExpanded) {
      propertyGridRef.current?.expandAllCategories();
    }

    setKeepExpanded((prev) => {
      return !prev;
    });
  };

  return <AutoSizer ref={divRef}>
    {({ width, height }) => (
      <>
        <div className="presentation-rules-editor-property-grid-controls" data-hovered={!suppressControls && hovered}>
          <IconButton
            styleType="borderless"
            isActive={keepExpanded}
            title={keepExpanded ? "Turn off auto-expand" : "Expand"}
            onClick={handleExpandClick}
          >
            <SvgExpandAll />
          </IconButton>
          <IconButton styleType="borderless" title="Collapse" onClick={handleCollapseClick}>
            <SvgCollapseAll />
          </IconButton>
        </div>
        <PropertyGrid
          ref={propertyGridRef}
          width={width}
          height={height}
          iModel={props.iModel}
          editableRuleset={props.ruleset}
          keepCategoriesExpanded={keepExpanded}
          noElementsSelectedState={() => (
            <NoElementsSelectedState height={height} setSuppressControls={setSuppressControls} />
          )}
          tooManyElementsSelectedState={() => (
            <TooManyElementsSelectedState height={height} setSuppressControls={setSuppressControls} />
          )}
          loadingPropertiesState={() => (
            <LoadingPropertiesState height={height} setSuppressControls={setSuppressControls} />
          )}
        />
      </>
    )}
  </AutoSizer>;
}

function useHover<T extends HTMLElement | null>(elementRef: React.MutableRefObject<T>): boolean {
  const [hovered, setHovered] = React.useState(false);

  React.useEffect(
    () => {
      const element = elementRef.current;
      if (element === null) {
        return;
      }

      const handleMouseEnter = () => setHovered(true);
      const handleMouseLeave = () => setHovered(false);

      element.addEventListener("mouseenter", handleMouseEnter);
      element.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        element.removeEventListener("mouseenter", handleMouseEnter);
        element.removeEventListener("mouseleave", handleMouseLeave);
      };
    },
    [elementRef],
  );

  return hovered;
}

interface NoElementsSelectedStateProps {
  height: number;
  setSuppressControls: (value: boolean) => void;
}

function NoElementsSelectedState(props: NoElementsSelectedStateProps): React.ReactElement {
  useSuppressControls(props.setSuppressControls);
  const appLayout = React.useContext(appLayoutContext);

  return (
    <VerticalStack style={{ height: props.height }}>
      <span>{IModelApp.localization.getLocalizedString("App:property-grid.no-elements-selected")}</span>
      {
        appLayout.activeTab !== AppTab.Viewport &&
        <Button onClick={() => appLayout.setActiveTab(AppTab.Viewport)}>
          {IModelApp.localization. getLocalizedString("App:property-grid.show-viewport")}
        </Button>
      }
    </VerticalStack>
  );
}

interface TooManyElementsSelectedStateProps {
  height: number;
  setSuppressControls: (value: boolean) => void;
}

function TooManyElementsSelectedState(props: TooManyElementsSelectedStateProps): React.ReactElement {
  useSuppressControls(props.setSuppressControls);

  return (
    <VerticalStack style={{ height: props.height }}>
      {IModelApp.localization.getLocalizedString("App:property-grid.over-limit")}
    </VerticalStack>
  );
}

interface LoadingPropertiesStateProps {
  height: number;
  setSuppressControls: (value: boolean) => void;
}

function LoadingPropertiesState(props: LoadingPropertiesStateProps): React.ReactElement {
  useSuppressControls(props.setSuppressControls);

  return (
    <LoadingIndicator style={{ height: props.height }}>
      {IModelApp.localization.getLocalizedString("App:property-grid.loading-properties")}
    </LoadingIndicator>
  );
}

function useSuppressControls(setSuppressControls: (value: boolean) => void): void {
  React.useEffect(
    () => {
      setSuppressControls(true);
      return () => setSuppressControls(false);
    },
    [setSuppressControls],
  );
}
