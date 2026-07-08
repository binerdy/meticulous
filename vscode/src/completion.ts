// Completions for meticulous:
//   * keywords (Ctrl+Space) — each inserts a ready-to-fill snippet
//   * argument-form snippets — type `/` (or Ctrl+Space) to expand e.g.
//     /modus-ponens into an argument skeleton with mirrored placeholders
//   * rule names after `by ` inside proof blocks
//   * prop/claim names declared in the current document
//
// The form snippets are generated from the same F# catalog that powers
// recognition, proofs, and fallacy naming — one source of truth.

import * as vscode from "vscode";
import { catalog } from "./core-bridge";

/** Map each Greek metavariable to a mirrored snippet placeholder, so filling
 *  in `p` once fills every φ in the skeleton. */
function toPlaceholders(pattern: string): string {
  return pattern
    .replace(/φ/g, "${1:p}")
    .replace(/ψ/g, "${2:q}")
    .replace(/χ/g, "${3:r}")
    .replace(/ω/g, "${4:s}");
}

/** The argument-block snippet for one catalog form. */
function formSnippet(form: ReturnType<typeof catalog>[number]): string {
  const premises = form.premises.map((p) => `  premise ${toPlaceholders(p)}`).join("\n");
  const body = premises === "" ? "" : `${premises}\n`;
  return `argument \${5:${form.name}} {\n${body}  ---\n  conclude ${toPlaceholders(form.conclusion)}\n}`;
}

const KEYWORD_SNIPPETS: { label: string; detail: string; body: string }[] = [
  { label: "prop", detail: "declare an atomic proposition", body: "prop ${1:p} : ${2:its meaning in plain language}" },
  { label: "claim", detail: "name a compound formula", body: "claim ${1:C1} : ${2:p -> q}" },
  { label: "table", detail: "truth table + verdict", body: "table ${1:C1}" },
  { label: "check", detail: "verdict for a formula", body: "check ${1:p -> q}" },
  { label: "check equivalent", detail: "are two formulas the same claim?", body: "check ${1:A} equivalent ${2:B}" },
  { label: "argument", detail: "premises + conclusion, validity checked", body: "argument ${1:name} {\n  premise ${2:p -> q}\n  premise ${3:p}\n  ---\n  conclude ${4:q}\n}" },
  { label: "proof", detail: "your own derivation, graded step by step", body: "proof ${1:name} {\n  1. premise ${2:p -> q}\n  2. premise ${3:p}\n  3. ${4:q} by ${5:modus-ponens} from ${6:1, 2}\n}" },
  { label: "analyze", detail: "relate every claim to every other", body: "analyze" },
  { label: "premise", detail: "a premise inside an argument", body: "premise ${1:p}" },
  { label: "conclude", detail: "the conclusion of an argument", body: "conclude ${1:q}" },
];

export function registerCompletions(context: vscode.ExtensionContext) {
  const forms = catalog();

  const provider: vscode.CompletionItemProvider = {
    provideCompletionItems(document, position) {
      const prefix = document.lineAt(position).text.slice(0, position.character);
      const items: vscode.CompletionItem[] = [];

      // After `by ` in a proof line: offer rule names (valid rules only —
      // the engine would reject a fallacy anyway).
      if (/\bby\s+[\w-]*$/.test(prefix)) {
        for (const form of forms.filter((f) => !f.isFallacy)) {
          const item = new vscode.CompletionItem(form.name, vscode.CompletionItemKind.Function);
          item.detail = form.aka ? `${form.title} (${form.aka})` : form.title;
          item.documentation = `${form.premises.join(";  ")}  ⊢  ${form.conclusion}\n${form.note}`;
          items.push(item);
        }
        return items;
      }

      // `/modus-ponens` style: replace the slash-word with the full skeleton.
      const slash = prefix.match(/\/[\w-]*$/);
      const slashRange = slash
        ? new vscode.Range(position.line, position.character - slash[0].length, position.line, position.character)
        : undefined;

      for (const form of forms.filter((f) => !f.isFallacy)) {
        const item = new vscode.CompletionItem(
          `/${form.name}`,
          vscode.CompletionItemKind.Snippet
        );
        item.detail = form.aka ? `${form.title} (${form.aka})` : form.title;
        item.documentation = new vscode.MarkdownString(
          `\`${form.premises.join("\`,  \`")}\`  ⊢  \`${form.conclusion}\`\n\n${form.note}`
        );
        item.insertText = new vscode.SnippetString(formSnippet(form));
        item.filterText = `/${form.name} ${form.name}`;
        if (slashRange) item.range = slashRange;
        items.push(item);
      }

      // If the user is mid-slash-word, keywords/names would be noise.
      if (slash) return items;

      for (const kw of KEYWORD_SNIPPETS) {
        const item = new vscode.CompletionItem(kw.label, vscode.CompletionItemKind.Keyword);
        item.detail = kw.detail;
        item.insertText = new vscode.SnippetString(kw.body);
        items.push(item);
      }

      // prop and claim names declared anywhere in this document.
      for (const match of document.getText().matchAll(/^\s*(prop|claim)\s+([A-Za-z_]\w*)\s*:/gm)) {
        const item = new vscode.CompletionItem(
          match[2],
          match[1] === "prop" ? vscode.CompletionItemKind.Variable : vscode.CompletionItemKind.Constant
        );
        item.detail = match[1];
        items.push(item);
      }

      return items;
    },
  };

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { language: "meticulous" },
      provider,
      "/" // typing a slash pops the form catalog; Ctrl+Space works everywhere
    )
  );
}
