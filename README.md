# meticulous

**A philosophical DSL, rendered live.** Write propositions, claims, and
arguments as plain text in `.met` files — meticulous computes truth tables,
checks validity, names the inference form (or the fallacy), derives proofs,
and reads your formulas back in plain English.

📖 **[Documentation & rendered examples](https://binerdy.github.io/meticulous/)** ·
📦 **[Latest release](https://github.com/binerdy/meticulous/releases/latest)**

## Why

Meticulous can help humanity by:

- **Teaching logic** — it makes learning propositional logic highly accessible
  and interactive for students and philosophers.
- **Clarifying debates** — by breaking down complex human arguments into
  explicit propositions and claims, it strips away emotion and ambiguity,
  making it easier to spot fallacies or false equivalences.
- **Promoting rationality** — any tool that encourages people to meticulously
  (hence the name!) check their assumptions and verify their reasoning
  contributes to a more rational, thoughtful society.

Better philosophical and logical reasoning leads to better decisions, which
ultimately helps us all.

## The VS Code extension: Meticulous (`meticulous-lang`)

The editor experience ships as the **Meticulous** extension, published by
**`meticulous-lang`** (extension ID `meticulous-lang.meticulous`). It gives you:

- syntax highlighting for `.met` files,
- a **live preview** (`Ctrl+Shift+V`, like Markdown) that re-renders as you type,
- every analysis below, computed as you write.

**Install:** download `meticulous-<version>.vsix` from the
[latest release](https://github.com/binerdy/meticulous/releases/latest), then in
VS Code run *Extensions: Install from VSIX…* (or
`code --install-extension meticulous-<version>.vsix`).

## A taste of the language

```meticulous
# Rain and Wetness

prop rain : It is raining
prop wet  : The ground is wet

claim C1 : rain -> wet        // renders as  rain → wet, and reads itself
                              // back: "If it is raining, then the ground is wet."

table C1                      // truth table + verdict (contingent, with counts)

check C1 equivalent (not rain or wet)   // EQUIVALENT — two phrasings of one claim
```

Operators come in three spellings — words (`and or not implies iff xor`),
ASCII (`& | ~ -> <->`), or Unicode (`∧ ∨ ¬ → ↔ ⊕`) — and all render as real
logic symbols.

### Arguments are checked, named, and explained

```meticulous
argument pundit {
  premise rain -> wet
  premise wet
  ---
  conclude rain
}
```

The engine answers: **INVALID** — recognized as the fallacy **affirming the
consequent** (*"wet may hold for other reasons — the arrow only runs one
way"*), shows the exact counterexample (`rain = F, wet = T`), and suggests the
missing premise that would repair the argument (`wet → rain` — is that what's
silently being assumed?).

Valid arguments get their form chip — modus ponens, disjunctive syllogism
(*modus tollendo ponens*), proof by cases, De Morgan's law, contraposition,
and ~26 more — plus a step-by-step derivation:

```
1. rain → wet    premise
2. rain          premise
3. wet           modus ponens (1, 2)
```

An argument with **no premises** claims a theorem: valid exactly when the
conclusion is a tautology (`law of excluded middle`, …). And contradictory
premises are called out honestly: *valid, but vacuously — ex falso quodlibet.*

### Compare every claim with every other

```meticulous
claim A : policy -> growth
claim B : not policy or growth
claim C : growth -> policy

analyze
```

`analyze` relates all claims pairwise — **A equivalent B** (a false equivalence
made visible), **A subcontrary C** (never both false) — each with a one-line
explanation. See [examples/](examples/) for the full library: one `.met` file
per classical inference form, all rendered on the
[documentation site](https://binerdy.github.io/meticulous/).

## Repository layout

| Path | What it is |
| --- | --- |
| `src/Core/` | The F# core: tokenizer, parser, truth-table engine, inference-rule catalog, recognition/proof search — compiled to JavaScript with [Fable](https://fable.io) |
| `src/Cli/` | Command-line runner: `dotnet run --project src/Cli -- examples/rain.met` |
| `vscode/` | The Meticulous VS Code extension (TypeScript renderer + preview) |
| `examples/` | The example library — one file per inference form and law |
| `tests/` | xUnit test suite for the core |

## Building

```bash
dotnet test                 # F# core tests
cd vscode
npm ci
npm run compile             # Fable (F# → JS) + esbuild bundle
npx vsce package            # produce the .vsix
```

Releases are automated: bump `version` in `vscode/package.json`, merge to
`main`, and CI tests, tags, and publishes the `.vsix` to GitHub Releases
(see [RELEASING.md](RELEASING.md)).
