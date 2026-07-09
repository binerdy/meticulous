
import { Formula } from "./Ast.js";
import { empty, add, contains } from "./fable_modules/fable-library-js.5.6.0/Set.js";
import { ofList, tryFind } from "./fable_modules/fable-library-js.5.6.0/Map.js";
import { equals, stringHash, comparePrimitives } from "./fable_modules/fable-library-js.5.6.0/Util.js";
import { filter, collect, tryFind as tryFind_1, fold, cons, head, tail, isEmpty, reverse, toArray, exists, forAll, map as map_1, mapIndexed, length, empty as empty_1, singleton, append, contains as contains_1 } from "./fable_modules/fable-library-js.5.6.0/List.js";
import { defaultArg } from "./fable_modules/fable-library-js.5.6.0/Option.js";
import { map, delay, toList } from "./fable_modules/fable-library-js.5.6.0/Seq.js";
import { rangeDouble } from "./fable_modules/fable-library-js.5.6.0/Range.js";
import { Record, Union } from "./fable_modules/fable-library-js.5.6.0/Types.js";
import { int32_type, record_type, tuple_type, class_type, bool_type, list_type, string_type, union_type } from "./fable_modules/fable-library-js.5.6.0/Reflection.js";
import { min, max } from "./fable_modules/fable-library-js.5.6.0/Double.js";
import { item } from "./fable_modules/fable-library-js.5.6.0/Array.js";

/**
 * Replace any atom that is actually a *claim name* with the claim's body,
 * recursively. Claim names are just abbreviations: `table C1` should behave
 * exactly as if you'd written C1's formula in full. Props (which have no
 * entry in `defs`) are left as plain atoms.
 * 
 * The `seen` set guards against a claim that (directly or via another
 * claim) refers to itself — we stop expanding instead of looping forever.
 */
export function resolve(defs, formula) {
    const go = (seen_mut, f_mut) => {
        go:
        while (true) {
            const seen = seen_mut, f = f_mut;
            switch (f.tag) {
                case 1:
                    return f;
                case 2:
                    return new Formula(2, [go(seen, f.fields[0])]);
                case 3:
                    return new Formula(3, [go(seen, f.fields[0]), go(seen, f.fields[1])]);
                case 4:
                    return new Formula(4, [go(seen, f.fields[0]), go(seen, f.fields[1])]);
                case 5:
                    return new Formula(5, [go(seen, f.fields[0]), go(seen, f.fields[1])]);
                case 6:
                    return new Formula(6, [go(seen, f.fields[0]), go(seen, f.fields[1])]);
                case 7:
                    return new Formula(7, [go(seen, f.fields[0]), go(seen, f.fields[1])]);
                case 8:
                    return new Formula(8, [go(seen, f.fields[0])]);
                case 9:
                    return new Formula(9, [go(seen, f.fields[0])]);
                default:
                    if (!contains(f.fields[0], seen)) {
                        const matchValue = tryFind(f.fields[0], defs);
                        if (matchValue == null) {
                            return new Formula(0, [f.fields[0]]);
                        }
                        else {
                            const body = matchValue;
                            seen_mut = add(f.fields[0], seen);
                            f_mut = body;
                            continue go;
                        }
                    }
                    else {
                        return new Formula(0, [f.fields[0]]);
                    }
            }
            break;
        }
    };
    return go(empty({
        Compare: (x, y) => (comparePrimitives(x, y) | 0),
    }), formula);
}

/**
 * All distinct atom names in a formula, in order of first appearance.
 * (Order matters so the truth table columns read left-to-right naturally.)
 */
export function atoms(f) {
    const go = (f_1_mut, acc_mut) => {
        go:
        while (true) {
            const f_1 = f_1_mut, acc = acc_mut;
            let matchResult, a, a_1, b;
            switch (f_1.tag) {
                case 1: {
                    matchResult = 1;
                    break;
                }
                case 2: {
                    matchResult = 2;
                    a = f_1.fields[0];
                    break;
                }
                case 8: {
                    matchResult = 2;
                    a = f_1.fields[0];
                    break;
                }
                case 9: {
                    matchResult = 2;
                    a = f_1.fields[0];
                    break;
                }
                case 3: {
                    matchResult = 3;
                    a_1 = f_1.fields[0];
                    b = f_1.fields[1];
                    break;
                }
                case 4: {
                    matchResult = 3;
                    a_1 = f_1.fields[0];
                    b = f_1.fields[1];
                    break;
                }
                case 5: {
                    matchResult = 3;
                    a_1 = f_1.fields[0];
                    b = f_1.fields[1];
                    break;
                }
                case 6: {
                    matchResult = 3;
                    a_1 = f_1.fields[0];
                    b = f_1.fields[1];
                    break;
                }
                case 7: {
                    matchResult = 3;
                    a_1 = f_1.fields[0];
                    b = f_1.fields[1];
                    break;
                }
                default:
                    matchResult = 0;
            }
            switch (matchResult) {
                case 0: {
                    const name = f_1.fields[0];
                    if (contains_1(name, acc, {
                        Equals: (x, y) => (x === y),
                        GetHashCode: (x) => (stringHash(x) | 0),
                    })) {
                        return acc;
                    }
                    else {
                        return append(acc, singleton(name));
                    }
                }
                case 1:
                    return acc;
                case 2: {
                    f_1_mut = a;
                    acc_mut = acc;
                    continue go;
                }
                default: {
                    f_1_mut = b;
                    acc_mut = go(a_1, acc);
                    continue go;
                }
            }
            break;
        }
    };
    return go(f, empty_1());
}

/**
 * Evaluate a formula under an assignment of truth values to its atoms.
 * □ and ◇ are read over a *single-world* model here (where they both
 * collapse to the formula itself) — genuine multi-world evaluation lives
 * in `evalS5` below, and modal formulas should be routed there.
 */
export function eval$(env_mut, f_mut) {
    eval$:
    while (true) {
        const env = env_mut, f = f_mut;
        let matchResult, a_6;
        switch (f.tag) {
            case 1: {
                matchResult = 1;
                break;
            }
            case 2: {
                matchResult = 2;
                break;
            }
            case 3: {
                matchResult = 3;
                break;
            }
            case 4: {
                matchResult = 4;
                break;
            }
            case 5: {
                matchResult = 5;
                break;
            }
            case 6: {
                matchResult = 6;
                break;
            }
            case 7: {
                matchResult = 7;
                break;
            }
            case 8: {
                matchResult = 8;
                a_6 = f.fields[0];
                break;
            }
            case 9: {
                matchResult = 8;
                a_6 = f.fields[0];
                break;
            }
            default:
                matchResult = 0;
        }
        switch (matchResult) {
            case 0:
                return defaultArg(tryFind(f.fields[0], env), false);
            case 1:
                return f.fields[0];
            case 2:
                return !eval$(env, f.fields[0]);
            case 3:
                if (eval$(env, f.fields[0])) {
                    env_mut = env;
                    f_mut = f.fields[1];
                    continue eval$;
                }
                else {
                    return false;
                }
            case 4:
                if (eval$(env, f.fields[0])) {
                    return true;
                }
                else {
                    env_mut = env;
                    f_mut = f.fields[1];
                    continue eval$;
                }
            case 5:
                return eval$(env, f.fields[0]) !== eval$(env, f.fields[1]);
            case 6:
                if (!eval$(env, f.fields[0])) {
                    return true;
                }
                else {
                    env_mut = env;
                    f_mut = f.fields[1];
                    continue eval$;
                }
            case 7:
                return eval$(env, f.fields[0]) === eval$(env, f.fields[1]);
            default: {
                env_mut = env;
                f_mut = a_6;
                continue eval$;
            }
        }
        break;
    }
}

/**
 * Every combination of truth values for the given atoms.
 * For n atoms this produces 2^n assignments. We read row index `i` as a
 * binary number whose most-significant bit is the first atom, so the table
 * counts down T,T … F,F in the familiar order.
 */
export function assignments(names) {
    const n = length(names) | 0;
    return toList(delay(() => map((i) => ofList(mapIndexed((bit, name) => [name, ((i >> ((n - 1) - bit)) & 1) === 1], names), {
        Compare: (x, y) => (comparePrimitives(x, y) | 0),
    }), rangeDouble(0, 1, (1 << n) - 1))));
}

/**
 * The character of a formula, judged over all assignments.
 */
export class Verdict extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["Tautology", "Contradiction", "Contingent"];
    }
}

export function Verdict_$reflection() {
    return union_type("Meticulous.Engine.Verdict", [], Verdict, () => [[], [], []]);
}

/**
 * A computed truth table: the atom columns, one row per assignment (with
 * its result), and the overall verdict.
 */
export class TruthTable extends Record {
    constructor(Atoms, Rows, Verdict) {
        super();
        this.Atoms = Atoms;
        this.Rows = Rows;
        this.Verdict = Verdict;
    }
}

export function TruthTable_$reflection() {
    return record_type("Meticulous.Engine.TruthTable", [], TruthTable, () => [["Atoms", list_type(string_type)], ["Rows", list_type(tuple_type(class_type("Microsoft.FSharp.Collections.FSharpMap`2", [string_type, bool_type]), bool_type))], ["Verdict", Verdict_$reflection()]]);
}

export function truthTable(f) {
    const names = atoms(f);
    const rows = map_1((env) => [env, eval$(env, f)], assignments(names));
    const results = map_1((tuple) => tuple[1], rows);
    return new TruthTable(names, rows, forAll((x) => x, results) ? (new Verdict(0, [])) : (forAll((value) => !value, results) ? (new Verdict(1, [])) : (new Verdict(2, []))));
}

/**
 * Does the formula mention □ or ◇ anywhere? Decides whether the classical
 * truth-table machinery is enough or the S5 machinery must take over.
 */
export function containsModal(f_mut) {
    containsModal:
    while (true) {
        const f = f_mut;
        let matchResult, a_1, b;
        switch (f.tag) {
            case 8:
            case 9: {
                matchResult = 1;
                break;
            }
            case 2: {
                matchResult = 2;
                break;
            }
            case 3: {
                matchResult = 3;
                a_1 = f.fields[0];
                b = f.fields[1];
                break;
            }
            case 4: {
                matchResult = 3;
                a_1 = f.fields[0];
                b = f.fields[1];
                break;
            }
            case 5: {
                matchResult = 3;
                a_1 = f.fields[0];
                b = f.fields[1];
                break;
            }
            case 6: {
                matchResult = 3;
                a_1 = f.fields[0];
                b = f.fields[1];
                break;
            }
            case 7: {
                matchResult = 3;
                a_1 = f.fields[0];
                b = f.fields[1];
                break;
            }
            default:
                matchResult = 0;
        }
        switch (matchResult) {
            case 0:
                return false;
            case 1:
                return true;
            case 2: {
                f_mut = f.fields[0];
                continue containsModal;
            }
            default:
                if (containsModal(a_1)) {
                    return true;
                }
                else {
                    f_mut = b;
                    continue containsModal;
                }
        }
        break;
    }
}

function modalOps(f_mut) {
    modalOps:
    while (true) {
        const f = f_mut;
        let matchResult, a, a_2, b;
        switch (f.tag) {
            case 8: {
                matchResult = 1;
                a = f.fields[0];
                break;
            }
            case 9: {
                matchResult = 1;
                a = f.fields[0];
                break;
            }
            case 2: {
                matchResult = 2;
                break;
            }
            case 3: {
                matchResult = 3;
                a_2 = f.fields[0];
                b = f.fields[1];
                break;
            }
            case 4: {
                matchResult = 3;
                a_2 = f.fields[0];
                b = f.fields[1];
                break;
            }
            case 5: {
                matchResult = 3;
                a_2 = f.fields[0];
                b = f.fields[1];
                break;
            }
            case 6: {
                matchResult = 3;
                a_2 = f.fields[0];
                b = f.fields[1];
                break;
            }
            case 7: {
                matchResult = 3;
                a_2 = f.fields[0];
                b = f.fields[1];
                break;
            }
            default:
                matchResult = 0;
        }
        switch (matchResult) {
            case 0:
                return 0;
            case 1:
                return (1 + modalOps(a)) | 0;
            case 2: {
                f_mut = f.fields[0];
                continue modalOps;
            }
            default:
                return (modalOps(a_2) + modalOps(b)) | 0;
        }
        break;
    }
}

/**
 * Evaluate a formula at world `w` of an S5 model (the list of all worlds).
 */
export function evalS5(model_mut, w_mut, f_mut) {
    evalS5:
    while (true) {
        const model = model_mut, w = w_mut, f = f_mut;
        switch (f.tag) {
            case 1:
                return f.fields[0];
            case 2:
                return !evalS5(model, w, f.fields[0]);
            case 3:
                if (evalS5(model, w, f.fields[0])) {
                    model_mut = model;
                    w_mut = w;
                    f_mut = f.fields[1];
                    continue evalS5;
                }
                else {
                    return false;
                }
            case 4:
                if (evalS5(model, w, f.fields[0])) {
                    return true;
                }
                else {
                    model_mut = model;
                    w_mut = w;
                    f_mut = f.fields[1];
                    continue evalS5;
                }
            case 5:
                return evalS5(model, w, f.fields[0]) !== evalS5(model, w, f.fields[1]);
            case 6:
                if (!evalS5(model, w, f.fields[0])) {
                    return true;
                }
                else {
                    model_mut = model;
                    w_mut = w;
                    f_mut = f.fields[1];
                    continue evalS5;
                }
            case 7:
                return evalS5(model, w, f.fields[0]) === evalS5(model, w, f.fields[1]);
            case 8:
                return forAll((v) => evalS5(model, v, f.fields[0]), model);
            case 9:
                return exists((v_1) => evalS5(model, v_1, f.fields[0]), model);
            default:
                return defaultArg(tryFind(f.fields[0], w), false);
        }
        break;
    }
}

/**
 * The outcome of an S5 model search. `TooLarge` is the honest answer when
 * a formula has too many atoms × modalities to check exhaustively.
 */
export class ModalSearch extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["NoModel", "Model", "TooLarge"];
    }
}

export function ModalSearch_$reflection() {
    return union_type("Meticulous.Engine.ModalSearch", [], ModalSearch, () => [[], [["worlds", list_type(class_type("Microsoft.FSharp.Collections.FSharpMap`2", [string_type, bool_type]))], ["actual", int32_type]], []]);
}

/**
 * Find an S5 model and actual world making the formula TRUE, if any.
 * The search is complete within its bound: worlds are drawn from all 2^n
 * valuations, and models never need more worlds than modal operators + 1.
 */
export function s5Satisfy(f) {
    const valuations = toArray(assignments(atoms(f)));
    const neededWorlds = max(1, modalOps(f) + 1) | 0;
    const maxWorlds = min(neededWorlds, 6) | 0;
    let examined = 0;
    const search = (k_mut) => {
        search:
        while (true) {
            const k = k_mut;
            if (k > maxWorlds) {
                return new ModalSearch(0, []);
            }
            else {
                const extend = (chosen, start) => {
                    if (length(chosen) === k) {
                        examined = ((examined + 1) | 0);
                        if (examined > 200000) {
                            return new ModalSearch(2, []);
                        }
                        else {
                            const worlds = map_1((i) => item(i, valuations), reverse(chosen));
                            const tryActual = (idx_mut, seen_mut, indices_mut) => {
                                tryActual:
                                while (true) {
                                    const idx = idx_mut, seen = seen_mut, indices = indices_mut;
                                    if (!isEmpty(indices)) {
                                        const rest = tail(indices);
                                        const i_1 = head(indices) | 0;
                                        if (contains(i_1, seen)) {
                                            idx_mut = (idx + 1);
                                            seen_mut = seen;
                                            indices_mut = rest;
                                            continue tryActual;
                                        }
                                        else if (evalS5(worlds, item(i_1, valuations), f)) {
                                            return new ModalSearch(1, [worlds, idx]);
                                        }
                                        else {
                                            idx_mut = (idx + 1);
                                            seen_mut = add(i_1, seen);
                                            indices_mut = rest;
                                            continue tryActual;
                                        }
                                    }
                                    else {
                                        return new ModalSearch(0, []);
                                    }
                                    break;
                                }
                            };
                            return tryActual(0, empty({
                                Compare: (x, y) => (comparePrimitives(x, y) | 0),
                            }), reverse(chosen));
                        }
                    }
                    else {
                        let result = new ModalSearch(0, []);
                        let i_2 = start;
                        while (equals(result, new ModalSearch(0, [])) && (i_2 < valuations.length)) {
                            result = extend(cons(i_2, chosen), i_2);
                            i_2 = ((i_2 + 1) | 0);
                        }
                        return result;
                    }
                };
                const matchValue = extend(empty_1(), 0);
                if (matchValue.tag === 0) {
                    k_mut = (k + 1);
                    continue search;
                }
                else {
                    return matchValue;
                }
            }
            break;
        }
    };
    const matchValue_1 = search(1);
    let matchResult, result_1;
    if (matchValue_1.tag === 0) {
        if (neededWorlds > maxWorlds) {
            matchResult = 0;
        }
        else {
            matchResult = 1;
            result_1 = matchValue_1;
        }
    }
    else {
        matchResult = 1;
        result_1 = matchValue_1;
    }
    switch (matchResult) {
        case 0:
            return new ModalSearch(2, []);
        default:
            return result_1;
    }
}

/**
 * Is the formula true at every world of every S5 model? (The modal
 * analogue of a tautology.) `None` when the search is too large to settle.
 */
export function s5Valid(f) {
    const matchValue = s5Satisfy(new Formula(2, [f]));
    switch (matchValue.tag) {
        case 1:
            return false;
        case 2:
            return undefined;
        default:
            return true;
    }
}

/**
 * One validity door for both logics: classical truth tables when the
 * formula is modal-free, the S5 model search when it isn't.
 */
export function valid(f) {
    if (containsModal(f)) {
        return s5Valid(f);
    }
    else {
        return equals(truthTable(f).Verdict, new Verdict(0, []));
    }
}

/**
 * Two formulas are logically equivalent when they agree in every possible
 * situation — every assignment classically, every world-arrangement
 * modally. `None` when a modal search is too large to settle.
 */
export function equivalent2(a, b) {
    return valid(new Formula(7, [a, b]));
}

/**
 * Classical-only convenience kept for the propositional call sites.
 */
export function equivalent(a, b) {
    return equals(truthTable(new Formula(7, [a, b])).Verdict, new Verdict(0, []));
}

/**
 * Check a *modal* argument in S5: search for a countermodel — an
 * arrangement of worlds where every premise holds at the actual world
 * but the conclusion fails there.
 */
export function checkArgumentS5(premises, conclusion) {
    return s5Satisfy(fold((acc, p) => (new Formula(3, [acc, p])), new Formula(2, [conclusion]), premises));
}

/**
 * Find one assignment where two formulas disagree — the concrete situation
 * showing they are *not* the same claim. None when they are equivalent.
 */
export function distinguishing(a, b) {
    return tryFind_1((env) => (eval$(env, a) !== eval$(env, b)), assignments(atoms(new Formula(7, [a, b]))));
}

function tautology(f) {
    return equals(truthTable(f).Verdict, new Verdict(0, []));
}

/**
 * The result of checking an argument. An argument is *valid* when there is
 * no possible assignment that makes every premise true but the conclusion
 * false. Each such assignment is a *counterexample* — the exact situation
 * in which the argument fails — and we keep them all for display.
 */
export class ArgumentCheck extends Record {
    constructor(Atoms, Counterexamples, IsValid) {
        super();
        this.Atoms = Atoms;
        this.Counterexamples = Counterexamples;
        this.IsValid = IsValid;
    }
}

export function ArgumentCheck_$reflection() {
    return record_type("Meticulous.Engine.ArgumentCheck", [], ArgumentCheck, () => [["Atoms", list_type(string_type)], ["Counterexamples", list_type(class_type("Microsoft.FSharp.Collections.FSharpMap`2", [string_type, bool_type]))], ["IsValid", bool_type]]);
}

export function checkArgument(premises, conclusion) {
    const names = fold((acc, a) => {
        if (contains_1(a, acc, {
            Equals: (x, y) => (x === y),
            GetHashCode: (x) => (stringHash(x) | 0),
        })) {
            return acc;
        }
        else {
            return append(acc, singleton(a));
        }
    }, empty_1(), collect(atoms, append(premises, singleton(conclusion))));
    const counterexamples = filter((env) => {
        if (forAll((f_1) => eval$(env, f_1), premises)) {
            return !eval$(env, conclusion);
        }
        else {
            return false;
        }
    }, assignments(names));
    return new ArgumentCheck(names, counterexamples, isEmpty(counterexamples));
}

/**
 * How two formulas stand to each other — the classical "square of
 * opposition", generalised to arbitrary formulas. We check the strong
 * relations first, because each one implies some of the weaker ones.
 * (RequireQualifiedAccess means you write `Relation.Entails`, which keeps
 * these short names from colliding with anything else.)
 */
export class Relation extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["Equivalent", "Contradictory", "Contrary", "Subcontrary", "Entails", "EntailedBy", "Independent"];
    }
}

export function Relation_$reflection() {
    return union_type("Meticulous.Engine.Relation", [], Relation, () => [[], [], [], [], [], [], []]);
}

export function relate(a, b) {
    const holds = (f) => equals(valid(f), true);
    if (holds(new Formula(7, [a, b]))) {
        return new Relation(0, []);
    }
    else if (holds(new Formula(7, [a, new Formula(2, [b])]))) {
        return new Relation(1, []);
    }
    else if (holds(new Formula(2, [new Formula(3, [a, b])]))) {
        return new Relation(2, []);
    }
    else if (holds(new Formula(4, [a, b]))) {
        return new Relation(3, []);
    }
    else if (holds(new Formula(6, [a, b]))) {
        return new Relation(4, []);
    }
    else if (holds(new Formula(6, [b, a]))) {
        return new Relation(5, []);
    }
    else {
        return new Relation(6, []);
    }
}

