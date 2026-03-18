/**
 * IIFE bundle entry point for embedding YTPlayer in non-React environments
 * (e.g., Vanilla JS pages like LibreTV).
 *
 * Exposes window.YTPlayerLib = { YTPlayer, React, ReactDOM }
 * Usage in player.js:
 *   const { YTPlayer, React, ReactDOM } = window.YTPlayerLib;
 *   const root = ReactDOM.createRoot(el);
 *   root.render(React.createElement(YTPlayer, props));
 */
export { YTPlayer } from "./player/Player";

import React from "react";
import * as ReactDOMClient from "react-dom/client";

export { React };
export const ReactDOM = ReactDOMClient;
