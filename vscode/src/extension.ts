import * as vscode from "vscode";
import * as path from "path";
import { analyze } from "./core-bridge";
import { renderDocument } from "./render";

// Styling for the preview. Uses VS Code theme variables so it matches the
// user's editor theme (light/dark) automatically.
const STYLE = `
  :root { color-scheme: light dark; }
  body {
    font-family: var(--vscode-font-family);
    color: var(--vscode-foreground);
    padding: 1rem 1.5rem;
    line-height: 1.5;
  }
  h1, h2, h3, h4, h5, h6 { border-bottom: 1px solid var(--vscode-widget-border, #8884); padding-bottom: .2em; }
  .prose { opacity: .85; }
  .prop, .claim { font-family: var(--vscode-editor-font-family); margin: .3rem 0; }
  .prop .atom, .claim .name { font-weight: 600; color: var(--vscode-symbolIcon-variableForeground, #4ec9b0); }
  .prop .colon { opacity: .5; margin: 0 .5em; }
  .prop .gloss { font-family: var(--vscode-font-family); opacity: .85; }
  .claim .formula { margin-left: .75em; }
  .check { font-family: var(--vscode-editor-font-family); margin: .5rem 0; display: flex; align-items: center; gap: .75em; }
  figure.statement { margin: .8rem 0; }
  figure.statement figcaption { margin-bottom: .35rem; display: flex; align-items: center; gap: .5em; }
  .check-label { text-transform: uppercase; font-size: .7rem; letter-spacing: .08em; opacity: .6; }
  table.truth { border-collapse: collapse; font-family: var(--vscode-editor-font-family); }
  table.truth th, table.truth td { border: 1px solid var(--vscode-widget-border, #8884); padding: .2em .7em; text-align: center; }
  table.truth th.result, table.truth td.result { font-weight: 600; }
  table.truth thead th { background: var(--vscode-editor-inactiveSelectionBackground, #8882); }
  table.truth td.t { color: var(--vscode-testing-iconPassed, #3fb950); }
  table.truth td.f { color: var(--vscode-testing-iconFailed, #f85149); opacity: .85; }
  .badge { font-size: .72rem; padding: .1em .6em; border-radius: 999px; text-transform: uppercase; letter-spacing: .05em; }
  .badge-tautology, .badge-equivalent { background: var(--vscode-testing-iconPassed, #3fb950); color: #041006; }
  .badge-contradiction, .badge-not-equivalent { background: var(--vscode-testing-iconFailed, #f85149); color: #100404; }
  .badge-contingent { background: var(--vscode-editorWarning-foreground, #cca700); color: #100c02; }
  .error { color: var(--vscode-errorForeground, #f85149); font-family: var(--vscode-editor-font-family); margin: .3rem 0; }
  .error-line { opacity: .6; margin-right: .5em; }
  .empty { opacity: .6; }
  code { background: var(--vscode-textCodeBlock-background, #8882); padding: 0 .3em; border-radius: 3px; }
`;

function wrapHtml(body: string): string {
  // No scripts run in the preview, so the CSP only needs to allow inline styles.
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';" />
  <style>${STYLE}</style>
</head>
<body>${body}</body>
</html>`;
}

export function activate(context: vscode.ExtensionContext) {
  let panel: vscode.WebviewPanel | undefined;
  let trackedUri: vscode.Uri | undefined;
  let debounce: ReturnType<typeof setTimeout> | undefined;

  const render = () => {
    if (!panel || !trackedUri) return;
    const doc = vscode.workspace.textDocuments.find(
      (d) => d.uri.toString() === trackedUri!.toString()
    );
    if (!doc) return;
    try {
      panel.webview.html = wrapHtml(renderDocument(analyze(doc.getText())));
    } catch (err) {
      panel.webview.html = wrapHtml(
        `<div class="error">Preview failed: ${String(err)}</div>`
      );
    }
  };

  const openPreview = () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== "meticulous") {
      vscode.window.showInformationMessage("Open a .met file to preview it.");
      return;
    }
    trackedUri = editor.document.uri;
    if (!panel) {
      panel = vscode.window.createWebviewPanel(
        "meticulousPreview",
        "meticulous preview",
        { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
        { enableScripts: false }
      );
      panel.onDidDispose(
        () => {
          panel = undefined;
          trackedUri = undefined;
        },
        null,
        context.subscriptions
      );
    }
    panel.title = `Preview ${path.basename(editor.document.fileName)}`;
    render();
  };

  context.subscriptions.push(
    vscode.commands.registerCommand("meticulous.showPreview", openPreview),

    // Live update: re-render (debounced) whenever the tracked document changes.
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (trackedUri && e.document.uri.toString() === trackedUri.toString()) {
        if (debounce) clearTimeout(debounce);
        debounce = setTimeout(render, 150);
      }
    })
  );
}

export function deactivate() {}
