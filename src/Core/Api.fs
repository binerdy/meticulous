namespace Meticulous

open Meticulous.Ast
open Meticulous.Parser
open Meticulous.Engine
open Meticulous.Render

/// The single entry point the outside world (the TypeScript renderer, via
/// Fable) calls. `analyze` turns source text into a flat array of "block views"
/// — plain records of strings, arrays, and bools that survive the trip to
/// JavaScript cleanly (no F# unions or options across the boundary).
module Api =

    /// One rendered block. Every field always exists; which ones are meaningful
    /// depends on `kind`. This flat shape is deliberately JS-friendly.
    ///   kind = "heading"       -> level, title
    ///   kind = "prose"         -> title (the text)
    ///   kind = "prop"          -> name, gloss
    ///   kind = "claim"         -> name, formula
    ///   kind = "table"         -> formula, atoms, rows, results, verdict
    ///   kind = "check"         -> formula, verdict   (verdict may be equivalent/...)
    ///   kind = "error"         -> line, title (the message)
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
          line: int }

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
          line = 0 }

    let private verdictName =
        function
        | Tautology -> "tautology"
        | Contradiction -> "contradiction"
        | Contingent -> "contingent"

    /// Build a full table view (columns, rows, verdict) for a formula.
    let private tableBlock (f: Formula) =
        let t = truthTable f
        { empty with
            kind = "table"
            formula = toUnicode f
            atoms = List.toArray t.Atoms
            rows = t.Rows |> List.map (fun (env, _) -> t.Atoms |> List.map (fun a -> env.[a]) |> List.toArray) |> List.toArray
            results = t.Rows |> List.map snd |> List.toArray
            verdict = verdictName t.Verdict }

    let private toBlock (defs: Map<string, Formula>) (st: Statement) : BlockView =
        match st with
        | Heading(level, text) -> { empty with kind = "heading"; level = level; title = text }
        | Prose text -> { empty with kind = "prose"; title = text }
        | Prop(name, gloss) -> { empty with kind = "prop"; name = name; gloss = gloss }
        | Claim(name, body) -> { empty with kind = "claim"; name = name; formula = toUnicode body }
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
            { empty with
                kind = "check"
                formula = toUnicode ra + " ≡ " + toUnicode rb
                verdict = if equivalent ra rb then "equivalent" else "not-equivalent" }

    /// Parse and analyse a whole document into block views for rendering.
    ///
    /// This is *resilient*: a line that fails to parse becomes an inline error
    /// block, and every other line still renders. That matters for the live
    /// preview, where you're almost always looking at a half-typed document.
    let analyze (source: string) : BlockView[] =
        let parsed =
            source.Replace("\r\n", "\n").Split('\n')
            |> Array.mapi (fun i line -> (i + 1), parseLine line)
            |> Array.toList

        // Claim names gathered from whatever parsed successfully, so that even a
        // document with errors elsewhere still resolves its good references.
        let defs =
            parsed
            |> List.choose (fun (_, r) ->
                match r with
                | Ok(Some(Claim(n, f))) -> Some(n, f)
                | _ -> None)
            |> Map.ofList

        parsed
        |> List.choose (fun (lineNo, r) ->
            match r with
            | Ok None -> None
            | Ok(Some st) -> Some(toBlock defs st)
            | Error msg -> Some { empty with kind = "error"; line = lineNo; title = msg })
        |> List.toArray
