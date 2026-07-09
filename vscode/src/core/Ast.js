
import { Union } from "./fable_modules/fable-library-js.5.6.0/Types.js";
import { list_type, int32_type, union_type, bool_type, string_type } from "./fable_modules/fable-library-js.5.6.0/Reflection.js";

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
        return ["Atom", "Const", "Not", "And", "Or", "Xor", "Implies", "Iff", "Box", "Diamond"];
    }
}

export function Formula_$reflection() {
    return union_type("Meticulous.Ast.Formula", [], Formula, () => [[["Item", string_type]], [["Item", bool_type]], [["Item", Formula_$reflection()]], [["Item1", Formula_$reflection()], ["Item2", Formula_$reflection()]], [["Item1", Formula_$reflection()], ["Item2", Formula_$reflection()]], [["Item1", Formula_$reflection()], ["Item2", Formula_$reflection()]], [["Item1", Formula_$reflection()], ["Item2", Formula_$reflection()]], [["Item1", Formula_$reflection()], ["Item2", Formula_$reflection()]], [["Item", Formula_$reflection()]], [["Item", Formula_$reflection()]]]);
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
 * The structural relations a document can assert between statements.
 * Three of them make formal claims the engine can verify; two are
 * informal judgments it can only record.
 */
export class RelationKind extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["Supports", "Presupposes", "Contradicts", "Entails", "EquivalentTo"];
    }
}

export function RelationKind_$reflection() {
    return union_type("Meticulous.Ast.RelationKind", [], RelationKind, () => [[], [], [], [], []]);
}

/**
 * One end of a relation: a declared prop/claim name, or a quoted ad-hoc
 * statement that hasn't been formalized ("The streets flood").
 */
export class RelRef extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["Named", "Quoted"];
    }
}

export function RelRef_$reflection() {
    return union_type("Meticulous.Ast.RelRef", [], RelRef, () => [[["Item", string_type]], [["Item", string_type]]]);
}

/**
 * One line of a user-written proof. Lines are numbered so later steps
 * can cite the earlier ones they build on.
 */
export class ProofLine extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["ProofPremise", "ProofDerived"];
    }
}

export function ProofLine_$reflection() {
    return union_type("Meticulous.Ast.ProofLine", [], ProofLine, () => [[["number", int32_type], ["formula", Formula_$reflection()]], [["number", int32_type], ["formula", Formula_$reflection()], ["rule", string_type], ["refs", list_type(int32_type)]]]);
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
        return ["Heading", "Prose", "Prop", "Claim", "Table", "Check", "Argument", "Proof", "Analyze", "Relates", "RelationMap"];
    }
}

export function Statement_$reflection() {
    return union_type("Meticulous.Ast.Statement", [], Statement, () => [[["level", int32_type], ["text", string_type]], [["Item", string_type]], [["name", string_type], ["gloss", string_type]], [["name", string_type], ["body", Formula_$reflection()]], [["Item", TableTarget_$reflection()]], [["Item", CheckKind_$reflection()]], [["name", string_type], ["premises", list_type(Formula_$reflection())], ["conclusion", Formula_$reflection()]], [["name", string_type], ["lines", list_type(ProofLine_$reflection())]], [], [["left", RelRef_$reflection()], ["kind", RelationKind_$reflection()], ["right", RelRef_$reflection()]], []]);
}

