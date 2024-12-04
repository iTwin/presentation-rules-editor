/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

// import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
// import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
// import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
// import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import "./index.scss";
// import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App.js";

// self.MonacoEnvironment = {
//   getWorker(_, label) {
//     if (label === "json") {
//       return new jsonWorker();
//     }
//     if (label === "css" || label === "scss" || label === "less") {
//       return new cssWorker();
//     }
//     if (label === "html" || label === "handlebars" || label === "razor") {
//       return new htmlWorker();
//     }
//     if (label === "typescript" || label === "javascript") {
//       return new tsWorker();
//     }
//     return new editorWorker();
//   },
// };

const div = document.createElement("div");
div.className = "app";
document.body.appendChild(div);
const root = createRoot(div);
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
