import { injectGlobal } from "@casablanca-css/core";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";

injectGlobal`
  * {
    margin: 0;
    box-sizing: border-box;
  }
`;

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
