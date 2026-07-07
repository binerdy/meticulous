// Generates the documentation site into _site/.
//
// The trick that makes these docs special: every example page is produced by
// the *real engine* — the same Fable-compiled F# core and TypeScript renderer
// the VS Code preview uses. The docs can't drift from the implementation,
// because they ARE the implementation's output, regenerated on every push.
//
// Run via `npm run build:site` in vscode/ (esbuild bundles this file first).

import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync } from "fs";
import * as path from "path";
import { analyze } from "../vscode/src/core-bridge";
import { renderDocument } from "../vscode/src/render";

const ROOT = path.join(__dirname, "..");
const EXAMPLES = path.join(ROOT, "examples");
const OUT = path.join(ROOT, "_site");

const REPO = "https://github.com/binerdy/meticulous";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function page(title: string, body: string, depth: number): string {
  const base = depth === 0 ? "." : "..";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)} · meticulous</title>
<link rel="stylesheet" href="${base}/site.css" />
</head>
<body>
<header class="site"><nav>
  <a class="brand" href="${base}/index.html">meticulous</a>
  <a href="${base}/index.html#language">language</a>
  <a href="${base}/index.html#examples">examples</a>
  <a href="${REPO}">github</a>
  <a href="${REPO}/releases/latest">install</a>
</nav></header>
<main>
${body}
</main>
<footer class="site">Rendered by the meticulous engine itself — the same F# core (via Fable)
and TypeScript renderer that power the VS Code preview.</footer>
</body>
</html>`;
}

/** First heading of a document, as its display title. */
function titleOf(source: string, fallback: string): string {
  const m = source.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

// ---- example pages ---------------------------------------------------------

mkdirSync(path.join(OUT, "examples"), { recursive: true });
copyFileSync(path.join(__dirname, "site.css"), path.join(OUT, "site.css"));

interface ExampleInfo {
  slug: string;
  title: string;
  chips: string[];
}

const examples: ExampleInfo[] = [];

for (const file of readdirSync(EXAMPLES).filter((f) => f.endsWith(".met")).sort()) {
  const slug = file.replace(/\.met$/, "");
  const source = readFileSync(path.join(EXAMPLES, file), "utf8");
  const blocks = analyze(source);
  const rendered = renderDocument(blocks);
  const title = titleOf(source, slug);

  // The form/fallacy chips this example earns — shown in the gallery.
  const chips = [
    ...new Set(
      blocks
        .filter((b) => b.kind === "argument")
        .flatMap((b) => [b.form, b.fallacy])
        .filter((c) => c !== "")
    ),
  ];
  examples.push({ slug, title, chips });

  const body = `<h1>${escapeHtml(title)}</h1>
<p><a href="${REPO}/blob/main/examples/${file}">examples/${file}</a></p>
<div class="section-label">source</div>
<pre class="source"><code>${escapeHtml(source.trim())}</code></pre>
<div class="section-label">rendered by the engine</div>
<div class="rendered">${rendered}</div>`;

  writeFileSync(path.join(OUT, "examples", `${slug}.html`), page(title, body, 1));
}

// ---- index -----------------------------------------------------------------

const gallery = examples
  .map(
    (e) =>
      `<li><a href="examples/${e.slug}.html">${escapeHtml(e.title)}` +
      (e.chips.length ? `<span class="sub">${escapeHtml(e.chips.join(" · "))}</span>` : "") +
      `</a></li>`
  )
  .join("\n");

const index = `<h1>meticulous</h1>
<p><strong>A philosophical DSL, rendered live.</strong> Write propositions, claims, and
arguments as plain text in <code>.met</code> files — meticulous computes truth tables,
checks argument validity, names the inference form (or the fallacy), derives
step-by-step proofs, and reads your formulas back in plain English.</p>

<p>The editor experience is the <strong>Meticulous</strong> VS Code extension
(publisher <code>meticulous-lang</code>): syntax highlighting plus a live preview,
<code>Ctrl+Shift+V</code>, exactly like Markdown.
<a href="${REPO}/releases/latest">Download the .vsix from the latest release</a>
and install it via <em>Extensions: Install from VSIX…</em></p>

<h2 id="language">The language in one screen</h2>

<pre class="source"><code># A heading, like Markdown          // comments use //

Plain lines are prose.

prop rain : It is raining           // an atomic proposition + its meaning
prop wet  : The ground is wet

claim C1 : rain -&gt; wet              // a named formula (words, ASCII, or ∧∨¬→↔)

table C1                            // truth table + verdict
check C1 equivalent (not rain or wet)

argument my-inference {             // checked for validity, form recognized,
  premise C1                        // proof derived, fallacies named,
  premise rain                      // missing premises suggested
  ---
  conclude wet
}

analyze                             // relate every claim to every other
</code></pre>

<h2 id="examples">The example library, rendered by the engine</h2>
<p>Every page below is generated by the actual meticulous engine at build time —
truth tables, verdict badges, recognized forms, counterexamples, and proofs are
computed, not hand-written.</p>
<ul class="gallery">
${gallery}
</ul>`;

writeFileSync(path.join(OUT, "index.html"), page("meticulous — a philosophical DSL", index, 0));

console.log(`site: ${examples.length} example pages + index written to _site/`);
