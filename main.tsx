import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import Home from "./app/page";
import "./app/globals.css";
import "./app/team-logos.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Home />
    <Analytics />
  </StrictMode>,
);
