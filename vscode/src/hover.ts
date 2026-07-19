// Hover explanations — the learning-tool layer. Hovering a word explains what
// the engine makes of it:
//   * statement keywords (prop, claim, argument, proof, …)
//   * prose logic words (if, all, some, therefore, …) with the symbol they become
//   * inference-rule names (modus-ponens, barbara, …) with pattern + note,
//     straight from the same F# catalog that powers recognition
//   * names defined in this document: props (their gloss), claims (their
//     formula and English reading), arguments (their verdict and form)

import * as vscode from "vscode";
import { analyze, catalog, BlockView } from "./core-bridge";

const KEYWORDS: Record<string, string> = {
  prop: "**prop** declares an *atomic proposition* — a smallest statement that is simply true or false — and glosses it in plain language:\n\n```\nprop rain : It is raining\n```",
  claim: "**claim** names a compound statement so it can be reused, tabled, and compared:\n\n```\nclaim C1 : if rain then wet\n```",
  table: "**table** computes a truth table and a verdict — *tautology* (always true), *contradiction* (never true), or *contingent* (depends on the facts).",
  check: "**check** asks for a verdict, or compares two claims:\n\n```\ncheck C1 equivalent (not rain or wet)\n```",
  argument: "**argument** lists premises and a conclusion. The engine checks validity, names the inference form (or the fallacy), shows counterexamples, suggests missing premises, and derives a proof.",
  premise: "A **premise** — something granted for the sake of the argument.",
  conclude: "**conclude** states what is supposed to follow from the premises. Valid means: no possible situation makes every premise true and this false.",
  proof: "**proof** is a derivation *you* write, one numbered step per line — the engine grades every step:\n\n```\n3. q by modus-ponens from 1, 2\n```",
  by: "**by** names the inference rule that justifies this step (hover the rule name for its pattern).",
  from: "**from** cites the earlier line numbers this step builds on.",
  venn: "**venn** draws a categorical argument as a Venn diagram — shaded regions are provably empty, a dot marks a region that must be occupied.",
  square: "**square** draws the classical *square of opposition* for two terms:\n\n```\nsquare men mortal\n```\n\nEvery edge is computed: contradictory diagonals hold outright; contraries, subcontraries, and subalternation hold only under Aristotle's *existential import*.",
  analyze: "**analyze** compares every claim with every other: equivalent, contradictory, contrary, subcontrary, entails, or independent.",
  map: "**map** draws all asserted relations (supports, contradicts, …) as an argument map.",
};

const LOGIC: Record<string, string> = {
  if: "**if … then …** builds a *material implication*, rendered **→**. It is false only when the *if* part holds and the *then* part fails — so a false *if* makes the whole thing true (vacuously).",
  then: "**if … then …** builds a *material implication*, rendered **→**. It is false only when the *if* part holds and the *then* part fails.",
  and: "**and** is *conjunction*, rendered **∧**: true exactly when both sides are true.",
  or: "**or** is *inclusive disjunction*, rendered **∨**: true when at least one side is true — possibly both.",
  not: "**not** is *negation*, rendered **¬**: flips true and false.",
  either: "**either … or …** is the same inclusive **∨** — the *either* just marks where the choice starts.",
  neither: "**neither … nor …** means both fail: ¬A ∧ ¬B.",
  nor: "**neither … nor …** means both fail: ¬A ∧ ¬B.",
  iff: "**iff** — *if and only if*, rendered **↔**: the two sides always share a truth value.",
  implies: "**implies** is the material conditional, rendered **→**.",
  necessarily: "**necessarily** is the modal operator **□**: true in *every* possible world (S5). What is necessary is actual — but not vice versa.",
  possibly: "**possibly** is the modal operator **◇**: true in *some* possible world (S5). Possible does not mean actual.",
  all: "**All S are P** becomes **∀x. S(x) → P(x)**: being S guarantees being P. It says nothing about whether any S exists.",
  no: "**No S are P** becomes **∀x. S(x) → ¬P(x)**: nothing is both.",
  some: "**Some S are P** becomes **∃x. S(x) ∧ P(x)**: at least one thing is both. *Some S are not P* is its negative twin, ∃x. S(x) ∧ ¬P(x).",
  every: "**Every S is a P** — same as *All S are P*: **∀x. S(x) → P(x)**.",
  is: "**X is a P** predicates P of the individual X: **P(x)**. Plurals are matched up, so *man*/*men* name the same class.",
  are: "The copula of a categorical sentence — *All/No/Some S **are** P*. The words around it decide the quantifier.",
  therefore: "**Therefore** marks the conclusion of a one-line argument:\n\n```\nIf P, then Q. P. Therefore, Q.\n```\n\nThe engine checks it, names the form, and derives a proof.",
  thus: "**Thus** marks a conclusion — same as *Therefore*.",
  hence: "**Hence** marks a conclusion — same as *Therefore*.",
  supports: "**supports** asserts an *informal* relation — recorded on the map, but not checked by the engine.",
  presupposes: "**presupposes** asserts an *informal* reliance — recorded on the map, but not checked.",
  contradicts: "**contradicts** is *checked*: the engine verifies the two claims can never both be true (or shows a situation where they can).",
  entails: "**entails** is *checked*: whenever the first claim holds, the second must — or the engine shows a counterexample.",
  "equivalent-to": "**equivalent-to** is *checked*: the two claims carry the same truth value in every situation — or the engine shows where they come apart.",
  equivalent: "**equivalent** asks whether two claims always share a truth value — two phrasings of one claim.",
};

export function registerHover(context: vscode.ExtensionContext) {
  const forms = catalog();
  const byName = new Map(forms.map((f) => [f.name, f]));

  // Blocks for the current document, re-analyzed only when it changes.
  const cache = { key: "", blocks: [] as BlockView[] };
  const blocksFor = (document: vscode.TextDocument): BlockView[] => {
    const key = `${document.uri.toString()}@${document.version}`;
    if (cache.key !== key) {
      try {
        cache.blocks = analyze(document.getText());
        cache.key = key;
      } catch {
        return cache.blocks;
      }
    }
    return cache.blocks;
  };

  const provider: vscode.HoverProvider = {
    provideHover(document, position) {
      const range = document.getWordRangeAtPosition(position, /[A-Za-z][\w-]*/);
      if (!range) return undefined;
      const word = document.getText(range);
      const lower = word.toLowerCase();
      const md = (s: string) => new vscode.Hover(new vscode.MarkdownString(s), range);

      // 1. an inference rule from the catalog (as cited in proofs)
      const form = byName.get(lower);
      if (form) {
        const aka = form.aka ? ` *(${form.aka})*` : "";
        const pattern =
          form.premises.length > 0
            ? `\`${form.premises.join("\`,  \`")}\`  ⊢  \`${form.conclusion}\``
            : `⊢  \`${form.conclusion}\``;
        const kind = form.isFallacy ? "⚠ a **fallacy**, not a rule" : "an inference rule";
        return md(`**${form.title}**${aka} — ${kind}\n\n${pattern}\n\n${form.note}`);
      }

      // 2. a name this document defines (prop / claim / argument)
      for (const block of blocksFor(document)) {
        if (block.kind === "prop" && block.name === word) {
          return md(`**prop ${block.name}** — “${block.gloss}”\n\nAn atomic proposition: simply true or false.`);
        }
        if (block.kind === "claim" && block.name === word) {
          const reading = block.note ? `\n\n*${block.note}*` : "";
          return md(`**claim ${block.name}**  =  \`${block.formula}\`${reading}`);
        }
        if (block.kind === "argument" && block.name === word) {
          const label = block.form || block.fallacy;
          const named = label ? ` — recognized as **${label}**` : "";
          return md(`**argument ${block.name}** — ${block.verdict.toUpperCase()}${named}\n\n${block.note}`);
        }
      }

      // 3. a statement keyword, or 4. a prose logic word
      if (KEYWORDS[lower]) return md(KEYWORDS[lower]);
      if (LOGIC[lower]) return md(LOGIC[lower]);

      return undefined;
    },
  };

  context.subscriptions.push(
    vscode.languages.registerHoverProvider({ language: "meticulous" }, provider)
  );
}
