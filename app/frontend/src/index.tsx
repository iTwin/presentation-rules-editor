/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App.js";
import "./index.scss";

const div = document.createElement("div");
div.className = "app";
document.body.appendChild(div);
const root = createRoot(div);
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
