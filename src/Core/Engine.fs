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
    ///
    /// The `seen` set guards against a claim that (directly or via another
    /// claim) refers to itself — we stop expanding instead of looping forever.
    let resolve (defs: Map<string, Formula>) (formula: Formula) : Formula =
        let rec go (seen: Set<string>) f =
            match f with
            | Atom n when not (Set.contains n seen) ->
                match Map.tryFind n defs with
                | Some body -> go (Set.add n seen) body
                | None -> Atom n
            | Atom n -> Atom n
            | Const _ -> f
            | Not a -> Not(go seen a)
            | And(a, b) -> And(go seen a, go seen b)
            | Or(a, b) -> Or(go seen a, go seen b)
            | Xor(a, b) -> Xor(go seen a, go seen b)
            | Implies(a, b) -> Implies(go seen a, go seen b)
            | Iff(a, b) -> Iff(go seen a, go seen b)
            | Box a -> Box(go seen a)
            | Diamond a -> Diamond(go seen a)
        go Set.empty formula

    /// All distinct atom names in a formula, in order of first appearance.
    /// (Order matters so the truth table columns read left-to-right naturally.)
    let atoms (f: Formula) : string list =
        let rec go f acc =
            match f with
            | Atom name -> if List.contains name acc then acc else acc @ [ name ]
            | Const _ -> acc
            | Not a
            | Box a
            | Diamond a -> go a acc
            | And(a, b)
            | Or(a, b)
            | Xor(a, b)
            | Implies(a, b)
            | Iff(a, b) -> go b (go a acc)
        go f []

    /// Evaluate a formula under an assignment of truth values to its atoms.
    /// □ and ◇ are read over a *single-world* model here (where they both
    /// collapse to the formula itself) — genuine multi-world evaluation lives
    /// in `evalS5` below, and modal formulas should be routed there.
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
        | Box a
        | Diamond a -> eval env a

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

    // ---- Modal logic: S5 over possible worlds --------------------------------
    //
    // In S5 every world can "see" every other, so a model is simply a
    // non-empty set of worlds — each world an ordinary valuation of the atoms
    // — plus a designated *actual* world where truth is judged. □φ holds when
    // φ holds at every world; ◇φ when it holds at some world.

    /// Does the formula mention □ or ◇ anywhere? Decides whether the classical
    /// truth-table machinery is enough or the S5 machinery must take over.
    let rec containsModal (f: Formula) : bool =
        match f with
        | Atom _ | Const _ -> false
        | Box _ | Diamond _ -> true
        | Not a -> containsModal a
        | And(a, b) | Or(a, b) | Xor(a, b) | Implies(a, b) | Iff(a, b) ->
            containsModal a || containsModal b

    /// How many modal operators a formula contains — used to bound the model
    /// search: a satisfiable S5 formula has a model with at most one world per
    /// modal operator, plus the actual world.
    let rec private modalOps (f: Formula) : int =
        match f with
        | Atom _ | Const _ -> 0
        | Box a | Diamond a -> 1 + modalOps a
        | Not a -> modalOps a
        | And(a, b) | Or(a, b) | Xor(a, b) | Implies(a, b) | Iff(a, b) ->
            modalOps a + modalOps b

    /// Evaluate a formula at world `w` of an S5 model (the list of all worlds).
    let rec evalS5 (model: Map<string, bool> list) (w: Map<string, bool>) (f: Formula) : bool =
        match f with
        | Atom name -> Map.tryFind name w |> Option.defaultValue false
        | Const b -> b
        | Not a -> not (evalS5 model w a)
        | And(a, b) -> evalS5 model w a && evalS5 model w b
        | Or(a, b) -> evalS5 model w a || evalS5 model w b
        | Xor(a, b) -> evalS5 model w a <> evalS5 model w b
        | Implies(a, b) -> (not (evalS5 model w a)) || evalS5 model w b
        | Iff(a, b) -> evalS5 model w a = evalS5 model w b
        | Box a -> model |> List.forall (fun v -> evalS5 model v a)
        | Diamond a -> model |> List.exists (fun v -> evalS5 model v a)

    /// The outcome of an S5 model search. `TooLarge` is the honest answer when
    /// a formula has too many atoms × modalities to check exhaustively.
    type ModalSearch =
        | NoModel
        | Model of worlds: Map<string, bool> list * actual: int
        | TooLarge

    /// Find an S5 model and actual world making the formula TRUE, if any.
    /// The search is complete within its bound: worlds are drawn from all 2^n
    /// valuations, and models never need more worlds than modal operators + 1.
    let s5Satisfy (f: Formula) : ModalSearch =
        let names = atoms f
        let valuations = assignments names |> List.toArray
        let neededWorlds = max 1 (modalOps f + 1)
        let maxWorlds = min neededWorlds 6

        // Enumerate models as non-decreasing index tuples (world sets, order-free).
        let mutable examined = 0
        let budget = 200_000

        let rec search (k: int) : ModalSearch =
            if k > maxWorlds then NoModel
            else
                let rec extend (chosen: int list) (start: int) : ModalSearch =
                    if List.length chosen = k then
                        examined <- examined + 1
                        if examined > budget then TooLarge
                        else
                            let worlds = chosen |> List.rev |> List.map (fun i -> valuations.[i])
                            // Try each distinct world as the actual one.
                            let rec tryActual idx (seen: Set<int>) (indices: int list) =
                                match indices with
                                | [] -> NoModel
                                | i :: rest ->
                                    if Set.contains i seen then tryActual (idx + 1) seen rest
                                    elif evalS5 worlds valuations.[i] f then Model(worlds, idx)
                                    else tryActual (idx + 1) (Set.add i seen) rest
                            tryActual 0 Set.empty (List.rev chosen)
                    else
                        let mutable result = NoModel
                        let mutable i = start
                        while result = NoModel && i < valuations.Length do
                            result <- extend (i :: chosen) i
                            i <- i + 1
                        result

                match extend [] 0 with
                | NoModel -> search (k + 1)
                | found -> found

        match search 1 with
        // Finding nothing under a *truncated* bound proves nothing — say so.
        | NoModel when neededWorlds > maxWorlds -> TooLarge
        | result -> result

    /// Is the formula true at every world of every S5 model? (The modal
    /// analogue of a tautology.) `None` when the search is too large to settle.
    let s5Valid (f: Formula) : bool option =
        match s5Satisfy (Not f) with
        | NoModel -> Some true
        | Model _ -> Some false
        | TooLarge -> None

    /// One validity door for both logics: classical truth tables when the
    /// formula is modal-free, the S5 model search when it isn't.
    let valid (f: Formula) : bool option =
        if containsModal f then s5Valid f
        else Some((truthTable f).Verdict = Tautology)

    /// Two formulas are logically equivalent when they agree in every possible
    /// situation — every assignment classically, every world-arrangement
    /// modally. `None` when a modal search is too large to settle.
    let equivalent2 (a: Formula) (b: Formula) : bool option = valid (Iff(a, b))

    /// Classical-only convenience kept for the propositional call sites.
    let equivalent (a: Formula) (b: Formula) : bool =
        (truthTable (Iff(a, b))).Verdict = Tautology

    /// Check a *modal* argument in S5: search for a countermodel — an
    /// arrangement of worlds where every premise holds at the actual world
    /// but the conclusion fails there.
    let checkArgumentS5 (premises: Formula list) (conclusion: Formula) : ModalSearch =
        let together = List.fold (fun acc p -> And(acc, p)) (Not conclusion) premises
        s5Satisfy together

    /// Find one assignment where two formulas disagree — the concrete situation
    /// showing they are *not* the same claim. None when they are equivalent.
    let distinguishing (a: Formula) (b: Formula) : Map<string, bool> option =
        let names = atoms (Iff(a, b))
        assignments names |> List.tryFind (fun env -> eval env a <> eval env b)

    /// A small helper we use below: is this formula a tautology?
    let private tautology (f: Formula) : bool =
        (truthTable f).Verdict = Tautology

    // ---- Arguments ---------------------------------------------------------

    /// The result of checking an argument. An argument is *valid* when there is
    /// no possible assignment that makes every premise true but the conclusion
    /// false. Each such assignment is a *counterexample* — the exact situation
    /// in which the argument fails — and we keep them all for display.
    type ArgumentCheck =
        { Atoms: string list
          Counterexamples: Map<string, bool> list
          IsValid: bool }

    let checkArgument (premises: Formula list) (conclusion: Formula) : ArgumentCheck =
        // Every atom mentioned anywhere in the argument, without duplicates,
        // in order of first appearance.
        let names =
            premises @ [ conclusion ]
            |> List.collect atoms
            |> List.fold (fun acc a -> if List.contains a acc then acc else acc @ [ a ]) []

        let counterexamples =
            assignments names
            |> List.filter (fun env ->
                premises |> List.forall (eval env) && not (eval env conclusion))

        { Atoms = names
          Counterexamples = counterexamples
          IsValid = List.isEmpty counterexamples }

    // ---- Relations between claims ------------------------------------------

    /// How two formulas stand to each other — the classical "square of
    /// opposition", generalised to arbitrary formulas. We check the strong
    /// relations first, because each one implies some of the weaker ones.
    /// (RequireQualifiedAccess means you write `Relation.Entails`, which keeps
    /// these short names from colliding with anything else.)
    [<RequireQualifiedAccess>]
    type Relation =
        | Equivalent    // always the same truth value
        | Contradictory // always opposite truth values
        | Contrary      // never both true (but can both be false)
        | Subcontrary   // never both false (but can both be true)
        | Entails       // whenever the first is true, so is the second
        | EntailedBy    // the other way around
        | Independent   // none of the above — logically unrelated

    let relate (a: Formula) (b: Formula) : Relation =
        // `valid` (defined above) routes through S5 when either side is modal;
        // an undecidable (`None`) check degrades safely toward Independent.
        let holds f = valid f = Some true
        if holds (Iff(a, b)) then Relation.Equivalent
        elif holds (Iff(a, Not b)) then Relation.Contradictory
        elif holds (Not(And(a, b))) then Relation.Contrary
        elif holds (Or(a, b)) then Relation.Subcontrary
        elif holds (Implies(a, b)) then Relation.Entails
        elif holds (Implies(b, a)) then Relation.EntailedBy
        else Relation.Independent
