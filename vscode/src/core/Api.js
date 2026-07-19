
import { toString, Record } from "./fable_modules/fable-library-js.5.6.0/Types.js";
import { record_type, bool_type, array_type, int32_type, string_type } from "./fable_modules/fable-library-js.5.6.0/Reflection.js";
import { ofSeq, choose, item, find, tryLast, tryFind as tryFind_1, mapIndexed, head, append, collect, fold, empty as empty_2, cons, ofArray, singleton, exists, reduce, isEmpty, map, toArray, filter, length } from "./fable_modules/fable-library-js.5.6.0/List.js";
import { replace, split, trimEnd, join, printf, toText } from "./fable_modules/fable-library-js.5.6.0/String.js";
import { equivalent2, Relation, relate, distinguishing, Verdict, ModalSearch, checkArgument, checkArgumentS5, containsModal, containsFO, FOSearch, foSatisfy, describeModel, valid, checkArgumentFO, analyzeMonadic, individuals, predicateArities, resolve, evalS5, atoms as atoms_1, s5Satisfy, eval$, subformulasFor, truthTable } from "./Engine.js";
import { clear, disposeSafe, getEnumerator, stringHash, int32ToString, comparePrimitives, equals } from "./fable_modules/fable-library-js.5.6.0/Util.js";
import { toEnglish, toUnicode } from "./Render.js";
import { ofList, add, containsKey, empty as empty_3, toList, tryFind, FSharpMap__get_Item } from "./fable_modules/fable-library-js.5.6.0/Map.js";
import { Statement, Formula } from "./Ast.js";
import { toArray as toArray_1, map as map_1, defaultArg } from "./fable_modules/fable-library-js.5.6.0/Option.js";
import { map as map_2, initialize } from "./fable_modules/fable-library-js.5.6.0/Array.js";
import { contains, ofList as ofList_1, empty as empty_1, toList as toList_1 } from "./fable_modules/fable-library-js.5.6.0/Set.js";
import { normalizeTerm } from "./Prose.js";
import { List_distinct } from "./fable_modules/fable-library-js.5.6.0/Seq2.js";
import { checkStep, suggestRepairs, prove, recognize } from "./Recognition.js";
import { forms, FormKind, existentialImportForms, fallacies, validForms } from "./InferenceRules.js";
import { map as map_3, collect as collect_1, delay } from "./fable_modules/fable-library-js.5.6.0/Seq.js";
import { rangeDouble } from "./fable_modules/fable-library-js.5.6.0/Range.js";
import { parseLines } from "./Parser.js";
import { FSharpChoice$2 } from "./fable_modules/fable-library-js.5.6.0/Choice.js";

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
    constructor(kind, level, title, name, gloss, formula, verdict, atoms, rows, results, subHeaders, subRows, actual, line, premises, conclusion, form, fallacy, note, suggestion, proof, relations, model, vennCircles, vennCells, vennPoints) {
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
        this.subHeaders = subHeaders;
        this.subRows = subRows;
        this.actual = (actual | 0);
        this.line = (line | 0);
        this.premises = premises;
        this.conclusion = conclusion;
        this.form = form;
        this.fallacy = fallacy;
        this.note = note;
        this.suggestion = suggestion;
        this.proof = proof;
        this.relations = relations;
        this.model = model;
        this.vennCircles = vennCircles;
        this.vennCells = vennCells;
        this.vennPoints = vennPoints;
    }
}

export function BlockView_$reflection() {
    return record_type("Meticulous.Api.BlockView", [], BlockView, () => [["kind", string_type], ["level", int32_type], ["title", string_type], ["name", string_type], ["gloss", string_type], ["formula", string_type], ["verdict", string_type], ["atoms", array_type(string_type)], ["rows", array_type(array_type(bool_type))], ["results", array_type(bool_type)], ["subHeaders", array_type(string_type)], ["subRows", array_type(array_type(bool_type))], ["actual", int32_type], ["line", int32_type], ["premises", array_type(string_type)], ["conclusion", string_type], ["form", string_type], ["fallacy", string_type], ["note", string_type], ["suggestion", array_type(string_type)], ["proof", array_type(array_type(string_type))], ["relations", array_type(array_type(string_type))], ["model", array_type(string_type)], ["vennCircles", array_type(string_type)], ["vennCells", array_type(array_type(string_type))], ["vennPoints", array_type(array_type(string_type))]]);
}

const empty = new BlockView("", 0, "", "", "", "", "", [], [], [], [], [], -1, 0, [], "", "", "", "", [], [], [], [], [], [], []);

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
    const subs = filter((s) => !equals(s, f), subformulasFor(f));
    const formula = toUnicode(f);
    const atoms = toArray(t.Atoms);
    const rows = toArray(map((tupledArg) => toArray(map((a) => FSharpMap__get_Item(tupledArg[0], a), t.Atoms)), t.Rows));
    const results = toArray(map((tuple) => tuple[1], t.Rows));
    const subHeaders = toArray(map(toUnicode, subs));
    const subRows = toArray(map((tupledArg_1) => toArray(map((f_1) => eval$(tupledArg_1[0], f_1), subs)), t.Rows));
    return new BlockView("table", empty.level, empty.title, empty.name, empty.gloss, formula, verdictName(t.Verdict), atoms, rows, results, subHeaders, subRows, empty.actual, empty.line, empty.premises, empty.conclusion, empty.form, empty.fallacy, verdictNote(t), empty.suggestion, empty.proof, empty.relations, empty.model, empty.vennCircles, empty.vennCells, empty.vennPoints);
}

const tooLargeNote = "Too many atoms and modal operators to check exhaustively — the engine won\'t guess.";

function modalBlock(kindName, f) {
    const base$0027 = new BlockView(kindName, empty.level, empty.title, empty.name, empty.gloss, toUnicode(f), empty.verdict, empty.atoms, empty.rows, empty.results, empty.subHeaders, empty.subRows, empty.actual, empty.line, empty.premises, empty.conclusion, empty.form, empty.fallacy, empty.note, empty.suggestion, empty.proof, empty.relations, empty.model, empty.vennCircles, empty.vennCells, empty.vennPoints);
    const matchValue = s5Satisfy(new Formula(3, [f]));
    const matchValue_1 = s5Satisfy(f);
    let matchResult, actual, worlds;
    switch (matchValue.tag) {
        case 2: {
            switch (matchValue_1.tag) {
                case 0: {
                    matchResult = 1;
                    break;
                }
                default:
                    matchResult = 2;
            }
            break;
        }
        case 1: {
            switch (matchValue_1.tag) {
                case 0: {
                    matchResult = 1;
                    break;
                }
                case 2: {
                    matchResult = 2;
                    break;
                }
                default: {
                    matchResult = 3;
                    actual = matchValue.fields[1];
                    worlds = matchValue.fields[0];
                }
            }
            break;
        }
        default:
            matchResult = 0;
    }
    switch (matchResult) {
        case 0:
            return new BlockView(base$0027.kind, base$0027.level, base$0027.title, base$0027.name, base$0027.gloss, base$0027.formula, "tautology", base$0027.atoms, base$0027.rows, base$0027.results, base$0027.subHeaders, base$0027.subRows, base$0027.actual, base$0027.line, base$0027.premises, base$0027.conclusion, base$0027.form, base$0027.fallacy, "Necessarily true: it holds at every world of every possible arrangement of worlds.", base$0027.suggestion, base$0027.proof, base$0027.relations, base$0027.model, base$0027.vennCircles, base$0027.vennCells, base$0027.vennPoints);
        case 1:
            return new BlockView(base$0027.kind, base$0027.level, base$0027.title, base$0027.name, base$0027.gloss, base$0027.formula, "contradiction", base$0027.atoms, base$0027.rows, base$0027.results, base$0027.subHeaders, base$0027.subRows, base$0027.actual, base$0027.line, base$0027.premises, base$0027.conclusion, base$0027.form, base$0027.fallacy, "Impossible: it fails at every world of every possible arrangement of worlds.", base$0027.suggestion, base$0027.proof, base$0027.relations, base$0027.model, base$0027.vennCircles, base$0027.vennCells, base$0027.vennPoints);
        case 2:
            return new BlockView(base$0027.kind, base$0027.level, base$0027.title, base$0027.name, base$0027.gloss, base$0027.formula, "unknown", base$0027.atoms, base$0027.rows, base$0027.results, base$0027.subHeaders, base$0027.subRows, base$0027.actual, base$0027.line, base$0027.premises, base$0027.conclusion, base$0027.form, base$0027.fallacy, tooLargeNote, base$0027.suggestion, base$0027.proof, base$0027.relations, base$0027.model, base$0027.vennCircles, base$0027.vennCells, base$0027.vennPoints);
        default: {
            const names = atoms_1(f);
            const note_2 = "Contingent: its truth depends on the facts and on how the possibilities are arranged — here is an arrangement where it fails at the actual world.";
            return new BlockView(base$0027.kind, base$0027.level, base$0027.title, base$0027.name, base$0027.gloss, base$0027.formula, "contingent", toArray(names), toArray(map((w) => toArray(map((a) => defaultArg(tryFind(a, w), false), names)), worlds)), toArray(map((w_1) => evalS5(worlds, w_1, f), worlds)), base$0027.subHeaders, base$0027.subRows, actual, base$0027.line, base$0027.premises, base$0027.conclusion, base$0027.form, base$0027.fallacy, note_2, base$0027.suggestion, base$0027.proof, base$0027.relations, base$0027.model, base$0027.vennCircles, base$0027.vennCells, base$0027.vennPoints);
        }
    }
}

function vennBlock(defs, name, premises, conclusion) {
    let c_2, matchValue, arg_2, arg_1;
    const rp = map((formula) => resolve(defs, formula), premises);
    const rc = map_1((formula_1) => resolve(defs, formula_1), conclusion);
    const premiseConj = isEmpty(rp) ? (new Formula(2, [true])) : reduce((a, b) => (new Formula(4, [a, b])), rp);
    const scope = (rc == null) ? premiseConj : (new Formula(4, [premiseConj, rc]));
    const arities = predicateArities(scope);
    const preds = map((tuple) => tuple[0], arities);
    const notDrawable = (why) => (new BlockView("venn", empty.level, empty.title, name, empty.gloss, empty.formula, "not-drawable", empty.atoms, empty.rows, empty.results, empty.subHeaders, empty.subRows, empty.actual, empty.line, empty.premises, empty.conclusion, empty.form, empty.fallacy, why, empty.suggestion, empty.proof, empty.relations, empty.model, empty.vennCircles, empty.vennCells, empty.vennPoints));
    const unaryCount = length(filter((tupledArg) => (tupledArg[1] === 1), arities)) | 0;
    if (exists((tupledArg_1) => (tupledArg_1[1] >= 2), arities)) {
        return notDrawable("A Venn diagram needs one-place predicates (properties like Man(x)); this argument uses a relation (a two-or-more-place predicate), which a Venn diagram can\'t picture.");
    }
    else if (exists((tupledArg_2) => (tupledArg_2[1] === 0), arities)) {
        return notDrawable("A Venn diagram pictures categorical statements about one-place predicates like Man(x). This argument is propositional (or modal) — try a truth table or a proof instead.");
    }
    else if (unaryCount === 0) {
        return notDrawable("A Venn diagram needs at least one one-place predicate, e.g. Man(x).");
    }
    else if (unaryCount > 3) {
        return notDrawable(toText(printf("Venn diagrams are drawn for up to 3 one-place predicates; this uses %d."))(unaryCount));
    }
    else {
        const consts = individuals(scope);
        const a_1 = analyzeMonadic(preds, consts, premiseConj);
        const bits = (cell) => (initialize(length(preds), (j) => ((((cell >> j) & 1) === 1) ? "1" : "0")).join(''));
        const cells = map((tupledArg_3) => {
            let _arg_3;
            return [bits(tupledArg_3[0]), (_arg_3 = tupledArg_3[1], (_arg_3.tag === 1) ? "occupied" : ((_arg_3.tag === 2) ? "free" : "empty"))];
        }, toList(a_1.Cells));
        const points = map((c_1) => [c_1, join("|", map(bits, toList_1(defaultArg(tryFind(c_1, a_1.Placement), empty_1({
            Compare: (x, y) => (comparePrimitives(x, y) | 0),
        })))))], consts);
        return new BlockView("venn", empty.level, empty.title, name, empty.gloss, empty.formula, a_1.Consistent ? "consistent" : "contradiction", empty.atoms, empty.rows, empty.results, empty.subHeaders, empty.subRows, empty.actual, empty.line, empty.premises, empty.conclusion, empty.form, empty.fallacy, (!a_1.Consistent ? "These premises can\'t all hold at once — no diagram satisfies them." : "Shaded regions are empty; a dot marks a region the premises guarantee is occupied.") + ((rc != null) ? ((c_2 = rc, (matchValue = checkArgumentFO(rp, c_2), (matchValue.tag === 1) ? ((arg_2 = toUnicode(c_2), toText(printf("  The conclusion (%s) is NOT forced — there is a model of the premises where it fails."))(arg_2))) : ((matchValue.tag === 2) ? "" : ((arg_1 = toUnicode(c_2), toText(printf("  The conclusion (%s) is already forced by the premises — the argument is valid."))(arg_1))))))) : ""), empty.suggestion, empty.proof, empty.relations, empty.model, toArray(preds), toArray(cells), toArray(points));
    }
}

function squareBlock(rawS, rawP) {
    const s = normalizeTerm(rawS);
    const sx = new Formula(1, [s, singleton("x")]);
    const px = new Formula(1, [normalizeTerm(rawP), singleton("x")]);
    const cornerA = new Formula(11, ["x", new Formula(7, [sx, px])]);
    const cornerE = new Formula(11, ["x", new Formula(7, [sx, new Formula(3, [px])])]);
    const cornerI = new Formula(12, ["x", new Formula(4, [sx, px])]);
    const cornerO = new Formula(12, ["x", new Formula(4, [sx, new Formula(3, [px])])]);
    const holds = (f) => equals(valid(f), true);
    const status = (f_2) => {
        if (holds(f_2)) {
            return "holds";
        }
        else if (holds(new Formula(7, [new Formula(12, ["x", sx]), f_2]))) {
            return "aristotle";
        }
        else {
            return "fails";
        }
    };
    const edges = ofArray([["A", "contraries", "E", status(new Formula(3, [new Formula(4, [cornerA, cornerE])]))], ["I", "subcontraries", "O", status(new Formula(5, [cornerI, cornerO]))], ["A", "contradictories", "O", status(new Formula(8, [cornerA, new Formula(3, [cornerO])]))], ["E", "contradictories", "I", status(new Formula(8, [cornerE, new Formula(3, [cornerI])]))], ["A", "subalternation", "I", status(new Formula(7, [cornerA, cornerI]))], ["E", "subalternation", "O", status(new Formula(7, [cornerE, cornerO]))]]);
    const vennCircles = [rawS, rawP];
    const premises = map_2(toUnicode, [cornerA, cornerE, cornerI, cornerO]);
    const relations = toArray(edges);
    return new BlockView("square", empty.level, empty.title, empty.name, empty.gloss, empty.formula, empty.verdict, empty.atoms, empty.rows, empty.results, empty.subHeaders, empty.subRows, empty.actual, empty.line, premises, empty.conclusion, empty.form, empty.fallacy, toText(printf("Solid edges hold in modern logic; dashed amber edges hold only under Aristotle\'s *existential import* — the silent assumption that at least one %s exists. Only the contradictory diagonals survive without it."))(s), empty.suggestion, empty.proof, relations, empty.model, vennCircles, empty.vennCells, empty.vennPoints);
}

function foFormulaBlock(kindName, f) {
    const base$0027 = new BlockView(kindName, empty.level, empty.title, empty.name, empty.gloss, toUnicode(f), empty.verdict, empty.atoms, empty.rows, empty.results, empty.subHeaders, empty.subRows, empty.actual, empty.line, empty.premises, empty.conclusion, empty.form, empty.fallacy, empty.note, empty.suggestion, empty.proof, empty.relations, empty.model, empty.vennCircles, empty.vennCells, empty.vennPoints);
    const card = (search) => {
        if (search.tag === 1) {
            return toArray(describeModel(search.fields[0], f));
        }
        else {
            return [];
        }
    };
    const matchValue = foSatisfy(new Formula(3, [f]));
    const matchValue_1 = foSatisfy(f);
    let matchResult, witness, falsifying;
    switch (matchValue.tag) {
        case 2: {
            switch (matchValue_1.tag) {
                case 0: {
                    matchResult = 1;
                    break;
                }
                default:
                    matchResult = 2;
            }
            break;
        }
        case 1: {
            switch (matchValue_1.tag) {
                case 0: {
                    matchResult = 1;
                    break;
                }
                case 2: {
                    matchResult = 2;
                    break;
                }
                default: {
                    matchResult = 3;
                    falsifying = matchValue.fields[0];
                }
            }
            break;
        }
        default: {
            matchResult = 0;
            witness = matchValue_1;
        }
    }
    switch (matchResult) {
        case 0: {
            const note = "A quantified statement has no truth table. It is valid — true in every model checked (a bounded check, domains up to size 4). Here is one such model, where it holds as it does everywhere:";
            return new BlockView(base$0027.kind, base$0027.level, base$0027.title, base$0027.name, base$0027.gloss, base$0027.formula, "tautology", base$0027.atoms, base$0027.rows, base$0027.results, base$0027.subHeaders, base$0027.subRows, base$0027.actual, base$0027.line, base$0027.premises, base$0027.conclusion, base$0027.form, base$0027.fallacy, note, base$0027.suggestion, base$0027.proof, base$0027.relations, card(witness), base$0027.vennCircles, base$0027.vennCells, base$0027.vennPoints);
        }
        case 1: {
            const note_1 = "A quantified statement has no truth table. It is unsatisfiable: false in every model checked (domains up to size 4).";
            return new BlockView(base$0027.kind, base$0027.level, base$0027.title, base$0027.name, base$0027.gloss, base$0027.formula, "contradiction", base$0027.atoms, base$0027.rows, base$0027.results, base$0027.subHeaders, base$0027.subRows, base$0027.actual, base$0027.line, base$0027.premises, base$0027.conclusion, base$0027.form, base$0027.fallacy, note_1, base$0027.suggestion, base$0027.proof, base$0027.relations, base$0027.model, base$0027.vennCircles, base$0027.vennCells, base$0027.vennPoints);
        }
        case 2:
            return new BlockView(base$0027.kind, base$0027.level, base$0027.title, base$0027.name, base$0027.gloss, base$0027.formula, "unknown", base$0027.atoms, base$0027.rows, base$0027.results, base$0027.subHeaders, base$0027.subRows, base$0027.actual, base$0027.line, base$0027.premises, base$0027.conclusion, base$0027.form, base$0027.fallacy, tooLargeNote, base$0027.suggestion, base$0027.proof, base$0027.relations, base$0027.model, base$0027.vennCircles, base$0027.vennCells, base$0027.vennPoints);
        default: {
            const note_2 = "A quantified statement has no truth table. Its truth depends on the domain and interpretation — here is a model where it is false:";
            return new BlockView(base$0027.kind, base$0027.level, base$0027.title, base$0027.name, base$0027.gloss, base$0027.formula, "contingent", base$0027.atoms, base$0027.rows, base$0027.results, base$0027.subHeaders, base$0027.subRows, base$0027.actual, base$0027.line, base$0027.premises, base$0027.conclusion, base$0027.form, base$0027.fallacy, note_2, base$0027.suggestion, base$0027.proof, base$0027.relations, card(new FOSearch(1, [falsifying])), base$0027.vennCircles, base$0027.vennCells, base$0027.vennPoints);
        }
    }
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

function argumentBlock(defs, glosses, name, premises, conclusion) {
    let arg_2, f_4, f_6, f_7, f_9;
    const rp = map((formula) => resolve(defs, formula), premises);
    const rc = resolve(defs, conclusion);
    const fo = exists(containsFO, cons(rc, rp));
    const modal = !fo && exists(containsModal, cons(rc, rp));
    let patternInput;
    if (fo) {
        const matchValue = checkArgumentFO(rp, rc);
        patternInput = ((matchValue.tag === 2) ? [false, true, empty_2(), empty_2(), -1, empty_2()] : ((matchValue.tag === 1) ? [false, false, empty_2(), empty_2(), -1, describeModel(matchValue.fields[0], fold((acc, p) => (new Formula(4, [acc, p])), new Formula(3, [rc]), rp))] : [true, false, empty_2(), empty_2(), -1, empty_2()]));
    }
    else if (modal) {
        const matchValue_1 = checkArgumentS5(rp, rc);
        patternInput = ((matchValue_1.tag === 2) ? [false, true, empty_2(), empty_2(), -1, empty_2()] : ((matchValue_1.tag === 1) ? [false, false, List_distinct(collect(atoms_1, append(rp, singleton(rc))), {
            Equals: (x, y) => (x === y),
            GetHashCode: (x) => (stringHash(x) | 0),
        }), matchValue_1.fields[0], matchValue_1.fields[1], empty_2()] : [true, false, empty_2(), empty_2(), -1, empty_2()]));
    }
    else {
        const check = checkArgument(rp, rc);
        patternInput = [check.IsValid, false, check.Atoms, check.Counterexamples, -1, empty_2()];
    }
    const unknown = patternInput[1];
    const isValid = patternInput[0];
    const cxRows = patternInput[3];
    const cxAtoms = patternInput[2];
    const cxActual = patternInput[4] | 0;
    let recognized;
    if (unknown) {
        recognized = undefined;
    }
    else if (isValid) {
        recognized = recognize(validForms, rp, rc);
    }
    else {
        const matchValue_2 = recognize(fallacies, rp, rc);
        recognized = ((matchValue_2 == null) ? recognize(existentialImportForms, rp, rc) : matchValue_2);
    }
    const displayTitle = (form) => {
        if (form.Aka === "") {
            return form.Title;
        }
        else {
            return ((form.Title + " (") + form.Aka) + ")";
        }
    };
    const proofSteps = ((isValid && !modal) && !fo) ? defaultArg(prove(rp, rc), empty_2()) : empty_2();
    const repairs = (((isValid ? true : unknown) ? true : modal) ? true : fo) ? empty_2() : suggestRepairs(rp, rc);
    let premisesConsistent;
    if (isEmpty(rp)) {
        premisesConsistent = true;
    }
    else {
        const together_1 = reduce((a, b) => (new Formula(4, [a, b])), rp);
        premisesConsistent = (fo ? !equals(foSatisfy(together_1), new FOSearch(0, [])) : (modal ? !equals(s5Satisfy(together_1), new ModalSearch(0, [])) : !equals(truthTable(together_1).Verdict, new Verdict(1, []))));
    }
    let explanation;
    if (unknown) {
        explanation = tooLargeNote;
    }
    else if (isEmpty(rp)) {
        if (isValid) {
            explanation = ((recognized == null) ? (fo ? "A theorem: the conclusion holds in every model checked (domains up to size 4) — provable from no premises at all." : (modal ? "A theorem of S5: the conclusion holds at every world of every arrangement — provable from no premises at all." : "A theorem: the conclusion holds in every possible situation — a tautology, provable from no premises at all.")) : recognized.Note);
        }
        else if (fo) {
            explanation = "Not a theorem: there is a model where the conclusion fails.";
        }
        else if (modal) {
            explanation = "Not a theorem: there is an arrangement of possible worlds where the conclusion fails.";
        }
        else {
            const arg = length(cxRows) | 0;
            explanation = toText(printf("Not a theorem: the conclusion fails in %d situation(s), so it is no tautology."))(arg);
        }
    }
    else if (isValid && !premisesConsistent) {
        explanation = "Valid, but vacuously so: the premises contradict one another and can never all hold — and from a contradiction, anything follows (ex falso quodlibet).";
    }
    else if (recognized == null) {
        if (isValid && fo) {
            explanation = "Valid: no model (over domains up to size 4) makes every premise true and the conclusion false. First-order validity is undecidable, so this is a bounded check.";
        }
        else if (isValid && modal) {
            explanation = "Valid in S5: no arrangement of possible worlds makes every premise true at the actual world while the conclusion fails there.";
        }
        else if (isValid) {
            explanation = "Valid: no possible situation makes every premise true and the conclusion false.";
        }
        else if (fo) {
            explanation = "Invalid: here is a model where every premise holds but the conclusion fails.";
        }
        else if (modal) {
            explanation = "Invalid in S5: there is an arrangement of possible worlds where every premise holds at the actual world while the conclusion fails there.";
        }
        else {
            const arg_1 = length(cxRows) | 0;
            explanation = toText(printf("Invalid: %d situation(s) make every premise true while the conclusion fails."))(arg_1);
        }
    }
    else {
        explanation = recognized.Note;
    }
    let explanation_1;
    if (((isValid ? true : unknown) ? true : fo) ? true : modal) {
        explanation_1 = explanation;
    }
    else if (isEmpty(cxRows)) {
        explanation_1 = explanation;
    }
    else {
        const reading = trimEnd(toEnglish((n) => tryFind(n, glosses), rc), ".");
        explanation_1 = (explanation + ((arg_2 = describeSituation(head(cxRows)), toText(printf(" Picture the situation where %s: every premise holds — the columns show it — and yet “%s” fails."))(arg_2)(reading))));
    }
    const formLabel = (recognized != null) ? (((f_4 = recognized, isValid)) ? ((f_6 = recognized, displayTitle(f_6))) : (equals(recognized.Kind, new FormKind(2, [])) ? ((f_7 = recognized, displayTitle(f_7))) : ((isValid && isEmpty(rp)) ? "tautology" : ""))) : ((isValid && isEmpty(rp)) ? "tautology" : "");
    const premises_1 = toArray(map(toUnicode, rp));
    const conclusion_1 = toUnicode(rc);
    const verdict = unknown ? "unknown" : (isValid ? "valid" : "invalid");
    const fallacy = defaultArg((recognized != null) ? (((!isValid && !unknown) && equals(recognized.Kind, new FormKind(1, []))) ? ((f_9 = recognized, displayTitle(f_9))) : undefined) : undefined, "");
    const suggestion = toArray(map(toUnicode, repairs));
    const proof = toArray(mapIndexed(proofRow, proofSteps));
    return new BlockView("argument", empty.level, empty.title, name, empty.gloss, empty.formula, verdict, toArray(cxAtoms), toArray(map((env_1) => toArray(map((a_1) => defaultArg(tryFind(a_1, env_1), false), cxAtoms)), cxRows)), (cxActual >= 0) ? toArray(map((w) => evalS5(cxRows, w, rc), cxRows)) : toArray(map((_arg) => false, cxRows)), toArray(map(toUnicode, rp)), toArray(map((env_2) => toArray(map((p_1) => {
        if (cxActual >= 0) {
            return evalS5(cxRows, env_2, p_1);
        }
        else {
            return eval$(env_2, p_1);
        }
    }, rp)), cxRows)), cxActual, empty.line, premises_1, conclusion_1, formLabel, fallacy, explanation_1, suggestion, proof, empty.relations, toArray(patternInput[5]), empty.vennCircles, empty.vennCells, empty.vennPoints);
}

function proofBlock(defs, name, lines) {
    let known = empty_3({
        Compare: (x, y) => (comparePrimitives(x, y) | 0),
    });
    let allOk = true;
    const rows = [];
    const enumerator = getEnumerator(lines);
    try {
        while (enumerator["System.Collections.IEnumerator.MoveNext"]()) {
            let arg_2, arg_7, arg_8, arg_14, title, refs;
            const line = enumerator["System.Collections.Generic.IEnumerator`1.get_Current"]();
            if (line.tag === 1) {
                const ruleName = line.fields[2];
                const refs_1 = line.fields[3];
                const n_1 = line.fields[0] | 0;
                const rf_1 = resolve(defs, line.fields[1]);
                const duplicate = containsKey(n_1, known);
                const missing = filter((r) => !containsKey(r, known), refs_1);
                const normalizeRule = (s) => join("-", split(replace(replace(s.trim().toLowerCase(), "(", ""), ")", ""), [" ", "-"], undefined, 1));
                const wanted = normalizeRule(ruleName);
                const form = tryFind_1((fm) => {
                    if ((fm.Name === wanted) ? true : (normalizeRule(fm.Title) === wanted)) {
                        return true;
                    }
                    else if (fm.Aka !== "") {
                        return normalizeRule(fm.Aka) === wanted;
                    }
                    else {
                        return false;
                    }
                }, forms);
                let patternInput;
                if (duplicate) {
                    patternInput = ["bad", toText(printf("line number %d is used twice"))(n_1), ruleName];
                }
                else if (!isEmpty(missing)) {
                    patternInput = ["bad", (arg_2 = (head(missing) | 0), toText(printf("cites line %d, which doesn\'t exist earlier in the proof"))(arg_2)), ruleName];
                }
                else if (form != null) {
                    if (equals(form.Kind, new FormKind(1, []))) {
                        const fm_3 = form;
                        patternInput = ["bad", toText(printf("\'%s\' is a fallacy, not a rule — it cannot justify a step"))(fm_3.Title), fm_3.Title];
                    }
                    else if (equals(form.Kind, new FormKind(2, []))) {
                        const fm_4 = form;
                        patternInput = ["bad", toText(printf("\'%s\' holds only under Aristotle\'s existential import (that the classes aren\'t empty) — modern logic rejects this step"))(fm_4.Title), fm_4.Title];
                    }
                    else {
                        const fm_5 = form;
                        const cited = map((r_1) => FSharpMap__get_Item(known, r_1), refs_1);
                        if (length(fm_5.Premises) !== length(cited)) {
                            patternInput = ["bad", (arg_7 = (length(fm_5.Premises) | 0), (arg_8 = (length(cited) | 0), toText(printf("%s needs %d cited line(s) after `from`, got %d"))(fm_5.Title)(arg_7)(arg_8))), fm_5.Title];
                        }
                        else if (checkStep(fm_5, cited, rf_1)) {
                            patternInput = ["ok", "", fm_5.Title];
                        }
                        else {
                            const matchValue = recognize(validForms, cited, rf_1);
                            if (matchValue == null) {
                                if (exists(containsModal, cons(rf_1, cited))) {
                                    const matchValue_1 = checkArgumentS5(cited, rf_1);
                                    patternInput = ((matchValue_1.tag === 1) ? ["bad", "it does not follow from the cited lines at all — some arrangement of possible worlds makes them true and this false", fm_5.Title] : ((matchValue_1.tag === 2) ? ["bad", tooLargeNote, fm_5.Title] : ["bad", toText(printf("it does follow from the cited lines (S5), but not by %s — and no single catalog rule derives it in one step"))(fm_5.Title), fm_5.Title]));
                                }
                                else {
                                    const semantic = checkArgument(cited, rf_1);
                                    patternInput = (semantic.IsValid ? ["bad", toText(printf("it does follow from the cited lines, but not by %s — and no single catalog rule derives it in one step"))(fm_5.Title), fm_5.Title] : ["bad", (arg_14 = describeSituation(head(semantic.Counterexamples)), toText(printf("it does not follow from the cited lines at all — counterexample: %s"))(arg_14)), fm_5.Title]);
                                }
                            }
                            else {
                                const actual = matchValue;
                                patternInput = ["bad", toText(printf("this step doesn\'t match %s — it is actually %s (%s)"))(fm_5.Title)(actual.Title)(actual.Note), fm_5.Title];
                            }
                        }
                    }
                }
                else {
                    patternInput = ["bad", toText(printf("unknown rule \'%s\' — write it naturally (by modus ponens) or kebab-case (by modus-ponens); Latin aliases work too"))(ruleName), ruleName];
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
    return new BlockView("proof", empty.level, empty.title, name, empty.gloss, empty.formula, verdict, empty.atoms, empty.rows, empty.results, empty.subHeaders, empty.subRows, empty.actual, empty.line, empty.premises, defaultArg(map_1((l) => toUnicode(resolve(defs, (l.tag === 1) ? l.fields[1] : l.fields[1])), tryLast(lines)), ""), empty.form, empty.fallacy, note, empty.suggestion, rows.slice(), empty.relations, empty.model, empty.vennCircles, empty.vennCells, empty.vennPoints);
}

function relationInfo(defs, glosses, left, kind, right) {
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
            const classical = !(((containsModal(a) ? true : containsModal(b)) ? true : containsFO(a)) ? true : containsFO(b));
            const checkFormal = (f, holdsNote, failsNote) => {
                const matchValue_3 = valid(f);
                if (matchValue_3 == null) {
                    return ["asserted", tooLargeNote];
                }
                else if (matchValue_3) {
                    return ["holds", holdsNote];
                }
                else {
                    return ["fails", failsNote()];
                }
            };
            patternInput = ((kind.tag === 3) ? checkFormal(new Formula(7, [a, b]), "verified: whenever the first holds, so does the second", () => {
                if (classical) {
                    const arg = describeSituation(head(checkArgument(singleton(a), b).Counterexamples));
                    return toText(printf("does not hold — counterexample: %s"))(arg);
                }
                else {
                    return "does not hold — it fails in some situation the engine found";
                }
            }) : ((kind.tag === 2) ? checkFormal(new Formula(3, [new Formula(4, [a, b])]), "verified: they can never both be true", () => {
                if (classical) {
                    const arg_1 = describeSituation(find((tuple) => tuple[1], truthTable(new Formula(4, [a, b])).Rows)[0]);
                    return toText(printf("they CAN both be true — for instance when %s"))(arg_1);
                }
                else {
                    return "they CAN both be true — in some situation the engine found";
                }
            }) : checkFormal(new Formula(8, [a, b]), "verified: always the same truth value — two phrasings of one claim", () => {
                if (classical) {
                    const matchValue_4 = distinguishing(a, b);
                    if (matchValue_4 == null) {
                        return "not equivalent";
                    }
                    else {
                        const arg_2 = describeSituation(matchValue_4);
                        return toText(printf("not equivalent — they come apart when %s"))(arg_2);
                    }
                }
                else {
                    return "not equivalent — they come apart in some situation the engine found";
                }
            })));
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
    return new BlockView("relations", empty.level, empty.title, empty.name, empty.gloss, empty.formula, empty.verdict, empty.atoms, empty.rows, empty.results, empty.subHeaders, empty.subRows, empty.actual, empty.line, empty.premises, empty.conclusion, empty.form, empty.fallacy, empty.note, empty.suggestion, empty.proof, Array.from(delay(() => collect_1((i) => map_3((j) => {
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
    }, rangeDouble(i + 1, 1, length(claims) - 1)), rangeDouble(0, 1, length(claims) - 1)))), empty.model, empty.vennCircles, empty.vennCells, empty.vennPoints);
}

function toBlock(defs, glosses, claims, relationRows, arguments$, st) {
    let matchValue_3, arg;
    switch (st.tag) {
        case 1:
            return new BlockView("prose", empty.level, st.fields[0], empty.name, empty.gloss, empty.formula, empty.verdict, empty.atoms, empty.rows, empty.results, empty.subHeaders, empty.subRows, empty.actual, empty.line, empty.premises, empty.conclusion, empty.form, empty.fallacy, empty.note, empty.suggestion, empty.proof, empty.relations, empty.model, empty.vennCircles, empty.vennCells, empty.vennPoints);
        case 2:
            return new BlockView("prop", empty.level, empty.title, st.fields[0], st.fields[1], empty.formula, empty.verdict, empty.atoms, empty.rows, empty.results, empty.subHeaders, empty.subRows, empty.actual, empty.line, empty.premises, empty.conclusion, empty.form, empty.fallacy, empty.note, empty.suggestion, empty.proof, empty.relations, empty.model, empty.vennCircles, empty.vennCells, empty.vennPoints);
        case 3:
            return new BlockView("claim", empty.level, empty.title, st.fields[0], empty.gloss, toUnicode(st.fields[1]), empty.verdict, empty.atoms, empty.rows, empty.results, empty.subHeaders, empty.subRows, empty.actual, empty.line, empty.premises, empty.conclusion, empty.form, empty.fallacy, toEnglish((name) => tryFind(name, glosses), resolve(defs, st.fields[1])), empty.suggestion, empty.proof, empty.relations, empty.model, empty.vennCircles, empty.vennCells, empty.vennPoints);
        case 4: {
            const f_2 = (st.fields[0].tag === 0) ? resolve(defs, new Formula(0, [st.fields[0].fields[0]])) : resolve(defs, st.fields[0].fields[0]);
            if (containsFO(f_2)) {
                return foFormulaBlock("table", f_2);
            }
            else if (containsModal(f_2)) {
                return modalBlock("table", f_2);
            }
            else {
                return tableBlock(f_2);
            }
        }
        case 5:
            if (st.fields[0].tag === 1) {
                const matchValue = resolve(defs, st.fields[0].fields[0]);
                const rb = resolve(defs, st.fields[0].fields[1]);
                const ra = matchValue;
                const modal = containsModal(ra) ? true : containsModal(rb);
                let patternInput_1;
                const matchValue_2 = equivalent2(ra, rb);
                patternInput_1 = ((matchValue_2 == null) ? ["unknown", tooLargeNote] : (matchValue_2 ? (modal ? ["equivalent", "At every world of every arrangement the two sides carry the same truth value — two phrasings of one claim."] : ["equivalent", "In every possible situation the two sides carry the same truth value — two phrasings of one claim."]) : (modal ? ["not-equivalent", "They come apart in some arrangement of possible worlds: there, one holds and the other doesn\'t."] : ["not-equivalent", (matchValue_3 = distinguishing(ra, rb), (matchValue_3 == null) ? "" : ((arg = describeSituation(matchValue_3), toText(printf("They come apart when %s: then one holds and the other doesn\'t."))(arg))))])));
                return new BlockView("check", empty.level, empty.title, empty.name, empty.gloss, (toUnicode(ra) + " ≡ ") + toUnicode(rb), patternInput_1[0], empty.atoms, empty.rows, empty.results, empty.subHeaders, empty.subRows, empty.actual, empty.line, empty.premises, empty.conclusion, empty.form, empty.fallacy, patternInput_1[1], empty.suggestion, empty.proof, empty.relations, empty.model, empty.vennCircles, empty.vennCells, empty.vennPoints);
            }
            else {
                const rf = resolve(defs, st.fields[0].fields[0]);
                if (containsFO(rf)) {
                    return foFormulaBlock("check", rf);
                }
                else if (containsModal(rf)) {
                    return modalBlock("check", rf);
                }
                else {
                    const bind$0040 = tableBlock(rf);
                    return new BlockView("check", bind$0040.level, bind$0040.title, bind$0040.name, bind$0040.gloss, bind$0040.formula, bind$0040.verdict, bind$0040.atoms, bind$0040.rows, bind$0040.results, bind$0040.subHeaders, bind$0040.subRows, bind$0040.actual, bind$0040.line, bind$0040.premises, bind$0040.conclusion, bind$0040.form, bind$0040.fallacy, bind$0040.note, bind$0040.suggestion, bind$0040.proof, bind$0040.relations, bind$0040.model, bind$0040.vennCircles, bind$0040.vennCells, bind$0040.vennPoints);
                }
            }
        case 6:
            return argumentBlock(defs, glosses, st.fields[0], st.fields[1], st.fields[2]);
        case 7:
            return proofBlock(defs, st.fields[0], st.fields[1]);
        case 8:
            return vennBlock(defs, st.fields[0], st.fields[1], st.fields[2]);
        case 9: {
            const matchValue_4 = tryFind(st.fields[0], arguments$);
            if (matchValue_4 == null) {
                return new BlockView("venn", empty.level, empty.title, st.fields[0], empty.gloss, empty.formula, "not-drawable", empty.atoms, empty.rows, empty.results, empty.subHeaders, empty.subRows, empty.actual, empty.line, empty.premises, empty.conclusion, empty.form, empty.fallacy, toText(printf("No argument named \'%s\' to draw — `venn` needs the name of an `argument` defined in this document."))(st.fields[0]), empty.suggestion, empty.proof, empty.relations, empty.model, empty.vennCircles, empty.vennCells, empty.vennPoints);
            }
            else {
                return vennBlock(defs, st.fields[0], matchValue_4[0], matchValue_4[1]);
            }
        }
        case 10:
            return squareBlock(st.fields[0], st.fields[1]);
        case 11:
            return relationsBlock(claims);
        case 12: {
            const patternInput_2 = relationInfo(defs, glosses, st.fields[0], st.fields[1], st.fields[2]);
            return new BlockView("relation", empty.level, patternInput_2[1], empty.name, empty.gloss, patternInput_2[0], patternInput_2[3], empty.atoms, empty.rows, empty.results, empty.subHeaders, empty.subRows, empty.actual, empty.line, empty.premises, patternInput_2[2], empty.form, empty.fallacy, patternInput_2[4], empty.suggestion, empty.proof, empty.relations, empty.model, empty.vennCircles, empty.vennCells, empty.vennPoints);
        }
        case 13:
            return new BlockView("map", empty.level, empty.title, empty.name, empty.gloss, empty.formula, empty.verdict, empty.atoms, empty.rows, empty.results, empty.subHeaders, empty.subRows, empty.actual, empty.line, empty.premises, empty.conclusion, empty.form, empty.fallacy, empty.note, empty.suggestion, empty.proof, relationRows, empty.model, empty.vennCircles, empty.vennCells, empty.vennPoints);
        default:
            return new BlockView("heading", st.fields[0], st.fields[1], empty.name, empty.gloss, empty.formula, empty.verdict, empty.atoms, empty.rows, empty.results, empty.subHeaders, empty.subRows, empty.actual, empty.line, empty.premises, empty.conclusion, empty.form, empty.fallacy, empty.note, empty.suggestion, empty.proof, empty.relations, empty.model, empty.vennCircles, empty.vennCells, empty.vennPoints);
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
    const arguments$ = ofList(choose((_arg_4) => {
        if (_arg_4.tag === 6) {
            return [_arg_4.fields[0], [_arg_4.fields[1], _arg_4.fields[2]]];
        }
        else {
            return undefined;
        }
    }, statements), {
        Compare: (x_2, y_2) => (comparePrimitives(x_2, y_2) | 0),
    });
    const relationRows = toArray(choose((_arg_5) => {
        if (_arg_5.tag === 12) {
            const patternInput = relationInfo(defs, glosses, _arg_5.fields[0], _arg_5.fields[1], _arg_5.fields[2]);
            return [patternInput[0], patternInput[1], patternInput[2], patternInput[3]];
        }
        else {
            return undefined;
        }
    }, statements));
    const entries = [];
    const proseBuffer = [];
    const flushProse = () => {
        if (proseBuffer.length > 0) {
            void (entries.push(new FSharpChoice$2(0, [new Statement(1, [join(" ", ofSeq(proseBuffer))])])));
            clear(proseBuffer);
        }
    };
    const enumerator = getEnumerator(parsed);
    try {
        while (enumerator["System.Collections.IEnumerator.MoveNext"]()) {
            const forLoopVar = enumerator["System.Collections.Generic.IEnumerator`1.get_Current"]();
            const r_2 = forLoopVar[1];
            if (r_2.tag === 1) {
                flushProse();
                void (entries.push(new FSharpChoice$2(1, [[forLoopVar[0], r_2.fields[0]]])));
            }
            else if (r_2.fields[0] == null) {
                flushProse();
            }
            else if (r_2.fields[0].tag === 1) {
                const text = r_2.fields[0].fields[0];
                void (proseBuffer.push(text));
            }
            else {
                const st_1 = r_2.fields[0];
                flushProse();
                void (entries.push(new FSharpChoice$2(0, [st_1])));
            }
        }
    }
    finally {
        disposeSafe(enumerator);
    }
    flushProse();
    return map_2((_arg_6) => {
        if (_arg_6.tag === 1) {
            return new BlockView("error", empty.level, _arg_6.fields[0][1], empty.name, empty.gloss, empty.formula, empty.verdict, empty.atoms, empty.rows, empty.results, empty.subHeaders, empty.subRows, empty.actual, _arg_6.fields[0][0], empty.premises, empty.conclusion, empty.form, empty.fallacy, empty.note, empty.suggestion, empty.proof, empty.relations, empty.model, empty.vennCircles, empty.vennCells, empty.vennPoints);
        }
        else {
            return toBlock(defs, glosses, claims, relationRows, arguments$, _arg_6.fields[0]);
        }
    }, entries.slice());
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
    const mentioned = (f_4_mut) => {
        mentioned:
        while (true) {
            const f_4 = f_4_mut;
            let matchResult_1, a_1, a_2, b_1;
            switch (f_4.tag) {
                case 1: {
                    matchResult_1 = 1;
                    break;
                }
                case 2: {
                    matchResult_1 = 2;
                    break;
                }
                case 3: {
                    matchResult_1 = 3;
                    a_1 = f_4.fields[0];
                    break;
                }
                case 9: {
                    matchResult_1 = 3;
                    a_1 = f_4.fields[0];
                    break;
                }
                case 10: {
                    matchResult_1 = 3;
                    a_1 = f_4.fields[0];
                    break;
                }
                case 11: {
                    matchResult_1 = 3;
                    a_1 = f_4.fields[1];
                    break;
                }
                case 12: {
                    matchResult_1 = 3;
                    a_1 = f_4.fields[1];
                    break;
                }
                case 4: {
                    matchResult_1 = 4;
                    a_2 = f_4.fields[0];
                    b_1 = f_4.fields[1];
                    break;
                }
                case 5: {
                    matchResult_1 = 4;
                    a_2 = f_4.fields[0];
                    b_1 = f_4.fields[1];
                    break;
                }
                case 6: {
                    matchResult_1 = 4;
                    a_2 = f_4.fields[0];
                    b_1 = f_4.fields[1];
                    break;
                }
                case 7: {
                    matchResult_1 = 4;
                    a_2 = f_4.fields[0];
                    b_1 = f_4.fields[1];
                    break;
                }
                case 8: {
                    matchResult_1 = 4;
                    a_2 = f_4.fields[0];
                    b_1 = f_4.fields[1];
                    break;
                }
                default:
                    matchResult_1 = 0;
            }
            switch (matchResult_1) {
                case 0:
                    return singleton(f_4.fields[0]);
                case 1:
                    return cons(f_4.fields[0], f_4.fields[1]);
                case 2:
                    return empty_2();
                case 3: {
                    f_4_mut = a_1;
                    continue mentioned;
                }
                default:
                    return append(mentioned(a_2), mentioned(b_1));
            }
            break;
        }
    };
    const usedNames = ofList_1(collect(mentioned, collect((tupledArg_1) => {
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
            case 8:
                return append(st_1.fields[1], ofArray(toArray_1(st_1.fields[2])));
            case 9:
                return empty_2();
            case 10:
                return empty_2();
            case 12:
                return choose((_arg_1) => {
                    if (_arg_1.tag === 1) {
                        return undefined;
                    }
                    else {
                        return new Formula(0, [_arg_1.fields[0]]);
                    }
                }, ofArray([st_1.fields[0], st_1.fields[2]]));
            default:
                return empty_2();
        }
    }, statements)), {
        Compare: (x, y) => (comparePrimitives(x, y) | 0),
    });
    const declaredNames = ofList_1(choose((tupledArg_2) => {
        const st_3 = tupledArg_2[1];
        let matchResult_3, n_4;
        switch (st_3.tag) {
            case 2: {
                matchResult_3 = 0;
                n_4 = st_3.fields[0];
                break;
            }
            case 3: {
                matchResult_3 = 0;
                n_4 = st_3.fields[0];
                break;
            }
            default:
                matchResult_3 = 1;
        }
        switch (matchResult_3) {
            case 0:
                return n_4;
            default:
                return undefined;
        }
    }, statements), {
        Compare: (x_1, y_1) => (comparePrimitives(x_1, y_1) | 0),
    });
    return toArray(collect((tupledArg_3) => {
        const lineNo = tupledArg_3[0] | 0;
        const st_4 = tupledArg_3[1];
        let matchResult_4, name_1, l_1, r_2;
        switch (st_4.tag) {
            case 2: {
                if (!contains(st_4.fields[0], usedNames)) {
                    matchResult_4 = 0;
                    name_1 = st_4.fields[0];
                }
                else {
                    matchResult_4 = 2;
                }
                break;
            }
            case 12: {
                matchResult_4 = 1;
                l_1 = st_4.fields[0];
                r_2 = st_4.fields[2];
                break;
            }
            default:
                matchResult_4 = 2;
        }
        switch (matchResult_4) {
            case 0:
                return singleton(new LintView(lineNo, toText(printf("prop \'%s\' is declared but never used in a formula"))(name_1)));
            case 1:
                return choose((_arg_4) => {
                    let matchResult_5, n_6;
                    if (_arg_4.tag === 0) {
                        if (!contains(_arg_4.fields[0], declaredNames)) {
                            matchResult_5 = 0;
                            n_6 = _arg_4.fields[0];
                        }
                        else {
                            matchResult_5 = 1;
                        }
                    }
                    else {
                        matchResult_5 = 1;
                    }
                    switch (matchResult_5) {
                        case 0:
                            return new LintView(lineNo, toText(printf("relation references \'%s\', which is not a declared prop or claim — it will appear as an ad-hoc node (quote it to make that intentional)"))(n_6));
                        default:
                            return undefined;
                    }
                }, ofArray([l_1, r_2]));
            default:
                return empty_2();
        }
    }, statements));
}

