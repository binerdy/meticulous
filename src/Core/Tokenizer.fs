namespace Meticulous

/// Turns the text of a *formula* (e.g. "p -> (q and not r)") into a flat list
/// of tokens the parser can consume.
///
/// Document structure (headings, prop, claim, ...) is handled line-by-line in
/// Parser.fs — this module only cares about the small expression language of
/// connectives. It accepts three spellings of every operator:
///   * words:     not  and  or  xor  implies  iff
///   * ASCII:     ~ !  &    |          ->       <->
///   * Unicode:   ¬    ∧    ∨   ⊕      →        ↔
/// so a rendered formula can be pasted straight back in and re-parsed.
module Tokenizer =

    type Token =
        | TIdent of string     // a proposition name, e.g. p, rain, q1
        | TTrue                // true / ⊤
        | TFalse               // false / ⊥
        | TNot                 // not  ~  !  ¬
        | TAnd                 // and  &  ∧
        | TOr                  // or   |  ∨
        | TXor                 // xor  ⊕
        | TImplies             // implies  ->  →
        | TIff                 // iff  <->  ↔
        | TLParen              // (
        | TRParen              // )

    /// Is this character allowed inside a proposition name?
    let private isIdentChar c =
        System.Char.IsLetterOrDigit c || c = '_'

    /// Map a bare word to its keyword token, or treat it as a proposition name.
    let private wordToToken (word: string) =
        match word with
        | "not" -> TNot
        | "and" -> TAnd
        | "or" -> TOr
        | "xor" -> TXor
        | "implies" -> TImplies
        | "iff" -> TIff
        | "true" -> TTrue
        | "false" -> TFalse
        | other -> TIdent other

    /// Tokenize a formula string. Returns Ok tokens, or Error with a message.
    let tokenize (input: string) : Result<Token list, string> =
        // We walk the string by index. `loop` accumulates tokens in reverse
        // (cheap to prepend to a list) and we reverse once at the very end.
        let rec loop i acc =
            if i >= input.Length then Ok(List.rev acc)
            else
                let c = input.[i]
                match c with
                | ' ' | '\t' -> loop (i + 1) acc
                | '(' -> loop (i + 1) (TLParen :: acc)
                | ')' -> loop (i + 1) (TRParen :: acc)
                | '&' | '∧' -> loop (i + 1) (TAnd :: acc)
                | '|' | '∨' -> loop (i + 1) (TOr :: acc)
                | '~' | '!' | '¬' -> loop (i + 1) (TNot :: acc)
                | '⊕' -> loop (i + 1) (TXor :: acc)
                | '→' -> loop (i + 1) (TImplies :: acc)
                | '↔' -> loop (i + 1) (TIff :: acc)
                | '⊤' -> loop (i + 1) (TTrue :: acc)
                | '⊥' -> loop (i + 1) (TFalse :: acc)
                | '-' when i + 1 < input.Length && input.[i + 1] = '>' ->
                    loop (i + 2) (TImplies :: acc)
                | '<' when i + 2 < input.Length && input.[i + 1] = '-' && input.[i + 2] = '>' ->
                    loop (i + 3) (TIff :: acc)
                | _ when System.Char.IsLetter c ->
                    // Read a whole word, then decide if it's a keyword.
                    let start = i
                    let mutable j = i
                    while j < input.Length && isIdentChar input.[j] do
                        j <- j + 1
                    let word = input.Substring(start, j - start)
                    loop j (wordToToken word :: acc)
                | other -> Error(sprintf "Unexpected character '%c' in formula" other)
        loop 0 []
