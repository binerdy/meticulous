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
  };
  const text = label[verdict] ?? verdict;
  return `<span class="badge badge-${verdict}">${escapeHtml(text)}</span>`;
}

function tf(value: boolean): string {
  return `<td class="${value ? "t" : "f"}">${value ? "T" : "F"}</td>`;
}

/** Render a truth table (shared by `table` and `check` blocks). */
function renderTable(block: BlockView): string {
  const head =
    block.atoms.map((a) => `<th>${escapeHtml(a)}</th>`).join("") +
    `<th class="result">${escapeHtml(block.formula)}</th>`;

  const body = block.rows
    .map((row, i) => {
      const cells = row.map((v) => tf(v)).join("") + tf(block.results[i]);
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<table class="truth"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
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

    case "claim":
      return `<div class="claim"><span class="name">${escapeHtml(block.name)}</span><span class="formula">${escapeHtml(block.formula)}</span></div>`;

    case "table":
      return `<figure class="statement"><figcaption>${verdictBadge(block.verdict)}</figcaption>${renderTable(block)}</figure>`;

    case "check":
      // Equivalence checks carry no table (empty atoms); verdict checks do.
      if (block.atoms.length === 0) {
        return `<div class="check"><span class="formula">${escapeHtml(block.formula)}</span>${verdictBadge(block.verdict)}</div>`;
      }
      return `<figure class="statement"><figcaption><span class="check-label">check</span> ${verdictBadge(block.verdict)}</figcaption>${renderTable(block)}</figure>`;

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
