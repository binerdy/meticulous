// The meticulous playground: type on the left, the engine answers on the right.
//
// This is the exact same pipeline as the VS Code preview — the Fable-compiled
// F# core (analyze) and the TypeScript renderer (renderDocument) — running
// entirely in the browser. No server anywhere.

import { analyze } from "../vscode/src/core-bridge";
import { renderDocument } from "../vscode/src/render";

declare global {
  interface Window {
    METICULOUS_EXAMPLES: { slug: string; title: string; source: string }[];
  }
}

const DEFAULT_SOURCE = `# Welcome to meticulous

Type on the left; the engine reasons on the right.

prop rain : It is raining
prop wet  : The ground is wet

claim C1 : rain -> wet

table C1

argument try-me {
  premise C1
  premise wet
  ---
  conclude rain
}

// ^ change 'premise wet' to 'premise rain' and 'conclude rain'
//   to 'conclude wet' — watch the fallacy chip turn into a proof.

analyze
`;

const input = document.getElementById("input") as HTMLTextAreaElement;
const output = document.getElementById("output") as HTMLElement;
const picker = document.getElementById("example-picker") as HTMLSelectElement;
const shareButton = document.getElementById("share") as HTMLButtonElement;

// ---- share links: the whole document travels in the URL hash ----------------

function encodeSource(source: string): string {
  const bytes = new TextEncoder().encode(source);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function decodeSource(hash: string): string | null {
  try {
    const binary = atob(hash);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

// ---- rendering ---------------------------------------------------------------

let debounce: ReturnType<typeof setTimeout> | undefined;

function render() {
  try {
    output.innerHTML = renderDocument(analyze(input.value));
  } catch (err) {
    output.innerHTML = `<div class="error">Renderer failed: ${String(err)}</div>`;
  }
  history.replaceState(null, "", "#" + encodeSource(input.value));
}

function scheduleRender() {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(render, 150);
}

input.addEventListener("input", scheduleRender);

// Tab inserts two spaces instead of leaving the editor.
input.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    const { selectionStart, selectionEnd, value } = input;
    input.value = value.slice(0, selectionStart) + "  " + value.slice(selectionEnd);
    input.selectionStart = input.selectionEnd = selectionStart + 2;
    scheduleRender();
  }
});

// ---- example picker ------------------------------------------------------------

for (const example of window.METICULOUS_EXAMPLES) {
  const option = document.createElement("option");
  option.value = example.slug;
  option.textContent = example.title;
  picker.appendChild(option);
}

picker.addEventListener("change", () => {
  const chosen = window.METICULOUS_EXAMPLES.find((e) => e.slug === picker.value);
  if (chosen) {
    input.value = chosen.source;
    render();
  }
});

// ---- share button ---------------------------------------------------------------

shareButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(location.href);
  const original = shareButton.textContent;
  shareButton.textContent = "copied!";
  setTimeout(() => (shareButton.textContent = original), 1500);
});

// ---- boot -----------------------------------------------------------------------

const fromHash = location.hash.length > 1 ? decodeSource(location.hash.slice(1)) : null;
input.value = fromHash ?? DEFAULT_SOURCE;
render();
