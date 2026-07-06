namespace Meticulous

open Meticulous.Ast

/// The reasoning engine. Everything here is pure: given a formula (and maybe a
/// set of definitions), it computes answers — truth values, whole truth tables,
/// verdicts, and equivalence. No parsing, no printing.
module Engine =

    /// Replace any atom that is actually a *claim name* with the claim's body,
    /// recursively. Claim names are just abbreviations: `table C1` should behave
    /// exactly as if you'd written C1's formula in full. Props (which have no
    /// entry in `defs`) are left as plain atoms.
    let rec resolve (defs: Map<string, Formula>) (f: Formula) : Formula =
        match f with
        | Atom n ->
            match Map.tryFind n defs with
            | Some body -> resolve defs body
            | None -> Atom n
        | Const _ -> f
        | Not a -> Not(resolve defs a)
        | And(a, b) -> And(resolve defs a, resolve defs b)
        | Or(a, b) -> Or(resolve defs a, resolve defs b)
        | Xor(a, b) -> Xor(resolve defs a, resolve defs b)
        | Implies(a, b) -> Implies(resolve defs a, resolve defs b)
        | Iff(a, b) -> Iff(resolve defs a, resolve defs b)

    /// All distinct atom names in a formula, in order of first appearance.
    /// (Order matters so the truth table columns read left-to-right naturally.)
    let atoms (f: Formula) : string list =
        let rec go f acc =
            match f with
            | Atom name -> if List.contains name acc then acc else acc @ [ name ]
            | Const _ -> acc
            | Not a -> go a acc
            | And(a, b)
            | Or(a, b)
            | Xor(a, b)
            | Implies(a, b)
            | Iff(a, b) -> go b (go a acc)
        go f []

    /// Evaluate a formula under an assignment of truth values to its atoms.
    let rec eval (env: Map<string, bool>) (f: Formula) : bool =
        match f with
        | Atom name -> Map.tryFind name env |> Option.defaultValue false
        | Const b -> b
        | Not a -> not (eval env a)
        | And(a, b) -> eval env a && eval env b
        | Or(a, b) -> eval env a || eval env b
        | Xor(a, b) -> eval env a <> eval env b            // true when they differ
        | Implies(a, b) -> (not (eval env a)) || eval env b // false only for T -> F
        | Iff(a, b) -> eval env a = eval env b             // true when they match

    /// Every combination of truth values for the given atoms.
    /// For n atoms this produces 2^n assignments. We read row index `i` as a
    /// binary number whose most-significant bit is the first atom, so the table
    /// counts down T,T … F,F in the familiar order.
    let assignments (names: string list) : Map<string, bool> list =
        let n = List.length names
        [ for i in 0 .. (1 <<< n) - 1 ->
              names
              |> List.mapi (fun bit name ->
                  let value = (i >>> (n - 1 - bit)) &&& 1 = 1
                  name, value)
              |> Map.ofList ]

    /// The character of a formula, judged over all assignments.
    type Verdict =
        | Tautology       // true in every case
        | Contradiction   // false in every case
        | Contingent      // sometimes true, sometimes false

    /// A computed truth table: the atom columns, one row per assignment (with
    /// its result), and the overall verdict.
    type TruthTable =
        { Atoms: string list
          Rows: (Map<string, bool> * bool) list
          Verdict: Verdict }

    let truthTable (f: Formula) : TruthTable =
        let names = atoms f
        let rows = assignments names |> List.map (fun env -> env, eval env f)
        let results = rows |> List.map snd
        let verdict =
            if List.forall id results then Tautology
            elif List.forall not results then Contradiction
            else Contingent
        { Atoms = names; Rows = rows; Verdict = verdict }

    /// Two formulas are logically equivalent when they agree on every possible
    /// assignment — i.e. when `a <-> b` is a tautology.
    let equivalent (a: Formula) (b: Formula) : bool =
        (truthTable (Iff(a, b))).Verdict = Tautology
