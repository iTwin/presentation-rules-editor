/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import "./index.scss";
import * as ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";

const div = document.createElement("div");
div.className = "app";
document.body.appendChild(div);
ReactDOM.render(<BrowserRouter><App /></BrowserRouter>, div);
