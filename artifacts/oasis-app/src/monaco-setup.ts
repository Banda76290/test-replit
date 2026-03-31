import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

self.MonacoEnvironment = {
  getWorker(_: unknown, label: string) {
    if (label === "json") return new jsonWorker();
    if (label === "css" || label === "scss" || label === "less")
      return new cssWorker();
    if (label === "html" || label === "handlebars" || label === "razor")
      return new htmlWorker();
    if (label === "typescript" || label === "javascript") return new tsWorker();
    return new editorWorker();
  },
};

loader.config({ monaco });

window.addEventListener("error", (e) => {
  if (
    e.message?.includes("TextModel got disposed") ||
    e.message?.includes("DiffEditorWidget")
  ) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
});

window.addEventListener("unhandledrejection", (e) => {
  const msg =
    e.reason?.message ?? (typeof e.reason === "string" ? e.reason : "");
  if (
    msg.includes("TextModel got disposed") ||
    msg.includes("DiffEditorWidget")
  ) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
});
