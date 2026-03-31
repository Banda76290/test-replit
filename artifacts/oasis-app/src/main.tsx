import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Monaco Editor's CDN web workers sometimes reject with non-Error values (Event,
// DOMException, string) in sandboxed environments. The Vite runtime-error overlay
// treats ANY unhandled rejection as a crash. We intercept rejections that are not
// genuine Error instances, log them, and suppress the overlay.
window.addEventListener("unhandledrejection", (event) => {
  if (!(event.reason instanceof Error)) {
    event.preventDefault();
    if (event.reason !== undefined && event.reason !== null) {
      console.warn("[OASIS] Unhandled non-Error rejection (suppressed):", event.reason);
    }
  }
});

createRoot(document.getElementById("root")!).render(<App />);
