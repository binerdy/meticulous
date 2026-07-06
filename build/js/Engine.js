
import { Formula } from "./Ast.js";
import { ofList, tryFind } from "./fable_modules/fable-library-js.5.6.0/Map.js";
import { forAll, map as map_1, mapIndexed, length, empty, singleton, append, contains } from "./fable_modules/fable-library-js.5.6.0/List.js";
import { equals, comparePrimitives, stringHash } from "./fable_modules/fable-library-js.5.6.0/Util.js";
import { defaultArg } from "./fable_modules/fable-library-js.5.6.0/Option.js";
import { map, delay, toList } from "./fable_modules/fable-library-js.5.6.0/Seq.js";
import { rangeDouble } from "./fable_modules/fable-library-js.5.6.0/Range.js";
import { Record, Union } from "./fable_modules/fable-library-js.5.6.0/Types.js";
import { record_type, tuple_type, class_type, bool_type, list_type, string_type, union_type } from "./fable_modules/fable-library-js.5.6.0/Reflection.js";

/**
 * Replace any atom that is actually a *claim name* with the claim's body,
 * recursively. Claim names are just abbreviations: `table C1` should behave
 * exactly as if you'd written C1's formula in full. Props (which have no
 * entry in `defs`) are left as plain atoms.
 */
export function resolve(defs_mut, f_mut) {
    resolve:
    while (true) {
        const defs = defs_mut, f = f_mut;
        switch (f.tag) {
            case 1:
                return f;
            case 2:
                return new Formula(2, [resolve(defs, f.fields[0])]);
            case 3:
                return new Formula(3, [resolve(defs, f.fields[0]), resolve(defs, f.fields[1])]);
            case 4:
                return new Formula(4, [resolve(defs, f.fields[0]), resolve(defs, f.fields[1])]);
            case 5:
                return new Formula(5, [resolve(defs, f.fields[0]), resolve(defs, f.fields[1])]);
            case 6:
                return new Formula(6, [resolve(defs, f.fields[0]), resolve(defs, f.fields[1])]);
            case 7:
                return new Formula(7, [resolve(defs, f.fields[0]), resolve(defs, f.fields[1])]);
            default: {
                const n = f.fields[0];
                const matchValue = tryFind(n, defs);
                if (matchValue == null) {
                    return new Formula(0, [n]);
                }
                else {
                    defs_mut = defs;
                    f_mut = matchValue;
                    continue resolve;
                }
            }
        }
        break;
    }
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
            let matchResult, a_1, b;
            switch (f_1.tag) {
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
                    if (contains(name, acc, {
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
                    f_1_mut = f_1.fields[0];
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
    return go(f, empty());
}

/**
 * Evaluate a formula under an assignment of truth values to its atoms.
 */
export function eval$(env_mut, f_mut) {
    eval$:
    while (true) {
        const env = env_mut, f = f_mut;
        switch (f.tag) {
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
            default:
                return defaultArg(tryFind(f.fields[0], env), false);
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
 * Two formulas are logically equivalent when they agree on every possible
 * assignment — i.e. when `a <-> b` is a tautology.
 */
export function equivalent(a, b) {
    return equals(truthTable(new Formula(7, [a, b])).Verdict, new Verdict(0, []));
}

