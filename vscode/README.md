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
| `// ...` | comment |

The engine is written in human-readable F#, compiled to JavaScript with Fable.
