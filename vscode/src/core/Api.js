
import { toString, Record } from "./fable_modules/fable-library-js.5.6.0/Types.js";
import { record_type, bool_type, array_type, int32_type, string_type } from "./fable_modules/fable-library-js.5.6.0/Reflection.js";
import { append, ofArray, collect as collect_1, choose, item, find, singleton, tryLast, head, tryFind, mapIndexed, reduce, empty as empty_1, isEmpty, map, toArray, filter, length } from "./fable_modules/fable-library-js.5.6.0/List.js";
import { join, printf, toText } from "./fable_modules/fable-library-js.5.6.0/String.js";
import { atoms as atoms_1, Relation, relate, distinguishing, equivalent, Verdict, checkArgument, resolve, truthTable } from "./Engine.js";
import { toEnglish, toUnicode } from "./Render.js";
import { ofList, tryFind as tryFind_1, add, containsKey, empty as empty_2, toList, FSharpMap__get_Item } from "./fable_modules/fable-library-js.5.6.0/Map.js";
import { disposeSafe, getEnumerator, comparePrimitives, equals, int32ToString } from "./fable_modules/fable-library-js.5.6.0/Util.js";
import { checkStep, suggestRepairs, prove, recognize } from "./Recognition.js";
import { FormKind, forms, fallacies, validForms } from "./InferenceRules.js";
import { map as map_1, defaultArg } from "./fable_modules/fable-library-js.5.6.0/Option.js";
import { Formula } from "./Ast.js";
import { map as map_2, collect, delay } from "./fable_modules/fable-library-js.5.6.0/Seq.js";
import { rangeDouble } from "./fable_modules/fable-library-js.5.6.0/Range.js";
import { parseLines } from "./Parser.js";
import { contains, ofList as ofList_1 } from "./fable_modules/fable-library-js.5.6.0/Set.js";

/**
 * One rendered block. Every field always exists; which ones are meaningful
 * depends on `kind`. This flat shape is deliberately JS-friendly.
 * kind = "heading"   -> level, title
 * kind = "prose"     -> title (the text)
 * kind = "prop"      -> name, gloss
 * kind = "claim"     -> name, formula
 * kind = "table"     -> formula, atoms, rows, results, verdict
 * kind = "check"     -> formula, verdict (+ table fields for verdict checks)
 * kind = "argument"  -> name, premises, conclusion, verdict (valid/invalid),
 * form/fallacy + note, proof (when valid),
 * atoms/rows/results = counterexamples (when invalid),
 * suggestion = missing premises that would repair it
 * kind = "relations" -> relations (from `analyze`: [left, relation, right])
 * kind = "error"     -> line, title (the message)
 */
export class BlockView extends Record {
    constructor(kind, level, title, name, gloss, formula, verdict, atoms, rows, results, line, premises, conclusion, form, fallacy, note, suggestion, proof, relations) {
        super();
        this.kind = kind;
        this.level = (level | 0);
        this.title = title;
        this.name = name;
        this.gloss = gloss;
        this.formula = formula;
        this.verdict = verdict;
        this.atoms = atoms;
        this.rows = rows;
        this.results = results;
        this.line = (line | 0);
        this.premises = premises;
        this.conclusion = conclusion;
        this.form = form;
        this.fallacy = fallacy;
        this.note = note;
        this.suggestion = suggestion;
        this.proof = proof;
        this.relations = relations;
    }
}

export function BlockView_$reflection() {
    return record_type("Meticulous.Api.BlockView", [], BlockView, () => [["kind", string_type], ["level", int32_type], ["title", string_type], ["name", string_type], ["gloss", string_type], ["formula", string_type], ["verdict", string_type], ["atoms", array_type(string_type)], ["rows", array_type(array_type(bool_type))], ["results", array_type(bool_type)], ["line", int32_type], ["premises", array_type(string_type)], ["conclusion", string_type], ["form", string_type], ["fallacy", string_type], ["note", string_type], ["suggestion", array_type(string_type)], ["proof", array_type(array_type(string_type))], ["relations", array_type(array_type(string_type))]]);
}

const empty = new BlockView("", 0, "", "", "", "", "", [], [], [], 0, [], "", "", "", "", [], [], []);

function verdictName(_arg) {
    switch (_arg.tag) {
        case 1:
            return "contradiction";
        case 2:
            return "contingent";
        default:
            return "tautology";
    }
}

function relationName(_arg) {
    switch (_arg.tag) {
        case 1:
            return "contradictory";
        case 2:
            return "contrary";
        case 3:
            return "subcontrary";
        case 4:
            return "entails";
        case 5:
            return "entailed-by";
        case 6:
            return "independent";
        default:
            return "equivalent";
    }
}

function verdictNote(t) {
    const total = length(t.Rows) | 0;
    const trues = length(filter((tuple) => tuple[1], t.Rows)) | 0;
    const matchValue = t.Verdict;
    switch (matchValue.tag) {
        case 1:
            return toText(printf("False in every one of the %d possible situations — it cannot hold, whatever the facts."))(total);
        case 2:
            return toText(printf("True in %d of %d possible situations — whether it holds depends on the facts."))(trues)(total);
        default:
            return toText(printf("True in every one of the %d possible situations — it cannot fail, whatever the facts."))(total);
    }
}

function tableBlock(f) {
    const t = truthTable(f);
    const formula = toUnicode(f);
    const atoms = toArray(t.Atoms);
    const rows = toArray(map((tupledArg) => toArray(map((a) => FSharpMap__get_Item(tupledArg[0], a), t.Atoms)), t.Rows));
    const results = toArray(map((tuple) => tuple[1], t.Rows));
    return new BlockView("table", empty.level, empty.title, empty.name, empty.gloss, formula, verdictName(t.Verdict), atoms, rows, results, empty.line, empty.premises, empty.conclusion, empty.form, empty.fallacy, verdictNote(t), empty.suggestion, empty.proof, empty.relations);
}

function describeSituation(env) {
    return join(" and ", map((tupledArg) => {
        const arg_1 = tupledArg[1] ? "true" : "false";
        return toText(printf("%s is %s"))(tupledArg[0])(arg_1);
    }, toList(env)));
}

function proofRow(index, step) {
    const justification = isEmpty(step.Refs) ? step.Rule : (((step.Rule + " (") + join(", ", map(int32ToString, step.Refs))) + ")");
    return [int32ToString(index + 1), toUnicode(step.Formula), justification];
}

function argumentBlock(defs, name, premises, conclusion) {
    const rp = map((formula) => resolve(defs, formula), premises);
    const rc = resolve(defs, conclusion);
    const check = checkArgument(rp, rc);
    const recognized = recognize(check.IsValid ? validForms : fallacies, rp, rc);
    const displayTitle = (form) => {
        if (form.Aka === "") {
            return form.Title;
        }
        else {
            return ((form.Title + " (") + form.Aka) + ")";
        }
    };
    const proofSteps = check.IsValid ? defaultArg(prove(rp, rc), empty_1()) : empty_1();
    const repairs = check.IsValid ? empty_1() : suggestRepairs(rp, rc);
    const premisesConsistent = isEmpty(rp) ? true : !equals(truthTable(reduce((a, b) => (new Formula(3, [a, b])), rp)).Verdict, new Verdict(1, []));
    let explanation;
    if (isEmpty(rp)) {
        if (check.IsValid) {
            explanation = ((recognized == null) ? "A theorem: the conclusion holds in every possible situation — a tautology, provable from no premises at all." : recognized.Note);
        }
        else {
            const arg = length(check.Counterexamples) | 0;
            explanation = toText(printf("Not a theorem: the conclusion fails in %d situation(s), so it is no tautology."))(arg);
        }
    }
    else if (check.IsValid && !premisesConsistent) {
        explanation = "Valid, but vacuously so: the premises contradict one another and can never all hold — and from a contradiction, anything follows (ex falso quodlibet).";
    }
    else if (recognized == null) {
        if (check.IsValid) {
            explanation = "Valid: no possible situation makes every premise true and the conclusion false.";
        }
        else {
            const arg_1 = length(check.Counterexamples) | 0;
            explanation = toText(printf("Invalid: %d situation(s) make every premise true while the conclusion fails."))(arg_1);
        }
    }
    else {
        explanation = recognized.Note;
    }
    const formLabel = !check.IsValid ? "" : ((recognized == null) ? (isEmpty(rp) ? "tautology" : "") : displayTitle(recognized));
    const premises_1 = toArray(map(toUnicode, rp));
    const conclusion_1 = toUnicode(rc);
    const verdict = check.IsValid ? "valid" : "invalid";
    const fallacy = defaultArg(check.IsValid ? undefined : map_1(displayTitle, recognized), "");
    const suggestion = toArray(map(toUnicode, repairs));
    const proof = toArray(mapIndexed(proofRow, proofSteps));
    return new BlockView("argument", empty.level, empty.title, name, empty.gloss, empty.formula, verdict, toArray(check.Atoms), toArray(map((env) => toArray(map((a_1) => FSharpMap__get_Item(env, a_1), check.Atoms)), check.Counterexamples)), toArray(map((_arg) => false, check.Counterexamples)), empty.line, premises_1, conclusion_1, formLabel, fallacy, explanation, suggestion, proof, empty.relations);
}

function proofBlock(defs, name, lines) {
    let known = empty_2({
        Compare: (x, y) => (comparePrimitives(x, y) | 0),
    });
    let allOk = true;
    const rows = [];
    const enumerator = getEnumerator(lines);
    try {
        while (enumerator["System.Collections.IEnumerator.MoveNext"]()) {
            let arg_2, arg_6, arg_7, arg_12, title, refs;
            const line = enumerator["System.Collections.Generic.IEnumerator`1.get_Current"]();
            if (line.tag === 1) {
                const ruleName = line.fields[2];
                const refs_1 = line.fields[3];
                const n_1 = line.fields[0] | 0;
                const rf_1 = resolve(defs, line.fields[1]);
                const duplicate = containsKey(n_1, known);
                const missing = filter((r) => !containsKey(r, known), refs_1);
                const form = tryFind((fm) => (fm.Name === ruleName), forms);
                let patternInput;
                if (duplicate) {
                    patternInput = ["bad", toText(printf("line number %d is used twice"))(n_1), ruleName];
                }
                else if (!isEmpty(missing)) {
                    patternInput = ["bad", (arg_2 = (head(missing) | 0), toText(printf("cites line %d, which doesn\'t exist earlier in the proof"))(arg_2)), ruleName];
                }
                else if (form != null) {
                    if (equals(form.Kind, new FormKind(1, []))) {
                        const fm_2 = form;
                        patternInput = ["bad", toText(printf("\'%s\' is a fallacy, not a rule — it cannot justify a step"))(fm_2.Title), fm_2.Title];
                    }
                    else {
                        const fm_3 = form;
                        const cited = map((r_1) => FSharpMap__get_Item(known, r_1), refs_1);
                        if (length(fm_3.Premises) !== length(cited)) {
                            patternInput = ["bad", (arg_6 = (length(fm_3.Premises) | 0), (arg_7 = (length(cited) | 0), toText(printf("%s needs %d cited line(s) after `from`, got %d"))(fm_3.Title)(arg_6)(arg_7))), fm_3.Title];
                        }
                        else if (checkStep(fm_3, cited, rf_1)) {
                            patternInput = ["ok", "", fm_3.Title];
                        }
                        else {
                            const matchValue = recognize(validForms, cited, rf_1);
                            if (matchValue == null) {
                                const semantic = checkArgument(cited, rf_1);
                                patternInput = (semantic.IsValid ? ["bad", toText(printf("it does follow from the cited lines, but not by %s — and no single catalog rule derives it in one step"))(fm_3.Title), fm_3.Title] : ["bad", (arg_12 = describeSituation(head(semantic.Counterexamples)), toText(printf("it does not follow from the cited lines at all — counterexample: %s"))(arg_12)), fm_3.Title]);
                            }
                            else {
                                const actual = matchValue;
                                patternInput = ["bad", toText(printf("this step doesn\'t match %s — it is actually %s (%s)"))(fm_3.Title)(actual.Title)(actual.Note), fm_3.Title];
                            }
                        }
                    }
                }
                else {
                    patternInput = ["bad", toText(printf("unknown rule \'%s\' — rule names are the kebab-case catalog names, e.g. modus-ponens"))(ruleName), ruleName];
                }
                const status = patternInput[0];
                if (status === "bad") {
                    allOk = false;
                }
                if (!duplicate) {
                    known = add(n_1, rf_1, known);
                }
                void (rows.push([int32ToString(n_1), toUnicode(rf_1), (title = patternInput[2], (refs = refs_1, isEmpty(refs) ? title : (((title + " (") + join(", ", map(toString, refs))) + ")"))), status, patternInput[1]]));
            }
            else {
                const n = line.fields[0] | 0;
                const rf = resolve(defs, line.fields[1]);
                if (containsKey(n, known)) {
                    allOk = false;
                    void (rows.push([int32ToString(n), toUnicode(rf), "premise", "bad", toText(printf("line number %d is used twice"))(n)]));
                }
                else {
                    known = add(n, rf, known);
                    void (rows.push([int32ToString(n), toUnicode(rf), "premise", "premise", ""]));
                }
            }
        }
    }
    finally {
        disposeSafe(enumerator);
    }
    const verdict = allOk ? "valid" : "invalid";
    const note = allOk ? "Every step checks out — the conclusion follows from the premises. ∎" : "The first ✗ step is where the chain breaks — repair it and the proof may go through.";
    return new BlockView("proof", empty.level, empty.title, name, empty.gloss, empty.formula, verdict, empty.atoms, empty.rows, empty.results, empty.line, empty.premises, defaultArg(map_1((l) => toUnicode(resolve(defs, (l.tag === 1) ? l.fields[1] : l.fields[1])), tryLast(lines)), ""), empty.form, empty.fallacy, note, empty.suggestion, rows.slice(), empty.relations);
}

function relationInfo(defs, glosses, left, kind, right) {
    let arg, arg_1, arg_2;
    const display = (_arg) => {
        if (_arg.tag === 1) {
            return ("“" + _arg.fields[0]) + "”";
        }
        else {
            return _arg.fields[0];
        }
    };
    const formulaOf = (ref) => {
        let n_1;
        let matchResult, n_2;
        if (ref.tag === 0) {
            if ((n_1 = ref.fields[0], containsKey(n_1, defs) ? true : containsKey(n_1, glosses))) {
                matchResult = 0;
                n_2 = ref.fields[0];
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
                return resolve(defs, new Formula(0, [n_2]));
            default:
                return undefined;
        }
    };
    const verb = (kind.tag === 1) ? "presupposes" : ((kind.tag === 2) ? "contradicts" : ((kind.tag === 3) ? "entails" : ((kind.tag === 4) ? "equivalent-to" : "supports")));
    const tautology = (f) => equals(truthTable(f).Verdict, new Verdict(0, []));
    let patternInput;
    const matchValue = formulaOf(left);
    const matchValue_1 = formulaOf(right);
    let matchResult_1, a, b;
    switch (kind.tag) {
        case 0:
        case 1: {
            matchResult_1 = 0;
            break;
        }
        default:
            if (matchValue != null) {
                if (matchValue_1 != null) {
                    matchResult_1 = 1;
                    a = matchValue;
                    b = matchValue_1;
                }
                else {
                    matchResult_1 = 2;
                }
            }
            else {
                matchResult_1 = 2;
            }
    }
    switch (matchResult_1) {
        case 0: {
            patternInput = ["asserted", "an informal relation — asserted by you, recorded but not checked by the engine"];
            break;
        }
        case 1: {
            switch (kind.tag) {
                case 3: {
                    patternInput = (tautology(new Formula(6, [a, b])) ? ["holds", "verified: whenever the first holds, so does the second"] : ["fails", (arg = describeSituation(head(checkArgument(singleton(a), b).Counterexamples)), toText(printf("does not hold — counterexample: %s"))(arg))]);
                    break;
                }
                case 2: {
                    patternInput = (tautology(new Formula(2, [new Formula(3, [a, b])])) ? ["holds", "verified: they can never both be true"] : ["fails", (arg_1 = describeSituation(find((tuple) => tuple[1], truthTable(new Formula(3, [a, b])).Rows)[0]), toText(printf("they CAN both be true — for instance when %s"))(arg_1))]);
                    break;
                }
                default:
                    if (equivalent(a, b)) {
                        patternInput = ["holds", "verified: always the same truth value — two phrasings of one claim"];
                    }
                    else {
                        const matchValue_3 = distinguishing(a, b);
                        patternInput = ((matchValue_3 == null) ? ["fails", "not equivalent"] : ["fails", (arg_2 = describeSituation(matchValue_3), toText(printf("not equivalent — they come apart when %s"))(arg_2))]);
                    }
            }
            break;
        }
        default:
            patternInput = ["asserted", "cannot be checked — one side is not a declared claim or prop"];
    }
    return [display(left), verb, display(right), patternInput[0], patternInput[1]];
}

function relationWhy(_arg) {
    switch (_arg.tag) {
        case 1:
            return "always opposite — exactly one of the two holds";
        case 2:
            return "never both true, though both can fail";
        case 3:
            return "never both false, though both can hold";
        case 4:
            return "whenever the first holds, so does the second";
        case 5:
            return "whenever the first holds, so does the second";
        case 6:
            return "neither settles the other — all four combinations are possible";
        default:
            return "always the same truth value — two phrasings of one claim";
    }
}

function relationsBlock(claims) {
    return new BlockView("relations", empty.level, empty.title, empty.name, empty.gloss, empty.formula, empty.verdict, empty.atoms, empty.rows, empty.results, empty.line, empty.premises, empty.conclusion, empty.form, empty.fallacy, empty.note, empty.suggestion, empty.proof, Array.from(delay(() => collect((i) => map_2((j) => {
        const patternInput = item(i, claims);
        const nameA = patternInput[0];
        const patternInput_1 = item(j, claims);
        const nameB = patternInput_1[0];
        const matchValue = relate(patternInput[1], patternInput_1[1]);
        if (matchValue.tag === 5) {
            return [nameB, "entails", nameA, relationWhy(new Relation(4, []))];
        }
        else {
            const r = matchValue;
            return [nameA, relationName(r), nameB, relationWhy(r)];
        }
    }, rangeDouble(i + 1, 1, length(claims) - 1)), rangeDouble(0, 1, length(claims) - 1)))));
}

function toBlock(defs, glosses, claims, relationRows, st) {
    switch (st.tag) {
        case 1:
            return new BlockView("prose", empty.level, st.fields[0], empty.name, empty.gloss, empty.formula, empty.verdict, empty.atoms, empty.rows, empty.results, empty.line, empty.premises, empty.conclusion, empty.form, empty.fallacy, empty.note, empty.suggestion, empty.proof, empty.relations);
        case 2:
            return new BlockView("prop", empty.level, empty.title, st.fields[0], st.fields[1], empty.formula, empty.verdict, empty.atoms, empty.rows, empty.results, empty.line, empty.premises, empty.conclusion, empty.form, empty.fallacy, empty.note, empty.suggestion, empty.proof, empty.relations);
        case 3:
            return new BlockView("claim", empty.level, empty.title, st.fields[0], empty.gloss, toUnicode(st.fields[1]), empty.verdict, empty.atoms, empty.rows, empty.results, empty.line, empty.premises, empty.conclusion, empty.form, empty.fallacy, toEnglish((name) => tryFind_1(name, glosses), resolve(defs, st.fields[1])), empty.suggestion, empty.proof, empty.relations);
        case 4:
            return tableBlock((st.fields[0].tag === 0) ? resolve(defs, new Formula(0, [st.fields[0].fields[0]])) : resolve(defs, st.fields[0].fields[0]));
        case 5:
            if (st.fields[0].tag === 1) {
                const matchValue = resolve(defs, st.fields[0].fields[0]);
                const rb = resolve(defs, st.fields[0].fields[1]);
                const ra = matchValue;
                const same = equivalent(ra, rb);
                let note_1;
                if (same) {
                    note_1 = "In every possible situation the two sides carry the same truth value — two phrasings of one claim.";
                }
                else {
                    const matchValue_2 = distinguishing(ra, rb);
                    if (matchValue_2 == null) {
                        note_1 = "";
                    }
                    else {
                        const arg = describeSituation(matchValue_2);
                        note_1 = toText(printf("They come apart when %s: then one holds and the other doesn\'t."))(arg);
                    }
                }
                return new BlockView("check", empty.level, empty.title, empty.name, empty.gloss, (toUnicode(ra) + " ≡ ") + toUnicode(rb), same ? "equivalent" : "not-equivalent", empty.atoms, empty.rows, empty.results, empty.line, empty.premises, empty.conclusion, empty.form, empty.fallacy, note_1, empty.suggestion, empty.proof, empty.relations);
            }
            else {
                const bind$0040 = tableBlock(resolve(defs, st.fields[0].fields[0]));
                return new BlockView("check", bind$0040.level, bind$0040.title, bind$0040.name, bind$0040.gloss, bind$0040.formula, bind$0040.verdict, bind$0040.atoms, bind$0040.rows, bind$0040.results, bind$0040.line, bind$0040.premises, bind$0040.conclusion, bind$0040.form, bind$0040.fallacy, bind$0040.note, bind$0040.suggestion, bind$0040.proof, bind$0040.relations);
            }
        case 6:
            return argumentBlock(defs, st.fields[0], st.fields[1], st.fields[2]);
        case 7:
            return proofBlock(defs, st.fields[0], st.fields[1]);
        case 8:
            return relationsBlock(claims);
        case 9: {
            const patternInput_1 = relationInfo(defs, glosses, st.fields[0], st.fields[1], st.fields[2]);
            return new BlockView("relation", empty.level, patternInput_1[1], empty.name, empty.gloss, patternInput_1[0], patternInput_1[3], empty.atoms, empty.rows, empty.results, empty.line, empty.premises, patternInput_1[2], empty.form, empty.fallacy, patternInput_1[4], empty.suggestion, empty.proof, empty.relations);
        }
        case 10:
            return new BlockView("map", empty.level, empty.title, empty.name, empty.gloss, empty.formula, empty.verdict, empty.atoms, empty.rows, empty.results, empty.line, empty.premises, empty.conclusion, empty.form, empty.fallacy, empty.note, empty.suggestion, empty.proof, relationRows);
        default:
            return new BlockView("heading", st.fields[0], st.fields[1], empty.name, empty.gloss, empty.formula, empty.verdict, empty.atoms, empty.rows, empty.results, empty.line, empty.premises, empty.conclusion, empty.form, empty.fallacy, empty.note, empty.suggestion, empty.proof, empty.relations);
    }
}

/**
 * Parse and analyse a whole document into block views for rendering.
 * 
 * This is *resilient*: a line that fails to parse becomes an inline error
 * block, and every other line still renders. That matters for the live
 * preview, where you're almost always looking at a half-typed document.
 */
export function analyze(source) {
    const parsed = parseLines(source);
    const statements = choose((tupledArg) => {
        const r = tupledArg[1];
        if (r.tag === 1) {
            return undefined;
        }
        else {
            return r.fields[0];
        }
    }, parsed);
    const defs = ofList(choose((_arg_1) => {
        if (_arg_1.tag === 3) {
            return [_arg_1.fields[0], _arg_1.fields[1]];
        }
        else {
            return undefined;
        }
    }, statements), {
        Compare: (x, y) => (comparePrimitives(x, y) | 0),
    });
    const glosses = ofList(choose((_arg_2) => {
        if (_arg_2.tag === 2) {
            return [_arg_2.fields[0], _arg_2.fields[1]];
        }
        else {
            return undefined;
        }
    }, statements), {
        Compare: (x_1, y_1) => (comparePrimitives(x_1, y_1) | 0),
    });
    const claims = choose((_arg_3) => {
        if (_arg_3.tag === 3) {
            return [_arg_3.fields[0], resolve(defs, _arg_3.fields[1])];
        }
        else {
            return undefined;
        }
    }, statements);
    const relationRows = toArray(choose((_arg_4) => {
        if (_arg_4.tag === 9) {
            const patternInput = relationInfo(defs, glosses, _arg_4.fields[0], _arg_4.fields[1], _arg_4.fields[2]);
            return [patternInput[0], patternInput[1], patternInput[2], patternInput[3]];
        }
        else {
            return undefined;
        }
    }, statements));
    return toArray(choose((tupledArg_1) => {
        const r_2 = tupledArg_1[1];
        if (r_2.tag === 1) {
            return new BlockView("error", empty.level, r_2.fields[0], empty.name, empty.gloss, empty.formula, empty.verdict, empty.atoms, empty.rows, empty.results, tupledArg_1[0], empty.premises, empty.conclusion, empty.form, empty.fallacy, empty.note, empty.suggestion, empty.proof, empty.relations);
        }
        else if (r_2.fields[0] != null) {
            return toBlock(defs, glosses, claims, relationRows, r_2.fields[0]);
        }
        else {
            return undefined;
        }
    }, parsed));
}

/**
 * One catalog entry, as plain data. The VS Code extension turns these into
 * completions: argument snippets for each form, and rule names after `by`.
 */
export class FormView extends Record {
    constructor(name, title, aka, note, premises, conclusion, isFallacy) {
        super();
        this.name = name;
        this.title = title;
        this.aka = aka;
        this.note = note;
        this.premises = premises;
        this.conclusion = conclusion;
        this.isFallacy = isFallacy;
    }
}

export function FormView_$reflection() {
    return record_type("Meticulous.Api.FormView", [], FormView, () => [["name", string_type], ["title", string_type], ["aka", string_type], ["note", string_type], ["premises", array_type(string_type)], ["conclusion", string_type], ["isFallacy", bool_type]]);
}

/**
 * The full inference-rule catalog, for the editor.
 */
export function catalog() {
    return toArray(map((f) => (new FormView(f.Name, f.Title, f.Aka, f.Note, toArray(map(toUnicode, f.Premises)), toUnicode(f.Conclusion), equals(f.Kind, new FormKind(1, [])))), forms));
}

/**
 * A non-fatal observation about the document (rendered as a warning
 * squiggle in the editor, not shown in the preview).
 */
export class LintView extends Record {
    constructor(line, message) {
        super();
        this.line = (line | 0);
        this.message = message;
    }
}

export function LintView_$reflection() {
    return record_type("Meticulous.Api.LintView", [], LintView, () => [["line", int32_type], ["message", string_type]]);
}

/**
 * Style warnings the parser can't raise: currently, props that are
 * declared but never used in any formula — usually a sign the glosses
 * and the atoms have drifted apart.
 */
export function lint(source) {
    const statements = choose((tupledArg) => {
        const r = tupledArg[1];
        let matchResult;
        if (r.tag === 0) {
            if (r.fields[0] != null) {
                matchResult = 0;
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
                return [tupledArg[0], r.fields[0]];
            default:
                return undefined;
        }
    }, parseLines(source));
    const usedNames = ofList_1(collect_1(atoms_1, collect_1((tupledArg_1) => {
        const st_1 = tupledArg_1[1];
        switch (st_1.tag) {
            case 3:
                return singleton(st_1.fields[1]);
            case 4:
                if (st_1.fields[0].tag === 0) {
                    return singleton(new Formula(0, [st_1.fields[0].fields[0]]));
                }
                else {
                    return singleton(st_1.fields[0].fields[0]);
                }
            case 5:
                if (st_1.fields[0].tag === 1) {
                    return ofArray([st_1.fields[0].fields[0], st_1.fields[0].fields[1]]);
                }
                else {
                    return singleton(st_1.fields[0].fields[0]);
                }
            case 6:
                return append(st_1.fields[1], singleton(st_1.fields[2]));
            case 7:
                return map((_arg) => {
                    let f_3;
                    if (_arg.tag === 1) {
                        f_3 = _arg.fields[1];
                    }
                    else {
                        f_3 = _arg.fields[1];
                    }
                    return f_3;
                }, st_1.fields[1]);
            case 9:
                return choose((_arg_1) => {
                    if (_arg_1.tag === 1) {
                        return undefined;
                    }
                    else {
                        return new Formula(0, [_arg_1.fields[0]]);
                    }
                }, ofArray([st_1.fields[0], st_1.fields[2]]));
            default:
                return empty_1();
        }
    }, statements)), {
        Compare: (x, y) => (comparePrimitives(x, y) | 0),
    });
    const declaredNames = ofList_1(choose((tupledArg_2) => {
        const st_3 = tupledArg_2[1];
        let matchResult_2, n_2;
        switch (st_3.tag) {
            case 2: {
                matchResult_2 = 0;
                n_2 = st_3.fields[0];
                break;
            }
            case 3: {
                matchResult_2 = 0;
                n_2 = st_3.fields[0];
                break;
            }
            default:
                matchResult_2 = 1;
        }
        switch (matchResult_2) {
            case 0:
                return n_2;
            default:
                return undefined;
        }
    }, statements), {
        Compare: (x_1, y_1) => (comparePrimitives(x_1, y_1) | 0),
    });
    return toArray(collect_1((tupledArg_3) => {
        const lineNo = tupledArg_3[0] | 0;
        const st_4 = tupledArg_3[1];
        let matchResult_3, name_1, l_1, r_2;
        switch (st_4.tag) {
            case 2: {
                if (!contains(st_4.fields[0], usedNames)) {
                    matchResult_3 = 0;
                    name_1 = st_4.fields[0];
                }
                else {
                    matchResult_3 = 2;
                }
                break;
            }
            case 9: {
                matchResult_3 = 1;
                l_1 = st_4.fields[0];
                r_2 = st_4.fields[2];
                break;
            }
            default:
                matchResult_3 = 2;
        }
        switch (matchResult_3) {
            case 0:
                return singleton(new LintView(lineNo, toText(printf("prop \'%s\' is declared but never used in a formula"))(name_1)));
            case 1:
                return choose((_arg_4) => {
                    let matchResult_4, n_4;
                    if (_arg_4.tag === 0) {
                        if (!contains(_arg_4.fields[0], declaredNames)) {
                            matchResult_4 = 0;
                            n_4 = _arg_4.fields[0];
                        }
                        else {
                            matchResult_4 = 1;
                        }
                    }
                    else {
                        matchResult_4 = 1;
                    }
                    switch (matchResult_4) {
                        case 0:
                            return new LintView(lineNo, toText(printf("relation references \'%s\', which is not a declared prop or claim — it will appear as an ad-hoc node (quote it to make that intentional)"))(n_4));
                        default:
                            return undefined;
                    }
                }, ofArray([l_1, r_2]));
            default:
                return empty_1();
        }
    }, statements));
}

