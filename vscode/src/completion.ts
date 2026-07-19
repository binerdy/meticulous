// Completions for meticulous (written entirely in prose now):
//   * keywords (Ctrl+Space) — each inserts a ready-to-fill prose snippet
//   * `/name` — expands a classic argument into a whole prose sentence, e.g.
//     /modus-ponens → "If P, then Q. P. Therefore, Q."
//   * rule names after `by ` inside proof blocks (still the kebab-case names)
//   * prop/claim names declared in the current document

import * as vscode from "vscode";
import { catalog } from "./core-bridge";

/** Classic forms as ready-to-fill prose sentences. Placeholders repeat, so
 *  filling `P` once fills every P. */
const PROSE_FORMS: { name: string; title: string; body: string }[] = [
  { name: "modus-ponens", title: "modus ponens", body: "If ${1:P}, then ${2:Q}. ${1:P}. Therefore, ${2:Q}." },
  { name: "modus-tollens", title: "modus tollens", body: "If ${1:P}, then ${2:Q}. Not ${2:Q}. Therefore, not ${1:P}." },
  { name: "hypothetical-syllogism", title: "hypothetical syllogism", body: "If ${1:P}, then ${2:Q}. If ${2:Q}, then ${3:R}. Therefore, if ${1:P}, then ${3:R}." },
  { name: "disjunctive-syllogism", title: "disjunctive syllogism", body: "Either ${1:P} or ${2:Q}. Not ${1:P}. Therefore, ${2:Q}." },
  { name: "constructive-dilemma", title: "constructive dilemma", body: "Either ${1:P} or ${2:R}. If ${1:P}, then ${3:Q}. If ${2:R}, then ${4:S}. Therefore, either ${3:Q} or ${4:S}." },
  { name: "syllogism", title: "categorical syllogism", body: "All ${1:men} are ${2:mortal}. ${3:Socrates} is a ${1:men}. Therefore, ${3:Socrates} is ${2:mortal}." },
];

const KEYWORD_SNIPPETS: { label: string; detail: string; body: string }[] = [
  { label: "prop", detail: "name an atomic proposition", body: "prop ${1:p} : ${2:its meaning in plain language}" },
  { label: "claim", detail: "name a claim, in prose", body: "claim ${1:C1} : ${2:if p then q}" },
  { label: "table", detail: "truth table + verdict", body: "table ${1:C1}" },
  { label: "check", detail: "verdict for a claim", body: "check ${1:if p then q}" },
  { label: "check equivalent", detail: "are two claims the same?", body: "check ${1:A} equivalent ${2:B}" },
  { label: "argument", detail: "premises + conclusion, validity checked", body: "argument ${1:name} {\n  premise ${2:if p then q}\n  premise ${3:p}\n  ---\n  conclude ${4:q}\n}" },
  { label: "proof", detail: "your own derivation, graded step by step", body: "proof ${1:name} {\n  1. premise ${2:if p then q}\n  2. premise ${3:p}\n  3. ${4:q} by ${5:modus-ponens} from ${6:1, 2}\n}" },
  { label: "venn", detail: "a categorical Venn diagram", body: "venn ${1:name} {\n  premise All ${2:men} are ${3:mortal}\n  premise ${4:Socrates} is a ${2:men}\n}" },
  { label: "analyze", detail: "relate every claim to every other", body: "analyze" },
  { label: "map", detail: "draw all asserted relations as a graph", body: "map" },
  { label: "relation", detail: "assert a relation between two claims", body: "${1:C1} ${2|supports,presupposes,contradicts,entails,equivalent-to|} ${3:C2}" },
  { label: "premise", detail: "a premise inside an argument", body: "premise ${1:p}" },
  { label: "conclude", detail: "the conclusion of an argument", body: "conclude ${1:q}" },
  { label: "necessarily", detail: "modal — true in every possible world", body: "necessarily ${1:p}" },
  { label: "possibly", detail: "modal — true in some possible world", body: "possibly ${1:p}" },
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

      // `/modus-ponens` style: replace the slash-word with a whole prose argument.
      const slash = prefix.match(/\/[\w-]*$/);
      const slashRange = slash
        ? new vscode.Range(position.line, position.character - slash[0].length, position.line, position.character)
        : undefined;

      for (const form of PROSE_FORMS) {
        const item = new vscode.CompletionItem(`/${form.name}`, vscode.CompletionItemKind.Snippet);
        item.detail = form.title;
        item.documentation = new vscode.MarkdownString(form.body.replace(/\$\{\d+:(\w+)\}/g, "$1"));
        item.insertText = new vscode.SnippetString(form.body);
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
