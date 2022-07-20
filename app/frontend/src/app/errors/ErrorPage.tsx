/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./ErrorPage.scss";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { SvgError } from "@itwin/itwinui-illustrations-react";
import { Button, ExpandableBlock, Title } from "@itwin/itwinui-react";

export interface ErrorPageProps {
  /** Illustration component. Default: {@link SvgError}. */
  illustration?: React.ComponentType<{ className: string }>;
  /** Main error title, describing the kind of error that occured. */
  title: string;
  /** Troubleshooting steps, if any. */
  troubleshooting?: React.ReactNode;
  /** Error description. */
  children: React.ReactNode;
}

/** An error page with illustration */
export function ErrorPage(props: ErrorPageProps): React.ReactElement {
  const navigate = useNavigate();
  React.useEffect(
    () => {
      document.title = `${props.title} - Presentation Rules Editor`;
      return () => {
        document.title = "Presentation Rules Editor";
      };
    },
    [props.title],
  );

  return (
    <div className="error-page">
      {React.createElement(props.illustration ?? SvgError, { className: "error-illustration" })}
      <div className="error-details">
        <Title>{props.title}</Title>
        <span>{props.children}</span>
      </div>
      {
        props.troubleshooting &&
        <ExpandableBlock className="error-troubleshooting" title="Troubleshooting">
          {props.troubleshooting}
        </ExpandableBlock>
      }
      <Button styleType="high-visibility" onClick={() => navigate("/")}>Go to homepage</Button>
    </div>
  );
}
