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

    /// Analyse one argument: validity by truth table, then — depending on the
    /// outcome — either a derivation, or counterexamples plus diagnosis.
    let private argumentBlock (defs: Map<string, Formula>) (name: string) premises conclusion =
        let rp = premises |> List.map (resolve defs)
        let rc = resolve defs conclusion
        let check = checkArgument rp rc

        let recognized =
            recognize (if check.IsValid then validForms else fallacies) rp rc

        // A form is shown with its traditional alias when it has one,
        // e.g. "disjunctive syllogism (modus tollendo ponens)".
        let displayTitle (form: ArgumentForm) =
            if form.Aka = "" then form.Title
            else form.Title + " (" + form.Aka + ")"

        let proofSteps =
            if check.IsValid then prove rp rc |> Option.defaultValue [] else []

        let repairs =
            if check.IsValid then [] else suggestRepairs rp rc

        // Every argument gets an explanation: the catalog's note when the shape
        // is recognized, otherwise a plain statement of what the verdict means.
        let explanation =
            match recognized with
            | Some form -> form.Note
            | None ->
                if check.IsValid then
                    "Valid: no possible situation makes every premise true and the conclusion false."
                else
                    sprintf "Invalid: %d situation(s) make every premise true while the conclusion fails."
                        (List.length check.Counterexamples)

        { empty with
            kind = "argument"
            name = name
            premises = rp |> List.map toUnicode |> List.toArray
            conclusion = toUnicode rc
            verdict = if check.IsValid then "valid" else "invalid"
            form = (if check.IsValid then recognized |> Option.map displayTitle else None) |> Option.defaultValue ""
            fallacy = (if check.IsValid then None else recognized |> Option.map displayTitle) |> Option.defaultValue ""
            note = explanation
            suggestion = repairs |> List.map toUnicode |> List.toArray
            proof = proofSteps |> List.mapi proofRow |> List.toArray
            // For invalid arguments the table fields carry the counterexamples:
            // each row is an assignment where all premises hold but the
            // conclusion (the `results` column) is false.
            atoms = List.toArray check.Atoms
            rows =
                check.Counterexamples
                |> List.map (fun env -> check.Atoms |> List.map (fun a -> env.[a]) |> List.toArray)
                |> List.toArray
            results = check.Counterexamples |> List.map (fun _ -> false) |> List.toArray }

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
            tableBlock f
        | Check(Verdict f) ->
            let rf = resolve defs f
            { (tableBlock rf) with kind = "check" }
        | Check(Equivalent(a, b)) ->
            let ra, rb = resolve defs a, resolve defs b
            let same = equivalent ra rb
            let note =
                if same then
                    "In every possible situation the two sides carry the same truth value — two phrasings of one claim."
                else
                    match distinguishing ra rb with
                    | Some env -> sprintf "They come apart when %s: then one holds and the other doesn't." (describeSituation env)
                    | None -> ""
            { empty with
                kind = "check"
                formula = toUnicode ra + " ≡ " + toUnicode rb
                verdict = if same then "equivalent" else "not-equivalent"
                note = note }
        | Argument(name, premises, conclusion) -> argumentBlock defs name premises conclusion
        | Analyze -> relationsBlock claims

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

        parsed
        |> List.choose (fun (lineNo, r) ->
            match r with
            | Ok None -> None
            | Ok(Some st) -> Some(toBlock defs glosses claims st)
            | Error msg -> Some { empty with kind = "error"; line = lineNo; title = msg })
        |> List.toArray
