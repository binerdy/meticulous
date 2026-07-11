namespace Meticulous

open Meticulous.Ast

/// Pretty-prints a Formula back into text using real logic symbols
/// (∧ ∨ ¬ → ↔ ⊕) and the *fewest* parentheses needed to keep the meaning
/// unambiguous. This is the display form shown in the rendered preview.
module Render =

    /// A binding strength for each kind of node. Higher = binds tighter, so a
    /// child with a *lower* number than its parent must be wrapped in parens.
    let private precedence f =
        match f with
        | Atom _
        | Pred _
        | Const _ -> 100
        | Not _
        | Box _
        | Diamond _ -> 90
        | And _ -> 80
        | Or _ -> 70
        | Xor _ -> 60
        | Implies _ -> 50
        | Iff _ -> 40
        // Quantifiers scope as far right as possible, so they bind loosest of
        // all — anything to their right is inside them unless parenthesised.
        | Forall _
        | Exists _ -> 20

    /// Render a formula to a minimally-parenthesised Unicode string.
    let toUnicode (formula: Formula) : string =
        let rec go f =
            let parentPrec = precedence f

            // Decide whether a child needs wrapping. Beyond raw precedence we
            // also respect associativity: → groups to the right, so a → on the
            // *left* of another → needs parens; the other binary ops group to
            // the left, so an equal-precedence child on the *right* needs parens.
            let wrap onLeft child =
                let childPrec = precedence child
                let needs =
                    if childPrec < parentPrec then true
                    elif childPrec = parentPrec then
                        match f with
                        | Implies _ -> onLeft        // right associative
                        | _ -> not onLeft            // left associative
                    else false
                if needs then "(" + go child + ")" else go child

            match f with
            | Atom n -> n
            | Pred(n, []) -> n
            | Pred(n, args) -> n + "(" + String.concat ", " args + ")"
            | Const true -> "⊤"
            | Const false -> "⊥"
            | Not a -> "¬" + wrap true a
            | Box a -> "□" + wrap true a
            | Diamond a -> "◇" + wrap true a
            | Forall(x, a) -> "∀" + x + ". " + wrap false a
            | Exists(x, a) -> "∃" + x + ". " + wrap false a
            | And(a, b) -> wrap true a + " ∧ " + wrap false b
            | Or(a, b) -> wrap true a + " ∨ " + wrap false b
            | Xor(a, b) -> wrap true a + " ⊕ " + wrap false b
            | Implies(a, b) -> wrap true a + " → " + wrap false b
            | Iff(a, b) -> wrap true a + " ↔ " + wrap false b

        go formula

    /// Render a formula as an English sentence, using each proposition's gloss
    /// where the document declared one. This is what lets a claim read back as
    /// the thought it formalises: `policy -> growth` becomes
    /// "If the tax cut was enacted, then the economy grew."
    let toEnglish (glossOf: string -> string option) (formula: Formula) : string =
        // A gloss like "It is raining" should read "...if it is raining..."
        // mid-sentence, so we lower its first letter — but leave things that
        // look like acronyms ("AI rules the world") alone.
        let soften (s: string) =
            if s.Length >= 2 && System.Char.IsUpper s.[0] && System.Char.IsLower s.[1] then
                string (System.Char.ToLower s.[0]) + s.Substring 1
            else
                s

        // "both … and …" / "either …, or …" keep the grouping audible: without
        // them, "not A or B" could be heard as ¬(A ∨ B) or as (¬A) ∨ B.
        let rec go f =
            match f with
            | Atom name -> glossOf name |> Option.map soften |> Option.defaultValue name
            // A unary predicate reads naturally as "socrates is Man"; anything
            // else falls back to the symbolic form spoken aloud.
            | Pred(name, [ t ]) -> t + " is " + name
            | Pred(name, []) -> glossOf name |> Option.map soften |> Option.defaultValue name
            | Pred(name, args) -> name + " holds of " + String.concat ", " args
            | Const true -> "true"
            | Const false -> "false"
            | Not a -> "it is not the case that " + go a
            | Box a -> "it is necessary that " + go a
            | Diamond a -> "it is possible that " + go a
            | Forall(x, a) -> "for every " + x + ", " + go a
            | Exists(x, a) -> "for some " + x + ", " + go a
            | And(a, b) -> "both " + go a + ", and " + go b
            | Or(a, b) -> "either " + go a + ", or " + go b
            | Xor(a, b) -> "either " + go a + " or " + go b + ", but not both"
            | Implies(a, b) -> "if " + go a + ", then " + go b
            | Iff(a, b) -> go a + " exactly when " + go b

        let sentence = go formula
        if sentence = "" then ""
        else string (System.Char.ToUpper sentence.[0]) + sentence.Substring 1 + "."
