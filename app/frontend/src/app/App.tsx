/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./App.scss";
import * as React from "react";
import { SvgImodelHollow } from "@itwin/itwinui-icons-react";
import { Footer, Header, HeaderBreadcrumbs, HeaderLogo } from "@itwin/itwinui-react";
import { appLayoutContext, AppLayoutContext, AppTab } from "./AppContext";
import { InitializationIndicator } from "./utils/InitializationIndicator";

const ITwinJsApp = React.lazy(async () => import("./ITwinJsApp/ITwinJsApp"));

export function App(): React.ReactElement {
  const appLayoutContextValue = useAppLayout();
  return (
    <div className="app">
      <appLayoutContext.Provider value={appLayoutContextValue}>
        <Header
          appLogo={<HeaderLogo logo={<SvgImodelHollow />}>Presentation Rules Editor</HeaderLogo>}
          breadcrumbs={<Breadcrumbs />}
        />
        <React.Suspense fallback={<InitializationIndicator />}>
          <ITwinJsApp />
        </React.Suspense>
        <Footer />
      </appLayoutContext.Provider>
    </div>
  );
}

function useAppLayout(): AppLayoutContext {
  const [activeTab, setActiveTab] = React.useState(AppTab.Editor);
  const [breadcrumbs, setBreadcrumbs] = React.useState<React.ReactNode[]>([]);
  return { activeTab, setActiveTab, breadcrumbs, setBreadcrumbs };
}

function Breadcrumbs(): React.ReactElement {
  const appLayout = React.useContext(appLayoutContext);
  return <HeaderBreadcrumbs items={appLayout.breadcrumbs} />;
}
