
import { Result_Map, FSharpResult$2, Result_Bind } from "./fable_modules/fable-library-js.5.6.0/Result.js";
import { ProofLine, CheckKind, TableTarget, Statement, RelationKind, RelRef, Formula } from "./Ast.js";
import { choose, ofSeq as ofSeq_1, map as map_1, filter, tryPick, ofArray, singleton, append, empty, tail, head, isEmpty } from "./fable_modules/fable-library-js.5.6.0/List.js";
import { tokenize } from "./Tokenizer.js";
import { contains, ofSeq } from "./fable_modules/fable-library-js.5.6.0/Set.js";
import { disposeSafe, getEnumerator, comparePrimitives } from "./fable_modules/fable-library-js.5.6.0/Util.js";
import { tryParseArgument, parseSentence } from "./Prose.js";
import { replace, printf, toText, trimStart, substring, split } from "./fable_modules/fable-library-js.5.6.0/String.js";
import { isDigit, isLetterOrDigit, isLetter } from "./fable_modules/fable-library-js.5.6.0/Char.js";
import { takeWhile, length, forAll } from "./fable_modules/fable-library-js.5.6.0/Seq.js";
import { bind } from "./fable_modules/fable-library-js.5.6.0/Option.js";
import { parse } from "./fable_modules/fable-library-js.5.6.0/Int32.js";
import { item, map } from "./fable_modules/fable-library-js.5.6.0/Array.js";

function parseIff(tokens) {
    return Result_Bind((tupledArg) => {
        const loop = (l, toks) => {
            let matchResult, more;
            if (!isEmpty(toks)) {
                if (head(toks).tag === 8) {
                    matchResult = 0;
                    more = tail(toks);
                }
                else {
                    matchResult = 1;
                }
            }
            else {
                matchResult = 1;
            }
            switch (matchResult) {
                case 0:
                    return Result_Bind((tupledArg_1) => loop(new Formula(8, [l, tupledArg_1[0]]), tupledArg_1[1]), parseImplies(more));
                default:
                    return new FSharpResult$2(0, [[l, toks]]);
            }
        };
        return loop(tupledArg[0], tupledArg[1]);
    }, parseImplies(tokens));
}

function parseImplies(tokens) {
    return Result_Bind((tupledArg) => {
        const left = tupledArg[0];
        const rest = tupledArg[1];
        let matchResult, more;
        if (!isEmpty(rest)) {
            if (head(rest).tag === 7) {
                matchResult = 0;
                more = tail(rest);
            }
            else {
                matchResult = 1;
            }
        }
        else {
            matchResult = 1;
        }
        switch (matchResult) {
            case 0:
                return Result_Map((tupledArg_1) => [new Formula(7, [left, tupledArg_1[0]]), tupledArg_1[1]], parseImplies(more));
            default:
                return new FSharpResult$2(0, [[left, rest]]);
        }
    }, parseXor(tokens));
}

function parseXor(tokens) {
    return Result_Bind((tupledArg) => {
        const loop = (l, toks) => {
            let matchResult, more;
            if (!isEmpty(toks)) {
                if (head(toks).tag === 6) {
                    matchResult = 0;
                    more = tail(toks);
                }
                else {
                    matchResult = 1;
                }
            }
            else {
                matchResult = 1;
            }
            switch (matchResult) {
                case 0:
                    return Result_Bind((tupledArg_1) => loop(new Formula(6, [l, tupledArg_1[0]]), tupledArg_1[1]), parseOr(more));
                default:
                    return new FSharpResult$2(0, [[l, toks]]);
            }
        };
        return loop(tupledArg[0], tupledArg[1]);
    }, parseOr(tokens));
}

function parseOr(tokens) {
    return Result_Bind((tupledArg) => {
        const loop = (l, toks) => {
            let matchResult, more;
            if (!isEmpty(toks)) {
                if (head(toks).tag === 5) {
                    matchResult = 0;
                    more = tail(toks);
                }
                else {
                    matchResult = 1;
                }
            }
            else {
                matchResult = 1;
            }
            switch (matchResult) {
                case 0:
                    return Result_Bind((tupledArg_1) => loop(new Formula(5, [l, tupledArg_1[0]]), tupledArg_1[1]), parseAnd(more));
                default:
                    return new FSharpResult$2(0, [[l, toks]]);
            }
        };
        return loop(tupledArg[0], tupledArg[1]);
    }, parseAnd(tokens));
}

function parseAnd(tokens) {
    return Result_Bind((tupledArg) => {
        const loop = (l, toks) => {
            let matchResult, more;
            if (!isEmpty(toks)) {
                if (head(toks).tag === 4) {
                    matchResult = 0;
                    more = tail(toks);
                }
                else {
                    matchResult = 1;
                }
            }
            else {
                matchResult = 1;
            }
            switch (matchResult) {
                case 0:
                    return Result_Bind((tupledArg_1) => loop(new Formula(4, [l, tupledArg_1[0]]), tupledArg_1[1]), parseUnary(more));
                default:
                    return new FSharpResult$2(0, [[l, toks]]);
            }
        };
        return loop(tupledArg[0], tupledArg[1]);
    }, parseUnary(tokens));
}

function parseUnary(tokens) {
    let matchResult, more, more_1, more_2, more_3, x, more_4, x_1;
    if (!isEmpty(tokens)) {
        switch (head(tokens).tag) {
            case 3: {
                matchResult = 0;
                more = tail(tokens);
                break;
            }
            case 9: {
                matchResult = 1;
                more_1 = tail(tokens);
                break;
            }
            case 10: {
                matchResult = 2;
                more_2 = tail(tokens);
                break;
            }
            case 11: {
                if (!isEmpty(tail(tokens))) {
                    if (head(tail(tokens)).tag === 0) {
                        if (!isEmpty(tail(tail(tokens)))) {
                            if (head(tail(tail(tokens))).tag === 13) {
                                matchResult = 3;
                                more_3 = tail(tail(tail(tokens)));
                                x = head(tail(tokens)).fields[0];
                            }
                            else {
                                matchResult = 5;
                            }
                        }
                        else {
                            matchResult = 5;
                        }
                    }
                    else {
                        matchResult = 5;
                    }
                }
                else {
                    matchResult = 5;
                }
                break;
            }
            case 12: {
                if (!isEmpty(tail(tokens))) {
                    if (head(tail(tokens)).tag === 0) {
                        if (!isEmpty(tail(tail(tokens)))) {
                            if (head(tail(tail(tokens))).tag === 13) {
                                matchResult = 4;
                                more_4 = tail(tail(tail(tokens)));
                                x_1 = head(tail(tokens)).fields[0];
                            }
                            else {
                                matchResult = 5;
                            }
                        }
                        else {
                            matchResult = 5;
                        }
                    }
                    else {
                        matchResult = 5;
                    }
                }
                else {
                    matchResult = 5;
                }
                break;
            }
            default:
                matchResult = 6;
        }
    }
    else {
        matchResult = 6;
    }
    switch (matchResult) {
        case 0:
            return Result_Map((tupledArg) => [new Formula(3, [tupledArg[0]]), tupledArg[1]], parseUnary(more));
        case 1:
            return Result_Map((tupledArg_1) => [new Formula(9, [tupledArg_1[0]]), tupledArg_1[1]], parseUnary(more_1));
        case 2:
            return Result_Map((tupledArg_2) => [new Formula(10, [tupledArg_2[0]]), tupledArg_2[1]], parseUnary(more_2));
        case 3:
            return Result_Map((tupledArg_3) => [new Formula(11, [x, tupledArg_3[0]]), tupledArg_3[1]], parseIff(more_3));
        case 4:
            return Result_Map((tupledArg_4) => [new Formula(12, [x_1, tupledArg_4[0]]), tupledArg_4[1]], parseIff(more_4));
        case 5:
            return new FSharpResult$2(1, ["a quantifier needs a variable then \'.\', e.g.  forall x. Human(x)"]);
        default:
            return parseAtom(tokens);
    }
}

function parseTermList(tokens) {
    let matchResult, rest;
    if (!isEmpty(tokens)) {
        if (head(tokens).tag === 16) {
            matchResult = 0;
            rest = tail(tokens);
        }
        else {
            matchResult = 1;
        }
    }
    else {
        matchResult = 1;
    }
    switch (matchResult) {
        case 0:
            return new FSharpResult$2(0, [[empty(), rest]]);
        default: {
            const loop = (acc_mut, toks_mut) => {
                loop:
                while (true) {
                    const acc = acc_mut, toks = toks_mut;
                    let matchResult_1, more, t, more_1, t_1;
                    if (!isEmpty(toks)) {
                        if (head(toks).tag === 0) {
                            if (!isEmpty(tail(toks))) {
                                switch (head(tail(toks)).tag) {
                                    case 14: {
                                        matchResult_1 = 0;
                                        more = tail(tail(toks));
                                        t = head(toks).fields[0];
                                        break;
                                    }
                                    case 16: {
                                        matchResult_1 = 1;
                                        more_1 = tail(tail(toks));
                                        t_1 = head(toks).fields[0];
                                        break;
                                    }
                                    default:
                                        matchResult_1 = 2;
                                }
                            }
                            else {
                                matchResult_1 = 2;
                            }
                        }
                        else {
                            matchResult_1 = 2;
                        }
                    }
                    else {
                        matchResult_1 = 2;
                    }
                    switch (matchResult_1) {
                        case 0: {
                            acc_mut = append(acc, singleton(t));
                            toks_mut = more;
                            continue loop;
                        }
                        case 1:
                            return new FSharpResult$2(0, [[append(acc, singleton(t_1)), more_1]]);
                        default:
                            return new FSharpResult$2(1, ["expected a term (a name), \',\' or \')\' in the predicate\'s arguments"]);
                    }
                    break;
                }
            };
            return loop(empty(), tokens);
        }
    }
}

function parseAtom(tokens) {
    let matchResult, name, rest, name_1, rest_1, rest_2, rest_3, rest_4;
    if (isEmpty(tokens)) {
        matchResult = 5;
    }
    else {
        switch (head(tokens).tag) {
            case 0: {
                if (!isEmpty(tail(tokens))) {
                    if (head(tail(tokens)).tag === 15) {
                        matchResult = 0;
                        name = head(tokens).fields[0];
                        rest = tail(tail(tokens));
                    }
                    else {
                        matchResult = 1;
                        name_1 = head(tokens).fields[0];
                        rest_1 = tail(tokens);
                    }
                }
                else {
                    matchResult = 1;
                    name_1 = head(tokens).fields[0];
                    rest_1 = tail(tokens);
                }
                break;
            }
            case 1: {
                matchResult = 2;
                rest_2 = tail(tokens);
                break;
            }
            case 2: {
                matchResult = 3;
                rest_3 = tail(tokens);
                break;
            }
            case 15: {
                matchResult = 4;
                rest_4 = tail(tokens);
                break;
            }
            default:
                matchResult = 6;
        }
    }
    switch (matchResult) {
        case 0:
            return Result_Map((tupledArg) => [new Formula(1, [name, tupledArg[0]]), tupledArg[1]], parseTermList(rest));
        case 1:
            return new FSharpResult$2(0, [[new Formula(0, [name_1]), rest_1]]);
        case 2:
            return new FSharpResult$2(0, [[new Formula(2, [true]), rest_2]]);
        case 3:
            return new FSharpResult$2(0, [[new Formula(2, [false]), rest_3]]);
        case 4:
            return Result_Bind((tupledArg_1) => {
                const rest$0027_1 = tupledArg_1[1];
                let matchResult_1, rest$0027$0027;
                if (!isEmpty(rest$0027_1)) {
                    if (head(rest$0027_1).tag === 16) {
                        matchResult_1 = 0;
                        rest$0027$0027 = tail(rest$0027_1);
                    }
                    else {
                        matchResult_1 = 1;
                    }
                }
                else {
                    matchResult_1 = 1;
                }
                switch (matchResult_1) {
                    case 0:
                        return new FSharpResult$2(0, [[tupledArg_1[0], rest$0027$0027]]);
                    default:
                        return new FSharpResult$2(1, ["Expected a closing \')\'"]);
                }
            }, parseIff(rest_4));
        case 5:
            return new FSharpResult$2(1, ["Unexpected end of formula"]);
        default:
            return new FSharpResult$2(1, ["Expected a proposition, a constant, or \'(\'"]);
    }
}

/**
 * Parse a formula from raw text (the full pipeline: tokenize then parse).
 */
export function parseFormula(text) {
    return Result_Bind((tokens) => Result_Bind((tupledArg) => {
        if (isEmpty(tupledArg[1])) {
            return new FSharpResult$2(0, [tupledArg[0]]);
        }
        else {
            return new FSharpResult$2(1, ["Unexpected leftover input after the formula"]);
        }
    }, parseIff(tokens)), tokenize(text));
}

const proseSignals = ofSeq(["if", "then", "all", "no", "some", "every", "either", "neither", "nor", "is", "are"], {
    Compare: (x, y) => (comparePrimitives(x, y) | 0),
});

/**
 * Parse a formula written either symbolically (p -> q) or as an English
 * sentence (If p, then q). Symbolic is tried first; prose is the fallback.
 */
export function parseAny(text) {
    let array;
    const matchValue = parseFormula(text);
    if (matchValue.tag === 1) {
        const matchValue_1 = parseSentence(text);
        if (matchValue_1.tag === 1) {
            return new FSharpResult$2(1, [((array = split(text, [" ", "\t"], undefined, 1), array.some((w) => contains(w.toLowerCase(), proseSignals)))) ? matchValue_1.fields[0] : matchValue.fields[0]]);
        }
        else {
            return new FSharpResult$2(0, [matchValue_1.fields[0]]);
        }
    }
    else {
        return new FSharpResult$2(0, [matchValue.fields[0]]);
    }
}

function stripComment(line) {
    const matchValue = line.indexOf("//") | 0;
    if (matchValue === -1) {
        return line;
    }
    else {
        return substring(line, 0, matchValue);
    }
}

function isSingleIdentifier(s) {
    if ((s.length > 0) && isLetter(s[0])) {
        return forAll((c) => {
            if (isLetterOrDigit(c)) {
                return true;
            }
            else {
                return c === "_";
            }
        }, s.split(""));
    }
    else {
        return false;
    }
}

function splitOnKeyword(s, kw) {
    const marker = (" " + kw) + " ";
    const matchValue = s.indexOf(marker) | 0;
    if (matchValue === -1) {
        return undefined;
    }
    else {
        const idx = matchValue | 0;
        return [substring(s, 0, idx).trim(), substring(s, idx + marker.length).trim()];
    }
}

function tryRef(s) {
    const s_1 = s.trimStart();
    if (s_1.startsWith("\"")) {
        const matchValue = s_1.indexOf("\"", 1) | 0;
        if (matchValue === -1) {
            return undefined;
        }
        else {
            const close = matchValue | 0;
            return [new RelRef(1, [substring(s_1, 1, close - 1)]), substring(s_1, close + 1)];
        }
    }
    else {
        const len = length(takeWhile((c) => {
            if (isLetterOrDigit(c) ? true : (c === "_")) {
                return true;
            }
            else {
                return c === "-";
            }
        }, s_1.split(""))) | 0;
        if ((len === 0) ? true : !isLetter(s_1[0])) {
            return undefined;
        }
        else {
            return [new RelRef(0, [substring(s_1, 0, len)]), substring(s_1, len)];
        }
    }
}

const relationVerbs = ofArray([["supports", new RelationKind(0, [])], ["presupposes", new RelationKind(1, [])], ["contradicts", new RelationKind(2, [])], ["entails", new RelationKind(3, [])], ["equivalent-to", new RelationKind(4, [])]]);

function tryParseRelation(line) {
    return bind((tupledArg) => {
        const rest_1 = tupledArg[1].trimStart();
        return tryPick((tupledArg_1) => {
            const verb = tupledArg_1[0];
            if (rest_1.startsWith(verb + " ")) {
                return bind((tupledArg_2) => {
                    if (tupledArg_2[1].trim() === "") {
                        return new Statement(11, [tupledArg[0], tupledArg_1[1], tupledArg_2[0]]);
                    }
                    else {
                        return undefined;
                    }
                }, tryRef(substring(rest_1, verb.length + 1)));
            }
            else {
                return undefined;
            }
        }, relationVerbs);
    }, tryRef(line));
}

/**
 * Parse a single line into an optional statement.
 * Blank/whitespace-only lines return `Ok None`.
 */
export function parseLine(raw) {
    let s;
    const line = stripComment(raw).trim();
    if (line === "") {
        return new FSharpResult$2(0, [undefined]);
    }
    else if (line.startsWith("#")) {
        return new FSharpResult$2(0, [new Statement(0, [line.length - trimStart(line, "#").length, trimStart(line, "#").trim()])]);
    }
    else if (line.startsWith("prop ")) {
        const rest = substring(line, 5);
        const matchValue = rest.indexOf(":") | 0;
        if (matchValue === -1) {
            return new FSharpResult$2(1, ["a `prop` needs a \':\'  — e.g.  prop p : It is raining"]);
        }
        else {
            const idx = matchValue | 0;
            return new FSharpResult$2(0, [new Statement(2, [substring(rest, 0, idx).trim(), substring(rest, idx + 1).trim()])]);
        }
    }
    else if (line.startsWith("claim ")) {
        const rest_1 = substring(line, 6);
        const matchValue_1 = rest_1.indexOf(":") | 0;
        if (matchValue_1 === -1) {
            return new FSharpResult$2(1, ["a `claim` needs a \':\'  — e.g.  claim C1 : p -> q"]);
        }
        else {
            const idx_1 = matchValue_1 | 0;
            const name_1 = substring(rest_1, 0, idx_1).trim();
            return Result_Map((f) => (new Statement(3, [name_1, f])), parseAny(substring(rest_1, idx_1 + 1).trim()));
        }
    }
    else if (line.startsWith("table ")) {
        const target = substring(line, 6).trim();
        if (isSingleIdentifier(target)) {
            return new FSharpResult$2(0, [new Statement(4, [new TableTarget(0, [target])])]);
        }
        else {
            return Result_Map((f_1) => (new Statement(4, [new TableTarget(1, [f_1])])), parseAny(target));
        }
    }
    else if (line.startsWith("check ")) {
        const rest_2 = substring(line, 6).trim();
        const matchValue_2 = splitOnKeyword(rest_2, "equivalent");
        if (matchValue_2 == null) {
            return Result_Map((f_2) => (new Statement(5, [new CheckKind(0, [f_2])])), parseAny(rest_2));
        }
        else {
            const r = matchValue_2[1];
            return Result_Bind((lf) => Result_Map((rf) => (new Statement(5, [new CheckKind(1, [lf, rf])])), parseAny(r)), parseAny(matchValue_2[0]));
        }
    }
    else {
        switch (line) {
            case "analyze":
                return new FSharpResult$2(0, [new Statement(10, [])]);
            case "map":
                return new FSharpResult$2(0, [new Statement(12, [])]);
            default:
                if (line.startsWith("argument")) {
                    return new FSharpResult$2(1, ["an `argument` needs `{` at the end of its first line — e.g.  argument my-point {"]);
                }
                else if (line.startsWith("proof")) {
                    return new FSharpResult$2(1, ["a `proof` needs `{` at the end of its first line — e.g.  proof my-derivation {"]);
                }
                else if (line.startsWith("venn ")) {
                    const target_1 = substring(line, 5).trim();
                    if ((s = target_1, ((s.length > 0) && isLetter(s[0])) && forAll((c) => {
                        if (isLetterOrDigit(c) ? true : (c === "_")) {
                            return true;
                        }
                        else {
                            return c === "-";
                        }
                    }, s.split("")))) {
                        return new FSharpResult$2(0, [new Statement(9, [target_1])]);
                    }
                    else {
                        return new FSharpResult$2(1, ["write `venn <argument-name>` to draw an argument, or `venn name { … }` for a fresh diagram"]);
                    }
                }
                else if (line === "venn") {
                    return new FSharpResult$2(1, ["`venn` needs an argument name (venn my-argument) or a block (venn name { … })"]);
                }
                else {
                    const matchValue_3 = tryParseRelation(line);
                    if (matchValue_3 == null) {
                        const matchValue_4 = tryParseArgument(line);
                        if (matchValue_4 == null) {
                            return new FSharpResult$2(0, [new Statement(1, [line])]);
                        }
                        else {
                            return new FSharpResult$2(0, [new Statement(6, [matchValue_4[0], matchValue_4[1], matchValue_4[2]])]);
                        }
                    }
                    else {
                        return new FSharpResult$2(0, [matchValue_3]);
                    }
                }
        }
    }
}

function parseArgumentBlock(name, headerLine, body) {
    let premises = empty();
    let conclusion = undefined;
    let errors = empty();
    const enumerator = getEnumerator(body);
    try {
        while (enumerator["System.Collections.IEnumerator.MoveNext"]()) {
            const forLoopVar = enumerator["System.Collections.Generic.IEnumerator`1.get_Current"]();
            const no = forLoopVar[0] | 0;
            const line = stripComment(forLoopVar[1]).trim();
            if (line === "") {
            }
            else if ((line.length >= 3) && forAll((c) => (c === "-"), line.split(""))) {
            }
            else if (line.startsWith("premise ")) {
                const matchValue = parseFormula(substring(line, 8));
                if (matchValue.tag === 1) {
                    errors = append(errors, singleton([no, matchValue.fields[0]]));
                }
                else {
                    premises = append(premises, singleton(matchValue.fields[0]));
                }
            }
            else if (line.startsWith("conclude ")) {
                const matchValue_1 = parseFormula(substring(line, 9));
                const conclusion_1 = conclusion;
                const copyOfStruct = matchValue_1;
                if (copyOfStruct.tag === 1) {
                    errors = append(errors, singleton([no, copyOfStruct.fields[0]]));
                }
                else if (conclusion_1 != null) {
                    errors = append(errors, singleton([no, "an argument can only have one `conclude`"]));
                }
                else {
                    conclusion = copyOfStruct.fields[0];
                }
            }
            else {
                errors = append(errors, singleton([no, "expected `premise`, `---`, or `conclude` inside an argument"]));
            }
        }
    }
    finally {
        disposeSafe(enumerator);
    }
    const errors_1 = errors;
    const conclusion_2 = conclusion;
    if (isEmpty(errors_1)) {
        if (conclusion_2 != null) {
            const c_1 = conclusion_2;
            return new FSharpResult$2(0, [new Statement(6, [name, premises, c_1])]);
        }
        else {
            return new FSharpResult$2(1, [singleton([headerLine, "an argument needs a `conclude` line"])]);
        }
    }
    else {
        return new FSharpResult$2(1, [errors_1]);
    }
}

function parseProofBlock(name, headerLine, body) {
    let steps = empty();
    let errors = empty();
    const enumerator = getEnumerator(body);
    try {
        while (enumerator["System.Collections.IEnumerator.MoveNext"]()) {
            let array_1, arg;
            const forLoopVar = enumerator["System.Collections.Generic.IEnumerator`1.get_Current"]();
            const no = forLoopVar[0] | 0;
            const line_1 = stripComment(forLoopVar[1]).trim();
            if (line_1 === "") {
            }
            else {
                let matchValue;
                const line = line_1;
                const digits = length(takeWhile(isDigit, line.split(""))) | 0;
                matchValue = ((((digits > 0) && (digits < line.length)) && (line[digits] === ".")) ? [parse(substring(line, 0, digits), 511, false, 32), substring(line, digits + 1).trim()] : undefined);
                if (matchValue != null) {
                    const rest = matchValue[1];
                    const number = matchValue[0] | 0;
                    if (rest.startsWith("premise ")) {
                        const matchValue_1 = parseFormula(substring(rest, 8));
                        if (matchValue_1.tag === 1) {
                            errors = append(errors, singleton([no, matchValue_1.fields[0]]));
                        }
                        else {
                            steps = append(steps, singleton(new ProofLine(0, [number, matchValue_1.fields[0]])));
                        }
                    }
                    else {
                        const matchValue_2 = rest.lastIndexOf(" by ") | 0;
                        if (matchValue_2 === -1) {
                            errors = append(errors, singleton([no, "a derived line needs a justification — e.g.  wet by modus-ponens from 1, 2"]));
                        }
                        else {
                            const idx = matchValue_2 | 0;
                            const formulaText = substring(rest, 0, idx);
                            const justification = substring(rest, idx + 4).trim();
                            let patternInput;
                            const matchValue_3 = justification.indexOf(" from ") | 0;
                            if (matchValue_3 === -1) {
                                patternInput = [justification, ""];
                            }
                            else {
                                const j = matchValue_3 | 0;
                                patternInput = [substring(justification, 0, j).trim(), substring(justification, j + 6)];
                            }
                            const rule = patternInput[0];
                            const refs = ofArray((array_1 = map((s) => s.trim(), split(patternInput[1], [","], undefined, 0)), array_1.filter((s_1) => (s_1 !== ""))));
                            const badRefs = filter((r) => !forAll(isDigit, r.split("")), refs);
                            if (rule === "") {
                                errors = append(errors, singleton([no, "missing rule name after `by`"]));
                            }
                            else if (!isEmpty(badRefs)) {
                                errors = append(errors, singleton([no, (arg = head(badRefs), toText(printf("citations after `from` must be line numbers, not %A"))(arg))]));
                            }
                            else {
                                const matchValue_4 = parseFormula(formulaText);
                                if (matchValue_4.tag === 1) {
                                    errors = append(errors, singleton([no, matchValue_4.fields[0]]));
                                }
                                else {
                                    steps = append(steps, singleton(new ProofLine(1, [number, matchValue_4.fields[0], rule, map_1((value) => (parse(value, 511, false, 32) | 0), refs)])));
                                }
                            }
                        }
                    }
                }
                else {
                    errors = append(errors, singleton([no, "every proof line starts with its number — e.g.  3. wet by modus-ponens from 1, 2"]));
                }
            }
        }
    }
    finally {
        disposeSafe(enumerator);
    }
    const errors_1 = errors;
    const steps_1 = steps;
    if (isEmpty(errors_1)) {
        if (isEmpty(steps_1)) {
            return new FSharpResult$2(1, [singleton([headerLine, "a proof needs at least one line"])]);
        }
        else {
            return new FSharpResult$2(0, [new Statement(7, [name, steps])]);
        }
    }
    else {
        return new FSharpResult$2(1, [errors_1]);
    }
}

function parseVennBlock(name, headerLine, body) {
    let premises = empty();
    let conclusion = undefined;
    let errors = empty();
    const enumerator = getEnumerator(body);
    try {
        while (enumerator["System.Collections.IEnumerator.MoveNext"]()) {
            const forLoopVar = enumerator["System.Collections.Generic.IEnumerator`1.get_Current"]();
            const no = forLoopVar[0] | 0;
            const line = stripComment(forLoopVar[1]).trim();
            if (line === "") {
            }
            else if ((line.length >= 3) && forAll((c) => (c === "-"), line.split(""))) {
            }
            else if (line.startsWith("premise ")) {
                const matchValue = parseFormula(substring(line, 8));
                if (matchValue.tag === 1) {
                    errors = append(errors, singleton([no, matchValue.fields[0]]));
                }
                else {
                    premises = append(premises, singleton(matchValue.fields[0]));
                }
            }
            else if (line.startsWith("conclude ")) {
                const matchValue_1 = parseFormula(substring(line, 9));
                const conclusion_1 = conclusion;
                const copyOfStruct = matchValue_1;
                if (copyOfStruct.tag === 1) {
                    errors = append(errors, singleton([no, copyOfStruct.fields[0]]));
                }
                else if (conclusion_1 != null) {
                    errors = append(errors, singleton([no, "a venn block can only have one `conclude`"]));
                }
                else {
                    conclusion = copyOfStruct.fields[0];
                }
            }
            else {
                errors = append(errors, singleton([no, "expected `premise` or `conclude` inside a venn block"]));
            }
        }
    }
    finally {
        disposeSafe(enumerator);
    }
    const errors_1 = errors;
    const premises_1 = premises;
    if (isEmpty(errors_1)) {
        if (isEmpty(premises_1)) {
            return new FSharpResult$2(1, [singleton([headerLine, "a venn block needs at least one `premise`"])]);
        }
        else {
            return new FSharpResult$2(0, [new Statement(8, [name, premises, conclusion])]);
        }
    }
    else {
        return new FSharpResult$2(1, [errors_1]);
    }
}

/**
 * Parse a whole source into (lineNumber, statement-or-error) entries,
 * grouping multi-line `argument { }` blocks into single statements.
 * This per-line shape lets callers be *resilient*: one bad line becomes
 * one error entry while everything around it still parses.
 */
export function parseLines(source) {
    const lines = split(replace(source, "\r\n", "\n"), ["\n"], undefined, 0);
    const results = [];
    let i = 0;
    while (i < lines.length) {
        const no = (i + 1) | 0;
        const line_1 = stripComment(item(i, lines)).trim();
        let matchValue;
        const line = line_1;
        matchValue = ((line.startsWith("argument ") && line.endsWith("{")) ? ["argument", (name) => ((headerLine) => ((body) => parseArgumentBlock(name, headerLine, body)))] : ((line.startsWith("proof ") && line.endsWith("{")) ? ["proof", (name_1) => ((headerLine_1) => ((body_1) => parseProofBlock(name_1, headerLine_1, body_1)))] : ((line.startsWith("venn ") && line.endsWith("{")) ? ["venn", (name_2) => ((headerLine_2) => ((body_2) => parseVennBlock(name_2, headerLine_2, body_2)))] : undefined)));
        if (matchValue == null) {
            void (results.push([no, parseLine(item(i, lines))]));
            i = ((i + 1) | 0);
        }
        else {
            const parseBlock = matchValue[1];
            const keyword = matchValue[0];
            const name_3 = substring(line_1, keyword.length, (line_1.length - keyword.length) - 1).trim();
            const body_3 = [];
            let j = i + 1;
            let closed = false;
            while (!closed && (j < lines.length)) {
                if (stripComment(item(j, lines)).trim() === "}") {
                    closed = true;
                }
                else {
                    void (body_3.push([j + 1, item(j, lines)]));
                    j = ((j + 1) | 0);
                }
            }
            if (!closed) {
                void (results.push([no, new FSharpResult$2(1, [toText(printf("this `%s {` is never closed with `}`"))(keyword)])]));
                i = (lines.length | 0);
            }
            else {
                const matchValue_1 = parseBlock(name_3)(no)(ofSeq_1(body_3));
                if (matchValue_1.tag === 1) {
                    const enumerator = getEnumerator(matchValue_1.fields[0]);
                    try {
                        while (enumerator["System.Collections.IEnumerator.MoveNext"]()) {
                            const forLoopVar = enumerator["System.Collections.Generic.IEnumerator`1.get_Current"]();
                            void (results.push([forLoopVar[0], new FSharpResult$2(1, [forLoopVar[1]])]));
                        }
                    }
                    finally {
                        disposeSafe(enumerator);
                    }
                }
                else {
                    void (results.push([no, new FSharpResult$2(0, [matchValue_1.fields[0]])]));
                }
                i = ((j + 1) | 0);
            }
        }
    }
    return ofSeq_1(results);
}

/**
 * Parse a whole document. Collects every parse error with its line number
 * so the editor can show them all at once, rather than stopping at the first.
 */
export function parseDocument(source) {
    const parsed = parseLines(source);
    const errors = choose((tupledArg) => {
        const r = tupledArg[1];
        if (r.tag === 1) {
            return [tupledArg[0], r.fields[0]];
        }
        else {
            return undefined;
        }
    }, parsed);
    if (isEmpty(errors)) {
        return new FSharpResult$2(0, [choose((tupledArg_1) => {
            const r_1 = tupledArg_1[1];
            if (r_1.tag === 1) {
                return undefined;
            }
            else {
                return r_1.fields[0];
            }
        }, parsed)]);
    }
    else {
        return new FSharpResult$2(1, [errors]);
    }
}

