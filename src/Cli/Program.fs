module Meticulous.Cli.Program

open System
open Meticulous.Api

/// The CLI prints the same analysed blocks the VS Code preview renders,
/// just as plain text. It's the quickest way to check a .met file without
/// an editor — and a handy way to see what the engine produces.

let private cell (b: bool) = if b then "T" else "F"

let private printTable indent (atoms: string[]) (rows: bool[][]) (results: bool[]) (resultHeader: string) (subHeaders: string[]) (subRows: bool[][]) =
    let header = String.concat " | " (Array.toList atoms @ Array.toList subHeaders @ [ resultHeader ])
    printfn "%s%s" indent header
    printfn "%s%s" indent (String('-', header.Length))
    rows
    |> Array.iteri (fun i row ->
        let subs = if i < subRows.Length then subRows.[i] |> Array.map cell |> Array.toList else []
        let cells = (row |> Array.map cell |> Array.toList) @ subs @ [ cell results.[i] ]
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
        if b.atoms.Length > 0 then printTable "    " b.atoms b.rows b.results b.formula b.subHeaders b.subRows
        else printfn "    %s" b.formula
        printfn "    => %s — %s" (b.verdict.ToUpper()) b.note
        b.model |> Array.iter (printfn "      %s")
    | "check" ->
        printfn "  check: %s => %s" b.formula (b.verdict.ToUpper())
        if b.note <> "" then printfn "      %s" b.note
        b.model |> Array.iter (printfn "      %s")
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
            printTable "      " b.atoms b.rows b.results b.conclusion b.subHeaders b.subRows
        if b.model.Length > 0 then
            printfn "    countermodel: premises true, conclusion false:"
            b.model |> Array.iter (printfn "      %s")
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
    | "venn" ->
        printfn "  venn %s:   [%s]" b.name (b.verdict.ToUpper())
        if b.vennCircles.Length > 0 then
            printfn "    circles: %s" (String.concat ", " b.vennCircles)
            let inout bits j = if j < String.length bits && bits.[j] = '1' then "in " + b.vennCircles.[j] else "out " + b.vennCircles.[j]
            let describeCell (bits: string) =
                String.concat ", " [ for j in 0 .. b.vennCircles.Length - 1 -> inout bits j ]
            b.vennCells
            |> Array.iter (fun c ->
                if c.[1] <> "free" then printfn "    [%s] %s" (c.[1].ToUpper()) (describeCell c.[0]))
            b.vennPoints |> Array.iter (fun p -> printfn "    • %s in cell(s) %s" p.[0] p.[1])
        printfn "    %s" b.note
    | "square" ->
        printfn "  square of opposition: %s / %s" b.vennCircles.[0] b.vennCircles.[1]
        [ "A"; "E"; "I"; "O" ] |> List.iteri (fun i c -> printfn "    %s: %s" c b.premises.[i])
        b.relations |> Array.iter (fun e -> printfn "    %s — %s — %s   [%s]" e.[0] e.[1] e.[2] (e.[3].ToUpper()))
        printfn "    %s" b.note
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
