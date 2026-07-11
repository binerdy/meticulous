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
            | Pred _ -> f      // predicates aren't claim abbreviations
            | Const _ -> f
            | Not a -> Not(go seen a)
            | And(a, b) -> And(go seen a, go seen b)
            | Or(a, b) -> Or(go seen a, go seen b)
            | Xor(a, b) -> Xor(go seen a, go seen b)
            | Implies(a, b) -> Implies(go seen a, go seen b)
            | Iff(a, b) -> Iff(go seen a, go seen b)
            | Box a -> Box(go seen a)
            | Diamond a -> Diamond(go seen a)
            | Forall(x, a) -> Forall(x, go seen a)
            | Exists(x, a) -> Exists(x, go seen a)
        go Set.empty formula

    /// All distinct atom names in a formula, in order of first appearance.
    /// (Order matters so the truth table columns read left-to-right naturally.)
    let atoms (f: Formula) : string list =
        let rec go f acc =
            match f with
            | Atom name -> if List.contains name acc then acc else acc @ [ name ]
            | Pred _ -> acc      // predicate atoms are the first-order engine's business
            | Const _ -> acc
            | Not a
            | Box a
            | Diamond a
            | Forall(_, a)
            | Exists(_, a) -> go a acc
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
        // First-order formulas are routed to `evalFO`; these cases keep `eval`
        // total and never fire for a purely propositional formula.
        | Pred _ -> false
        | Forall(_, a) | Exists(_, a) -> eval env a

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
        | Atom _ | Pred _ | Const _ -> false
        | Box _ | Diamond _ -> true
        | Not a | Forall(_, a) | Exists(_, a) -> containsModal a
        | And(a, b) | Or(a, b) | Xor(a, b) | Implies(a, b) | Iff(a, b) ->
            containsModal a || containsModal b

    /// Does the formula use predicates or quantifiers? Decides whether the
    /// first-order model checker must take over from the propositional engine.
    let rec containsFO (f: Formula) : bool =
        match f with
        | Pred _ | Forall _ | Exists _ -> true
        | Atom _ | Const _ -> false
        | Not a | Box a | Diamond a -> containsFO a
        | And(a, b) | Or(a, b) | Xor(a, b) | Implies(a, b) | Iff(a, b) ->
            containsFO a || containsFO b

    /// How many modal operators a formula contains — used to bound the model
    /// search: a satisfiable S5 formula has a model with at most one world per
    /// modal operator, plus the actual world.
    let rec private modalOps (f: Formula) : int =
        match f with
        | Atom _ | Pred _ | Const _ -> 0
        | Box a | Diamond a -> 1 + modalOps a
        | Not a | Forall(_, a) | Exists(_, a) -> modalOps a
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
        // Quantified modal logic is a later storey; a bare predicate/quantifier
        // here is treated propositionally so `evalS5` stays total.
        | Pred _ -> false
        | Forall(_, a) | Exists(_, a) -> evalS5 model w a

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

    // ---- First-order logic over finite domains -------------------------------
    //
    // A first-order model is a finite domain {0 … size-1}, an assignment of
    // each constant to a domain element, and for each predicate the set of
    // argument-tuples at which it holds. Propositional atoms are just 0-ary
    // predicates whose "tuple" is the empty list.
    //
    // Full first-order validity is undecidable, so — exactly as with S5 — we
    // check *bounded* models (domains up to a small size). A refuting model
    // proves invalidity outright; finding none up to the bound is reported
    // honestly as "valid up to domain size N", never as plain "valid".

    type FOModel =
        { Size: int
          Constants: Map<string, int>
          Extensions: Map<string, Set<int list>> }

    /// (predicate name, arity) pairs used in a formula; atoms count as arity 0.
    let rec private signatures (f: Formula) : Set<string * int> =
        match f with
        | Atom name -> Set.singleton (name, 0)
        | Pred(name, args) -> Set.singleton (name, List.length args)
        | Const _ -> Set.empty
        | Not a | Box a | Diamond a | Forall(_, a) | Exists(_, a) -> signatures a
        | And(a, b) | Or(a, b) | Xor(a, b) | Implies(a, b) | Iff(a, b) ->
            Set.union (signatures a) (signatures b)

    /// The individual constants a formula names — term positions not bound by
    /// an enclosing quantifier. (A bound variable is not a constant.)
    let private freeConstants (f: Formula) : string list =
        let rec go bound f =
            match f with
            | Pred(_, args) -> args |> List.filter (fun t -> not (Set.contains t bound)) |> Set.ofList
            | Atom _ | Const _ -> Set.empty
            | Not a | Box a | Diamond a -> go bound a
            | Forall(x, a) | Exists(x, a) -> go (Set.add x bound) a
            | And(a, b) | Or(a, b) | Xor(a, b) | Implies(a, b) | Iff(a, b) ->
                Set.union (go bound a) (go bound b)
        go Set.empty f |> Set.toList

    /// Evaluate a formula at a first-order model under a variable assignment.
    let rec evalFO (m: FOModel) (env: Map<string, int>) (f: Formula) : bool =
        let holds name tuple =
            m.Extensions |> Map.tryFind name |> Option.map (Set.contains tuple) |> Option.defaultValue false
        match f with
        | Const b -> b
        | Atom name -> holds name []
        | Pred(name, args) ->
            let tuple =
                args |> List.map (fun t ->
                    match Map.tryFind t env with
                    | Some e -> e
                    | None -> Map.tryFind t m.Constants |> Option.defaultValue 0)
            holds name tuple
        | Not a -> not (evalFO m env a)
        | And(a, b) -> evalFO m env a && evalFO m env b
        | Or(a, b) -> evalFO m env a || evalFO m env b
        | Xor(a, b) -> evalFO m env a <> evalFO m env b
        | Implies(a, b) -> (not (evalFO m env a)) || evalFO m env b
        | Iff(a, b) -> evalFO m env a = evalFO m env b
        | Forall(x, a) -> [ 0 .. m.Size - 1 ] |> List.forall (fun e -> evalFO m (Map.add x e env) a)
        | Exists(x, a) -> [ 0 .. m.Size - 1 ] |> List.exists (fun e -> evalFO m (Map.add x e env) a)
        // Modality inside a first-order formula is out of scope for now; treated
        // transparently so the evaluator stays total.
        | Box a | Diamond a -> evalFO m env a

    type FOSearch =
        | FONoModel                    // no refuting model up to the bound
        | FOModelFound of FOModel
        | FOTooLarge                   // search space exceeded the budget

    /// Search for a first-order model (domain size 1 … maxSize) that makes the
    /// formula TRUE. Complete within the bound unless the budget is exhausted.
    let foSatisfy (f: Formula) : FOSearch =
        let sigs = signatures f |> Set.toList
        let consts = freeConstants f
        let maxSize = 4
        let mutable budget = 300_000
        let mutable truncated = false

        // every length-k tuple of domain elements
        let allTuples size k =
            let rec go k = if k = 0 then [ [] ] else [ for tail in go (k - 1) do for e in 0 .. size - 1 -> e :: tail ]
            go k

        let trySize size =
            let predTuples = sigs |> List.map (fun (n, k) -> n, allTuples size k)

            // choose an extension (subset of tuples) for each predicate, then an
            // element for each constant, then evaluate.
            let rec chooseExt remaining ext =
                match remaining with
                | [] -> chooseConsts consts Map.empty ext
                | (name, tuples) :: rest ->
                    let n = List.length tuples
                    let count = pown 2 n
                    let rec loop mask =
                        if mask >= count then FONoModel
                        else
                            let subset =
                                [ for i in 0 .. n - 1 do if (mask >>> i) &&& 1 = 1 then yield tuples.[i] ]
                                |> Set.ofList
                            match chooseExt rest (Map.add name subset ext) with
                            | FONoModel -> loop (mask + 1)
                            | found -> found
                    loop 0

            and chooseConsts remaining assigned ext =
                match remaining with
                | [] ->
                    budget <- budget - 1
                    if budget <= 0 then
                        truncated <- true
                        FOTooLarge
                    else
                        let model = { Size = size; Constants = assigned; Extensions = ext }
                        if evalFO model Map.empty f then FOModelFound model else FONoModel
                | c :: rest ->
                    let rec loop e =
                        if e >= size then FONoModel
                        else
                            match chooseConsts rest (Map.add c e assigned) ext with
                            | FONoModel -> loop (e + 1)
                            | found -> found
                    loop 0

            chooseExt predTuples Map.empty

        let rec search size =
            if size > maxSize then (if truncated then FOTooLarge else FONoModel)
            else
                match trySize size with
                | FONoModel -> search (size + 1)
                | found -> found

        search 1

    /// One validity door for all three logics: classical truth tables when the
    /// formula is plain, the S5 search when it is modal, and the finite-model
    /// search when it is first-order. `None` = the search was too large.
    let valid (f: Formula) : bool option =
        if containsFO f then
            match foSatisfy (Not f) with
            | FONoModel -> Some true       // no finite countermodel up to the bound
            | FOModelFound _ -> Some false
            | FOTooLarge -> None
        elif containsModal f then s5Valid f
        else Some((truthTable f).Verdict = Tautology)

    /// Search for a first-order countermodel to an argument: a model where all
    /// premises hold but the conclusion fails.
    let checkArgumentFO (premises: Formula list) (conclusion: Formula) : FOSearch =
        let together = List.fold (fun acc p -> And(acc, p)) (Not conclusion) premises
        foSatisfy together

    /// The (predicate, arity) pairs a formula uses, sorted by name.
    let predicateArities (f: Formula) : (string * int) list =
        signatures f |> Set.toList |> List.sortBy fst

    /// The individual constants a formula names.
    let individuals (f: Formula) : string list = freeConstants f

    // ---- Monadic (Venn) analysis --------------------------------------------
    //
    // When every predicate is one-place, a model is fully described by which
    // "cells" of the Venn diagram are inhabited — a cell being one combination
    // of in/out for each predicate. Equality-free monadic logic needs at most
    // one witness per cell, so we can enumerate models exactly and read off,
    // for each region, whether the premises force it empty, force it occupied,
    // or leave it open — and where each named individual must sit.

    type CellStatus =
        | CellEmpty       // the premises rule this region out (shade it)
        | CellOccupied    // the premises guarantee something here (mark it)
        | CellFree        // undetermined

    type VennAnalysis =
        { Predicates: string list
          Consistent: bool
          /// cell index (bitmask over predicates, bit j = predicate j is "in") → status
          Cells: Map<int, CellStatus>
          /// individual name → the set of cells it may occupy across all models
          Placement: Map<string, Set<int>> }

    let analyzeMonadic (preds: string list) (consts: string list) (premise: Formula) : VennAnalysis =
        let n = List.length preds
        let cellCount = 1 <<< n
        let cellHas cell j = (cell >>> j) &&& 1 = 1

        // Build the finite model for a given set of occupied cells and an
        // assignment of each constant to one of those cells' witnesses.
        let modelFor (occupied: int list) (constCells: Map<string, int>) : FOModel =
            let size = List.length occupied
            let elementOfCell = occupied |> List.mapi (fun idx cell -> cell, idx) |> Map.ofList
            let ext =
                preds
                |> List.mapi (fun j name ->
                    name, occupied |> List.mapi (fun idx cell -> idx, cell) |> List.choose (fun (idx, cell) -> if cellHas cell j then Some [ idx ] else None) |> Set.ofList)
                |> Map.ofList
            { Size = size
              Constants = constCells |> Map.map (fun _ cell -> Map.find cell elementOfCell)
              Extensions = ext }

        // Every non-empty set of occupied cells, paired with every placement of
        // the constants into those cells; keep the ones that satisfy the premise.
        let allOccupancies =
            [ for mask in 1 .. (1 <<< cellCount) - 1 ->
                  [ for c in 0 .. cellCount - 1 do if (mask >>> c) &&& 1 = 1 then yield c ] ]

        let rec placements (occupied: int list) (remaining: string list) : Map<string, int> list =
            match remaining with
            | [] -> [ Map.empty ]
            | c :: rest ->
                [ for cell in occupied do
                      for tail in placements occupied rest -> Map.add c cell tail ]

        let satisfying =
            [ for occupied in allOccupancies do
                  for cmap in placements occupied consts do
                      let model = modelFor occupied cmap
                      if evalFO model Map.empty premise then yield occupied, cmap ]

        let consistent = not (List.isEmpty satisfying)

        let cells =
            [ for cell in 0 .. cellCount - 1 ->
                  let canOccupied = satisfying |> List.exists (fun (occ, _) -> List.contains cell occ)
                  let canEmpty = satisfying |> List.exists (fun (occ, _) -> not (List.contains cell occ))
                  let status =
                      if not consistent then CellFree
                      elif not canOccupied then CellEmpty
                      elif not canEmpty then CellOccupied
                      else CellFree
                  cell, status ]
            |> Map.ofList

        let placement =
            consts
            |> List.map (fun c ->
                c, satisfying |> List.choose (fun (_, cmap) -> Map.tryFind c cmap) |> Set.ofList)
            |> Map.ofList

        { Predicates = preds; Consistent = consistent; Cells = cells; Placement = placement }

    /// Describe a first-order model in plain lines: its domain, what each
    /// constant names, and the extension of each predicate. Elements are shown
    /// as a, b, c, … The formula tells us which constants and predicates to list.
    let describeModel (m: FOModel) (f: Formula) : string list =
        let elem i = string (char (int 'a' + i))
        let domain = "domain = { " + String.concat ", " [ for i in 0 .. m.Size - 1 -> elem i ] + " }"
        let constLines =
            freeConstants f
            |> List.map (fun c -> c + " = " + elem (Map.tryFind c m.Constants |> Option.defaultValue 0))
        let predLines =
            signatures f
            |> Set.toList
            |> List.sortBy fst
            |> List.map (fun (name, arity) ->
                let ext = Map.tryFind name m.Extensions |> Option.defaultValue Set.empty
                if arity = 0 then
                    name + " = " + (if Set.contains [] ext then "true" else "false")
                else
                    let tuples =
                        ext
                        |> Set.toList
                        |> List.map (fun t ->
                            match t with
                            | [ x ] -> elem x
                            | _ -> "(" + String.concat ", " (List.map elem t) + ")")
                    name + " = { " + String.concat ", " tuples + " }")
        [ domain ] @ constLines @ predLines

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
