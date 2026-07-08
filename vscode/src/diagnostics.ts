// Diagnostics for meticulous documents:
//   * parse errors from the engine   -> red squiggles
//   * lint warnings (unused props)   -> yellow squiggles
//
// Both come straight from the F# core (analyze + lint), so the squiggles can
// never disagree with what the preview shows.

import * as vscode from "vscode";
import { analyze, lint } from "./core-bridge";

function refresh(document: vscode.TextDocument, collection: vscode.DiagnosticCollection) {
  if (document.languageId !== "meticulous") return;

  const diagnostics: vscode.Diagnostic[] = [];
  const fullLineRange = (line1based: number) => {
    const line = Math.max(0, Math.min(line1based - 1, document.lineCount - 1));
    return document.lineAt(line).range;
  };

  try {
    for (const block of analyze(document.getText())) {
      if (block.kind === "error") {
        diagnostics.push(
          new vscode.Diagnostic(fullLineRange(block.line), block.title, vscode.DiagnosticSeverity.Error)
        );
      }
    }
    for (const warning of lint(document.getText())) {
      const d = new vscode.Diagnostic(
        fullLineRange(warning.line),
        warning.message,
        vscode.DiagnosticSeverity.Warning
      );
      d.tags = [vscode.DiagnosticTag.Unnecessary]; // renders the line faded
      diagnostics.push(d);
    }
  } catch {
    // An engine crash shouldn't take the editor down with it.
  }

  collection.set(document.uri, diagnostics);
}

export function registerDiagnostics(context: vscode.ExtensionContext) {
  const collection = vscode.languages.createDiagnosticCollection("meticulous");
  let debounce: ReturnType<typeof setTimeout> | undefined;

  const scheduleRefresh = (document: vscode.TextDocument) => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => refresh(document, collection), 300);
  };

  for (const document of vscode.workspace.textDocuments) refresh(document, collection);

  context.subscriptions.push(
    collection,
    vscode.workspace.onDidOpenTextDocument((d) => refresh(d, collection)),
    vscode.workspace.onDidChangeTextDocument((e) => scheduleRefresh(e.document)),
    vscode.workspace.onDidCloseTextDocument((d) => collection.delete(d.uri))
  );
}
