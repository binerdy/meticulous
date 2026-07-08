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

/** One asserted relation: left/verb/right with the engine's verdict —
 *  holds ✓ (verified), fails ✗ (refuted), or asserted (informal). */
function renderRelation(block: BlockView): string {
  const mark = block.verdict === "holds" ? "✓ holds" : block.verdict === "fails" ? "✗ fails" : "asserted";
  const note = block.note ? `<div class="note">${escapeHtml(block.note)}</div>` : "";
  return (
    `<div class="relation-stmt">` +
    `<span class="rel-claim">${escapeHtml(block.formula)}</span>` +
    `<span class="rel-verb rel-${escapeHtml(block.title)}">${escapeHtml(block.title)}</span>` +
    `<span class="rel-claim">${escapeHtml(block.conclusion)}</span>` +
    `<span class="chip chip-${escapeHtml(block.verdict)}">${mark}</span>` +
    note +
    `</div>`
  );
}

/** The `map` block: every asserted relation drawn as a node-link diagram.
 *  Nodes sit on an ellipse (deterministic — no physics), edges are colored by
 *  relation kind, and a refuted formal assertion renders dashed with a ✗. */
function renderMap(block: BlockView): string {
  if (block.relations.length === 0) {
    return `<figure class="relmap-figure"><p class="empty">map needs at least one relation — e.g. <code>C1 supports C2</code>.</p></figure>`;
  }

  const labels = [...new Set(block.relations.flatMap(([l, , r]) => [l, r]))];
  const W = 760, H = Math.max(320, 150 + labels.length * 42);
  const cx = W / 2, cy = H / 2, rx = W / 2 - 130, ry = H / 2 - 45;

  const pos = new Map(
    labels.map((label, i) => {
      const angle = (2 * Math.PI * i) / labels.length - Math.PI / 2;
      return [label, { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) }] as const;
    })
  );
  const widthOf = (label: string) => Math.min(label.length, 26) * 7.2 + 20;
  const shown = (label: string) => (label.length > 26 ? label.slice(0, 25) + "…" : label);

  const edges = block.relations
    .map(([l, verb, r, status]) => {
      const a = pos.get(l)!, b = pos.get(r)!;
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 1;
      const ux = dx / dist, uy = dy / dist;
      // pull each endpoint out of its node box
      const trim = (label: string) => (widthOf(label) / 2) * Math.abs(ux) + 15 * Math.abs(uy) + 6;
      const x1 = a.x + ux * trim(l), y1 = a.y + uy * trim(l);
      const x2 = b.x - ux * trim(r), y2 = b.y - uy * trim(r);
      const failed = status === "fails" ? " failed" : "";
      const both = verb === "equivalent-to" ? ` marker-start="url(#dot-${verb})"` : "";
      const labelText = status === "fails" ? `${verb} ✗` : verb;
      // The label rides its arrow: rotated to the edge's angle, flipped when
      // the arrow points leftward so the text never renders upside down, and
      // nudged perpendicularly off the line (dy applies in the rotated frame).
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const upright = angle > 90 ? angle - 180 : angle < -90 ? angle + 180 : angle;
      return (
        `<line class="edge ${verb}${failed}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" marker-end="url(#arrow-${verb})"${both}/>` +
        `<text class="edge-label${failed}" x="${mx.toFixed(1)}" y="${my.toFixed(1)}" dy="-6" text-anchor="middle" transform="rotate(${upright.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)})">${escapeHtml(labelText)}</text>`
      );
    })
    .join("");

  const nodes = labels
    .map((label) => {
      const { x, y } = pos.get(label)!;
      const w = widthOf(label);
      const adHoc = label.startsWith("“") ? " ad-hoc" : "";
      return (
        `<g class="node${adHoc}"><rect x="${(x - w / 2).toFixed(1)}" y="${(y - 14).toFixed(1)}" width="${w.toFixed(1)}" height="28" rx="7"/>` +
        `<text x="${x.toFixed(1)}" y="${(y + 4.5).toFixed(1)}" text-anchor="middle">${escapeHtml(shown(label))}</text></g>`
      );
    })
    .join("");

  const marker = (verb: string) =>
    `<marker id="arrow-${verb}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow ${verb}" d="M 0 0 L 10 5 L 0 10 z"/></marker>` +
    `<marker id="dot-${verb}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow ${verb}" d="M 0 0 L 10 5 L 0 10 z"/></marker>`;
  const verbs = [...new Set(block.relations.map(([, v]) => v))];

  return (
    `<figure class="relmap-figure"><figcaption>argument map</figcaption>` +
    `<svg class="relmap" viewBox="0 0 ${W} ${H}" role="img"><defs>${verbs.map(marker).join("")}</defs>${edges}${nodes}</svg></figure>`
  );
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

    case "relation":
      return renderRelation(block);

    case "map":
      return renderMap(block);

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
