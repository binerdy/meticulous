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

// ---- M3: argument validity -------------------------------------------------

[<Fact>]
let ``modus ponens is valid with no counterexamples`` () =
    let check = checkArgument [ parse "p -> q"; parse "p" ] (parse "q")
    Assert.True(check.IsValid)
    Assert.Empty(check.Counterexamples)

[<Fact>]
let ``affirming the consequent is invalid with the exact counterexample`` () =
    let check = checkArgument [ parse "p -> q"; parse "q" ] (parse "p")
    Assert.False(check.IsValid)
    // Exactly one situation breaks it: p false, q true.
    let cx = Assert.Single check.Counterexamples
    Assert.False(cx.["p"])
    Assert.True(cx.["q"])

// ---- M3: form and fallacy recognition ---------------------------------------

open Meticulous.InferenceRules
open Meticulous.Recognition

let private recognizedName forms premises conclusion =
    recognize forms (List.map parse premises) (parse conclusion)
    |> Option.map (fun f -> f.Name)

[<Fact>]
let ``recognizes modus ponens even with premises reversed`` () =
    Assert.Equal(Some "modus-ponens", recognizedName validForms [ "p"; "p -> q" ] "q")

[<Fact>]
let ``recognizes modus tollens with compound formulas`` () =
    // Metavariables must match whole formulas, not just atoms.
    Assert.Equal(
        Some "modus-tollens",
        recognizedName validForms [ "(a and b) -> c"; "not c" ] "not (a and b)"
    )

[<Fact>]
let ``names the fallacy of affirming the consequent`` () =
    Assert.Equal(
        Some "affirming-the-consequent",
        recognizedName fallacies [ "p -> q"; "q" ] "p"
    )

[<Fact>]
let ``recognizes modus tollendo ponens under its Latin name`` () =
    // Disjunctive syllogism IS modus tollendo ponens — the display shows both.
    let doc =
        "argument day-night {\n  premise day or night\n  premise not day\n  ---\n  conclude night\n}\n"
    let arg = analyze doc |> Array.find (fun b -> b.kind = "argument")
    Assert.Equal("valid", arg.verdict)
    Assert.Equal("disjunctive syllogism (modus tollendo ponens)", arg.form)

[<Fact>]
let ``recognizes modus ponendo tollens`` () =
    // Not both; the first holds; so the second fails.
    Assert.Equal(
        Some "ponendo-tollens",
        recognizedName validForms [ "not (p and q)"; "p" ] "not q"
    )

// ---- M3: proof generation ----------------------------------------------------

[<Fact>]
let ``proves a two-step chain ending in the goal`` () =
    // p -> q, q -> r, p  ⊢  r   (modus ponens twice, or via hypothetical syllogism)
    let proof =
        prove [ parse "p -> q"; parse "q -> r"; parse "p" ] (parse "r")
        |> Option.defaultValue []
    Assert.NotEmpty proof
    Assert.Equal(parse "r", (List.last proof).Formula)
    // Premises come first, derived steps refer back to earlier lines.
    Assert.Equal("premise", proof.Head.Rule)

// ---- M3: missing-premise repair ----------------------------------------------

[<Fact>]
let ``suggests the hidden premise that repairs an invalid argument`` () =
    // "p -> q, q, therefore p" silently assumes the arrow runs backwards.
    let repairs = suggestRepairs [ parse "p -> q"; parse "q" ] (parse "p")
    Assert.Contains(parse "q -> p", repairs)

// ---- M3: relations between claims ---------------------------------------------

[<Fact>]
let ``relate classifies the square of opposition`` () =
    Assert.Equal(Relation.Equivalent, relate (parse "p -> q") (parse "not p or q"))
    Assert.Equal(Relation.Contradictory, relate (parse "p") (parse "not p"))
    Assert.Equal(Relation.Entails, relate (parse "p and q") (parse "p"))
    Assert.Equal(Relation.Independent, relate (parse "p") (parse "q"))
    // (p -> q) and (q -> p) can't both fail — a subcontrary pair.
    Assert.Equal(Relation.Subcontrary, relate (parse "p -> q") (parse "q -> p"))

// ---- M3: end to end through the Api --------------------------------------------

let private argumentDoc =
    "claim C1 : p -> q\n\
     argument mp {\n\
       premise C1\n\
       premise p\n\
       ---\n\
       conclude q\n\
     }\n\
     argument oops {\n\
       premise p -> q\n\
       premise q\n\
       ---\n\
       conclude p\n\
     }\n\
     analyze\n"

[<Fact>]
let ``analyze handles argument blocks and names forms and fallacies`` () =
    let blocks = analyze argumentDoc
    let mp = blocks |> Array.find (fun b -> b.name = "mp")
    Assert.Equal("valid", mp.verdict)
    // Claim reference resolved, then recognized — shown with its Latin alias.
    Assert.Equal("modus ponens (modus ponendo ponens)", mp.form)
    Assert.NotEmpty mp.proof
    let oops = blocks |> Array.find (fun b -> b.name = "oops")
    Assert.Equal("invalid", oops.verdict)
    Assert.Equal("affirming the consequent", oops.fallacy)
    Assert.Equal(1, oops.rows.Length)          // the single counterexample
    Assert.Contains("q → p", oops.suggestion)  // the hidden assumption

[<Fact>]
let ``an unclosed argument block is one error, not a cascade`` () =
    let blocks = analyze "argument broken {\n  premise p\n"
    let errors = blocks |> Array.filter (fun b -> b.kind = "error")
    Assert.Equal(1, errors.Length)

// ---- Explanations everywhere -------------------------------------------------

open Meticulous.Render

[<Fact>]
let ``a claim reads back as an English sentence using the glosses`` () =
    let doc =
        "prop rain : It is raining\n\
         prop wet : The ground is wet\n\
         claim C1 : rain -> wet\n"
    let claim = analyze doc |> Array.find (fun b -> b.kind = "claim")
    Assert.Equal("If it is raining, then the ground is wet.", claim.note)

[<Fact>]
let ``toEnglish handles negation and missing glosses`` () =
    let glossOf = function "p" -> Some "It is raining" | _ -> None
    Assert.Equal("It is not the case that it is raining.", toEnglish glossOf (parse "not p"))
    // Unknown atoms fall back to their name.
    Assert.Equal("If q, then it is raining.", toEnglish glossOf (parse "q -> p"))

[<Fact>]
let ``a table's note explains its verdict with real counts`` () =
    let table = analyze "table p or not p\n" |> Array.find (fun b -> b.kind = "table")
    Assert.Contains("every one of the 2 possible situations", table.note)
    let contingent = analyze "table p and q\n" |> Array.find (fun b -> b.kind = "table")
    Assert.Contains("True in 1 of 4 possible situations", contingent.note)

[<Fact>]
let ``a failed equivalence check names the situation where the sides come apart`` () =
    let check = analyze "check p equivalent q\n" |> Array.find (fun b -> b.kind = "check")
    Assert.Equal("not-equivalent", check.verdict)
    Assert.Contains("They come apart when", check.note)

[<Fact>]
let ``every relation pair carries its explanation`` () =
    let doc = "claim A : p -> q\nclaim B : not p or q\nanalyze\n"
    let rel = analyze doc |> Array.find (fun b -> b.kind = "relations")
    let pair = rel.relations.[0]
    Assert.Equal(4, pair.Length)
    Assert.Contains("two phrasings of one claim", pair.[3])

[<Fact>]
let ``a premise-less argument is a theorem exactly when its conclusion is a tautology`` () =
    // Excluded middle is recognized as a named law...
    let doc = "argument theorem {\n  ---\n  conclude p or not p\n}\n"
    let arg = analyze doc |> Array.find (fun b -> b.kind = "argument")
    Assert.Equal("valid", arg.verdict)
    Assert.Equal("law of excluded middle (tertium non datur)", arg.form)
    // ...an unnamed theorem still gets the generic tautology chip...
    let generic = analyze "argument refl {\n  ---\n  conclude p -> p\n}\n" |> Array.find (fun b -> b.kind = "argument")
    Assert.Equal("valid", generic.verdict)
    Assert.Equal("tautology", generic.form)
    Assert.Contains("theorem", generic.note)
    // ...and a contingent conclusion is no theorem.
    let bad = analyze "argument nope {\n  ---\n  conclude p\n}\n" |> Array.find (fun b -> b.kind = "argument")
    Assert.Equal("invalid", bad.verdict)
    Assert.Contains("no tautology", bad.note)

[<Fact>]
let ``the catalog recognizes the replacement rules and dilemmas`` () =
    let expect name premises conclusion =
        Assert.Equal(Some name, recognizedName validForms premises conclusion)
    expect "proof-by-cases" [ "p or q"; "p -> r"; "q -> r" ] "r"
    expect "constructive-dilemma" [ "p -> q"; "r -> s"; "p or r" ] "q or s"
    expect "destructive-dilemma" [ "p -> q"; "r -> s"; "not q or not s" ] "not p or not r"
    expect "de-morgan-nand" [ "not (p and q)" ] "not p or not q"
    expect "de-morgan-nor" [ "not (p or q)" ] "not p and not q"
    expect "contraposition" [ "p -> q" ] "not q -> not p"
    expect "material-implication" [ "p -> q" ] "not p or q"
    expect "absorption" [ "p -> q" ] "p -> (p and q)"
    expect "exportation" [ "(p and q) -> r" ] "p -> (q -> r)"
    expect "exportation-rev" [ "p -> (q -> r)" ] "(p and q) -> r"

[<Fact>]
let ``contradictory premises are called out as vacuous validity`` () =
    let doc =
        "argument ex-falso {\n  premise p\n  premise not p\n  ---\n  conclude q\n}\n"
    let arg = analyze doc |> Array.find (fun b -> b.kind = "argument")
    Assert.Equal("valid", arg.verdict)
    Assert.Contains("ex falso quodlibet", arg.note)

[<Fact>]
let ``a valid but unrecognized argument still explains its verdict`` () =
    // Valid, but matching no single catalog rule.
    let doc =
        "argument odd {\n  premise p and (q or p)\n  ---\n  conclude p or p\n}\n"
    let arg = analyze doc |> Array.find (fun b -> b.kind = "argument")
    Assert.Equal("valid", arg.verdict)
    Assert.Contains("no possible situation", arg.note)
