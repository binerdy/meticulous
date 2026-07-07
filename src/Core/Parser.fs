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

        elif line = "analyze" then
            Ok(Some Analyze)

        elif line.StartsWith "argument" then
            // Argument *blocks* are assembled in parseLines below; a header
            // reaching this function means the opening brace was missing.
            Error "an `argument` needs `{` at the end of its first line — e.g.  argument my-point {"

        else
            // Anything we don't recognise is plain prose.
            Ok(Some(Prose line))

    /// Parse the interior of an `argument name { ... }` block.
    /// `body` carries (lineNumber, rawLine) for everything between the braces.
    /// On success we get one Argument statement; on failure, every error found.
    let private parseArgumentBlock name headerLine (body: (int * string) list) : Result<Statement, (int * string) list> =
        let mutable premises = []
        let mutable conclusion = None
        let mutable errors = []

        for (no, raw) in body do
            let line = (stripComment raw).Trim()
            if line = "" then
                () // blank line — fine
            elif line.Length >= 3 && line |> Seq.forall (fun c -> c = '-') then
                () // the `---` inference line: decoration between premises and conclusion
            elif line.StartsWith "premise " then
                match parseFormula (line.Substring 8) with
                | Ok f -> premises <- premises @ [ f ]
                | Error e -> errors <- errors @ [ no, e ]
            elif line.StartsWith "conclude " then
                match parseFormula (line.Substring 9), conclusion with
                | Ok f, None -> conclusion <- Some f
                | Ok _, Some _ -> errors <- errors @ [ no, "an argument can only have one `conclude`" ]
                | Error e, _ -> errors <- errors @ [ no, e ]
            else
                errors <- errors @ [ no, "expected `premise`, `---`, or `conclude` inside an argument" ]

        // Zero premises is allowed: `argument x { conclude ... }` claims the
        // conclusion is a *theorem* — provable from nothing, i.e. a tautology.
        match errors, conclusion with
        | [], None -> Error [ headerLine, "an argument needs a `conclude` line" ]
        | [], Some c -> Ok(Argument(name, premises, c))
        | errs, _ -> Error errs

    /// Parse a whole source into (lineNumber, statement-or-error) entries,
    /// grouping multi-line `argument { }` blocks into single statements.
    /// This per-line shape lets callers be *resilient*: one bad line becomes
    /// one error entry while everything around it still parses.
    let parseLines (source: string) : (int * Result<Statement option, string>) list =
        let lines = source.Replace("\r\n", "\n").Split('\n')
        let results = ResizeArray()
        let mutable i = 0

        while i < lines.Length do
            let no = i + 1
            let line = (stripComment lines.[i]).Trim()

            if line.StartsWith "argument " && line.EndsWith "{" then
                // Collect the block body up to the closing brace.
                let name = line.Substring(9, line.Length - 10).Trim()
                let body = ResizeArray()
                let mutable j = i + 1
                let mutable closed = false
                while not closed && j < lines.Length do
                    if (stripComment lines.[j]).Trim() = "}" then closed <- true
                    else
                        body.Add(j + 1, lines.[j])
                        j <- j + 1

                if not closed then
                    results.Add(no, Error "this `argument {` is never closed with `}`")
                    i <- lines.Length
                else
                    match parseArgumentBlock name no (List.ofSeq body) with
                    | Ok st -> results.Add(no, Ok(Some st))
                    | Error errs -> for (n, e) in errs do results.Add(n, Error e)
                    i <- j + 1
            else
                results.Add(no, parseLine lines.[i])
                i <- i + 1

        List.ofSeq results

    /// Parse a whole document. Collects every parse error with its line number
    /// so the editor can show them all at once, rather than stopping at the first.
    let parseDocument (source: string) : Result<Document, (int * string) list> =
        let parsed = parseLines source
        let errors =
            parsed |> List.choose (fun (no, r) -> match r with Error e -> Some(no, e) | _ -> None)
        if List.isEmpty errors then
            Ok(parsed |> List.choose (fun (_, r) -> match r with Ok st -> st | Error _ -> None))
        else
            Error errors
