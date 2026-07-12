namespace Meticulous

open Meticulous.Ast

/// A gentle natural-language surface for meticulous, so you can write logic the
/// way you'd say it:
///
///   If P, then Q.          instead of   P -> Q
///   Either P or Q.                       P or Q
///   Neither P nor Q.                     not P and not Q
///   All men are mortal.                  forall x. men(x) -> mortal(x)
///   Socrates is a man.                   man(socrates)
///
/// and whole arguments in one breath:
///
///   If P, then Q. P. Therefore, Q.
///
/// Everything here produces ordinary `Formula` values, so the rest of the
/// engine — validity, proofs, Venn diagrams, countermodels — works unchanged.
module Prose =

    // Words that carry grammar, so they can never be read as a proposition name.
    let private reserved =
        set [ "if"; "then"; "and"; "or"; "not"; "either"; "neither"; "nor"
              "implies"; "iff"; "necessarily"; "possibly"; "all"; "no"; "some"
              "every"; "are"; "is"; "a"; "an"; "therefore"; "thus"; "hence"
              "true"; "false" ]

    let private lower (w: string) = w.ToLowerInvariant()

    /// Fold a few fixed multi-word phrases down to single keywords, drop commas,
    /// and strip a trailing period.
    let private normalize (s: string) =
        s.Trim().TrimEnd('.').Replace(",", " ")
            .Replace(" if and only if ", " iff ")
            .Replace("it is not the case that ", "not ")
            .Replace("it is necessary that ", "necessarily ")
            .Replace("it is possible that ", "possibly ")

    let private tokenize (s: string) =
        (normalize s).Replace("(", " ( ").Replace(")", " ) ").Split([| ' '; '\t' |], System.StringSplitOptions.RemoveEmptyEntries)
        |> Array.toList

    let private isName (w: string) =
        w.Length > 0
        && System.Char.IsLetter w.[0]
        && w |> Seq.forall (fun c -> System.Char.IsLetterOrDigit c || c = '_' || c = '-')

    // ---- categorical sentences ------------------------------------------------
    // Class/predicate names are lowercased *and singularized* so that "All men
    // are mortal" and "Socrates is a man" talk about the same predicate `man`.
    // (Individual names — the subject of a singular sentence — are left alone.)

    let private irregularPlurals =
        Map [ "men", "man"; "women", "woman"; "children", "child"; "people", "person"
              "feet", "foot"; "teeth", "tooth"; "mice", "mouse"; "geese", "goose" ]

    let private singular (w: string) =
        match Map.tryFind w irregularPlurals with
        | Some s -> s
        | None ->
            if w.EndsWith "ies" && w.Length > 3 then w.Substring(0, w.Length - 3) + "y"
            elif [ "ses"; "xes"; "zes"; "ches"; "shes" ] |> List.exists w.EndsWith then w.Substring(0, w.Length - 2)
            elif w.EndsWith "s" && not (w.EndsWith "ss") && w.Length > 2 then w.Substring(0, w.Length - 1)
            else w

    let private categorical (ws: string list) : Formula option =
        // `name` is a class/predicate word (singularized); `arg` is a term.
        let p name arg = Pred(singular (lower name), [ lower arg ])
        let x = "x"
        // pair each word with its lowercased form for keyword matching
        match ws |> List.map (fun w -> w, lower w) with
        | [ _, "all"; s, _; _, "are"; t, _ ] -> Some(Forall(x, Implies(p s x, p t x)))
        | [ _, "no"; s, _; _, "are"; t, _ ] -> Some(Forall(x, Implies(p s x, Not(p t x))))
        | [ _, "some"; s, _; _, "are"; _, "not"; t, _ ] -> Some(Exists(x, And(p s x, Not(p t x))))
        | [ _, "some"; s, _; _, "are"; t, _ ] -> Some(Exists(x, And(p s x, p t x)))
        | [ _, "every"; s, _; _, "is"; _, ("a" | "an"); t, _ ] -> Some(Forall(x, Implies(p s x, p t x)))
        | [ _, "every"; s, _; _, "is"; t, _ ] -> Some(Forall(x, Implies(p s x, p t x)))
        // singular predication: "Socrates is a man" / "Socrates is mortal"
        | [ subj, _; _, "is"; _, ("a" | "an"); t, _ ] -> Some(p t subj)
        | [ subj, _; _, "is"; t, _ ] -> Some(p t subj)
        | _ -> None

    // ---- connective sentences -------------------------------------------------
    // A small recursive-descent grammar over words. Loosest to tightest:
    //   iff · if/then, implies · or (either) · and · not/neither·nor · atom

    let rec private parseTop ts = parseIff ts

    and private parseIff ts =
        parseImp ts
        |> Result.bind (fun (l, rest) ->
            match rest with
            | w :: more when lower w = "iff" -> parseImp more |> Result.map (fun (r, rest') -> Iff(l, r), rest')
            | _ -> Ok(l, rest))

    and private parseImp ts =
        match ts with
        | w :: rest when lower w = "if" ->
            parseOr rest
            |> Result.bind (fun (ant, rest') ->
                match rest' with
                | t :: more when lower t = "then" ->
                    parseTop more |> Result.map (fun (con, rest'') -> Implies(ant, con), rest'')
                | _ -> Error "expected 'then' to close the 'if …' clause")
        | _ ->
            parseOr ts
            |> Result.bind (fun (l, rest) ->
                match rest with
                | w :: more when lower w = "implies" -> parseImp more |> Result.map (fun (r, rest') -> Implies(l, r), rest')
                | _ -> Ok(l, rest))

    and private parseOr ts =
        let ts = match ts with w :: more when lower w = "either" -> more | _ -> ts
        parseAnd ts
        |> Result.bind (fun (l, rest) ->
            let rec loop acc toks =
                match toks with
                | w :: more when lower w = "or" -> parseAnd more |> Result.bind (fun (r, rest') -> loop (Or(acc, r)) rest')
                | _ -> Ok(acc, toks)
            loop l rest)

    and private parseAnd ts =
        parseNeg ts
        |> Result.bind (fun (l, rest) ->
            let rec loop acc toks =
                match toks with
                | w :: more when lower w = "and" -> parseNeg more |> Result.bind (fun (r, rest') -> loop (And(acc, r)) rest')
                | _ -> Ok(acc, toks)
            loop l rest)

    and private parseNeg ts =
        match ts with
        | w :: more when lower w = "not" -> parseNeg more |> Result.map (fun (f, r) -> Not f, r)
        | w :: more when lower w = "necessarily" -> parseNeg more |> Result.map (fun (f, r) -> Box f, r)
        | w :: more when lower w = "possibly" -> parseNeg more |> Result.map (fun (f, r) -> Diamond f, r)
        | w :: more when lower w = "neither" ->
            parseAnd more
            |> Result.bind (fun (a, rest) ->
                match rest with
                | t :: r2 when lower t = "nor" -> parseNeg r2 |> Result.map (fun (b, r3) -> And(Not a, Not b), r3)
                | _ -> Error "expected 'nor' after 'neither'")
        | _ -> parseAtom ts

    and private parseAtom ts =
        match ts with
        | w :: more when lower w = "(" ->
            parseTop more
            |> Result.bind (fun (f, rest) ->
                match rest with
                | t :: r when lower t = ")" -> Ok(f, r)
                | _ -> Error "expected ')'")
        | w :: more when lower w = "true" -> Ok(Const true, more)
        | w :: more when lower w = "false" -> Ok(Const false, more)
        | w :: more when isName w && not (Set.contains (lower w) reserved) -> Ok(Atom w, more)
        | [] -> Error "the sentence ended unexpectedly"
        | w :: _ -> Error(sprintf "didn't expect '%s' here" w)

    /// Parse a single declarative sentence into a formula.
    let parseSentence (text: string) : Result<Formula, string> =
        let ws = tokenize text
        if List.isEmpty ws then
            Error "empty sentence"
        else
            match categorical ws with
            | Some f -> Ok f
            | None ->
                parseTop ws
                |> Result.bind (fun (f, rest) ->
                    if List.isEmpty rest then Ok f
                    else Error(sprintf "didn't understand the rest of the sentence: '%s'" (String.concat " " rest)))

    // ---- whole arguments ------------------------------------------------------

    let private markers = set [ "therefore"; "thus"; "hence" ]

    let private firstWord (s: string) =
        s.Trim().Split([| ' '; '\t' |], System.StringSplitOptions.RemoveEmptyEntries)
        |> Array.tryHead
        |> Option.map (fun w -> (lower w).Trim([| ','; ';'; '.'; ':' |]))
        |> Option.defaultValue ""

    /// Recognise a whole argument written as prose, e.g.
    ///   "If P, then Q. P. Therefore, Q."
    /// optionally with a leading "name:". Returns the argument only if every
    /// sentence parses — otherwise this is ordinary prose, not an argument.
    let tryParseArgument (line: string) : (string * Formula list * Formula) option =
        // optional "name:" label
        let name, body =
            match line.IndexOf ':' with
            | i when i > 0 && line.Substring(0, i).Trim() |> Seq.forall (fun c -> System.Char.IsLetterOrDigit c || c = '-' || c = '_') ->
                line.Substring(0, i).Trim(), line.Substring(i + 1)
            | _ -> "", line

        let sentences =
            body.Split('.') |> Array.map (fun s -> s.Trim()) |> Array.filter (fun s -> s <> "") |> Array.toList

        // one sentence must open with a conclusion marker; the rest are premises
        match sentences |> List.tryFindIndex (fun s -> Set.contains (firstWord s) markers) with
        | Some idx when List.length sentences >= 2 ->
            let stripMarker (s: string) =
                let t = s.Trim()
                let sp = t.IndexOf ' '
                if sp > 0 then t.Substring(sp + 1).Trim() else ""
            let premiseTexts = sentences |> List.mapi (fun i s -> i, s) |> List.filter (fun (i, _) -> i <> idx) |> List.map snd
            let parsedPremises = premiseTexts |> List.map parseSentence
            match parseSentence (stripMarker sentences.[idx]) with
            | Ok conclusion when parsedPremises |> List.forall (function Ok _ -> true | _ -> false) ->
                Some(name, parsedPremises |> List.map (function Ok f -> f | _ -> Const true), conclusion)
            | _ -> None
        | _ -> None
