import "@fontsource-variable/space-grotesk/wght.css";
import "@recoil-river/graph/styles.css";
import "./style.css";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React from "react";
import ReactDOM from "react-dom/client";

import { PopupApp } from "../../src/popup/PopupApp";

const convexUrl = import.meta.env.WXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("WXT_PUBLIC_CONVEX_URL is required.");
}

const convex = new ConvexReactClient(convexUrl);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex}>
      <PopupApp />
    </ConvexAuthProvider>
  </React.StrictMode>,
);
