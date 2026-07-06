
import { Union } from "./fable_modules/fable-library-js.5.6.0/Types.js";
import { int32_type, union_type, bool_type, string_type } from "./fable_modules/fable-library-js.5.6.0/Reflection.js";

/**
 * A logical formula built from atomic propositions and connectives.
 * This is the heart of the propositional layer. A `Formula` is a little
 * tree — e.g. `p -> (q and r)` becomes `Implies(Atom "p", And(Atom "q", Atom "r"))`.
 */
export class Formula extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["Atom", "Const", "Not", "And", "Or", "Xor", "Implies", "Iff"];
    }
}

export function Formula_$reflection() {
    return union_type("Meticulous.Ast.Formula", [], Formula, () => [[["Item", string_type]], [["Item", bool_type]], [["Item", Formula_$reflection()]], [["Item1", Formula_$reflection()], ["Item2", Formula_$reflection()]], [["Item1", Formula_$reflection()], ["Item2", Formula_$reflection()]], [["Item1", Formula_$reflection()], ["Item2", Formula_$reflection()]], [["Item1", Formula_$reflection()], ["Item2", Formula_$reflection()]], [["Item1", Formula_$reflection()], ["Item2", Formula_$reflection()]]]);
}

/**
 * Where a `table` request points: either a named claim, or a formula
 * written inline on the same line.
 */
export class TableTarget extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["TargetRef", "TargetFormula"];
    }
}

export function TableTarget_$reflection() {
    return union_type("Meticulous.Ast.TableTarget", [], TableTarget, () => [[["Item", string_type]], [["Item", Formula_$reflection()]]]);
}

/**
 * The two kinds of `check` request.
 */
export class CheckKind extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["Verdict", "Equivalent"];
    }
}

export function CheckKind_$reflection() {
    return union_type("Meticulous.Ast.CheckKind", [], CheckKind, () => [[["Item", Formula_$reflection()]], [["Item1", Formula_$reflection()], ["Item2", Formula_$reflection()]]]);
}

/**
 * A top-level statement — one meaningful line or block in a document.
 */
export class Statement extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["Heading", "Prose", "Prop", "Claim", "Table", "Check"];
    }
}

export function Statement_$reflection() {
    return union_type("Meticulous.Ast.Statement", [], Statement, () => [[["level", int32_type], ["text", string_type]], [["Item", string_type]], [["name", string_type], ["gloss", string_type]], [["name", string_type], ["body", Formula_$reflection()]], [["Item", TableTarget_$reflection()]], [["Item", CheckKind_$reflection()]]]);
}

