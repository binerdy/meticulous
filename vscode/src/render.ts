// The presentation layer: turns the analysed block views into an HTML fragment
// for the preview webview. Pure and side-effect free, so it's easy to test.

import type { BlockView } from "./core-bridge";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** A coloured pill stating the logical character of a formula. */
function verdictBadge(verdict: string): string {
  const label: Record<string, string> = {
    tautology: "tautology",
    contradiction: "contradiction",
    contingent: "contingent",
    equivalent: "equivalent",
    "not-equivalent": "not equivalent",
    valid: "valid",
    invalid: "invalid",
  };
  const text = label[verdict] ?? verdict;
  return `<span class="badge badge-${verdict}">${escapeHtml(text)}</span>`;
}

function tf(value: boolean): string {
  return `<td class="${value ? "t" : "f"}">${value ? "T" : "F"}</td>`;
}

/** Render a truth table: atom columns plus one result column. */
function renderTruthTable(
  atoms: string[],
  rows: boolean[][],
  results: boolean[],
  resultHeader: string
): string {
  const head =
    atoms.map((a) => `<th>${escapeHtml(a)}</th>`).join("") +
    `<th class="result">${escapeHtml(resultHeader)}</th>`;

  const body = rows
    .map((row, i) => {
      const cells = row.map((v) => tf(v)).join("") + tf(results[i]);
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<table class="truth"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderTable(block: BlockView): string {
  return renderTruthTable(block.atoms, block.rows, block.results, block.formula);
}

/** The boxed rendering of an `argument { }` block: premises over an inference
 *  line, the conclusion, and everything the engine worked out about it. */
function renderArgument(block: BlockView): string {
  const chips = [verdictBadge(block.verdict)];
  if (block.form) chips.push(`<span class="chip chip-form">${escapeHtml(block.form)}</span>`);
  if (block.fallacy) chips.push(`<span class="chip chip-fallacy">${escapeHtml(block.fallacy)}</span>`);

  const parts: string[] = [];
  parts.push(
    `<figcaption><span class="arg-name">${escapeHtml(block.name)}</span>${chips.join(" ")}</figcaption>`
  );

  const premises = block.premises
    .map((p) => `<div class="premise">${escapeHtml(p)}</div>`)
    .join("");
  parts.push(
    `<div class="derivation">${premises}<div class="conclusion">∴ ${escapeHtml(block.conclusion)}</div></div>`
  );

  if (block.note) {
    parts.push(`<p class="note">${escapeHtml(block.note)}</p>`);
  }

  if (block.verdict === "invalid" && block.rows.length > 0) {
    parts.push(
      `<div class="counterexample"><span class="cx-label">counterexample — premises true, conclusion false:</span>` +
        renderTruthTable(block.atoms, block.rows, block.results, block.conclusion) +
        `</div>`
    );
  }

  if (block.suggestion.length > 0) {
    const options = block.suggestion
      .map((s) => `<span class="formula">${escapeHtml(s)}</span>`)
      .join(`<span class="or"> or </span>`);
    parts.push(
      `<div class="repair">Becomes valid if you add the premise ${options} — is that what's silently being assumed?</div>`
    );
  }

  if (block.proof.length > 0) {
    const steps = block.proof
      .map(
        ([n, formula, why]) =>
          `<tr><td class="step-no">${escapeHtml(n)}.</td><td class="step-formula">${escapeHtml(formula)}</td><td class="step-why">${escapeHtml(why)}</td></tr>`
      )
      .join("");
    parts.push(`<table class="proof"><tbody>${steps}</tbody></table>`);
  }

  return `<figure class="argument">${parts.join("")}</figure>`;
}

/** A user-written proof, graded step by step. Each row arrives as
 *  [number, formula, justification, status, message] where status is
 *  "premise" | "ok" | "bad". */
function renderProof(block: BlockView): string {
  const rows = block.proof
    .map(([n, formula, why, status, message]) => {
      const mark =
        status === "ok" ? `<td class="step-status ok">✓</td>` :
        status === "bad" ? `<td class="step-status bad">✗</td>` :
        `<td class="step-status"></td>`;
      const main =
        `<tr class="step-${status}"><td class="step-no">${escapeHtml(n)}.</td>` +
        `<td class="step-formula">${escapeHtml(formula)}</td>` +
        `<td class="step-why">${escapeHtml(why)}</td>${mark}</tr>`;
      const detail = message
        ? `<tr class="step-msg"><td></td><td colspan="3">${escapeHtml(message)}</td></tr>`
        : "";
      return main + detail;
    })
    .join("");

  const note = block.note ? `<p class="note">${escapeHtml(block.note)}</p>` : "";

  return `<figure class="argument proof-figure"><figcaption><span class="arg-name">${escapeHtml(block.name)}</span>${verdictBadge(block.verdict)}<span class="check-label">proof</span></figcaption><table class="proof">${rows}</table>${note}</figure>`;
}

/** The `analyze` block: how every claim stands to every other claim.
 *  Each pair arrives as [left, relation, right, explanation]. */
function renderRelations(block: BlockView): string {
  if (block.relations.length === 0) {
    return `<div class="relations"><p class="empty">analyze needs at least two <code>claim</code>s to compare.</p></div>`;
  }
  const rows = block.relations
    .map(([left, rel, right, why]) => {
      const detail = why ? ` <span class="rel-detail">— ${escapeHtml(why)}</span>` : "";
      const cls = rel === "independent" ? "rel-row rel-independent" : "rel-row";
      return `<tr class="${cls}"><td class="rel-claim">${escapeHtml(left)}</td><td class="rel-kind">${escapeHtml(rel)}${detail}</td><td class="rel-claim">${escapeHtml(right)}</td></tr>`;
    })
    .join("");
  return `<figure class="relations"><figcaption>claim relations</figcaption><table><tbody>${rows}</tbody></table></figure>`;
}

function renderBlock(block: BlockView): string {
  switch (block.kind) {
    case "heading": {
      const level = Math.min(Math.max(block.level, 1), 6);
      return `<h${level}>${escapeHtml(block.title)}</h${level}>`;
    }

    case "prose":
      return `<p class="prose">${escapeHtml(block.title)}</p>`;

    case "prop":
      return `<div class="prop"><span class="atom">${escapeHtml(block.name)}</span><span class="colon">:</span><span class="gloss">${escapeHtml(block.gloss)}</span></div>`;

    case "claim": {
      const reading = block.note
        ? `<div class="reading">${escapeHtml(block.note)}</div>`
        : "";
      return `<div class="claim"><span class="name">${escapeHtml(block.name)}</span><span class="formula">${escapeHtml(block.formula)}</span>${reading}</div>`;
    }

    case "table": {
      const note = block.note ? `<span class="note-inline">${escapeHtml(block.note)}</span>` : "";
      return `<figure class="statement"><figcaption>${verdictBadge(block.verdict)}${note}</figcaption>${renderTable(block)}</figure>`;
    }

    case "check": {
      const note = block.note ? `<span class="note-inline">${escapeHtml(block.note)}</span>` : "";
      // Equivalence checks carry no table (empty atoms); verdict checks do.
      if (block.atoms.length === 0) {
        return `<div class="check"><div><span class="formula">${escapeHtml(block.formula)}</span>${verdictBadge(block.verdict)}</div>${note}</div>`;
      }
      return `<figure class="statement"><figcaption><span class="check-label">check</span> ${verdictBadge(block.verdict)}${note}</figcaption>${renderTable(block)}</figure>`;
    }

    case "argument":
      return renderArgument(block);

    case "proof":
      return renderProof(block);

    case "relations":
      return renderRelations(block);

    case "error":
      return `<div class="error"><span class="error-line">line ${block.line}</span> ${escapeHtml(block.title)}</div>`;

    default:
      return "";
  }
}

/** Render a whole analysed document to an HTML fragment. */
export function renderDocument(blocks: BlockView[]): string {
  if (blocks.length === 0) {
    return `<p class="empty">Nothing to show yet — write a <code>prop</code>, <code>claim</code>, or <code>table</code>.</p>`;
  }
  return blocks.map(renderBlock).join("\n");
}
