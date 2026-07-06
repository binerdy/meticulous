module Meticulous.Cli.Program

open System
open Meticulous.Ast
open Meticulous.Parser
open Meticulous.Engine

/// Pretty-print a formula with Unicode operators. This version fully
/// parenthesises binary operators — unambiguous, if a little noisy. (The nicer
/// minimal-parenthesis printer will live in the TypeScript renderer later.)
let rec private show (f: Formula) : string =
    match f with
    | Atom n -> n
    | Const true -> "⊤"
    | Const false -> "⊥"
    | Not a -> "¬" + show a
    | And(a, b) -> sprintf "(%s ∧ %s)" (show a) (show b)
    | Or(a, b) -> sprintf "(%s ∨ %s)" (show a) (show b)
    | Xor(a, b) -> sprintf "(%s ⊕ %s)" (show a) (show b)
    | Implies(a, b) -> sprintf "(%s → %s)" (show a) (show b)
    | Iff(a, b) -> sprintf "(%s ↔ %s)" (show a) (show b)

let private verdictText =
    function
    | Tautology -> "TAUTOLOGY (always true)"
    | Contradiction -> "CONTRADICTION (always false)"
    | Contingent -> "CONTINGENT (depends)"

let private cell (b: bool) = if b then "T" else "F"

let private printTable (f: Formula) =
    let t = truthTable f
    let header = String.concat " | " (t.Atoms @ [ show f ])
    printfn "    %s" header
    printfn "    %s" (String('-', header.Length))
    for (env, result) in t.Rows do
        let cells = (t.Atoms |> List.map (fun a -> cell env.[a])) @ [ cell result ]
        printfn "    %s" (String.concat " | " cells)
    printfn "    => %s" (verdictText t.Verdict)

let private printCheck (defs: Map<string, Formula>) (kind: CheckKind) =
    match kind with
    | Verdict f ->
        let rf = resolve defs f
        printfn "  check: %s => %s" (show rf) (verdictText (truthTable rf).Verdict)
    | Equivalent(a, b) ->
        let ra, rb = resolve defs a, resolve defs b
        let same = equivalent ra rb
        printfn "  check: %s ≡ %s => %s" (show ra) (show rb) (if same then "EQUIVALENT" else "NOT EQUIVALENT")

[<EntryPoint>]
let main argv =
    match argv with
    | [| path |] ->
        let source = IO.File.ReadAllText path
        match parseDocument source with
        | Error errors ->
            for (line, msg) in errors do
                eprintfn "line %d: %s" line msg
            1
        | Ok doc ->
            // Claim names become definitions we can expand inside table/check.
            let defs =
                doc
                |> List.choose (function Claim(n, f) -> Some(n, f) | _ -> None)
                |> Map.ofList

            for st in doc do
                match st with
                | Heading(level, text) -> printfn "\n%s %s" (String('#', level)) text
                | Prose text -> printfn "%s" text
                | Prop(name, gloss) -> printfn "  %s : %s" name gloss
                | Claim(name, body) -> printfn "  %s := %s" name (show body)
                | Table target ->
                    let f =
                        match target with
                        | TargetFormula f -> resolve defs f
                        | TargetRef n -> resolve defs (Atom n)
                    printTable f
                | Check kind -> printCheck defs kind
            0
    | _ ->
        eprintfn "usage: meticulous <file.met>"
        1
