import * as vscode from "vscode";
import * as path from "path";
import { analyze } from "./core-bridge";
import { renderDocument } from "./render";
import { registerCompletions } from "./completion";
import { registerDiagnostics } from "./diagnostics";

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
  .check { font-family: var(--vscode-editor-font-family); margin: .5rem 0; }
  .check > div { display: flex; align-items: center; gap: .75em; }
  .reading { font-family: var(--vscode-font-family); font-style: italic; opacity: .7; margin: .1rem 0 .1rem 1.5rem; }
  .note-inline { font-style: italic; opacity: .65; font-size: .85em; margin-left: .6em; }
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
  .badge-valid { background: var(--vscode-testing-iconPassed, #3fb950); color: #041006; }
  .badge-invalid { background: var(--vscode-testing-iconFailed, #f85149); color: #100404; }
  .badge-unknown { background: var(--vscode-descriptionForeground, #8d96a0); color: #101214; }
  table.truth td.world-name, table.truth th.world-name { font-style: italic; opacity: .75; text-align: right; }
  table.truth td.world-name.actual { font-weight: 700; opacity: 1; }
  .fo-formula { font-family: var(--vscode-editor-font-family); margin: .2rem 0 .4rem; }
  .model-card { font-family: var(--vscode-editor-font-family); border: 1px solid var(--vscode-widget-border, #8884); border-radius: 6px; padding: .4rem .7rem; display: inline-block; margin: .2rem 0; }
  .model-line { padding: .08rem 0; }
  .model-lhs { color: var(--vscode-symbolIcon-variableForeground, #4ec9b0); font-weight: 600; }
  .model-eq { opacity: .5; margin: 0 .5em; }
  .error { color: var(--vscode-errorForeground, #f85149); font-family: var(--vscode-editor-font-family); margin: .3rem 0; }
  .error-line { opacity: .6; margin-right: .5em; }
  .empty { opacity: .6; }
  code { background: var(--vscode-textCodeBlock-background, #8882); padding: 0 .3em; border-radius: 3px; }

  /* arguments */
  figure.argument { margin: 1rem 0; padding: .6rem .9rem; border: 1px solid var(--vscode-widget-border, #8884); border-radius: 6px; }
  figure.argument figcaption { display: flex; align-items: center; gap: .5em; margin-bottom: .5rem; }
  .arg-name { font-weight: 600; font-family: var(--vscode-editor-font-family); }
  .chip { font-size: .72rem; padding: .1em .6em; border-radius: 999px; border: 1px solid var(--vscode-widget-border, #8884); }
  .chip-form { border-color: var(--vscode-testing-iconPassed, #3fb950); }
  .chip-fallacy { border-color: var(--vscode-testing-iconFailed, #f85149); color: var(--vscode-testing-iconFailed, #f85149); }
  .derivation { font-family: var(--vscode-editor-font-family); margin: .3rem 0 .3rem .5rem; }
  .derivation .premise { padding: .1rem 0; }
  .derivation .conclusion { border-top: 1px solid var(--vscode-foreground); margin-top: .25rem; padding-top: .25rem; width: fit-content; min-width: 12em; }
  .note { opacity: .75; font-style: italic; margin: .35rem 0; }
  .counterexample { margin: .5rem 0; }
  .cx-label { display: block; font-size: .78rem; opacity: .7; margin-bottom: .3rem; }
  .repair { margin: .5rem 0; padding: .45rem .7rem; border-left: 3px solid var(--vscode-editorWarning-foreground, #cca700); background: var(--vscode-textCodeBlock-background, #8881); }
  .repair .formula { font-family: var(--vscode-editor-font-family); font-weight: 600; }
  .repair .or { opacity: .6; }
  table.proof { font-family: var(--vscode-editor-font-family); border-collapse: collapse; margin: .5rem 0 .2rem; }
  table.proof td { padding: .12em .6em .12em 0; }
  .step-no { opacity: .55; }
  .step-why { opacity: .7; font-size: .85em; }
  .step-status.ok { color: var(--vscode-testing-iconPassed, #3fb950); font-weight: 700; }
  .step-status.bad { color: var(--vscode-testing-iconFailed, #f85149); font-weight: 700; }
  tr.step-msg td { color: var(--vscode-testing-iconFailed, #f85149); font-size: .85em; font-family: var(--vscode-font-family); padding-bottom: .4em; }

  /* asserted relations + argument map */
  .relation-stmt { font-family: var(--vscode-editor-font-family); margin: .45rem 0; display: flex; align-items: center; gap: .6em; flex-wrap: wrap; }
  .relation-stmt .note { flex-basis: 100%; margin: 0 0 0 1rem; font-size: .95em; }
  .rel-verb { font-size: .8rem; padding: .05em .55em; border-radius: 999px; border: 1px solid var(--vscode-widget-border, #8884); opacity: .9; }
  .chip-holds { border-color: var(--vscode-testing-iconPassed, #3fb950); color: var(--vscode-testing-iconPassed, #3fb950); }
  .chip-fails { border-color: var(--vscode-testing-iconFailed, #f85149); color: var(--vscode-testing-iconFailed, #f85149); }
  .chip-asserted { opacity: .6; }
  figure.relmap-figure { margin: 1rem 0; padding: .6rem .9rem; border: 1px solid var(--vscode-widget-border, #8884); border-radius: 6px; }
  figure.relmap-figure figcaption { text-transform: uppercase; font-size: .7rem; letter-spacing: .08em; opacity: .6; margin-bottom: .4rem; }
  svg.relmap { width: 100%; height: auto; }
  svg.relmap .edge { stroke-width: 1.6; fill: none; stroke-linejoin: round; }
  svg.relmap .edge.failed { stroke-dasharray: 5 4; }
  /* edges are stroked lines only; fill belongs solely to the arrowheads —
     a filled multi-point path would render as a solid polygon */
  svg.relmap .edge.supports { stroke: var(--vscode-testing-iconPassed, #3fb950); }
  svg.relmap .edge.contradicts { stroke: var(--vscode-testing-iconFailed, #f85149); }
  svg.relmap .edge.entails { stroke: var(--vscode-textLink-foreground, #58a6ff); }
  svg.relmap .edge.presupposes { stroke: var(--vscode-editorWarning-foreground, #cca700); }
  svg.relmap .edge.equivalent-to { stroke: var(--vscode-descriptionForeground, #8d96a0); }
  svg.relmap .arrow.supports { fill: var(--vscode-testing-iconPassed, #3fb950); }
  svg.relmap .arrow.contradicts { fill: var(--vscode-testing-iconFailed, #f85149); }
  svg.relmap .arrow.entails { fill: var(--vscode-textLink-foreground, #58a6ff); }
  svg.relmap .arrow.presupposes { fill: var(--vscode-editorWarning-foreground, #cca700); }
  svg.relmap .arrow.equivalent-to { fill: var(--vscode-descriptionForeground, #8d96a0); }
  svg.relmap .edge-label { fill: var(--vscode-descriptionForeground, #8d96a0); font-size: 10.5px; font-family: var(--vscode-font-family); }
  svg.relmap .edge-label.supports { fill: var(--vscode-testing-iconPassed, #3fb950); }
  svg.relmap .edge-label.contradicts { fill: var(--vscode-testing-iconFailed, #f85149); }
  svg.relmap .edge-label.entails { fill: var(--vscode-textLink-foreground, #58a6ff); }
  svg.relmap .edge-label.presupposes { fill: var(--vscode-editorWarning-foreground, #cca700); }
  svg.relmap .edge-label.equivalent-to { fill: var(--vscode-descriptionForeground, #8d96a0); }
  svg.relmap .edge-label.failed { fill: var(--vscode-testing-iconFailed, #f85149); }
  svg.relmap .node rect { fill: var(--vscode-editor-inactiveSelectionBackground, #8882); stroke: var(--vscode-widget-border, #8884); }
  svg.relmap .node.ad-hoc rect { stroke-dasharray: 4 3; }
  svg.relmap .node text { fill: var(--vscode-foreground); font-size: 12px; font-family: var(--vscode-editor-font-family); }

  /* relations (analyze) */
  figure.relations { margin: 1rem 0; padding: .6rem .9rem; border: 1px solid var(--vscode-widget-border, #8884); border-radius: 6px; }
  figure.relations figcaption { text-transform: uppercase; font-size: .7rem; letter-spacing: .08em; opacity: .6; margin-bottom: .4rem; }
  figure.relations table { border-collapse: collapse; }
  figure.relations td { padding: .15em .8em .15em 0; }
  .rel-claim { font-family: var(--vscode-editor-font-family); font-weight: 600; }
  .rel-kind { opacity: .9; }
  .rel-detail { opacity: .6; font-size: .85em; }
  .rel-independent { opacity: .45; }
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
  registerCompletions(context);
  registerDiagnostics(context);

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
