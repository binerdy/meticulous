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
        | TBox :: more -> parseUnary more |> Result.map (fun (f, rest) -> Box f, rest)
        | TDiamond :: more -> parseUnary more |> Result.map (fun (f, rest) -> Diamond f, rest)
        // Quantifiers bind loosest: their body is parsed at the top level, so
        // `forall x. P(x) -> Q(x)` scopes over the whole implication. They still
        // live at the unary level so they can appear as an operand, as in
        // `p -> forall x. Q(x)`.
        | TForall :: TIdent x :: TDot :: more -> parseIff more |> Result.map (fun (f, rest) -> Forall(x, f), rest)
        | TExists :: TIdent x :: TDot :: more -> parseIff more |> Result.map (fun (f, rest) -> Exists(x, f), rest)
        | (TForall | TExists) :: _ -> Error "a quantifier needs a variable then '.', e.g.  forall x. Human(x)"
        | _ -> parseAtom tokens

    // Parse the comma-separated argument list of a predicate, after its '('.
    and private parseTermList tokens =
        match tokens with
        | TRParen :: rest -> Ok([], rest)
        | _ ->
            let rec loop acc toks =
                match toks with
                | TIdent t :: TComma :: more -> loop (acc @ [ t ]) more
                | TIdent t :: TRParen :: more -> Ok(acc @ [ t ], more)
                | _ -> Error "expected a term (a name), ',' or ')' in the predicate's arguments"
            loop [] tokens

    and private parseAtom tokens =
        match tokens with
        // An identifier immediately followed by '(' is a predicate application.
        | TIdent name :: TLParen :: rest ->
            parseTermList rest |> Result.map (fun (terms, rest') -> Pred(name, terms), rest')
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

    // Words that only appear in the prose surface — their presence means a
    // failed symbolic parse should report the *prose* error instead.
    let private proseSignals =
        set [ "if"; "then"; "all"; "no"; "some"; "every"; "either"; "neither"; "nor"; "is"; "are" ]

    /// Parse a formula written either symbolically (p -> q) or as an English
    /// sentence (If p, then q). Symbolic is tried first; prose is the fallback.
    let parseAny (text: string) : Result<Formula, string> =
        match parseFormula text with
        | Ok f -> Ok f
        | Error symErr ->
            match Prose.parseSentence text with
            | Ok f -> Ok f
            | Error proseErr ->
                let looksProse =
                    text.Split([| ' '; '\t' |], System.StringSplitOptions.RemoveEmptyEntries)
                    |> Array.exists (fun w -> Set.contains (w.ToLowerInvariant()) proseSignals)
                Error(if looksProse then proseErr else symErr)

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

    /// Try to read one relation end from the front of a string: either a
    /// quoted ad-hoc statement, or a single (possibly kebab-case) name.
    /// Returns the ref and whatever text follows it.
    let private tryRef (s: string) : (RelRef * string) option =
        let s = s.TrimStart()
        if s.StartsWith "\"" then
            match s.IndexOf('"', 1) with
            | -1 -> None
            | close -> Some(Quoted(s.Substring(1, close - 1)), s.Substring(close + 1))
        else
            let isNameChar c = System.Char.IsLetterOrDigit c || c = '_' || c = '-'
            let len = s |> Seq.takeWhile isNameChar |> Seq.length
            if len = 0 || not (System.Char.IsLetter s.[0]) then None
            else Some(Named(s.Substring(0, len)), s.Substring len)

    let private relationVerbs =
        [ "supports", Supports
          "presupposes", Presupposes
          "contradicts", Contradicts
          "entails", Entails
          "equivalent-to", EquivalentTo ]

    /// Recognise `<ref> <verb> <ref>` — e.g.  C1 supports C2  or
    /// `A entails "the streets flood"`. Anything that doesn't fit exactly
    /// (extra words, missing ref) is left alone, so prose stays prose.
    let private tryParseRelation (line: string) : Statement option =
        tryRef line
        |> Option.bind (fun (left, rest) ->
            let rest = rest.TrimStart()
            relationVerbs
            |> List.tryPick (fun (verb, kind) ->
                if rest.StartsWith(verb + " ") then
                    tryRef (rest.Substring(verb.Length + 1))
                    |> Option.bind (fun (right, leftover) ->
                        if leftover.Trim() = "" then Some(Relates(left, kind, right)) else None)
                else
                    None))

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
                parseAny body |> Result.map (fun f -> Some(Claim(name, f)))

        elif line.StartsWith "table " then
            let target = line.Substring(6).Trim()
            if isSingleIdentifier target then
                Ok(Some(Table(TargetRef target)))
            else
                parseAny target |> Result.map (fun f -> Some(Table(TargetFormula f)))

        elif line.StartsWith "check " then
            let rest = line.Substring(6).Trim()
            match splitOnKeyword rest "equivalent" with
            | Some (l, r) ->
                parseAny l
                |> Result.bind (fun lf -> parseAny r |> Result.map (fun rf -> Some(Check(Equivalent(lf, rf)))))
            | None -> parseAny rest |> Result.map (fun f -> Some(Check(Verdict f)))

        elif line = "analyze" then
            Ok(Some Analyze)

        elif line = "map" then
            Ok(Some RelationMap)

        elif line.StartsWith "argument" then
            // Argument *blocks* are assembled in parseLines below; a header
            // reaching this function means the opening brace was missing.
            Error "an `argument` needs `{` at the end of its first line — e.g.  argument my-point {"

        elif line.StartsWith "proof" then
            Error "a `proof` needs `{` at the end of its first line — e.g.  proof my-derivation {"

        elif line.StartsWith "venn " then
            // The single-line form `venn some-argument` draws an existing
            // argument's diagram; the block form `venn x { … }` is handled above.
            let target = line.Substring(5).Trim()
            let isName (s: string) =
                s.Length > 0
                && System.Char.IsLetter s.[0]
                && s |> Seq.forall (fun c -> System.Char.IsLetterOrDigit c || c = '_' || c = '-')
            if isName target then Ok(Some(VennRef target))
            else Error "write `venn <argument-name>` to draw an argument, or `venn name { … }` for a fresh diagram"

        elif line = "venn" then
            Error "`venn` needs an argument name (venn my-argument) or a block (venn name { … })"

        else
            // A relation assertion like `C1 supports C2`? A whole prose argument
            // like `If P, then Q. P. Therefore, Q.`? Otherwise, plain prose.
            match tryParseRelation line with
            | Some relation -> Ok(Some relation)
            | None ->
                match Prose.tryParseArgument line with
                | Some(name, premises, conclusion) -> Ok(Some(Argument(name, premises, conclusion)))
                | None -> Ok(Some(Prose line))

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

    /// Parse the interior of a `proof name { ... }` block. Each line is
    ///   N. premise <formula>
    ///   N. <formula> by <rule-name>            (for laws needing no citations)
    ///   N. <formula> by <rule-name> from 1, 2
    let private parseProofBlock name headerLine (body: (int * string) list) : Result<Statement, (int * string) list> =
        let mutable steps = []
        let mutable errors = []

        // "3." -> Some (3, rest-of-line); None when the line has no number.
        let splitNumber (line: string) =
            let digits = line |> Seq.takeWhile System.Char.IsDigit |> Seq.length
            if digits > 0 && digits < line.Length && line.[digits] = '.' then
                Some(int (line.Substring(0, digits)), line.Substring(digits + 1).Trim())
            else
                None

        for (no, raw) in body do
            let line = (stripComment raw).Trim()
            if line = "" then
                ()
            else
                match splitNumber line with
                | None ->
                    errors <- errors @ [ no, "every proof line starts with its number — e.g.  3. wet by modus-ponens from 1, 2" ]
                | Some(number, rest) ->
                    if rest.StartsWith "premise " then
                        match parseFormula (rest.Substring 8) with
                        | Ok f -> steps <- steps @ [ ProofPremise(number, f) ]
                        | Error e -> errors <- errors @ [ no, e ]
                    else
                        // The justification comes after the *last* " by ", so a
                        // proposition named `by` can't confuse the split.
                        match rest.LastIndexOf " by " with
                        | -1 ->
                            errors <- errors @ [ no, "a derived line needs a justification — e.g.  wet by modus-ponens from 1, 2" ]
                        | idx ->
                            let formulaText = rest.Substring(0, idx)
                            let justification = rest.Substring(idx + 4).Trim()
                            let rule, refsText =
                                match justification.IndexOf " from " with
                                | -1 -> justification, ""
                                | j -> justification.Substring(0, j).Trim(), justification.Substring(j + 6)
                            let refs =
                                refsText.Split(',')
                                |> Array.map (fun s -> s.Trim())
                                |> Array.filter (fun s -> s <> "")
                                |> Array.toList
                            let badRefs = refs |> List.filter (fun r -> not (r |> Seq.forall System.Char.IsDigit))
                            if rule = "" then
                                errors <- errors @ [ no, "missing rule name after `by`" ]
                            elif not (List.isEmpty badRefs) then
                                errors <- errors @ [ no, sprintf "citations after `from` must be line numbers, not %A" (List.head badRefs) ]
                            else
                                match parseFormula formulaText with
                                | Ok f -> steps <- steps @ [ ProofDerived(number, f, rule, refs |> List.map int) ]
                                | Error e -> errors <- errors @ [ no, e ]

        match errors, steps with
        | [], [] -> Error [ headerLine, "a proof needs at least one line" ]
        | [], _ -> Ok(Proof(name, steps))
        | errs, _ -> Error errs

    /// Parse the interior of a `venn name { ... }` block — like an argument,
    /// but the `conclude` line is optional (a Venn diagram of premises alone is
    /// perfectly meaningful).
    let private parseVennBlock name headerLine (body: (int * string) list) : Result<Statement, (int * string) list> =
        let mutable premises = []
        let mutable conclusion = None
        let mutable errors = []

        for (no, raw) in body do
            let line = (stripComment raw).Trim()
            if line = "" then ()
            elif line.Length >= 3 && line |> Seq.forall (fun c -> c = '-') then ()
            elif line.StartsWith "premise " then
                match parseFormula (line.Substring 8) with
                | Ok f -> premises <- premises @ [ f ]
                | Error e -> errors <- errors @ [ no, e ]
            elif line.StartsWith "conclude " then
                match parseFormula (line.Substring 9), conclusion with
                | Ok f, None -> conclusion <- Some f
                | Ok _, Some _ -> errors <- errors @ [ no, "a venn block can only have one `conclude`" ]
                | Error e, _ -> errors <- errors @ [ no, e ]
            else
                errors <- errors @ [ no, "expected `premise` or `conclude` inside a venn block" ]

        match errors, premises with
        | [], [] -> Error [ headerLine, "a venn block needs at least one `premise`" ]
        | [], _ -> Ok(Venn(name, premises, conclusion))
        | errs, _ -> Error errs

    /// Parse a whole source into (lineNumber, statement-or-error) entries,
    /// grouping multi-line `argument { }` blocks into single statements.
    /// This per-line shape lets callers be *resilient*: one bad line becomes
    /// one error entry while everything around it still parses.
    let parseLines (source: string) : (int * Result<Statement option, string>) list =
        let lines = source.Replace("\r\n", "\n").Split('\n')
        let results = ResizeArray()
        let mutable i = 0

        // Which block parser handles a given header keyword.
        let blockKind (line: string) =
            if line.StartsWith "argument " && line.EndsWith "{" then
                Some("argument", parseArgumentBlock)
            elif line.StartsWith "proof " && line.EndsWith "{" then
                Some("proof", parseProofBlock)
            elif line.StartsWith "venn " && line.EndsWith "{" then
                Some("venn", parseVennBlock)
            else
                None

        while i < lines.Length do
            let no = i + 1
            let line = (stripComment lines.[i]).Trim()

            match blockKind line with
            | Some(keyword, parseBlock) ->
                // Collect the block body up to the closing brace.
                let name = line.Substring(keyword.Length, line.Length - keyword.Length - 1).Trim()
                let body = ResizeArray()
                let mutable j = i + 1
                let mutable closed = false
                while not closed && j < lines.Length do
                    if (stripComment lines.[j]).Trim() = "}" then closed <- true
                    else
                        body.Add(j + 1, lines.[j])
                        j <- j + 1

                if not closed then
                    results.Add(no, Error(sprintf "this `%s {` is never closed with `}`" keyword))
                    i <- lines.Length
                else
                    match parseBlock name no (List.ofSeq body) with
                    | Ok st -> results.Add(no, Ok(Some st))
                    | Error errs -> for (n, e) in errs do results.Add(n, Error e)
                    i <- j + 1
            | None ->
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
