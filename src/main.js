import { App } from "./app.js";

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("#app element was not found.");
}

if (!window.React || !window.ReactDOM) {
  throw new Error("React CDN scripts are missing.");
}

const root = window.ReactDOM.createRoot(rootElement);

root.render(
  window.React.createElement(
    window.React.StrictMode,
    null,
    window.React.createElement(App)
  )
);
