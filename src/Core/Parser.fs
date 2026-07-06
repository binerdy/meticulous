namespace Meticulous

open Meticulous.Ast
open Meticulous.Tokenizer

/// Two parsers live here:
///   1. `parseFormula` — turns tokens into a Formula tree, respecting the
///      precedence of connectives.
///   2. `parseLine` / `parseDocument` — a line-oriented reader for whole
///      .met documents.
module Parser =

    // ---- Formula parser --------------------------------------------------
    //
    // We use "recursive descent by precedence": one function per precedence
    // level, each calling the next-tighter-binding level. Reading top to
    // bottom is reading loosest to tightest:
    //
    //   iff      (loosest)   p <-> q
    //   implies               p -> q          (right associative)
    //   xor                   p xor q
    //   or                    p or q
    //   and                   p and q
    //   unary not             not p
    //   atom     (tightest)   p, true, ( ... )
    //
    // Every function has the shape:  Token list -> Result<Formula * Token list, string>
    // i.e. "given these tokens, parse one thing and hand back what's left over".

    let rec private parseIff tokens =
        parseImplies tokens
        |> Result.bind (fun (left, rest) ->
            // iff chains left-to-right:  a <-> b <-> c  =  (a <-> b) <-> c
            let rec loop l toks =
                match toks with
                | TIff :: more ->
                    parseImplies more |> Result.bind (fun (r, rest') -> loop (Iff(l, r)) rest')
                | _ -> Ok(l, toks)
            loop left rest)

    and private parseImplies tokens =
        parseXor tokens
        |> Result.bind (fun (left, rest) ->
            match rest with
            | TImplies :: more ->
                // implies is right associative:  a -> b -> c  =  a -> (b -> c)
                parseImplies more |> Result.map (fun (r, rest') -> Implies(left, r), rest')
            | _ -> Ok(left, rest))

    and private parseXor tokens =
        parseOr tokens
        |> Result.bind (fun (left, rest) ->
            let rec loop l toks =
                match toks with
                | TXor :: more -> parseOr more |> Result.bind (fun (r, rest') -> loop (Xor(l, r)) rest')
                | _ -> Ok(l, toks)
            loop left rest)

    and private parseOr tokens =
        parseAnd tokens
        |> Result.bind (fun (left, rest) ->
            let rec loop l toks =
                match toks with
                | TOr :: more -> parseAnd more |> Result.bind (fun (r, rest') -> loop (Or(l, r)) rest')
                | _ -> Ok(l, toks)
            loop left rest)

    and private parseAnd tokens =
        parseUnary tokens
        |> Result.bind (fun (left, rest) ->
            let rec loop l toks =
                match toks with
                | TAnd :: more -> parseUnary more |> Result.bind (fun (r, rest') -> loop (And(l, r)) rest')
                | _ -> Ok(l, toks)
            loop left rest)

    and private parseUnary tokens =
        match tokens with
        | TNot :: more -> parseUnary more |> Result.map (fun (f, rest) -> Not f, rest)
        | _ -> parseAtom tokens

    and private parseAtom tokens =
        match tokens with
        | TIdent name :: rest -> Ok(Atom name, rest)
        | TTrue :: rest -> Ok(Const true, rest)
        | TFalse :: rest -> Ok(Const false, rest)
        | TLParen :: rest ->
            parseIff rest
            |> Result.bind (fun (inner, rest') ->
                match rest' with
                | TRParen :: rest'' -> Ok(inner, rest'')
                | _ -> Error "Expected a closing ')'")
        | [] -> Error "Unexpected end of formula"
        | _ -> Error "Expected a proposition, a constant, or '('"

    /// Parse a formula from raw text (the full pipeline: tokenize then parse).
    let parseFormula (text: string) : Result<Formula, string> =
        tokenize text
        |> Result.bind (fun tokens ->
            parseIff tokens
            |> Result.bind (fun (f, rest) ->
                match rest with
                | [] -> Ok f
                | _ -> Error "Unexpected leftover input after the formula"))

    // ---- Document parser -------------------------------------------------

    /// Remove an inline `//` comment. (Naive, but formulas never contain "//".)
    let private stripComment (line: string) =
        match line.IndexOf "//" with
        | -1 -> line
        | idx -> line.Substring(0, idx)

    /// Is the whole (trimmed) string a single proposition name?
    let private isSingleIdentifier (s: string) =
        s.Length > 0
        && System.Char.IsLetter s.[0]
        && s |> Seq.forall (fun c -> System.Char.IsLetterOrDigit c || c = '_')

    /// Split "left <kw> right" on a keyword surrounded by spaces, if present.
    let private splitOnKeyword (s: string) (kw: string) =
        let marker = " " + kw + " "
        match s.IndexOf marker with
        | -1 -> None
        | idx -> Some(s.Substring(0, idx).Trim(), s.Substring(idx + marker.Length).Trim())

    /// Parse a single line into an optional statement.
    /// Blank/whitespace-only lines return `Ok None`.
    let parseLine (raw: string) : Result<Statement option, string> =
        let line = (stripComment raw).Trim()

        if line = "" then
            Ok None

        elif line.StartsWith "#" then
            let level = line.Length - (line.TrimStart('#')).Length
            let text = (line.TrimStart('#')).Trim()
            Ok(Some(Heading(level, text)))

        elif line.StartsWith "prop " then
            let rest = line.Substring(5)
            match rest.IndexOf ':' with
            | -1 -> Error "a `prop` needs a ':'  — e.g.  prop p : It is raining"
            | idx ->
                let name = rest.Substring(0, idx).Trim()
                let gloss = rest.Substring(idx + 1).Trim()
                Ok(Some(Prop(name, gloss)))

        elif line.StartsWith "claim " then
            let rest = line.Substring(6)
            match rest.IndexOf ':' with
            | -1 -> Error "a `claim` needs a ':'  — e.g.  claim C1 : p -> q"
            | idx ->
                let name = rest.Substring(0, idx).Trim()
                let body = rest.Substring(idx + 1).Trim()
                parseFormula body |> Result.map (fun f -> Some(Claim(name, f)))

        elif line.StartsWith "table " then
            let target = line.Substring(6).Trim()
            if isSingleIdentifier target then
                Ok(Some(Table(TargetRef target)))
            else
                parseFormula target |> Result.map (fun f -> Some(Table(TargetFormula f)))

        elif line.StartsWith "check " then
            let rest = line.Substring(6).Trim()
            match splitOnKeyword rest "equivalent" with
            | Some (l, r) ->
                parseFormula l
                |> Result.bind (fun lf -> parseFormula r |> Result.map (fun rf -> Some(Check(Equivalent(lf, rf)))))
            | None -> parseFormula rest |> Result.map (fun f -> Some(Check(Verdict f)))

        else
            // Anything we don't recognise is plain prose.
            Ok(Some(Prose line))

    /// Parse a whole document. Collects every parse error with its line number
    /// so the editor can show them all at once, rather than stopping at the first.
    let parseDocument (source: string) : Result<Document, (int * string) list> =
        let lines = source.Replace("\r\n", "\n").Split('\n')
        let mutable statements = []
        let mutable errors = []
        lines
        |> Array.iteri (fun i line ->
            match parseLine line with
            | Ok (Some st) -> statements <- st :: statements
            | Ok None -> ()
            | Error e -> errors <- (i + 1, e) :: errors)
        if List.isEmpty errors then Ok(List.rev statements)
        else Error(List.rev errors)
