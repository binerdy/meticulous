
import { Record } from "./fable_modules/fable-library-js.5.6.0/Types.js";
import { record_type, bool_type, array_type, int32_type, string_type } from "./fable_modules/fable-library-js.5.6.0/Reflection.js";
import { choose, item, mapIndexed, empty as empty_1, isEmpty, map, toArray, filter, length } from "./fable_modules/fable-library-js.5.6.0/List.js";
import { join, printf, toText } from "./fable_modules/fable-library-js.5.6.0/String.js";
import { distinguishing, equivalent, Relation, relate, checkArgument, resolve, truthTable } from "./Engine.js";
import { toEnglish, toUnicode } from "./Render.js";
import { ofList, tryFind, toList, FSharpMap__get_Item } from "./fable_modules/fable-library-js.5.6.0/Map.js";
import { comparePrimitives, int32ToString } from "./fable_modules/fable-library-js.5.6.0/Util.js";
import { suggestRepairs, prove, recognize } from "./Recognition.js";
import { fallacies, validForms } from "./InferenceRules.js";
import { map as map_1, defaultArg } from "./fable_modules/fable-library-js.5.6.0/Option.js";
import { map as map_2, collect, delay } from "./fable_modules/fable-library-js.5.6.0/Seq.js";
import { rangeDouble } from "./fable_modules/fable-library-js.5.6.0/Range.js";
import { Formula } from "./Ast.js";
import { parseLines } from "./Parser.js";

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
    let explanation;
    if (recognized == null) {
        if (check.IsValid) {
            explanation = "Valid: no possible situation makes every premise true and the conclusion false.";
        }
        else {
            const arg = length(check.Counterexamples) | 0;
            explanation = toText(printf("Invalid: %d situation(s) make every premise true while the conclusion fails."))(arg);
        }
    }
    else {
        explanation = recognized.Note;
    }
    const premises_1 = toArray(map(toUnicode, rp));
    const conclusion_1 = toUnicode(rc);
    const verdict = check.IsValid ? "valid" : "invalid";
    const form_2 = defaultArg(check.IsValid ? map_1(displayTitle, recognized) : undefined, "");
    const fallacy = defaultArg(check.IsValid ? undefined : map_1(displayTitle, recognized), "");
    const suggestion = toArray(map(toUnicode, repairs));
    const proof = toArray(mapIndexed(proofRow, proofSteps));
    return new BlockView("argument", empty.level, empty.title, name, empty.gloss, empty.formula, verdict, toArray(check.Atoms), toArray(map((env) => toArray(map((a) => FSharpMap__get_Item(env, a), check.Atoms)), check.Counterexamples)), toArray(map((_arg) => false, check.Counterexamples)), empty.line, premises_1, conclusion_1, form_2, fallacy, explanation, suggestion, proof, empty.relations);
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

function toBlock(defs, glosses, claims, st) {
    switch (st.tag) {
        case 1:
            return new BlockView("prose", empty.level, st.fields[0], empty.name, empty.gloss, empty.formula, empty.verdict, empty.atoms, empty.rows, empty.results, empty.line, empty.premises, empty.conclusion, empty.form, empty.fallacy, empty.note, empty.suggestion, empty.proof, empty.relations);
        case 2:
            return new BlockView("prop", empty.level, empty.title, st.fields[0], st.fields[1], empty.formula, empty.verdict, empty.atoms, empty.rows, empty.results, empty.line, empty.premises, empty.conclusion, empty.form, empty.fallacy, empty.note, empty.suggestion, empty.proof, empty.relations);
        case 3:
            return new BlockView("claim", empty.level, empty.title, st.fields[0], empty.gloss, toUnicode(st.fields[1]), empty.verdict, empty.atoms, empty.rows, empty.results, empty.line, empty.premises, empty.conclusion, empty.form, empty.fallacy, toEnglish((name) => tryFind(name, glosses), resolve(defs, st.fields[1])), empty.suggestion, empty.proof, empty.relations);
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
            return relationsBlock(claims);
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
    return toArray(choose((tupledArg_1) => {
        const r_1 = tupledArg_1[1];
        if (r_1.tag === 1) {
            return new BlockView("error", empty.level, r_1.fields[0], empty.name, empty.gloss, empty.formula, empty.verdict, empty.atoms, empty.rows, empty.results, tupledArg_1[0], empty.premises, empty.conclusion, empty.form, empty.fallacy, empty.note, empty.suggestion, empty.proof, empty.relations);
        }
        else if (r_1.fields[0] != null) {
            return toBlock(defs, glosses, claims, r_1.fields[0]);
        }
        else {
            return undefined;
        }
    }, parsed));
}

