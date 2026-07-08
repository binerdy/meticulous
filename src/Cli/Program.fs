module Meticulous.Cli.Program

open System
open Meticulous.Api

/// The CLI prints the same analysed blocks the VS Code preview renders,
/// just as plain text. It's the quickest way to check a .met file without
/// an editor — and a handy way to see what the engine produces.

let private cell (b: bool) = if b then "T" else "F"

let private printTable indent (atoms: string[]) (rows: bool[][]) (results: bool[]) (resultHeader: string) =
    let header = String.concat " | " (Array.toList atoms @ [ resultHeader ])
    printfn "%s%s" indent header
    printfn "%s%s" indent (String('-', header.Length))
    rows
    |> Array.iteri (fun i row ->
        let cells = (row |> Array.map cell |> Array.toList) @ [ cell results.[i] ]
        printfn "%s%s" indent (String.concat " | " cells))

let private printBlock (b: BlockView) =
    match b.kind with
    | "heading" -> printfn "\n%s %s" (String('#', b.level)) b.title
    | "prose" -> printfn "%s" b.title
    | "prop" -> printfn "  %s : %s" b.name b.gloss
    | "claim" ->
        printfn "  %s := %s" b.name b.formula
        if b.note <> "" then printfn "      \"%s\"" b.note
    | "table" ->
        printTable "    " b.atoms b.rows b.results b.formula
        printfn "    => %s — %s" (b.verdict.ToUpper()) b.note
    | "check" ->
        printfn "  check: %s => %s" b.formula (b.verdict.ToUpper())
        if b.note <> "" then printfn "      %s" b.note
    | "argument" ->
        printfn "  argument %s:" b.name
        b.premises |> Array.iter (printfn "    premise  %s")
        printfn "    ---------"
        printfn "    conclude %s   [%s]" b.conclusion (b.verdict.ToUpper())
        if b.form <> "" then printfn "    form: %s — %s" b.form b.note
        if b.fallacy <> "" then printfn "    fallacy: %s — %s" b.fallacy b.note
        if b.form = "" && b.fallacy = "" && b.note <> "" then printfn "    %s" b.note
        if b.rows.Length > 0 then
            printfn "    counterexample(s): premises true, conclusion false:"
            printTable "      " b.atoms b.rows b.results b.conclusion
        if b.suggestion.Length > 0 then
            printfn "    becomes valid if you add: %s" (String.concat "   or   " b.suggestion)
        if b.proof.Length > 0 then
            printfn "    proof:"
            b.proof |> Array.iter (fun step -> printfn "      %s. %s   (%s)" step.[0] step.[1] step.[2])
    | "proof" ->
        printfn "  proof %s:   [%s]" b.name (b.verdict.ToUpper())
        b.proof
        |> Array.iter (fun step ->
            let mark =
                match step.[3] with
                | "ok" -> "✓"
                | "bad" -> "✗"
                | _ -> " " // premises need no check mark
            printfn "    %s %s. %s   (%s)" mark step.[0] step.[1] step.[2]
            if step.[4] <> "" then printfn "        ^ %s" step.[4])
        if b.note <> "" then printfn "    %s" b.note
    | "relations" ->
        printfn "  claim relations:"
        if b.relations.Length = 0 then printfn "    (needs at least two claims)"
        b.relations |> Array.iter (fun r -> printfn "    %s %s %s — %s" r.[0] r.[1] r.[2] r.[3])
    | "relation" ->
        printfn "  %s %s %s   [%s]" b.formula b.title b.conclusion (b.verdict.ToUpper())
        if b.note <> "" then printfn "      %s" b.note
    | "map" ->
        printfn "  argument map (%d relations):" b.relations.Length
        b.relations |> Array.iter (fun r -> printfn "    %s --%s--> %s [%s]" r.[0] r.[1] r.[2] r.[3])
    | "error" -> printfn "  ! line %d: %s" b.line b.title
    | other -> printfn "  ? unknown block kind '%s'" other

[<EntryPoint>]
let main argv =
    match argv with
    | [| path |] ->
        let source = IO.File.ReadAllText path
        let blocks = analyze source
        blocks |> Array.iter printBlock
        // Exit non-zero when the document has errors, so scripts can rely on it.
        if blocks |> Array.exists (fun b -> b.kind = "error") then 1 else 0
    | _ ->
        eprintfn "usage: meticulous <file.met>"
        1
