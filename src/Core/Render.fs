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
        | Const _ -> 100
        | Not _ -> 90
        | And _ -> 80
        | Or _ -> 70
        | Xor _ -> 60
        | Implies _ -> 50
        | Iff _ -> 40

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
            | Const true -> "⊤"
            | Const false -> "⊥"
            | Not a -> "¬" + wrap true a
            | And(a, b) -> wrap true a + " ∧ " + wrap false b
            | Or(a, b) -> wrap true a + " ∨ " + wrap false b
            | Xor(a, b) -> wrap true a + " ⊕ " + wrap false b
            | Implies(a, b) -> wrap true a + " → " + wrap false b
            | Iff(a, b) -> wrap true a + " ↔ " + wrap false b

        go formula
