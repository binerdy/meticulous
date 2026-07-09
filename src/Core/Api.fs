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
          actual: int          // for modal blocks: which row is the actual world (-1 = not modal)
          line: int
          premises: string[]
          conclusion: string
          form: string
          fallacy: string
          note: string
          suggestion: string[]
          proof: string[][]      // one step: [number; formula; justification]
          relations: string[][] } // one pair: [left; relation; right]

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
          actual = -1
          line = 0
          premises = [||]
          conclusion = ""
          form = ""
          fallacy = ""
          note = ""
          suggestion = [||]
          proof = [||]
          relations = [||] }

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

    /// Build a full table view (columns, rows, verdict) for a formula.
    let private tableBlock (f: Formula) =
        let t = truthTable f
        { empty with
            kind = "table"
            formula = toUnicode f
            atoms = List.toArray t.Atoms
            rows = t.Rows |> List.map (fun (env, _) -> t.Atoms |> List.map (fun a -> env.[a]) |> List.toArray) |> List.toArray
            results = t.Rows |> List.map snd |> List.toArray
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
    let private argumentBlock (defs: Map<string, Formula>) (name: string) premises conclusion =
        let rp = premises |> List.map (resolve defs)
        let rc = resolve defs conclusion
        let modal = List.exists containsModal (rc :: rp)

        // isValid/unknown plus, when invalid, the refuting situations:
        // classical rows (many), or one modal countermodel with its actual world.
        let isValid, unknown, cxAtoms, cxRows, cxActual =
            if modal then
                match checkArgumentS5 rp rc with
                | NoModel -> true, false, [], [], -1
                | TooLarge -> false, true, [], [], -1
                | Model(worlds, actual) ->
                    let names = rp @ [ rc ] |> List.collect atoms |> List.distinct
                    false, false, names, worlds, actual
            else
                let check = checkArgument rp rc
                check.IsValid, false, check.Atoms, check.Counterexamples, -1

        let recognized =
            if unknown then None
            else recognize (if isValid then validForms else fallacies) rp rc

        // A form is shown with its traditional alias when it has one,
        // e.g. "disjunctive syllogism (modus tollendo ponens)".
        let displayTitle (form: ArgumentForm) =
            if form.Aka = "" then form.Title
            else form.Title + " (" + form.Aka + ")"

        let proofSteps =
            if isValid then prove rp rc |> Option.defaultValue [] else []

        // Missing-premise repair is a classical search; modal repair would need
        // its own candidate space, so it honestly stays out of modal arguments.
        let repairs =
            if isValid || unknown || modal then [] else suggestRepairs rp rc

        // Can the premises all hold at once? If not, the argument is valid only
        // *vacuously* — a situation worth naming, not hiding behind a green badge.
        let premisesConsistent =
            match rp with
            | [] -> true
            | _ ->
                let together = List.reduce (fun a b -> And(a, b)) rp
                if modal then s5Satisfy together <> NoModel
                else (truthTable together).Verdict <> Contradiction

        // Every argument gets an explanation: the catalog's note when the shape
        // is recognized, otherwise a plain statement of what the verdict means.
        let explanation =
            if unknown then tooLargeNote
            elif List.isEmpty rp then
                if isValid then
                    match recognized with
                    | Some form -> form.Note
                    | None when modal ->
                        "A theorem of S5: the conclusion holds at every world of every arrangement — provable from no premises at all."
                    | None ->
                        "A theorem: the conclusion holds in every possible situation — a tautology, provable from no premises at all."
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
                    if isValid && modal then
                        "Valid in S5: no arrangement of possible worlds makes every premise true at the actual world while the conclusion fails there."
                    elif isValid then
                        "Valid: no possible situation makes every premise true and the conclusion false."
                    elif modal then
                        "Invalid in S5: there is an arrangement of possible worlds where every premise holds at the actual world while the conclusion fails there."
                    else
                        sprintf "Invalid: %d situation(s) make every premise true while the conclusion fails."
                            (List.length cxRows)

        // The chip next to the verdict: a recognized form's name, or — for a
        // premise-less theorem no law accounts for — the plain label "tautology".
        let formLabel =
            if not isValid then ""
            else
                match recognized with
                | Some f -> displayTitle f
                | None -> if List.isEmpty rp then "tautology" else ""

        { empty with
            kind = "argument"
            name = name
            premises = rp |> List.map toUnicode |> List.toArray
            conclusion = toUnicode rc
            verdict = if unknown then "unknown" elif isValid then "valid" else "invalid"
            form = formLabel
            fallacy = (if isValid || unknown then None else recognized |> Option.map displayTitle) |> Option.defaultValue ""
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
            actual = cxActual }

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
                let form = forms |> List.tryFind (fun fm -> fm.Name = ruleName)

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
                            "bad", sprintf "unknown rule '%s' — rule names are the kebab-case catalog names, e.g. modus-ponens" ruleName, ruleName
                        | Some fm when fm.Kind = FallacyForm ->
                            "bad", sprintf "'%s' is a fallacy, not a rule — it cannot justify a step" fm.Title, fm.Title
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
                let modal = containsModal a || containsModal b
                let checkFormal (f: Formula) (holdsNote: string) (failsNote: unit -> string) =
                    match valid f with
                    | Some true -> "holds", holdsNote
                    | Some false -> "fails", failsNote ()
                    | None -> "asserted", tooLargeNote
                match kind with
                | Entails ->
                    checkFormal (Implies(a, b)) "verified: whenever the first holds, so does the second" (fun () ->
                        if modal then "does not hold — it fails in some arrangement of possible worlds"
                        else
                            let cx = (checkArgument [ a ] b).Counterexamples |> List.head
                            sprintf "does not hold — counterexample: %s" (describeSituation cx))
                | Contradicts ->
                    checkFormal (Not(And(a, b))) "verified: they can never both be true" (fun () ->
                        if modal then "they CAN both be true — in some arrangement of possible worlds"
                        else
                            let both = (truthTable (And(a, b))).Rows |> List.find snd |> fst
                            sprintf "they CAN both be true — for instance when %s" (describeSituation both))
                | _ ->
                    checkFormal (Iff(a, b)) "verified: always the same truth value — two phrasings of one claim" (fun () ->
                        if modal then "not equivalent — they come apart in some arrangement of possible worlds"
                        else
                            match distinguishing a b with
                            | Some env -> sprintf "not equivalent — they come apart when %s" (describeSituation env)
                            | None -> "not equivalent")
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
            if containsModal f then modalBlock "table" f else tableBlock f
        | Check(Verdict f) ->
            let rf = resolve defs f
            if containsModal rf then modalBlock "check" rf
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
        | Argument(name, premises, conclusion) -> argumentBlock defs name premises conclusion
        | Proof(name, lines) -> proofBlock defs name lines
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

        parsed
        |> List.choose (fun (lineNo, r) ->
            match r with
            | Ok None -> None
            | Ok(Some st) -> Some(toBlock defs glosses claims relationRows st)
            | Error msg -> Some { empty with kind = "error"; line = lineNo; title = msg })
        |> List.toArray

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
            | Relates(l, _, r) ->
                // A prop that only appears in a relation still counts as used.
                [ l; r ] |> List.choose (function Named n -> Some(Atom n) | Quoted _ -> None)
            | _ -> []

        let usedNames =
            statements
            |> List.collect (fun (_, st) -> formulasOf st)
            |> List.collect atoms
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
