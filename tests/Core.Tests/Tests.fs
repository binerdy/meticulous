module Meticulous.Tests

open Xunit
open Meticulous.Ast
open Meticulous.Parser
open Meticulous.Engine

// A tiny helper: parse a formula or fail the test with the parse error.
let parse text =
    match parseFormula text with
    | Ok f -> f
    | Error e -> failwithf "parse failed for %A: %s" text e

let verdictOf text = (truthTable (parse text)).Verdict

// ---- Tokenizer / parser --------------------------------------------------

[<Fact>]
let ``ascii, word, and unicode operators parse to the same tree`` () =
    Assert.Equal(parse "p -> q", parse "p implies q")
    Assert.Equal(parse "p -> q", parse "p → q")
    Assert.Equal(parse "p & q", parse "p and q")
    Assert.Equal(parse "~p", parse "not p")

[<Fact>]
let ``and binds tighter than or`` () =
    // p or q and r  ==  p or (q and r)
    Assert.Equal(parse "p or q and r", Or(Atom "p", And(Atom "q", Atom "r")))

[<Fact>]
let ``implies is right associative`` () =
    // p -> q -> r  ==  p -> (q -> r)
    Assert.Equal(parse "p -> q -> r", Implies(Atom "p", Implies(Atom "q", Atom "r")))

[<Fact>]
let ``parentheses override precedence`` () =
    Assert.Equal(parse "(p or q) and r", And(Or(Atom "p", Atom "q"), Atom "r"))

[<Fact>]
let ``a malformed formula reports an error`` () =
    match parseFormula "p and" with
    | Error _ -> ()
    | Ok f -> failwithf "expected an error, got %A" f

// ---- Engine: verdicts ----------------------------------------------------

[<Fact>]
let ``excluded middle is a tautology`` () =
    Assert.Equal(Tautology, verdictOf "p or not p")

[<Fact>]
let ``contradiction is always false`` () =
    Assert.Equal(Contradiction, verdictOf "p and not p")

[<Fact>]
let ``a plain implication is contingent`` () =
    Assert.Equal(Contingent, verdictOf "p -> q")

// ---- Engine: equivalence -------------------------------------------------

[<Fact>]
let ``material implication equals not-p-or-q`` () =
    Assert.True(equivalent (parse "p -> q") (parse "not p or q"))

[<Fact>]
let ``de Morgan holds`` () =
    Assert.True(equivalent (parse "not (p and q)") (parse "not p or not q"))

[<Fact>]
let ``distinct formulas are not equivalent`` () =
    Assert.False(equivalent (parse "p and q") (parse "p or q"))

// ---- Document parser -----------------------------------------------------

[<Fact>]
let ``a document parses props, claims, and requests`` () =
    let source =
        "# Title\n\
         prop p : it rains\n\
         claim C1 : p -> p\n\
         table C1\n\
         // a comment line\n"
    match parseDocument source with
    | Error errs -> failwithf "unexpected errors: %A" errs
    | Ok doc ->
        Assert.Equal(4, List.length doc) // heading, prop, claim, table (comment/blank dropped)

[<Fact>]
let ``claim names resolve when referenced`` () =
    // C1 abbreviates a tautology; resolving the ref must reproduce it.
    let defs = Map.ofList [ "C1", parse "p or not p" ]
    Assert.Equal(Tautology, (truthTable (resolve defs (Atom "C1"))).Verdict)

// ---- Renderer: minimal parentheses ---------------------------------------

open Meticulous.Render

[<Fact>]
let ``renderer drops unnecessary parentheses`` () =
    Assert.Equal("p ∧ q → r", toUnicode (parse "(p and q) -> r"))
    Assert.Equal("p → q ∨ r", toUnicode (parse "p -> (q or r)"))
    Assert.Equal("¬(p ∧ q)", toUnicode (parse "not (p and q)"))

[<Fact>]
let ``renderer keeps parentheses that change meaning`` () =
    // left-nested implication is NOT the default grouping, so it must be kept
    Assert.Equal("(p → q) → r", toUnicode (parse "(p -> q) -> r"))
    // but the right-associative default needs none
    Assert.Equal("p → q → r", toUnicode (parse "p -> (q -> r)"))

// ---- Api: the view model handed to TypeScript -----------------------------

open Meticulous.Api

[<Fact>]
let ``analyze produces blocks with a truth table and verdict`` () =
    let blocks = analyze "claim C1 : p -> q\ntable C1\n"
    Assert.Equal(2, blocks.Length)
    let tbl = blocks |> Array.find (fun b -> b.kind = "table")
    Assert.Equal<string[]>([| "p"; "q" |], tbl.atoms)
    Assert.Equal(4, tbl.rows.Length) // 2^2 rows
    Assert.Equal("contingent", tbl.verdict)

[<Fact>]
let ``analyze reports parse errors as error blocks`` () =
    let blocks = analyze "claim Bad : p and\n"
    Assert.Equal("error", blocks.[0].kind)
    Assert.Equal(1, blocks.[0].line)
