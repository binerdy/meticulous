namespace Meticulous

open Meticulous.Ast
open Meticulous.Parser
open Meticulous.Engine
open Meticulous.InferenceRules
open Meticulous.Recognition
open Meticulous.Render

/// The single entry point the outside world (the TypeScript renderer, via
/// Fable) calls. `analyze` turns source text into a flat array of "block views"
/// — plain records of strings, arrays, and bools that survive the trip to
/// JavaScript cleanly (no F# unions or options across the boundary).
module Api =

    /// One rendered block. Every field always exists; which ones are meaningful
    /// depends on `kind`. This flat shape is deliberately JS-friendly.
    ///   kind = "heading"   -> level, title
    ///   kind = "prose"     -> title (the text)
    ///   kind = "prop"      -> name, gloss
    ///   kind = "claim"     -> name, formula
    ///   kind = "table"     -> formula, atoms, rows, results, verdict
    ///   kind = "check"     -> formula, verdict (+ table fields for verdict checks)
    ///   kind = "argument"  -> name, premises, conclusion, verdict (valid/invalid),
    ///                         form/fallacy + note, proof (when valid),
    ///                         atoms/rows/results = counterexamples (when invalid),
    ///                         suggestion = missing premises that would repair it
    ///   kind = "relations" -> relations (from `analyze`: [left, relation, right])
    ///   kind = "error"     -> line, title (the message)
    type BlockView =
        { kind: string
          level: int
          title: string
          name: string
          gloss: string
          formula: string
          verdict: string
          atoms: string[]
          rows: bool[][]
          results: bool[]
          subHeaders: string[] // extra columns between atoms and result: subformulas (tables) or premises (counterexamples)
          subRows: bool[][]    // their values, row by row (parallel to rows)
          actual: int          // for modal blocks: which row is the actual world (-1 = not modal)
          line: int
          premises: string[]
          conclusion: string
          form: string
          fallacy: string
          note: string
          suggestion: string[]
          proof: string[][]      // one step: [number; formula; justification]
          relations: string[][]  // one pair: [left; relation; right]
          model: string[]        // first-order (counter)model description, line by line
          vennCircles: string[]  // predicate names, one circle each
          vennCells: string[][]  // one region: [membership-bits; "empty"|"occupied"|"free"]
          vennPoints: string[][] } // one individual: [name; pipe-joined cell bit-strings]

    /// A blank block we copy-and-tweak, so each branch only sets what it needs.
    let private empty =
        { kind = ""
          level = 0
          title = ""
          name = ""
          gloss = ""
          formula = ""
          verdict = ""
          atoms = [||]
          rows = [||]
          results = [||]
          subHeaders = [||]
          subRows = [||]
          actual = -1
          line = 0
          premises = [||]
          conclusion = ""
          form = ""
          fallacy = ""
          note = ""
          suggestion = [||]
          proof = [||]
          relations = [||]
          model = [||]
          vennCircles = [||]
          vennCells = [||]
          vennPoints = [||] }

    let private verdictName =
        function
        | Tautology -> "tautology"
        | Contradiction -> "contradiction"
        | Contingent -> "contingent"

    let private relationName =
        function
        | Relation.Equivalent -> "equivalent"
        | Relation.Contradictory -> "contradictory"
        | Relation.Contrary -> "contrary"
        | Relation.Subcontrary -> "subcontrary"
        | Relation.Entails -> "entails"
        | Relation.EntailedBy -> "entailed-by"
        | Relation.Independent -> "independent"

    /// Explain a verdict in plain words, with the actual counts, so a table
    /// teaches what its badge means.
    let private verdictNote (t: TruthTable) =
        let total = List.length t.Rows
        let trues = t.Rows |> List.filter snd |> List.length
        match t.Verdict with
        | Tautology ->
            sprintf "True in every one of the %d possible situations — it cannot fail, whatever the facts." total
        | Contradiction ->
            sprintf "False in every one of the %d possible situations — it cannot hold, whatever the facts." total
        | Contingent ->
            sprintf "True in %d of %d possible situations — whether it holds depends on the facts." trues total

    /// Build a full table view (columns, rows, verdict) for a formula —
    /// textbook style: one column per compound subformula, so the truth value
    /// visibly builds up from the atoms to the whole formula.
    let private tableBlock (f: Formula) =
        let t = truthTable f
        let subs = subformulasFor f |> List.filter (fun s -> s <> f)
        { empty with
            kind = "table"
            formula = toUnicode f
            atoms = List.toArray t.Atoms
            rows = t.Rows |> List.map (fun (env, _) -> t.Atoms |> List.map (fun a -> env.[a]) |> List.toArray) |> List.toArray
            results = t.Rows |> List.map snd |> List.toArray
            subHeaders = subs |> List.map toUnicode |> List.toArray
            subRows =
                t.Rows
                |> List.map (fun (env, _) -> subs |> List.map (eval env) |> List.toArray)
                |> List.toArray
            verdict = verdictName t.Verdict
            note = verdictNote t }

    /// The message used whenever an S5 search had to give up. Rare — it takes
    /// many atoms × modal operators — but honesty beats guessing.
    let private tooLargeNote =
        "Too many atoms and modal operators to check exhaustively — the engine won't guess."

    /// The verdict card for a *modal* formula: no truth table can capture □/◇,
    /// so the verdict comes from the S5 model search, and a contingent formula
    /// shows the arrangement of possible worlds where it fails (→ marks the
    /// actual world).
    let private modalBlock (kindName: string) (f: Formula) =
        let base' =
            { empty with kind = kindName; formula = toUnicode f }
        match s5Satisfy (Not f), s5Satisfy f with
        | NoModel, _ ->
            { base' with
                verdict = "tautology"
                note = "Necessarily true: it holds at every world of every possible arrangement of worlds." }
        | _, NoModel ->
            { base' with
                verdict = "contradiction"
                note = "Impossible: it fails at every world of every possible arrangement of worlds." }
        | TooLarge, _ | _, TooLarge ->
            { base' with verdict = "unknown"; note = tooLargeNote }
        | Model(worlds, actual), _ ->
            let names = atoms f
            { base' with
                verdict = "contingent"
                note =
                    "Contingent: its truth depends on the facts and on how the possibilities are arranged — here is an arrangement where it fails at the actual world."
                atoms = List.toArray names
                rows =
                    worlds
                    |> List.map (fun w -> names |> List.map (fun a -> Map.tryFind a w |> Option.defaultValue false) |> List.toArray)
                    |> List.toArray
                results = worlds |> List.map (fun w -> evalS5 worlds w f) |> List.toArray
                actual = actual }

    /// A categorical Venn diagram: which regions the premises force empty or
    /// occupied, and where each named individual must sit. Only one-place
    /// predicates can be drawn (1–3 of them); anything else declines gracefully.
    let private vennBlock (defs: Map<string, Formula>) (name: string) (premises: Formula list) (conclusion: Formula option) =
        let rp = premises |> List.map (resolve defs)
        let rc = conclusion |> Option.map (resolve defs)
        let premiseConj = match rp with [] -> Const true | _ -> List.reduce (fun a b -> And(a, b)) rp
        // circles and individuals are taken from premises AND conclusion
        let scope = match rc with Some c -> And(premiseConj, c) | None -> premiseConj
        let arities = predicateArities scope
        let preds = arities |> List.map fst

        let notDrawable why =
            { empty with kind = "venn"; name = name; verdict = "not-drawable"; note = why }

        let unaryCount = arities |> List.filter (fun (_, k) -> k = 1) |> List.length

        if arities |> List.exists (fun (_, k) -> k >= 2) then
            notDrawable "A Venn diagram needs one-place predicates (properties like Man(x)); this argument uses a relation (a two-or-more-place predicate), which a Venn diagram can't picture."
        elif arities |> List.exists (fun (_, k) -> k = 0) then
            notDrawable "A Venn diagram pictures categorical statements about one-place predicates like Man(x). This argument is propositional (or modal) — try a truth table or a proof instead."
        elif unaryCount = 0 then
            notDrawable "A Venn diagram needs at least one one-place predicate, e.g. Man(x)."
        elif unaryCount > 3 then
            notDrawable (sprintf "Venn diagrams are drawn for up to 3 one-place predicates; this uses %d." unaryCount)
        else
            let consts = individuals scope
            let a = analyzeMonadic preds consts premiseConj
            let bits cell = System.String(Array.init (List.length preds) (fun j -> if (cell >>> j) &&& 1 = 1 then '1' else '0'))
            let statusName = function CellEmpty -> "empty" | CellOccupied -> "occupied" | CellFree -> "free"

            let cells =
                a.Cells
                |> Map.toList
                |> List.map (fun (cell, status) -> [| bits cell; statusName status |])

            let points =
                consts
                |> List.map (fun c ->
                    let cellsFor = Map.tryFind c a.Placement |> Option.defaultValue Set.empty |> Set.toList
                    [| c; cellsFor |> List.map bits |> String.concat "|" |])

            // optional conclusion check reuses the first-order engine
            let conclusionNote =
                match rc with
                | None -> ""
                | Some c ->
                    match checkArgumentFO rp c with
                    | FONoModel -> sprintf "  The conclusion (%s) is already forced by the premises — the argument is valid." (toUnicode c)
                    | FOModelFound _ -> sprintf "  The conclusion (%s) is NOT forced — there is a model of the premises where it fails." (toUnicode c)
                    | FOTooLarge -> ""

            let baseNote =
                if not a.Consistent then "These premises can't all hold at once — no diagram satisfies them."
                else "Shaded regions are empty; a dot marks a region the premises guarantee is occupied."

            { empty with
                kind = "venn"
                name = name
                verdict = if a.Consistent then "consistent" else "contradiction"
                note = baseNote + conclusionNote
                vennCircles = List.toArray preds
                vennCells = List.toArray cells
                vennPoints = List.toArray points }

    /// The classical square of opposition for subject S and predicate P: the
    /// four categorical corners A/E/I/O with every edge *computed* — "holds"
    /// outright in modern logic, "aristotle" when it needs existential import
    /// (at least one S), or "fails".
    let private squareBlock (rawS: string) (rawP: string) =
        // the engine reasons over normalized terms; the display keeps yours
        let s = Prose.normalizeTerm rawS
        let p = Prose.normalizeTerm rawP
        let sx = Pred(s, [ "x" ])
        let px = Pred(p, [ "x" ])
        let cornerA = Forall("x", Implies(sx, px))          // All S are P
        let cornerE = Forall("x", Implies(sx, Not px))      // No S are P
        let cornerI = Exists("x", And(sx, px))              // Some S are P
        let cornerO = Exists("x", And(sx, Not px))          // Some S are not P

        let holds f = valid f = Some true
        let withImport f = holds (Implies(Exists("x", sx), f))
        let status f =
            if holds f then "holds"
            elif withImport f then "aristotle"
            else "fails"

        let edges =
            [ [| "A"; "contraries"; "E"; status (Not(And(cornerA, cornerE))) |]
              [| "I"; "subcontraries"; "O"; status (Or(cornerI, cornerO)) |]
              [| "A"; "contradictories"; "O"; status (Iff(cornerA, Not cornerO)) |]
              [| "E"; "contradictories"; "I"; status (Iff(cornerE, Not cornerI)) |]
              [| "A"; "subalternation"; "I"; status (Implies(cornerA, cornerI)) |]
              [| "E"; "subalternation"; "O"; status (Implies(cornerE, cornerO)) |] ]

        { empty with
            kind = "square"
            vennCircles = [| rawS; rawP |]
            premises = [| cornerA; cornerE; cornerI; cornerO |] |> Array.map toUnicode
            relations = List.toArray edges
            note =
                sprintf
                    "Solid edges hold in modern logic; dashed amber edges hold only under Aristotle's *existential import* — the silent assumption that at least one %s exists. Only the contradictory diagonals survive without it."
                    s }

    /// The verdict card for a *first-order* formula. No truth table can capture
    /// quantifiers, so the verdict comes from the finite-model search, and a
    /// contingent formula shows a small model where it fails.
    let private foFormulaBlock (kindName: string) (f: Formula) =
        let base' = { empty with kind = kindName; formula = toUnicode f }
        let card search = match search with FOModelFound m -> Engine.describeModel m f |> List.toArray | _ -> [||]
        // A quantified statement has no finite truth table, so instead of a grid
        // we always show a concrete model: a witnessing one when it holds, or a
        // falsifying one when it can fail.
        match foSatisfy (Not f), foSatisfy f with
        | FONoModel, witness ->
            { base' with
                verdict = "tautology"
                note = "A quantified statement has no truth table. It is valid — true in every model checked (a bounded check, domains up to size 4). Here is one such model, where it holds as it does everywhere:"
                model = card witness }
        | _, FONoModel ->
            { base' with
                verdict = "contradiction"
                note = "A quantified statement has no truth table. It is unsatisfiable: false in every model checked (domains up to size 4)." }
        | FOTooLarge, _ | _, FOTooLarge ->
            { base' with verdict = "unknown"; note = tooLargeNote }
        | FOModelFound falsifying, _ ->
            { base' with
                verdict = "contingent"
                note = "A quantified statement has no truth table. Its truth depends on the domain and interpretation — here is a model where it is false:"
                model = card (FOModelFound falsifying) }

    /// Describe an assignment in words: "policy is true and growth is false".
    let private describeSituation (env: Map<string, bool>) =
        env
        |> Map.toList
        |> List.map (fun (name, value) -> sprintf "%s is %s" name (if value then "true" else "false"))
        |> String.concat " and "

    /// One proof step as display strings: number, formula, justification.
    let private proofRow (index: int) (step: ProofStep) : string[] =
        let justification =
            if List.isEmpty step.Refs then step.Rule
            else step.Rule + " (" + (step.Refs |> List.map string |> String.concat ", ") + ")"
        [| string (index + 1); toUnicode step.Formula; justification |]

    /// Analyse one argument: validity by truth table (classical) or S5 model
    /// search (modal), then — depending on the outcome — either a derivation,
    /// or counterexamples/countermodel plus diagnosis.
    let private argumentBlock (defs: Map<string, Formula>) (glosses: Map<string, string>) (name: string) premises conclusion =
        let rp = premises |> List.map (resolve defs)
        let rc = resolve defs conclusion
        let fo = List.exists containsFO (rc :: rp)
        let modal = not fo && List.exists containsModal (rc :: rp)

        // isValid/unknown plus, when invalid, the refuting situation: classical
        // rows (many), a modal countermodel with its actual world, or a
        // first-order model card.
        let isValid, unknown, cxAtoms, cxRows, cxActual, cxModel =
            if fo then
                match checkArgumentFO rp rc with
                | FONoModel -> true, false, [], [], -1, []
                | FOTooLarge -> false, true, [], [], -1, []
                | FOModelFound m ->
                    let together = List.fold (fun acc p -> And(acc, p)) (Not rc) rp
                    false, false, [], [], -1, Engine.describeModel m together
            elif modal then
                match checkArgumentS5 rp rc with
                | NoModel -> true, false, [], [], -1, []
                | TooLarge -> false, true, [], [], -1, []
                | Model(worlds, actual) ->
                    let names = rp @ [ rc ] |> List.collect atoms |> List.distinct
                    false, false, names, worlds, actual, []
            else
                let check = checkArgument rp rc
                check.IsValid, false, check.Atoms, check.Counterexamples, -1, []

        let recognized =
            if unknown then None
            elif isValid then recognize validForms rp rc
            else
                // An invalid argument may be a named fallacy — or one of the four
                // Aristotelian moods that need existential import: recognized,
                // named, and honestly refuted.
                match recognize fallacies rp rc with
                | Some f -> Some f
                | None -> recognize existentialImportForms rp rc

        // A form is shown with its traditional alias when it has one,
        // e.g. "disjunctive syllogism (modus tollendo ponens)".
        let displayTitle (form: ArgumentForm) =
            if form.Aka = "" then form.Title
            else form.Title + " (" + form.Aka + ")"

        // Proof search and missing-premise repair are propositional machinery;
        // they honestly stay out of modal and first-order arguments.
        let proofSteps =
            if isValid && not modal && not fo then prove rp rc |> Option.defaultValue [] else []

        let repairs =
            if isValid || unknown || modal || fo then [] else suggestRepairs rp rc

        // Can the premises all hold at once? If not, the argument is valid only
        // *vacuously* — a situation worth naming, not hiding behind a green badge.
        let premisesConsistent =
            match rp with
            | [] -> true
            | _ ->
                let together = List.reduce (fun a b -> And(a, b)) rp
                if fo then foSatisfy together <> FONoModel
                elif modal then s5Satisfy together <> NoModel
                else (truthTable together).Verdict <> Contradiction

        // Every argument gets an explanation: the catalog's note when the shape
        // is recognized, otherwise a plain statement of what the verdict means.
        let explanation =
            if unknown then tooLargeNote
            elif List.isEmpty rp then
                if isValid then
                    match recognized with
                    | Some form -> form.Note
                    | None when fo ->
                        "A theorem: the conclusion holds in every model checked (domains up to size 4) — provable from no premises at all."
                    | None when modal ->
                        "A theorem of S5: the conclusion holds at every world of every arrangement — provable from no premises at all."
                    | None ->
                        "A theorem: the conclusion holds in every possible situation — a tautology, provable from no premises at all."
                elif fo then
                    "Not a theorem: there is a model where the conclusion fails."
                elif modal then
                    "Not a theorem: there is an arrangement of possible worlds where the conclusion fails."
                else
                    sprintf "Not a theorem: the conclusion fails in %d situation(s), so it is no tautology."
                        (List.length cxRows)
            elif isValid && not premisesConsistent then
                "Valid, but vacuously so: the premises contradict one another and can never all hold — and from a contradiction, anything follows (ex falso quodlibet)."
            else
                match recognized with
                | Some form -> form.Note
                | None ->
                    if isValid && fo then
                        "Valid: no model (over domains up to size 4) makes every premise true and the conclusion false. First-order validity is undecidable, so this is a bounded check."
                    elif isValid && modal then
                        "Valid in S5: no arrangement of possible worlds makes every premise true at the actual world while the conclusion fails there."
                    elif isValid then
                        "Valid: no possible situation makes every premise true and the conclusion false."
                    elif fo then
                        "Invalid: here is a model where every premise holds but the conclusion fails."
                    elif modal then
                        "Invalid in S5: there is an arrangement of possible worlds where every premise holds at the actual world while the conclusion fails there."
                    else
                        sprintf "Invalid: %d situation(s) make every premise true while the conclusion fails."
                            (List.length cxRows)

        // Narrate the first counterexample — a concrete story beats an abstract
        // row — whether or not the fallacy was recognized by name.
        let explanation =
            if isValid || unknown || fo || modal then explanation
            else
                match cxRows with
                | env :: _ ->
                    let reading =
                        (toEnglish (fun n -> Map.tryFind n glosses) rc).TrimEnd('.')
                    explanation
                    + sprintf " Picture the situation where %s: every premise holds — the columns show it — and yet “%s” fails."
                        (describeSituation env) reading
                | [] -> explanation

        // The chip next to the verdict: a recognized form's name, or — for a
        // premise-less theorem no law accounts for — the plain label "tautology".
        // Aristotelian existential-import moods get their name even though the
        // verdict is invalid: that pairing IS the lesson.
        let formLabel =
            match recognized with
            | Some f when isValid -> displayTitle f
            | Some f when f.Kind = ExistentialImportForm -> displayTitle f
            | _ -> if isValid && List.isEmpty rp then "tautology" else ""

        { empty with
            kind = "argument"
            name = name
            premises = rp |> List.map toUnicode |> List.toArray
            conclusion = toUnicode rc
            verdict = if unknown then "unknown" elif isValid then "valid" else "invalid"
            form = formLabel
            fallacy =
                (match recognized with
                 | Some f when not isValid && not unknown && f.Kind = FallacyForm -> Some(displayTitle f)
                 | _ -> None)
                |> Option.defaultValue ""
            note = explanation
            suggestion = repairs |> List.map toUnicode |> List.toArray
            proof = proofSteps |> List.mapi proofRow |> List.toArray
            // For invalid arguments the table fields carry the refutation:
            // classical counterexample rows, or the worlds of one countermodel
            // (with `actual` marking where truth was judged).
            atoms = List.toArray cxAtoms
            rows =
                cxRows
                |> List.map (fun env ->
                    cxAtoms |> List.map (fun a -> Map.tryFind a env |> Option.defaultValue false) |> List.toArray)
                |> List.toArray
            results =
                if cxActual >= 0 then cxRows |> List.map (fun w -> evalS5 cxRows w rc) |> List.toArray
                else cxRows |> List.map (fun _ -> false) |> List.toArray
            // one column per premise, so the row visibly shows every premise
            // true (at the actual world, for modal countermodels)
            subHeaders = rp |> List.map toUnicode |> List.toArray
            subRows =
                cxRows
                |> List.map (fun env ->
                    rp
                    |> List.map (fun p -> if cxActual >= 0 then evalS5 cxRows env p else eval env p)
                    |> List.toArray)
                |> List.toArray
            actual = cxActual
            model = List.toArray cxModel }

    /// Check a user-written proof line by line. Each derived step must
    /// genuinely follow from the lines it cites, *by the rule it names* —
    /// this is where the engine grades your reasoning rather than doing it.
    let private proofBlock (defs: Map<string, Formula>) (name: string) (lines: ProofLine list) =
        // Formulas established so far, by line number. A failed step is still
        // recorded, so one mistake doesn't cascade into every later citation.
        let mutable known: Map<int, Formula> = Map.empty
        let mutable allOk = true
        let rows = ResizeArray<string[]>()

        // How the justification reads in the output, e.g. "modus ponens (1, 2)".
        let justify (title: string) refs =
            if List.isEmpty refs then title
            else title + " (" + (refs |> List.map string |> String.concat ", ") + ")"

        for line in lines do
            match line with
            | ProofPremise(n, f) ->
                let rf = resolve defs f
                if Map.containsKey n known then
                    allOk <- false
                    rows.Add [| string n; toUnicode rf; "premise"; "bad"; sprintf "line number %d is used twice" n |]
                else
                    known <- Map.add n rf known
                    rows.Add [| string n; toUnicode rf; "premise"; "premise"; "" |]

            | ProofDerived(n, f, ruleName, refs) ->
                let rf = resolve defs f
                let duplicate = Map.containsKey n known
                // A citation is valid only if that line already exists above us.
                let missing = refs |> List.filter (fun r -> not (Map.containsKey r known))
                // Rules can be cited naturally — "by modus ponens", "by modus
                // tollendo ponens", "by Barbara" — or in kebab-case. Everything
                // is normalized (lowercase, parens dropped, spaces → hyphens)
                // and matched against each form's name, title, and alias.
                let normalizeRule (s: string) =
                    s.Trim().ToLowerInvariant().Replace("(", "").Replace(")", "")
                        .Split([| ' '; '-' |], System.StringSplitOptions.RemoveEmptyEntries)
                    |> String.concat "-"
                let wanted = normalizeRule ruleName
                let form =
                    forms
                    |> List.tryFind (fun fm ->
                        fm.Name = wanted
                        || normalizeRule fm.Title = wanted
                        || (fm.Aka <> "" && normalizeRule fm.Aka = wanted))

                // Work out the step's verdict and, when it fails, the most
                // helpful thing we can say about *why*.
                let status, message, displayTitle =
                    if duplicate then
                        "bad", sprintf "line number %d is used twice" n, ruleName
                    elif not (List.isEmpty missing) then
                        "bad", sprintf "cites line %d, which doesn't exist earlier in the proof" (List.head missing), ruleName
                    else
                        match form with
                        | None ->
                            "bad", sprintf "unknown rule '%s' — write it naturally (by modus ponens) or kebab-case (by modus-ponens); Latin aliases work too" ruleName, ruleName
                        | Some fm when fm.Kind = FallacyForm ->
                            "bad", sprintf "'%s' is a fallacy, not a rule — it cannot justify a step" fm.Title, fm.Title
                        | Some fm when fm.Kind = ExistentialImportForm ->
                            "bad",
                            sprintf "'%s' holds only under Aristotle's existential import (that the classes aren't empty) — modern logic rejects this step" fm.Title,
                            fm.Title
                        | Some fm ->
                            let cited = refs |> List.map (fun r -> known.[r])
                            if List.length fm.Premises <> List.length cited then
                                "bad",
                                sprintf "%s needs %d cited line(s) after `from`, got %d" fm.Title (List.length fm.Premises) (List.length cited),
                                fm.Title
                            elif checkStep fm cited rf then
                                "ok", "", fm.Title
                            else
                                // The step is wrong as justified. Diagnose in tiers:
                                // is it a different rule? valid but ruleless? or
                                // not even a consequence?
                                match recognize validForms cited rf with
                                | Some actual ->
                                    "bad", sprintf "this step doesn't match %s — it is actually %s (%s)" fm.Title actual.Title actual.Note, fm.Title
                                | None when List.exists containsModal (rf :: cited) ->
                                    match checkArgumentS5 cited rf with
                                    | NoModel ->
                                        "bad", sprintf "it does follow from the cited lines (S5), but not by %s — and no single catalog rule derives it in one step" fm.Title, fm.Title
                                    | Model _ ->
                                        "bad", "it does not follow from the cited lines at all — some arrangement of possible worlds makes them true and this false", fm.Title
                                    | TooLarge -> "bad", tooLargeNote, fm.Title
                                | None ->
                                    let semantic = checkArgument cited rf
                                    if semantic.IsValid then
                                        "bad", sprintf "it does follow from the cited lines, but not by %s — and no single catalog rule derives it in one step" fm.Title, fm.Title
                                    else
                                        "bad",
                                        sprintf "it does not follow from the cited lines at all — counterexample: %s" (describeSituation (List.head semantic.Counterexamples)),
                                        fm.Title

                if status = "bad" then allOk <- false
                if not duplicate then known <- Map.add n rf known
                rows.Add [| string n; toUnicode rf; justify displayTitle refs; status; message |]

        { empty with
            kind = "proof"
            name = name
            verdict = if allOk then "valid" else "invalid"
            note =
                if allOk then
                    "Every step checks out — the conclusion follows from the premises. ∎"
                else
                    "The first ✗ step is where the chain breaks — repair it and the proof may go through."
            conclusion =
                lines
                |> List.tryLast
                |> Option.map (fun l -> toUnicode (resolve defs (match l with ProofPremise(_, f) | ProofDerived(_, f, _, _) -> f)))
                |> Option.defaultValue ""
            proof = rows.ToArray() }

    /// Everything worth saying about one asserted relation: how its two ends
    /// display, whether the engine could check it, and with what outcome.
    /// `status` is "holds" / "fails" (formal, checked) or "asserted" (informal
    /// or involving an unformalized statement).
    let private relationInfo
        (defs: Map<string, Formula>)
        (glosses: Map<string, string>)
        (left: RelRef)
        (kind: RelationKind)
        (right: RelRef)
        =
        let display = function Named n -> n | Quoted s -> "“" + s + "”"

        // A ref has a formula only when it names a declared claim or prop.
        let formulaOf ref =
            match ref with
            | Named n when Map.containsKey n defs || Map.containsKey n glosses ->
                Some(resolve defs (Atom n))
            | _ -> None

        let verb =
            match kind with
            | Supports -> "supports"
            | Presupposes -> "presupposes"
            | Contradicts -> "contradicts"
            | Entails -> "entails"
            | EquivalentTo -> "equivalent-to"

        let status, note =
            match kind, formulaOf left, formulaOf right with
            | (Supports | Presupposes), _, _ ->
                "asserted", "an informal relation — asserted by you, recorded but not checked by the engine"
            | _, Some a, Some b ->
                let classical = not (containsModal a || containsModal b || containsFO a || containsFO b)
                let checkFormal (f: Formula) (holdsNote: string) (failsNote: unit -> string) =
                    match valid f with
                    | Some true -> "holds", holdsNote
                    | Some false -> "fails", failsNote ()
                    | None -> "asserted", tooLargeNote
                match kind with
                | Entails ->
                    checkFormal (Implies(a, b)) "verified: whenever the first holds, so does the second" (fun () ->
                        if classical then
                            let cx = (checkArgument [ a ] b).Counterexamples |> List.head
                            sprintf "does not hold — counterexample: %s" (describeSituation cx)
                        else "does not hold — it fails in some situation the engine found")
                | Contradicts ->
                    checkFormal (Not(And(a, b))) "verified: they can never both be true" (fun () ->
                        if classical then
                            let both = (truthTable (And(a, b))).Rows |> List.find snd |> fst
                            sprintf "they CAN both be true — for instance when %s" (describeSituation both)
                        else "they CAN both be true — in some situation the engine found")
                | _ ->
                    checkFormal (Iff(a, b)) "verified: always the same truth value — two phrasings of one claim" (fun () ->
                        if classical then
                            match distinguishing a b with
                            | Some env -> sprintf "not equivalent — they come apart when %s" (describeSituation env)
                            | None -> "not equivalent"
                        else "not equivalent — they come apart in some situation the engine found")
            | _ ->
                "asserted", "cannot be checked — one side is not a declared claim or prop"

        display left, verb, display right, status, note

    /// Explain what each relation *means* — shown next to the relation name.
    let private relationWhy =
        function
        | Relation.Equivalent -> "always the same truth value — two phrasings of one claim"
        | Relation.Contradictory -> "always opposite — exactly one of the two holds"
        | Relation.Contrary -> "never both true, though both can fail"
        | Relation.Subcontrary -> "never both false, though both can hold"
        | Relation.Entails -> "whenever the first holds, so does the second"
        | Relation.EntailedBy -> "whenever the first holds, so does the second"
        | Relation.Independent -> "neither settles the other — all four combinations are possible"

    /// The `analyze` block: how every claim stands to every other claim.
    /// This is the false-equivalence (and hidden-contradiction) detector.
    let private relationsBlock (claims: (string * Formula) list) =
        let pairs =
            [ for i in 0 .. List.length claims - 1 do
                for j in i + 1 .. List.length claims - 1 ->
                    let (nameA, a) = claims.[i]
                    let (nameB, b) = claims.[j]
                    // Flip "entailed by" so every arrow reads left-to-right.
                    match relate a b with
                    | Relation.EntailedBy -> [| nameB; "entails"; nameA; relationWhy Relation.Entails |]
                    | r -> [| nameA; relationName r; nameB; relationWhy r |] ]
        { empty with kind = "relations"; relations = List.toArray pairs }

    let private toBlock
        (defs: Map<string, Formula>)
        (glosses: Map<string, string>)
        (claims: (string * Formula) list)
        (relationRows: string[][])
        (arguments: Map<string, Formula list * Formula>)
        (st: Statement)
        : BlockView =
        // Reading a formula out loud uses the props' glosses where they exist.
        let readAloud f = toEnglish (fun name -> Map.tryFind name glosses) f

        match st with
        | Heading(level, text) -> { empty with kind = "heading"; level = level; title = text }
        | Prose text -> { empty with kind = "prose"; title = text }
        | Prop(name, gloss) -> { empty with kind = "prop"; name = name; gloss = gloss }
        | Claim(name, body) ->
            // The note reads the claim back as a sentence, with claim names
            // expanded so abbreviations don't hide the meaning.
            { empty with
                kind = "claim"
                name = name
                formula = toUnicode body
                note = readAloud (resolve defs body) }
        | Table target ->
            let f =
                match target with
                | TargetFormula f -> resolve defs f
                | TargetRef n -> resolve defs (Atom n)
            if containsFO f then foFormulaBlock "table" f
            elif containsModal f then modalBlock "table" f
            else tableBlock f
        | Check(Verdict f) ->
            let rf = resolve defs f
            if containsFO rf then foFormulaBlock "check" rf
            elif containsModal rf then modalBlock "check" rf
            else { (tableBlock rf) with kind = "check" }
        | Check(Equivalent(a, b)) ->
            let ra, rb = resolve defs a, resolve defs b
            let modal = containsModal ra || containsModal rb
            let verdict, note =
                match equivalent2 ra rb with
                | Some true when modal ->
                    "equivalent", "At every world of every arrangement the two sides carry the same truth value — two phrasings of one claim."
                | Some true ->
                    "equivalent", "In every possible situation the two sides carry the same truth value — two phrasings of one claim."
                | Some false when modal ->
                    "not-equivalent", "They come apart in some arrangement of possible worlds: there, one holds and the other doesn't."
                | Some false ->
                    "not-equivalent",
                    (match distinguishing ra rb with
                     | Some env -> sprintf "They come apart when %s: then one holds and the other doesn't." (describeSituation env)
                     | None -> "")
                | None -> "unknown", tooLargeNote
            { empty with
                kind = "check"
                formula = toUnicode ra + " ≡ " + toUnicode rb
                verdict = verdict
                note = note }
        | Argument(name, premises, conclusion) -> argumentBlock defs glosses name premises conclusion
        | Proof(name, lines) -> proofBlock defs name lines
        | Venn(name, premises, conclusion) -> vennBlock defs name premises conclusion
        | VennRef argName ->
            match Map.tryFind argName arguments with
            | Some(premises, conclusion) -> vennBlock defs argName premises (Some conclusion)
            | None ->
                { empty with
                    kind = "venn"
                    name = argName
                    verdict = "not-drawable"
                    note = sprintf "No argument named '%s' to draw — `venn` needs the name of an `argument` defined in this document." argName }
        | Square(s, p) -> squareBlock s p
        | Analyze -> relationsBlock claims
        | Relates(left, kind, right) ->
            let l, verb, r, status, note = relationInfo defs glosses left kind right
            { empty with
                kind = "relation"
                formula = l          // left display
                title = verb         // the relation word
                conclusion = r       // right display
                verdict = status     // holds / fails / asserted
                note = note }
        | RelationMap -> { empty with kind = "map"; relations = relationRows }

    /// Parse and analyse a whole document into block views for rendering.
    ///
    /// This is *resilient*: a line that fails to parse becomes an inline error
    /// block, and every other line still renders. That matters for the live
    /// preview, where you're almost always looking at a half-typed document.
    let analyze (source: string) : BlockView[] =
        let parsed = parseLines source

        let statements =
            parsed |> List.choose (fun (_, r) -> match r with Ok st -> st | Error _ -> None)

        // Claim names gathered from whatever parsed successfully, so that even
        // a document with errors elsewhere still resolves its good references.
        let defs =
            statements
            |> List.choose (function Claim(n, f) -> Some(n, f) | _ -> None)
            |> Map.ofList

        // Each prop's natural-language meaning, for reading formulas out loud.
        let glosses =
            statements
            |> List.choose (function Prop(n, g) -> Some(n, g) | _ -> None)
            |> Map.ofList

        // The claims in document order, fully resolved — what `analyze` compares.
        let claims =
            statements
            |> List.choose (function Claim(n, f) -> Some(n, resolve defs f) | _ -> None)

        // Arguments by name, so `venn <name>` can draw an existing one.
        let arguments =
            statements
            |> List.choose (function Argument(n, p, c) -> Some(n, (p, c)) | _ -> None)
            |> Map.ofList

        // Every asserted relation in the document, checked where checkable —
        // this is what a `map` statement draws.
        let relationRows =
            statements
            |> List.choose (function
                | Relates(l, k, r) ->
                    let left, verb, right, status, _ = relationInfo defs glosses l k r
                    Some [| left; verb; right; status |]
                | _ -> None)
            |> List.toArray

        // Paragraph grouping, Markdown-style: consecutive prose lines with no
        // blank line between them merge into one paragraph; a blank (or comment)
        // line, or any other statement, ends the current paragraph.
        let entries = ResizeArray<Choice<Statement, int * string>>()
        let proseBuffer = ResizeArray<string>()
        let flushProse () =
            if proseBuffer.Count > 0 then
                entries.Add(Choice1Of2(Prose(String.concat " " (List.ofSeq proseBuffer))))
                proseBuffer.Clear()

        for (lineNo, r) in parsed do
            match r with
            | Ok(Some(Prose text)) -> proseBuffer.Add text
            | Ok None -> flushProse ()
            | Ok(Some st) -> flushProse (); entries.Add(Choice1Of2 st)
            | Error msg -> flushProse (); entries.Add(Choice2Of2(lineNo, msg))
        flushProse ()

        entries.ToArray()
        |> Array.map (function
            | Choice1Of2 st -> toBlock defs glosses claims relationRows arguments st
            | Choice2Of2(lineNo, msg) -> { empty with kind = "error"; line = lineNo; title = msg })

    // ---- Extras for the editor tooling --------------------------------------

    /// One catalog entry, as plain data. The VS Code extension turns these into
    /// completions: argument snippets for each form, and rule names after `by`.
    type FormView =
        { name: string
          title: string
          aka: string
          note: string
          premises: string[]   // patterns with metavariables, e.g. "φ → ψ"
          conclusion: string
          isFallacy: bool }

    /// The full inference-rule catalog, for the editor.
    let catalog () : FormView[] =
        forms
        |> List.map (fun f ->
            { name = f.Name
              title = f.Title
              aka = f.Aka
              note = f.Note
              premises = f.Premises |> List.map toUnicode |> List.toArray
              conclusion = toUnicode f.Conclusion
              isFallacy = (f.Kind = FallacyForm) })
        |> List.toArray

    /// A non-fatal observation about the document (rendered as a warning
    /// squiggle in the editor, not shown in the preview).
    type LintView = { line: int; message: string }

    /// Style warnings the parser can't raise: currently, props that are
    /// declared but never used in any formula — usually a sign the glosses
    /// and the atoms have drifted apart.
    let lint (source: string) : LintView[] =
        let statements =
            parseLines source
            |> List.choose (fun (no, r) -> match r with Ok(Some st) -> Some(no, st) | _ -> None)

        let formulasOf st =
            match st with
            | Claim(_, f) -> [ f ]
            | Table(TargetFormula f) -> [ f ]
            | Table(TargetRef n) -> [ Atom n ]
            | Check(Verdict f) -> [ f ]
            | Check(Equivalent(a, b)) -> [ a; b ]
            | Argument(_, ps, c) -> ps @ [ c ]
            | Proof(_, lines) ->
                lines |> List.map (function ProofPremise(_, f) | ProofDerived(_, f, _, _) -> f)
            | Venn(_, premises, conclusion) -> premises @ (Option.toList conclusion)
            | VennRef _ -> []   // refers to an argument whose formulas are already counted
            | Square _ -> []    // its four corners are generated, not user formulas
            | Relates(l, _, r) ->
                // A prop that only appears in a relation still counts as used.
                [ l; r ] |> List.choose (function Named n -> Some(Atom n) | Quoted _ -> None)
            | _ -> []

        // Every name a formula mentions: propositional atoms, and — crucially —
        // predicate names and their term arguments, so `Man(socrates)` counts
        // both `Man` and `socrates` as used.
        let rec mentioned f =
            match f with
            | Atom n -> [ n ]
            | Pred(n, args) -> n :: args
            | Const _ -> []
            | Not a | Box a | Diamond a | Forall(_, a) | Exists(_, a) -> mentioned a
            | And(a, b) | Or(a, b) | Xor(a, b) | Implies(a, b) | Iff(a, b) ->
                mentioned a @ mentioned b

        let usedNames =
            statements
            |> List.collect (fun (_, st) -> formulasOf st)
            |> List.collect mentioned
            |> Set.ofList

        let declaredNames =
            statements
            |> List.choose (fun (_, st) ->
                match st with
                | Prop(n, _) | Claim(n, _) -> Some n
                | _ -> None)
            |> Set.ofList

        statements
        |> List.collect (fun (lineNo, st) ->
            match st with
            | Prop(name, _) when not (Set.contains name usedNames) ->
                [ { line = lineNo; message = sprintf "prop '%s' is declared but never used in a formula" name } ]
            | Relates(l, _, r) ->
                [ l; r ]
                |> List.choose (function
                    | Named n when not (Set.contains n declaredNames) ->
                        Some { line = lineNo
                               message = sprintf "relation references '%s', which is not a declared prop or claim — it will appear as an ad-hoc node (quote it to make that intentional)" n }
                    | _ -> None)
            | _ -> [])
        |> List.toArray
