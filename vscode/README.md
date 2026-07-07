# meticulous

A philosophical DSL, rendered live. Write propositions and claims as plain text
in `.met` files — the preview shows clean logic notation, computed truth tables,
and verdicts (tautology / contradiction / contingent), so you can analyse the
structure of your thoughts the way Markdown lets you write documents.

## Features

- **Syntax highlighting** for `.met` files.
- **Live preview** (`Ctrl+Shift+V`, like Markdown) that re-renders as you type.
- **Truth tables** computed for any claim or formula, with verdict badges.
- **Equivalence checks** between formulas.
- **Arguments checked for validity** — premises over an inference line, a
  green *valid* or red *invalid* badge, and for invalid arguments the exact
  counterexample rows.
- **Fallacies named**: an invalid argument matching a classic mistake is
  labelled (*affirming the consequent*, *denying the antecedent*, …) with a
  one-line explanation.
- **Missing-premise repair**: for an invalid argument, the engine suggests the
  smallest premise that would make it valid — the hidden assumption.
- **Proofs generated**: valid arguments come with a step-by-step derivation
  (modus ponens, hypothetical syllogism, …) when one is found.
- **`analyze`**: compares every claim with every other — equivalent,
  contradictory, contrary, entails, independent — so false equivalences and
  hidden contradictions surface by themselves.
- Operators accepted three ways — words (`and`, `or`, `not`, `implies`, `iff`),
  ASCII (`&`, `|`, `~`, `->`, `<->`), or Unicode (`∧ ∨ ¬ → ↔`) — all rendered
  as real logic symbols.

## Example

```meticulous
# Rain and Wetness

prop p : It is raining
prop q : The ground is wet

claim C1 : p -> q     // renders as p → q

table C1              // truth table + verdict
check C1 equivalent (not p or q)
```

## Language

| Statement | Meaning |
| --- | --- |
| `# Heading` | section heading (`##`, `###` for deeper levels) |
| plain text | prose, rendered as a paragraph |
| `prop name : gloss` | an atomic proposition and what it means |
| `claim name : formula` | a named compound formula |
| `table X` | truth table for a claim or inline formula |
| `check A equivalent B` | are two formulas logically equivalent? |
| `argument x { premise … / --- / conclude … }` | an argument, checked for validity |
| `analyze` | relate every claim to every other claim |
| `// ...` | comment |

The engine is written in human-readable F#, compiled to JavaScript with Fable.
