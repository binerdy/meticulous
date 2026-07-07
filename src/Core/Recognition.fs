namespace Meticulous

open Meticulous.Ast
open Meticulous.Engine
open Meticulous.InferenceRules

/// Everything that reasons *about arguments as shapes*:
///   * recognize      — which named form (or fallacy) does this argument match?
///   * prove          — derive the conclusion from the premises, step by step
///   * suggestRepairs — for an invalid argument, find the missing premise
module Recognition =

    // ---- Pattern matching --------------------------------------------------
    //
    // A pattern is a Formula whose atoms are metavariables. Matching a pattern
    // against a concrete formula either fails, or produces a *substitution*:
    // a map from each metavariable to the formula it stood for. The same
    // metavariable must stand for the same formula everywhere — that's the
    // check against `subst` below.

    let rec private matchPattern (pattern: Formula) (target: Formula) (subst: Map<string, Formula>) : Map<string, Formula> option =
        match pattern, target with
        | Atom v, t ->
            match Map.tryFind v subst with
            | Some bound -> if bound = t then Some subst else None
            | None -> Some(Map.add v t subst)
        | Const a, Const b when a = b -> Some subst
        | Not p, Not t -> matchPattern p t subst
        | And(p1, p2), And(t1, t2)
        | Or(p1, p2), Or(t1, t2)
        | Xor(p1, p2), Xor(t1, t2)
        | Implies(p1, p2), Implies(t1, t2)
        | Iff(p1, p2), Iff(t1, t2) ->
            matchPattern p1 t1 subst |> Option.bind (matchPattern p2 t2)
        | _ -> None

    /// Match a list of patterns against a list of targets, pair by pair,
    /// threading the substitution through so bindings stay consistent.
    let private matchAll (patterns: Formula list) (targets: Formula list) : Map<string, Formula> option =
        List.zip patterns targets
        |> List.fold
            (fun acc (p, t) -> acc |> Option.bind (matchPattern p t))
            (Some Map.empty)

    /// Fill a pattern's metavariables in from a substitution. Metavariables the
    /// substitution doesn't know stay as they are (callers handle that case).
    let rec private instantiate (subst: Map<string, Formula>) (pattern: Formula) : Formula =
        match pattern with
        | Atom v -> Map.tryFind v subst |> Option.defaultValue pattern
        | Const _ -> pattern
        | Not a -> Not(instantiate subst a)
        | And(a, b) -> And(instantiate subst a, instantiate subst b)
        | Or(a, b) -> Or(instantiate subst a, instantiate subst b)
        | Xor(a, b) -> Xor(instantiate subst a, instantiate subst b)
        | Implies(a, b) -> Implies(instantiate subst a, instantiate subst b)
        | Iff(a, b) -> Iff(instantiate subst a, instantiate subst b)

    // ---- Recognition -------------------------------------------------------

    /// All orderings of a list. Users write premises in any order, but the
    /// catalog patterns are ordered — so we try every arrangement. Premise
    /// lists are tiny (2–3), so this is at most 6 arrangements.
    let rec private permutations lst =
        let rec insertEverywhere x rest =
            match rest with
            | [] -> [ [ x ] ]
            | head :: tail ->
                (x :: rest) :: (insertEverywhere x tail |> List.map (fun p -> head :: p))
        match lst with
        | [] -> [ [] ]
        | head :: tail -> permutations tail |> List.collect (insertEverywhere head)

    /// Does this argument match one of the given forms? Returns the first form
    /// whose premise and conclusion patterns all match under one substitution.
    let recognize (forms: ArgumentForm list) (premises: Formula list) (conclusion: Formula) : ArgumentForm option =
        forms
        |> List.tryFind (fun form ->
            List.length form.Premises = List.length premises
            && permutations premises
               |> List.exists (fun arrangement ->
                   matchAll form.Premises arrangement
                   |> Option.bind (matchPattern form.Conclusion conclusion)
                   |> Option.isSome))

    // ---- Proof search ------------------------------------------------------

    /// One line of a derivation. `Refs` are 1-based numbers of the earlier
    /// steps this one was inferred from (empty for premises).
    type ProofStep =
        { Formula: Formula
          Rule: string
          Refs: int list }

    /// How big a formula is — used to stop the proof search from inventing
    /// ever-larger formulas that lead nowhere.
    let rec private size f =
        match f with
        | Atom _ | Const _ -> 1
        | Not a -> 1 + size a
        | And(a, b) | Or(a, b) | Xor(a, b) | Implies(a, b) | Iff(a, b) -> 1 + size a + size b

    /// Every subformula of a formula, including itself.
    let rec private subformulas f =
        f
        :: (match f with
            | Atom _ | Const _ -> []
            | Not a -> subformulas a
            | And(a, b) | Or(a, b) | Xor(a, b) | Implies(a, b) | Iff(a, b) ->
                subformulas a @ subformulas b)

    /// Try to *derive* the conclusion from the premises by repeatedly applying
    /// the valid inference rules (forward chaining). Returns the steps of the
    /// shortest derivation found, or None.
    ///
    /// Honesty note: this search is deliberately bounded, so a valid argument
    /// may still come back None — validity itself is always settled separately
    /// by truth table. A proof, when we find one, is the *explanation*.
    let prove (premises: Formula list) (goal: Formula) : ProofStep list option =
        // Everything derived so far: (formula, rule that produced it, refs).
        let steps = ResizeArray<Formula * string * int list>()
        let known f = steps |> Seq.exists (fun (g, _, _) -> g = f)

        for p in premises do
            if not (known p) then steps.Add(p, "premise", [])

        // When a rule's conclusion mentions a metavariable its premises don't
        // (e.g. addition: from φ conclude φ ∨ ψ), we only try filling it with
        // formulas already in play — the subformulas of the argument itself.
        let universe =
            premises @ [ goal ] |> List.collect subformulas |> List.distinct

        // Search bounds: derived formulas may not grow much bigger than what
        // the argument already contains, and we stop after a few rounds.
        let sizeLimit =
            (premises @ [ goal ] |> List.map size |> List.max) * 2 + 2

        let mutable found = known goal
        let mutable round = 0

        while not found && round < 6 && steps.Count < 40 do
            round <- round + 1
            let snapshot = steps.Count

            for rule in validForms do
                // Every way of picking one known step per premise slot.
                let candidates =
                    match List.length rule.Premises with
                    | 1 -> [ for i in 0 .. snapshot - 1 -> [ i ] ]
                    | 2 -> [ for i in 0 .. snapshot - 1 do for j in 0 .. snapshot - 1 -> [ i; j ] ]
                    | 3 when snapshot <= 20 ->
                        [ for i in 0 .. snapshot - 1 do
                            for j in 0 .. snapshot - 1 do
                                for k in 0 .. snapshot - 1 -> [ i; j; k ] ]
                    | _ -> []

                for indices in candidates do
                    if not found && steps.Count < 40 then
                        let targets = indices |> List.map (fun i -> let (f, _, _) = steps.[i] in f)
                        match matchAll rule.Premises targets with
                        | None -> ()
                        | Some subst ->
                            let unbound =
                                atoms rule.Conclusion
                                |> List.filter (fun v -> not (Map.containsKey v subst))
                            let fillings =
                                match unbound with
                                | [] -> [ subst ]
                                | [ v ] -> universe |> List.map (fun u -> Map.add v u subst)
                                | _ -> [] // no rule in the catalog has 2+ free conclusion vars
                            for s in fillings do
                                if not found && steps.Count < 40 then
                                    let derived = instantiate s rule.Conclusion
                                    if size derived <= sizeLimit && not (known derived) then
                                        steps.Add(derived, rule.Title, indices |> List.map (fun i -> i + 1))
                                        if derived = goal then found <- true

        if not found then None
        else
            // Walk back from the goal, keep only the steps actually used,
            // and renumber them 1..n in order.
            let goalIndex = steps |> Seq.findIndex (fun (f, _, _) -> f = goal)
            let rec neededFrom idx (acc: Set<int>) =
                let (_, _, refs) = steps.[idx]
                refs |> List.fold (fun a r -> neededFrom (r - 1) a) (Set.add idx acc)
            let needed = neededFrom goalIndex Set.empty |> Set.toList |> List.sort
            let renumber = needed |> List.mapi (fun newIdx oldIdx -> oldIdx, newIdx + 1) |> Map.ofList
            needed
            |> List.map (fun oldIdx ->
                let (f, rule, refs) = steps.[oldIdx]
                { Formula = f
                  Rule = rule
                  Refs = refs |> List.map (fun r -> renumber.[r - 1]) })
            |> Some

    // ---- Missing-premise repair (enthymeme completion) ----------------------

    /// For an invalid argument, look for the small premise that would make it
    /// valid — the thing the speaker is probably assuming without saying.
    ///
    /// A candidate is only suggested when adding it:
    ///   1. makes the argument valid,
    ///   2. keeps the premises consistent (no fixing an argument by making its
    ///      premises impossible), and
    ///   3. doesn't prove the conclusion single-handedly (that wouldn't reveal
    ///      a hidden assumption — it would replace the argument).
    let suggestRepairs (premises: Formula list) (conclusion: Formula) : Formula list =
        let names =
            premises @ [ conclusion ]
            |> List.collect atoms
            |> List.distinct

        let literals = names |> List.collect (fun a -> [ Atom a; Not(Atom a) ])
        let atomOf lit = match lit with Atom a -> a | Not(Atom a) -> a | _ -> ""

        // Candidates: single literals, and implications between literals of
        // different atoms — the shapes hidden assumptions actually take.
        let candidates =
            literals
            @ [ for x in literals do
                  for y in literals do
                      if atomOf x <> atomOf y then Implies(x, y) ]

        let consistentWith c =
            let allTogether = premises |> List.fold (fun acc p -> And(acc, p)) c
            (truthTable allTogether).Verdict <> Contradiction

        let provesAlone c =
            (truthTable (Implies(c, conclusion))).Verdict = Tautology

        candidates
        |> List.filter (fun c ->
            (checkArgument (c :: premises) conclusion).IsValid
            && consistentWith c
            && not (provesAlone c))
        |> List.sortBy size
        // Drop logically-equivalent duplicates (e.g. a contrapositive of an
        // earlier suggestion), keeping the smallest form of each.
        |> List.fold
            (fun kept c -> if kept |> List.exists (fun k -> equivalent k c) then kept else kept @ [ c ])
            []
        |> List.truncate 2
