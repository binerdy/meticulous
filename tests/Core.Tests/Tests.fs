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
let ``kebab-case names work in formulas without breaking the arrow`` () =
    Assert.Equal(
        Implies(Atom "possibly-god", Atom "necessarily-god"),
        parse "possibly-god -> necessarily-god"
    )
    // and directly glued to the arrow:
    Assert.Equal(Implies(Atom "p", Atom "q"), parse "p->q")

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

// ---- Proof mode: the engine grades user-written derivations -------------------

let private findProof doc =
    analyze doc |> Array.find (fun b -> b.kind = "proof")

[<Fact>]
let ``a correct proof checks out step by step`` () =
    let proof =
        findProof
            "proof chain {\n\
               1. premise p -> q\n\
               2. premise q -> r\n\
               3. premise p\n\
               4. q by modus-ponens from 1, 3\n\
               5. r by modus-ponens from 2, 4\n\
             }\n"
    Assert.Equal("valid", proof.verdict)
    Assert.Contains("∎", proof.note)
    Assert.Equal("ok", proof.proof.[4].[3])   // last step status
    Assert.Equal("r", proof.conclusion)

[<Fact>]
let ``citing the wrong rule names the rule it actually is`` () =
    let proof =
        findProof
            "proof oops {\n\
               1. premise p -> q\n\
               2. premise p\n\
               3. q by modus-tollens from 1, 2\n\
             }\n"
    Assert.Equal("invalid", proof.verdict)
    let step = proof.proof.[2]
    Assert.Equal("bad", step.[3])
    Assert.Contains("actually modus ponens", step.[4])

[<Fact>]
let ``a non-consequence step gets a counterexample`` () =
    let proof =
        findProof
            "proof wild {\n\
               1. premise p or q\n\
               2. q by simplification from 1\n\
             }\n"
    Assert.Equal("invalid", proof.verdict)
    Assert.Contains("counterexample", proof.proof.[1].[4])

[<Fact>]
let ``citing a fallacy as a rule is rejected by name`` () =
    let proof =
        findProof
            "proof cheeky {\n\
               1. premise p -> q\n\
               2. premise q\n\
               3. p by affirming-the-consequent from 1, 2\n\
             }\n"
    Assert.Contains("fallacy, not a rule", proof.proof.[2].[4])

[<Fact>]
let ``laws need no citations and claim references resolve in proofs`` () =
    let proof =
        findProof
            "claim C1 : p -> q\n\
             proof themed {\n\
               1. p or not p by excluded-middle\n\
               2. premise C1\n\
             }\n"
    Assert.Equal("valid", proof.verdict)
    Assert.Equal("ok", proof.proof.[0].[3])
    Assert.Equal("p → q", proof.proof.[1].[1])  // C1 expanded

[<Fact>]
let ``forward and dangling citations are caught`` () =
    let proof =
        findProof
            "proof timey {\n\
               1. premise p -> q\n\
               2. q by modus-ponens from 1, 3\n\
               3. premise p\n\
             }\n"
    Assert.Contains("doesn't exist earlier", proof.proof.[1].[4])

// ---- M5: structural relations ---------------------------------------------------

let private relationDoc =
    "prop policy : The tax cut was enacted\n\
     prop growth : The economy grew\n\
     claim A : policy -> growth\n\
     claim B : not policy or growth\n\
     claim D : policy and not growth\n\
     A equivalent-to B\n\
     A contradicts D\n\
     B entails A\n\
     A entails D\n\
     \"Voters reward growth\" supports A\n\
     map\n"

[<Fact>]
let ``formal relation assertions are verified`` () =
    let blocks = analyze relationDoc
    let rels = blocks |> Array.filter (fun b -> b.kind = "relation")
    Assert.Equal(5, rels.Length)
    Assert.Equal("holds", rels.[0].verdict)      // A equivalent-to B
    Assert.Equal("holds", rels.[1].verdict)      // A contradicts D
    Assert.Equal("holds", rels.[2].verdict)      // B entails A
    Assert.Equal("fails", rels.[3].verdict)      // A entails D — no!
    Assert.Contains("counterexample", rels.[3].note)
    Assert.Equal("asserted", rels.[4].verdict)   // informal support
    Assert.Contains("not checked", rels.[4].note)

[<Fact>]
let ``the map collects every relation with its status`` () =
    let map = analyze relationDoc |> Array.find (fun b -> b.kind = "map")
    Assert.Equal(5, map.relations.Length)
    Assert.Equal<string[]>([| "A"; "equivalent-to"; "B"; "holds" |], map.relations.[0])
    Assert.Equal("“Voters reward growth”", map.relations.[4].[0])

[<Fact>]
let ``prose sentences do not become relations`` () =
    let blocks = analyze "The engine supports many great features here.\n"
    Assert.Equal("prose", blocks.[0].kind)

[<Fact>]
let ``relations keep props counted as used, and undeclared names warn`` () =
    let warnings = lint "prop p : Something\nprop q : Other\np supports q\nghost entails p\n"
    // p and q are used (via the relation), so the only warning is `ghost`.
    let w = Assert.Single warnings
    Assert.Contains("ghost", w.message)
    Assert.Equal(4, w.line)

// ---- Modal logic: S5 ------------------------------------------------------------

[<Fact>]
let ``modal operators parse in all three spellings and render to Unicode`` () =
    Assert.Equal(parse "necessarily p", parse "[] p")
    Assert.Equal(parse "necessarily p", parse "□p")
    Assert.Equal(parse "possibly p", parse "<> p")
    Assert.Equal(parse "possibly p", parse "◇p")
    // <> must not break <-> lexing
    Assert.Equal(Iff(Atom "p", Atom "q"), parse "p <-> q")
    Assert.Equal("□p → ◇(p ∧ q)", Meticulous.Render.toUnicode (parse "[]p -> <>(p and q)"))

[<Fact>]
let ``the S5 axioms are valid and their converses are not`` () =
    let isValid text = Engine.valid (parse text)
    Assert.Equal(Some true, isValid "[]p -> p")            // T
    Assert.Equal(Some true, isValid "p -> <>p")            // T dual
    Assert.Equal(Some true, isValid "[]p -> [][]p")        // 4
    Assert.Equal(Some true, isValid "<>p -> []<>p")        // 5
    Assert.Equal(Some true, isValid "<>[]p -> []p")        // S5 collapse
    Assert.Equal(Some true, isValid "([](p -> q) and []p) -> []q") // K
    Assert.Equal(Some true, isValid "<>p <-> not [] not p")        // duality
    Assert.Equal(Some false, isValid "p -> []p")           // truth is not necessity
    Assert.Equal(Some false, isValid "<>p -> p")           // possibility is not actuality

[<Fact>]
let ``an invalid modal argument yields a countermodel with an actual world`` () =
    // possibly p ⊬ p: needs a world where p holds that isn't the actual one.
    match checkArgumentS5 [ parse "<>p" ] (parse "p") with
    | Engine.Model(worlds, actual) ->
        Assert.True(List.length worlds >= 2)
        Assert.False(worlds.[actual].["p"])                   // p fails at the actual world
        Assert.True(worlds |> List.exists (fun w -> w.["p"])) // but holds somewhere
    | other -> failwithf "expected a countermodel, got %A" other

[<Fact>]
let ``the modal ontological argument is S5-valid`` () =
    // Hartshorne: ◇g, □(g → □g) ⊢ g
    let result = checkArgumentS5 [ parse "<>god"; parse "[](god -> []god)" ] (parse "god")
    Assert.Equal(Engine.NoModel, result)

// ---- First-order logic: predicates and quantifiers ---------------------------------

[<Fact>]
let ``predicates and quantifiers parse and render`` () =
    Assert.Equal(Pred("Man", [ "socrates" ]), parse "Man(socrates)")
    Assert.Equal(Forall("x", Implies(Pred("Human", [ "x" ]), Pred("Mortal", [ "x" ]))),
                 parse "forall x. Human(x) -> Mortal(x)")   // maximal scope
    Assert.Equal(parse "forall x. P(x)", parse "∀x. P(x)")
    Assert.Equal(parse "exists x. P(x)", parse "∃x. P(x)")
    Assert.Equal("∀x. Human(x) → Mortal(x)", Meticulous.Render.toUnicode (parse "forall x. Human(x) -> Mortal(x)"))
    // a quantifier under negation keeps its parentheses
    Assert.Equal("¬(∃x. P(x))", Meticulous.Render.toUnicode (parse "not exists x. P(x)"))

[<Fact>]
let ``the Socrates syllogism is valid over finite domains`` () =
    let premises = [ parse "forall x. Human(x) -> Mortal(x)"; parse "Human(socrates)" ]
    Assert.Equal(FONoModel, checkArgumentFO premises (parse "Mortal(socrates)"))

[<Fact>]
let ``the existential fallacy is refuted with a two-element countermodel`` () =
    // ∃x.Human(x), ∃x.Mortal(x) ⊬ ∃x.(Human(x) ∧ Mortal(x))
    let premises = [ parse "exists x. Human(x)"; parse "exists x. Mortal(x)" ]
    match checkArgumentFO premises (parse "exists x. Human(x) and Mortal(x)") with
    | FOModelFound m ->
        Assert.Equal(2, m.Size)   // needs two individuals to split human from mortal
    | other -> failwithf "expected a countermodel, got %A" other

[<Fact>]
let ``quantifier duality and the drinker paradox are valid`` () =
    Assert.Equal(Some true, Engine.valid (parse "(not forall x. P(x)) <-> (exists x. not P(x))"))
    // the drinker paradox: someone is such that, if they drink, everyone drinks
    Assert.Equal(Some true, Engine.valid (parse "exists x. (Drinks(x) -> forall y. Drinks(y))"))

[<Fact>]
let ``a plainly invalid quantifier shift is caught`` () =
    // ∀x.∃y.Loves(x,y) ⊬ ∃y.∀x.Loves(x,y)   (everyone loves someone ≠ someone is loved by all)
    match checkArgumentFO [ parse "forall x. exists y. Loves(x, y)" ] (parse "exists y. forall x. Loves(x, y)") with
    | FOModelFound _ -> ()
    | other -> failwithf "expected a countermodel, got %A" other

// ---- Modal logic through the Api --------------------------------------------------

[<Fact>]
let ``a modal table becomes a world-arrangement card with an actual world`` () =
    let block = analyze "table possibly p\n" |> Array.find (fun b -> b.kind = "table")
    Assert.Equal("contingent", block.verdict)
    Assert.True(block.actual >= 0)
    Assert.True(block.rows.Length >= 1)
    Assert.Contains("arrangement", block.note)

[<Fact>]
let ``modal forms and fallacies are recognized by name`` () =
    let doc =
        "argument hartshorne-core {\n  premise possibly necessarily god\n  ---\n  conclude necessarily god\n}\n\
         argument wishful {\n  premise possibly rich\n  ---\n  conclude rich\n}\n"
    let blocks = analyze doc
    let collapse = blocks |> Array.find (fun b -> b.name = "hartshorne-core")
    Assert.Equal("valid", collapse.verdict)
    Assert.Equal("S5 collapse", collapse.form)
    let wishful = blocks |> Array.find (fun b -> b.name = "wishful")
    Assert.Equal("invalid", wishful.verdict)
    Assert.Equal("actualizing the possible", wishful.fallacy)
    Assert.True(wishful.actual >= 0)          // countermodel with a marked actual world
    Assert.False(wishful.results.[wishful.actual]) // conclusion false at the actual world

[<Fact>]
let ``the full modal ontological argument is valid through the Api`` () =
    let doc =
        "argument anselm {\n  premise possibly god\n  premise necessarily (god -> necessarily god)\n  ---\n  conclude god\n}\n"
    let arg = analyze doc |> Array.find (fun b -> b.kind = "argument")
    Assert.Equal("valid", arg.verdict)
    Assert.Contains("S5", arg.note)

[<Fact>]
let ``modal claims read back in English`` () =
    let doc = "prop god : a maximally great being exists\nclaim P : possibly god\n"
    let claim = analyze doc |> Array.find (fun b -> b.kind = "claim")
    Assert.Equal("It is possible that a maximally great being exists.", claim.note)

[<Fact>]
let ``a modal proof checks with the S5 rules`` () =
    let proof =
        findProof
            "proof hartshorne {\n\
               1. premise possibly necessarily god\n\
               2. necessarily god by s5-collapse from 1\n\
               3. god by axiom-t from 2\n\
             }\n"
    Assert.Equal("valid", proof.verdict)

// ---- First-order logic through the Api ---------------------------------------------

[<Fact>]
let ``the Socrates syllogism is valid through the Api`` () =
    let doc =
        "argument s {\n  premise forall x. Man(x) -> Mortal(x)\n  premise Man(socrates)\n  ---\n  conclude Mortal(socrates)\n}\n"
    let arg = analyze doc |> Array.find (fun b -> b.kind = "argument")
    Assert.Equal("valid", arg.verdict)

[<Fact>]
let ``an invalid FO argument shows a model card`` () =
    let doc =
        "argument e {\n  premise exists x. Human(x)\n  premise exists x. Mortal(x)\n  ---\n  conclude exists x. Human(x) and Mortal(x)\n}\n"
    let arg = analyze doc |> Array.find (fun b -> b.kind = "argument")
    Assert.Equal("invalid", arg.verdict)
    Assert.NotEmpty arg.model
    Assert.Contains(arg.model, fun line -> line.StartsWith "domain =")

[<Fact>]
let ``a FO table reports bounded validity`` () =
    let block = analyze "table forall x. P(x) -> P(x)\n" |> Array.find (fun b -> b.kind = "table")
    Assert.Equal("tautology", block.verdict)
    Assert.Contains("bounded", block.note)

[<Fact>]
let ``FO claims read back in English with the unary shorthand`` () =
    let doc = "claim S : forall x. Man(x) -> Mortal(x)\n"
    let claim = analyze doc |> Array.find (fun b -> b.kind = "claim")
    Assert.Equal("For every x, if x is Man, then x is Mortal.", claim.note)

// ---- Editor extras: catalog and lint -------------------------------------------

[<Fact>]
let ``the catalog is exposed for the editor with patterns intact`` () =
    let entries = catalog ()
    Assert.True(entries.Length >= 25)
    let mp = entries |> Array.find (fun e -> e.name = "modus-ponens")
    Assert.Equal<string[]>([| "φ → ψ"; "φ" |], mp.premises)
    Assert.Equal("ψ", mp.conclusion)
    Assert.False(mp.isFallacy)
    Assert.True(entries |> Array.exists (fun e -> e.isFallacy))

[<Fact>]
let ``lint flags props that never appear in a formula`` () =
    let warnings = lint "prop ghost : Never used\nprop p : Used\nclaim C1 : p -> p\n"
    let w = Assert.Single warnings
    Assert.Equal(1, w.line)
    Assert.Contains("ghost", w.message)

[<Fact>]
let ``lint counts a prop used only as a predicate argument`` () =
    // socrates appears in Man(socrates) / Mortal(socrates) — that IS usage.
    let warnings =
        lint "prop socrates : the philosopher\nclaim S : Man(socrates) -> Mortal(socrates)\n"
    Assert.Empty warnings

[<Fact>]
let ``a valid but unrecognized argument still explains its verdict`` () =
    // Valid, but matching no single catalog rule.
    let doc =
        "argument odd {\n  premise p and (q or p)\n  ---\n  conclude p or p\n}\n"
    let arg = analyze doc |> Array.find (fun b -> b.kind = "argument")
    Assert.Equal("valid", arg.verdict)
    Assert.Contains("no possible situation", arg.note)
