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
    unknown: "unknown",
  };
  const text = label[verdict] ?? verdict;
  return `<span class="badge badge-${verdict}">${escapeHtml(text)}</span>`;
}

function tf(value: boolean): string {
  return `<td class="${value ? "t" : "f"}">${value ? "T" : "F"}</td>`;
}

/** Render a truth table: atom columns plus one result column. When `actual`
 *  is set (modal blocks) the rows are possible worlds — a leading column
 *  names them w1, w2, … and → marks the actual world. */
function renderTruthTable(
  atoms: string[],
  rows: boolean[][],
  results: boolean[],
  resultHeader: string,
  actual = -1
): string {
  const worldly = actual >= 0;
  const head =
    (worldly ? `<th class="world-name">world</th>` : "") +
    atoms.map((a) => `<th>${escapeHtml(a)}</th>`).join("") +
    `<th class="result">${escapeHtml(resultHeader)}</th>`;

  const body = rows
    .map((row, i) => {
      const name = worldly
        ? `<td class="world-name${i === actual ? " actual" : ""}">${i === actual ? "→ " : ""}w${i + 1}</td>`
        : "";
      const cells = name + row.map((v) => tf(v)).join("") + tf(results[i]);
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<table class="truth"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderTable(block: BlockView): string {
  return renderTruthTable(block.atoms, block.rows, block.results, block.formula, block.actual);
}

/** A first-order (counter)model: the domain, constant assignments, and each
 *  predicate's extension, one line each. `domain = …` heads the block. */
function renderModelCard(lines: string[]): string {
  const rows = lines
    .map((line) => {
      const eq = line.indexOf("=");
      if (eq === -1) return `<div class="model-line">${escapeHtml(line)}</div>`;
      const lhs = line.slice(0, eq).trim();
      const rhs = line.slice(eq + 1).trim();
      return `<div class="model-line"><span class="model-lhs">${escapeHtml(lhs)}</span><span class="model-eq">=</span><span class="model-rhs">${escapeHtml(rhs)}</span></div>`;
    })
    .join("");
  return `<div class="model-card">${rows}</div>`;
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
    const label =
      block.actual >= 0
        ? "countermodel — premises true at the actual world (→), conclusion false there:"
        : "counterexample — premises true, conclusion false:";
    parts.push(
      `<div class="counterexample"><span class="cx-label">${label}</span>` +
        renderTruthTable(block.atoms, block.rows, block.results, block.conclusion, block.actual) +
        `</div>`
    );
  }

  if (block.verdict === "invalid" && block.model.length > 0) {
    parts.push(
      `<div class="counterexample"><span class="cx-label">countermodel — premises true, conclusion false:</span>` +
        renderModelCard(block.model) +
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

const nodeWidthOf = (label: string) => Math.min(label.length, 26) * 7.2 + 20;

/** Sugiyama-style layered layout (the algorithm behind Graphviz dot):
 *  1. break cycles (DFS back-edges are ignored for placement only),
 *  2. assign each node a layer by longest path from the roots,
 *  2b. give edges that span several layers invisible *virtual nodes* on each
 *      layer they cross, so they can be routed around real nodes,
 *  3. reduce edge crossings with barycenter sweeps (virtual nodes included),
 *  4. spread each layer horizontally, centered.
 *  Deterministic — the same document always draws the same map.
 *  Returns node positions plus, per link, the waypoints its edge bends through. */
function layeredLayout(labels: string[], links: { from: string; to: string }[]) {
  const index = new Map(labels.map((label, i) => [label, i]));
  const out: Set<number>[] = labels.map(() => new Set());
  for (const { from, to } of links) {
    const a = index.get(from)!, b = index.get(to)!;
    if (a !== b) out[a].add(b);
  }

  // 1. cycle breaking: edges that close a DFS cycle are skipped when layering
  const state = labels.map(() => 0); // 0 new, 1 on stack, 2 done
  const backEdges = new Set<string>();
  const dfs = (v: number) => {
    state[v] = 1;
    for (const w of out[v]) {
      if (state[w] === 1) backEdges.add(`${v}>${w}`);
      else if (state[w] === 0) dfs(w);
    }
    state[v] = 2;
  };
  labels.forEach((_, v) => state[v] === 0 && dfs(v));

  // 2. layers: longest path (repeated relaxation; graphs here are tiny)
  //    vLayer/vWidth cover every vertex — real nodes first, dummies appended.
  const vLayer = labels.map(() => 0);
  for (let pass = 0; pass < labels.length; pass++)
    labels.forEach((_, v) => {
      for (const w of out[v])
        if (!backEdges.has(`${v}>${w}`)) vLayer[w] = Math.max(vLayer[w], vLayer[v] + 1);
    });
  const vWidth = labels.map(nodeWidthOf);

  // 2b. long edges become chains through virtual vertices
  const chains = links.map(({ from, to }) => {
    const a = index.get(from)!, b = index.get(to)!;
    const span = vLayer[b] - vLayer[a];
    if (a === b || Math.abs(span) <= 1) return [a, b];
    const step = Math.sign(span);
    const chain = [a];
    for (let k = 1; k < Math.abs(span); k++) {
      chain.push(vLayer.length);
      vLayer.push(vLayer[a] + step * k);
      vWidth.push(10);
    }
    chain.push(b);
    return chain;
  });
  const segments: [number, number][] = [];
  for (const chain of chains)
    for (let i = 0; i + 1 < chain.length; i++) segments.push([chain[i], chain[i + 1]]);

  const depth = Math.max(0, ...vLayer);
  const rows: number[][] = Array.from({ length: depth + 1 }, () => []);
  vLayer.forEach((l, v) => rows[l].push(v));

  // 3. crossing reduction: order each row by the average position of its
  //    neighbors in the adjacent row (alternating sweeps settle it)
  const orderOf: number[] = new Array(vLayer.length).fill(0);
  rows.forEach((row) => row.forEach((v, i) => (orderOf[v] = i)));
  const neighborsIn = (v: number, targetLayer: number) => {
    const result: number[] = [];
    for (const [a, b] of segments) {
      if (a === v && vLayer[b] === targetLayer) result.push(b);
      if (b === v && vLayer[a] === targetLayer) result.push(a);
    }
    return result;
  };
  for (let sweep = 0; sweep < 6; sweep++) {
    const dir = sweep % 2 === 0 ? -1 : 1;
    for (const row of rows) {
      const barycenter = (v: number) => {
        const ns = neighborsIn(v, vLayer[v] + dir);
        return ns.length ? ns.reduce((s, w) => s + orderOf[w], 0) / ns.length : orderOf[v];
      };
      row.sort((u, v) => barycenter(u) - barycenter(v));
      row.forEach((v, i) => (orderOf[v] = i));
    }
  }

  // 4. coordinates: rows stacked vertically; initial x follows the
  //    crossing-reduced order
  const GAP = 42, ROW_H = 118, MARGIN = 56;
  const coord: { x: number; y: number }[] = new Array(vLayer.length);
  rows.forEach((row, li) => {
    let x = 0;
    for (const v of row) {
      coord[v] = { x: x + vWidth[v] / 2, y: MARGIN + li * ROW_H };
      x += vWidth[v] + GAP;
    }
  });

  // 4b. straightening: pull every vertex toward the (weighted) average x of
  //     its neighbors, then push overlaps apart. Chains through virtual
  //     vertices pull four times harder — a long edge wants to be straight —
  //     and rows re-sort by where nodes *want* to be, so a leaf node can
  //     drift across the row toward its only connection.
  const realCount = labels.length;
  const segWeight = (a: number, b: number) => (a >= realCount || b >= realCount ? 4 : 1);
  const weightedNeighbors = (v: number) =>
    segments
      .filter(([a, b]) => a === v || b === v)
      .map(([a, b]) => {
        const w = a === v ? b : a;
        return { w, weight: segWeight(a, b) };
      });

  // push overlapping row members apart without reordering them
  const settleRow = (row: number[]) => {
    const sorted = [...row].sort((u, v) => coord[u].x - coord[v].x);
    for (let k = 1; k < sorted.length; k++) {
      const gap = coord[sorted[k - 1]].x + vWidth[sorted[k - 1]] / 2 + GAP + vWidth[sorted[k]] / 2;
      if (coord[sorted[k]].x < gap) coord[sorted[k]].x = gap;
    }
    for (let k = sorted.length - 2; k >= 0; k--) {
      const cap = coord[sorted[k + 1]].x - vWidth[sorted[k + 1]] / 2 - GAP - vWidth[sorted[k]] / 2;
      if (coord[sorted[k]].x > cap) coord[sorted[k]].x = cap;
    }
    for (let k = 1; k < sorted.length; k++) {
      const gap = coord[sorted[k - 1]].x + vWidth[sorted[k - 1]] / 2 + GAP + vWidth[sorted[k]] / 2;
      if (coord[sorted[k]].x < gap) coord[sorted[k]].x = gap;
    }
  };

  const relaxPasses = (count: number) => {
    for (let pass = 0; pass < count; pass++) {
      // Alternate top-down / bottom-up: a fixed direction lets a uniform
      // "traveling wave" ride down the rows (each row copying its already-
      // shifted neighbor), which freezes relative positions short of optimum.
      const rowSequence = pass % 2 === 0 ? rows : [...rows].reverse();
      for (const row of rowSequence) {
        for (const v of row) {
          const ns = weightedNeighbors(v);
          const total = ns.reduce((s, n) => s + n.weight, 0);
          if (total) coord[v].x = ns.reduce((s, n) => s + coord[n.w].x * n.weight, 0) / total;
        }
        settleRow(row);
      }
    }
  };
  relaxPasses(16);

  // 4c. escape local minima: try swapping horizontally-adjacent vertices —
  //     if trading places shortens the total (weighted) wire length, keep the
  //     swap and let the relaxation re-settle. Two rounds catch the classic
  //     case of a chain trapped on the wrong side of a wide neighbor.
  const wireCostOf = (v: number) =>
    segments.reduce(
      (s, [a, b]) =>
        a === v || b === v ? s + segWeight(a, b) * Math.abs(coord[a].x - coord[b].x) : s,
      0
    );
  for (let round = 0; round < 2; round++) {
    for (const row of rows) {
      const sorted = [...row].sort((u, v) => coord[u].x - coord[v].x);
      for (let k = 0; k + 1 < sorted.length; k++) {
        const u = sorted[k], v = sorted[k + 1];
        const before = wireCostOf(u) + wireCostOf(v);
        const ux = coord[u].x, vx = coord[v].x;
        coord[u].x = vx;
        coord[v].x = ux;
        if (wireCostOf(u) + wireCostOf(v) >= before) {
          coord[u].x = ux;
          coord[v].x = vx;
        } else {
          sorted[k] = v;
          sorted[k + 1] = u;
        }
      }
    }
    relaxPasses(8);
  }
  // let chains fully settle after the last swaps — a chain displaced past a
  // wide neighbor converges one row per pass, so give it room to finish
  relaxPasses(20);

  // leaf snap: a vertex with a single neighbor can always sit exactly on that
  // neighbor's settled column (its edge becomes a straight vertical), clamped
  // only by its row's spacing. Leaves influence nobody, so order is irrelevant.
  for (const row of rows) {
    for (const v of row) {
      const ns = weightedNeighbors(v);
      if (ns.length === 1) coord[v].x = coord[ns[0].w].x;
    }
    settleRow(row);
  }

  // normalize into the margins
  const allV = coord.map((_, v) => v);
  const shift = MARGIN - Math.min(...allV.map((v) => coord[v].x - vWidth[v] / 2));
  allV.forEach((v) => (coord[v].x += shift));
  const W = Math.max(480, ...allV.map((v) => coord[v].x + vWidth[v] / 2 + MARGIN));
  const H = MARGIN * 2 + depth * ROW_H + 28;

  const pos = new Map(labels.map((label, i) => [label, coord[i]]));
  const layerOf = new Map(labels.map((label, i) => [label, vLayer[i]]));
  // per link: the x/layer of each virtual vertex its edge passes through
  const routes = chains.map((chain) =>
    chain.slice(1, -1).map((d) => ({ x: coord[d].x, layer: vLayer[d] }))
  );
  // vertical midpoint of the channel between row `c` and row `c+1`
  const channelMid = (c: number) => MARGIN + c * ROW_H + ROW_H / 2;
  return { pos, layerOf, routes, channelMid, W, H };
}

/** The `map` block: every asserted relation drawn as a layered argument map
 *  with *orthogonal* edges — each route runs vertical → horizontal → vertical,
 *  arrows always enter nodes squarely from above (or below, for cycles), and
 *  every label sits horizontally on its edge's crossbar. Horizontal runs in
 *  the same channel get separate tracks so they never overlap. */
function renderMap(block: BlockView): string {
  if (block.relations.length === 0) {
    return `<figure class="relmap-figure"><p class="empty">map needs at least one relation — e.g. <code>C1 supports C2</code>.</p></figure>`;
  }

  const labels = [...new Set(block.relations.flatMap(([l, , r]) => [l, r]))];
  const { pos, layerOf, routes, channelMid, W, H } = layeredLayout(
    labels,
    block.relations.map(([from, , to]) => ({ from, to }))
  );
  const widthOf = nodeWidthOf;
  const shown = (label: string) => (label.length > 26 ? label.slice(0, 25) + "…" : label);
  const HALF_NODE = 14;

  // ---- ports: edges sharing a node's top or bottom get spread out ----------
  // so several arrows never pile onto the same point.
  type PortSide = { edge: number; towardX: number }[];
  const ports = new Map<string, PortSide>(); // key: `${label}|top` / `|bottom`
  const portKey = (label: string, side: string) => `${label}|${side}`;

  block.relations.forEach(([l, , r], i) => {
    const la = layerOf.get(l)!, lb = layerOf.get(r)!;
    if (la === lb) return; // same-row bows keep their own geometry
    const down = lb > la;
    const wps = routes[i];
    const firstX = wps.length ? wps[0].x : pos.get(r)!.x;
    const lastX = wps.length ? wps[wps.length - 1].x : pos.get(l)!.x;
    const srcSide = portKey(l, down ? "bottom" : "top");
    const dstSide = portKey(r, down ? "top" : "bottom");
    (ports.get(srcSide) ?? ports.set(srcSide, []).get(srcSide)!).push({ edge: i, towardX: firstX });
    (ports.get(dstSide) ?? ports.set(dstSide, []).get(dstSide)!).push({ edge: i, towardX: lastX });
  });

  const portX = new Map<string, number>(); // `${edge}|src` / `${edge}|dst`
  for (const [key, list] of ports) {
    const label = key.slice(0, key.lastIndexOf("|"));
    const { x } = pos.get(label)!;
    const usable = Math.max(widthOf(label) - 28, 0);
    const spread = list.length > 1 ? Math.min(24, usable / (list.length - 1)) : 0;
    list.sort((p, q) => p.towardX - q.towardX);
    list.forEach((p, j) => {
      const isSrc = block.relations[p.edge][0] === label;
      portX.set(`${p.edge}|${isSrc ? "src" : "dst"}`, x + (j - (list.length - 1) / 2) * spread);
    });
  }

  // ---- channel tracks: horizontal runs between the same two rows ------------
  // are stacked on separate y-lines (greedy interval coloring).
  type Run = { edge: number; hop: number; x1: number; x2: number };
  const channelRuns = new Map<number, Run[]>();
  const runTrackY = new Map<string, number>(); // `${edge}|${hop}` -> y

  const edgeColumns = (i: number): number[] | null => {
    const [l, , r] = block.relations[i];
    const la = layerOf.get(l)!, lb = layerOf.get(r)!;
    if (la === lb) return null;
    return [
      portX.get(`${i}|src`) ?? pos.get(l)!.x,
      ...routes[i].map((w) => w.x),
      portX.get(`${i}|dst`) ?? pos.get(r)!.x,
    ];
  };

  block.relations.forEach(([l, , r], i) => {
    const cols = edgeColumns(i);
    if (!cols) return;
    const la = layerOf.get(l)!, lb = layerOf.get(r)!;
    const step = Math.sign(lb - la);
    for (let hop = 0; hop + 1 < cols.length; hop++) {
      const channel = Math.min(la + hop * step, la + (hop + 1) * step);
      (channelRuns.get(channel) ?? channelRuns.set(channel, []).get(channel)!)
        .push({ edge: i, hop, x1: cols[hop], x2: cols[hop + 1] });
    }
  });

  const lastHopOf = (edge: number) => routes[edge].length;

  for (const [channel, runs] of channelRuns) {
    // Runs that leave the same node (fan-out) or arrive at the same node
    // (fan-in) form one group and share a single turn height — the fan reads
    // as one clean bus. A run that is both first and last hop joins whichever
    // fan is bigger. Everything else is a group of one.
    const srcCount = new Map<string, number>();
    const dstCount = new Map<string, number>();
    for (const run of runs) {
      if (run.hop === 0) {
        const s = block.relations[run.edge][0];
        srcCount.set(s, (srcCount.get(s) ?? 0) + 1);
      }
      if (run.hop === lastHopOf(run.edge)) {
        const d = block.relations[run.edge][2];
        dstCount.set(d, (dstCount.get(d) ?? 0) + 1);
      }
    }
    const keyOf = (run: Run) => {
      const src = block.relations[run.edge][0], dst = block.relations[run.edge][2];
      const s = run.hop === 0 ? srcCount.get(src) ?? 0 : 0;
      const d = run.hop === lastHopOf(run.edge) ? dstCount.get(dst) ?? 0 : 0;
      if (s === 0 && d === 0) return `edge:${run.edge}:${run.hop}`;
      return d > s ? `dst:${dst}` : `src:${src}`;
    };

    const groups = new Map<string, { runs: Run[]; lo: number; hi: number }>();
    for (const run of runs) {
      const key = keyOf(run);
      const lo = Math.min(run.x1, run.x2), hi = Math.max(run.x1, run.x2);
      const g = groups.get(key);
      if (g) { g.runs.push(run); g.lo = Math.min(g.lo, lo); g.hi = Math.max(g.hi, hi); }
      else groups.set(key, { runs: [run], lo, hi });
    }

    // Greedy interval coloring over groups: overlapping groups get
    // different tracks, disjoint ones reuse the same height.
    const ordered = [...groups.values()].sort((a, b) => a.lo - b.lo);
    const trackEnds: number[] = [];
    for (const group of ordered) {
      let t = trackEnds.findIndex((end) => group.lo > end + 18);
      if (t === -1) { t = trackEnds.length; trackEnds.push(group.hi); }
      else trackEnds[t] = Math.max(trackEnds[t], group.hi);
      for (const run of group.runs) {
        runTrackY.set(`${run.edge}|${run.hop}`, t); // track index for now
      }
    }
    for (const run of runs) {
      const t = runTrackY.get(`${run.edge}|${run.hop}`)!;
      runTrackY.set(`${run.edge}|${run.hop}`, channelMid(channel) + (t - (trackEnds.length - 1) / 2) * 13);
    }
  }

  // ---- build the orthogonal paths -------------------------------------------
  // Labels are gathered as specs (with fallback positions) and placed at the
  // end by a collision pass, so no two labels — and no label and node — overlap.
  type LabelSpec = { text: string; cls: string; x: number; anchor: "middle" | "start"; candidates: number[] };
  const labelSpecs: LabelSpec[] = [];

  const edgePaths = block.relations
    .map(([l, verb, r, status], i) => {
      const a = pos.get(l)!, b = pos.get(r)!;
      const failed = status === "fails" ? " failed" : "";
      const both = verb === "equivalent-to" ? ` marker-start="url(#dot-${verb})"` : "";
      const labelText = status === "fails" ? `${verb} ✗` : verb;
      const cls = `${verb}${failed}`;

      // Same-row neighbors connect with a bow above the row.
      if (layerOf.get(l)! === layerOf.get(r)!) {
        const x1 = a.x + Math.sign(b.x - a.x) * (widthOf(l) / 2 + 8);
        const x2 = b.x - Math.sign(b.x - a.x) * (widthOf(r) / 2 + 8);
        const y = a.y - 12;
        const mx = (x1 + x2) / 2;
        const bow = 34 + Math.abs(x2 - x1) / 12;
        const top = y - bow / 2 - 8;
        labelSpecs.push({ text: labelText, cls, x: mx, anchor: "middle", candidates: [top, top - 14, top - 28] });
        return `<path class="edge ${cls}" d="M ${x1.toFixed(1)} ${y} Q ${mx.toFixed(1)} ${(y - bow).toFixed(1)} ${x2.toFixed(1)} ${y}" marker-end="url(#arrow-${verb})"${both}/>`;
      }

      const cols = edgeColumns(i)!;
      const down = layerOf.get(r)! > layerOf.get(l)!;
      const yStart = a.y + (down ? 1 : -1) * (HALF_NODE + 2);
      const yEnd = b.y - (down ? 1 : -1) * (HALF_NODE + 8);

      const points: { x: number; y: number }[] = [{ x: cols[0], y: yStart }];
      for (let hop = 0; hop + 1 < cols.length; hop++) {
        if (Math.abs(cols[hop + 1] - cols[hop]) >= 1) {
          const ty = runTrackY.get(`${i}|${hop}`)!;
          points.push({ x: cols[hop], y: ty }, { x: cols[hop + 1], y: ty });
        }
      }
      points.push({ x: cols[cols.length - 1], y: yEnd });
      const path = "M " + points.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ");

      // Label: horizontal, preferring the widest crossbar (above it, then
      // below, then further out); a pure vertical drop hangs its label beside
      // the line, sliding along it if the spot is taken.
      let best = -1, bx = 0, by = 0;
      for (let k = 0; k + 1 < points.length; k++) {
        const w = Math.abs(points[k + 1].x - points[k].x);
        if (points[k].y === points[k + 1].y && w > best) {
          best = w;
          bx = (points[k].x + points[k + 1].x) / 2;
          by = points[k].y;
        }
      }
      if (best >= 24) {
        labelSpecs.push({ text: labelText, cls, x: bx, anchor: "middle", candidates: [by - 6, by + 13, by - 21, by + 28] });
      } else {
        const midY = (yStart + yEnd) / 2;
        labelSpecs.push({ text: labelText, cls, x: cols[0] + 8, anchor: "start", candidates: [midY, midY + 16, midY - 16, midY + 32, midY - 32] });
      }

      return `<path class="edge ${cls}" d="${path}" marker-end="url(#arrow-${verb})"${both}/>`;
    })
    .join("");

  // ---- place labels without overlaps -----------------------------------------
  // Node boxes are obstacles too, so a label never sits on a node.
  type Box = { x1: number; x2: number; y1: number; y2: number };
  const occupied: Box[] = labels.map((label) => {
    const { x, y } = pos.get(label)!;
    const w = widthOf(label);
    return { x1: x - w / 2, x2: x + w / 2, y1: y - HALF_NODE, y2: y + HALF_NODE };
  });
  const collides = (box: Box) =>
    occupied.some((b) => b.x1 < box.x2 && box.x1 < b.x2 && b.y1 < box.y2 && box.y1 < b.y2);

  const edgeLabels = labelSpecs
    .map((spec) => {
      const w = spec.text.length * 6.3;
      const x1 = spec.anchor === "middle" ? spec.x - w / 2 : spec.x;
      const boxAt = (y: number): Box => ({ x1, x2: x1 + w, y1: y - 10, y2: y + 3 });
      let y = spec.candidates[spec.candidates.length - 1];
      for (const candidate of spec.candidates) {
        if (!collides(boxAt(candidate))) { y = candidate; break; }
      }
      occupied.push(boxAt(y));
      const anchor = spec.anchor === "middle" ? ` text-anchor="middle"` : ` text-anchor="start"`;
      return `<text class="edge-label ${spec.cls}" x="${spec.x.toFixed(1)}" y="${y.toFixed(1)}"${anchor}>${escapeHtml(spec.text)}</text>`;
    })
    .join("");

  const edges = edgePaths + edgeLabels;

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

// Circle layouts and per-cell centroids for 1-, 2-, and 3-predicate diagrams.
// A cell is identified by its membership bits (bit j = inside circle j).
const VENN_W = 380;
const VENN_H = 300;
const VENN_R = 82;
const VENN_LAYOUT: Record<number, { cx: number; cy: number }[]> = {
  1: [{ cx: 190, cy: 155 }],
  2: [
    { cx: 150, cy: 155 },
    { cx: 230, cy: 155 },
  ],
  3: [
    { cx: 150, cy: 138 },
    { cx: 240, cy: 138 },
    { cx: 195, cy: 214 },
  ],
};
const VENN_CENTROIDS: Record<number, Record<string, [number, number]>> = {
  1: { "0": [190, 40], "1": [190, 155] },
  2: {
    "00": [190, 32],
    "10": [112, 155],
    "01": [268, 155],
    "11": [190, 155],
  },
  3: {
    "000": [195, 28],
    "100": [108, 112],
    "010": [282, 112],
    "001": [195, 258],
    "110": [195, 100],
    "101": [138, 188],
    "011": [252, 188],
    "111": [195, 158],
  },
};

let vennCounter = 0;

/** A categorical Venn diagram. Regions the premises force empty are shaded;
 *  regions they force occupied get a dot; named individuals are placed as
 *  labeled points in the region they must occupy. Region fills use nested
 *  clip paths (each circle contributes an inside- or outside-clip; nesting
 *  intersects them). */
function renderVenn(block: BlockView): string {
  if (block.verdict === "not-drawable") {
    return `<figure class="venn-figure"><figcaption>${escapeHtml(block.name)} — Venn diagram</figcaption><p class="empty">${escapeHtml(block.note)}</p></figure>`;
  }

  const n = block.vennCircles.length;
  const layout = VENN_LAYOUT[n];
  const centroids = VENN_CENTROIDS[n];
  const id = `v${vennCounter++}`;

  // clip paths: one "inside" and one "outside" per circle
  const circlePath = (cx: number, cy: number) =>
    `M ${cx - VENN_R} ${cy} a ${VENN_R} ${VENN_R} 0 1 0 ${2 * VENN_R} 0 a ${VENN_R} ${VENN_R} 0 1 0 ${-2 * VENN_R} 0 z`;
  const defs =
    `<pattern id="hatch-${id}" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="7" class="venn-hatch"/></pattern>` +
    layout
      .map(
        (c, j) =>
          `<clipPath id="in-${id}-${j}"><circle cx="${c.cx}" cy="${c.cy}" r="${VENN_R}"/></clipPath>` +
          `<clipPath id="out-${id}-${j}" clip-rule="evenodd"><path clip-rule="evenodd" d="M0 0 H${VENN_W} V${VENN_H} H0 Z ${circlePath(c.cx, c.cy)}"/></clipPath>`
      )
      .join("");

  // shade every empty cell by nesting one clip group per circle
  const shaded = block.vennCells
    .filter((c) => c[1] === "empty")
    .map(([bits]) => {
      let open = "";
      let close = "";
      for (let j = 0; j < n; j++) {
        const which = bits[j] === "1" ? "in" : "out";
        open += `<g clip-path="url(#${which}-${id}-${j})">`;
        close += `</g>`;
      }
      return `${open}<rect x="0" y="0" width="${VENN_W}" height="${VENN_H}" fill="url(#hatch-${id})"/>${close}`;
    })
    .join("");

  const circles = layout
    .map((c) => `<circle class="venn-circle" cx="${c.cx}" cy="${c.cy}" r="${VENN_R}"/>`)
    .join("");

  // circle labels sit just outside the top of each circle
  const labels = layout
    .map((c, j) => {
      const dx = n === 2 ? (j === 0 ? -VENN_R * 0.5 : VENN_R * 0.5) : 0;
      return `<text class="venn-label" x="${c.cx + dx}" y="${c.cy - VENN_R - 6}" text-anchor="middle">${escapeHtml(block.vennCircles[j])}</text>`;
    })
    .join("");

  const dots = block.vennCells
    .filter((c) => c[1] === "occupied")
    .map(([bits]) => {
      const [x, y] = centroids[bits] ?? [VENN_W / 2, VENN_H / 2];
      return `<circle class="venn-dot" cx="${x}" cy="${y}" r="4.5"/>`;
    })
    .join("");

  const points = block.vennPoints
    .map(([name, cellSpec]) => {
      const cells = cellSpec ? cellSpec.split("|") : [];
      if (cells.length === 0) return "";
      // average the centroids of every cell the individual might occupy
      const pts = cells.map((b) => centroids[b] ?? [VENN_W / 2, VENN_H / 2]);
      const x = pts.reduce((s, p) => s + p[0], 0) / pts.length;
      const y = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      const ambiguous = cells.length > 1 ? "?" : "";
      return `<g class="venn-point"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5"/><text x="${(x + 7).toFixed(1)}" y="${(y + 4).toFixed(1)}">${escapeHtml(name)}${ambiguous}</text></g>`;
    })
    .join("");

  return (
    `<figure class="venn-figure"><figcaption>${escapeHtml(block.name)} — Venn diagram</figcaption>` +
    `<svg class="venn" viewBox="0 0 ${VENN_W} ${VENN_H}" role="img"><defs>${defs}</defs>` +
    `${shaded}${circles}${labels}${dots}${points}</svg>` +
    `<p class="note">${escapeHtml(block.note)}</p></figure>`
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

    case "prose": {
      // Minimal inline markup, applied AFTER escaping: *word* renders emphasized.
      const text = escapeHtml(block.title).replace(/\*([^*]+)\*/g, "<em>$1</em>");
      return `<p class="prose">${text}</p>`;
    }

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
      const card = block.model.length > 0 ? renderModelCard(block.model) : "";
      // A first-order table has no truth table — just the formula, verdict, and
      // (when contingent) a model where it fails.
      const body = block.atoms.length > 0 ? renderTable(block) : card;
      const head = block.atoms.length > 0 ? "" : `<div class="fo-formula">${escapeHtml(block.formula)}</div>`;
      return `<figure class="statement"><figcaption>${verdictBadge(block.verdict)}${note}</figcaption>${head}${body}</figure>`;
    }

    case "check": {
      const note = block.note ? `<span class="note-inline">${escapeHtml(block.note)}</span>` : "";
      const card = block.model.length > 0 ? renderModelCard(block.model) : "";
      // Truth-table checks show their table; equivalence and first-order checks
      // show the formula, the verdict, and any model.
      if (block.atoms.length === 0) {
        return `<div class="check"><div><span class="formula">${escapeHtml(block.formula)}</span>${verdictBadge(block.verdict)}</div>${note}${card}</div>`;
      }
      return `<figure class="statement"><figcaption><span class="check-label">check</span> ${verdictBadge(block.verdict)}${note}</figcaption>${renderTable(block)}</figure>`;
    }

    case "argument":
      return renderArgument(block);

    case "proof":
      return renderProof(block);

    case "venn":
      return renderVenn(block);

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
