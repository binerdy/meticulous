
import { Record } from "./fable_modules/fable-library-js.5.6.0/Types.js";
import { record_type, bool_type, array_type, int32_type, string_type } from "./fable_modules/fable-library-js.5.6.0/Reflection.js";
import { equivalent, resolve, truthTable } from "./Engine.js";
import { toUnicode } from "./Render.js";
import { choose, ofArray, map, toArray } from "./fable_modules/fable-library-js.5.6.0/List.js";
import { ofList, FSharpMap__get_Item } from "./fable_modules/fable-library-js.5.6.0/Map.js";
import { Formula } from "./Ast.js";
import { mapIndexed } from "./fable_modules/fable-library-js.5.6.0/Array.js";
import { parseLine } from "./Parser.js";
import { replace, split } from "./fable_modules/fable-library-js.5.6.0/String.js";
import { comparePrimitives } from "./fable_modules/fable-library-js.5.6.0/Util.js";

/**
 * One rendered block. Every field always exists; which ones are meaningful
 * depends on `kind`. This flat shape is deliberately JS-friendly.
 * kind = "heading"       -> level, title
 * kind = "prose"         -> title (the text)
 * kind = "prop"          -> name, gloss
 * kind = "claim"         -> name, formula
 * kind = "table"         -> formula, atoms, rows, results, verdict
 * kind = "check"         -> formula, verdict   (verdict may be equivalent/...)
 * kind = "error"         -> line, title (the message)
 */
export class BlockView extends Record {
    constructor(kind, level, title, name, gloss, formula, verdict, atoms, rows, results, line) {
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
    }
}

export function BlockView_$reflection() {
    return record_type("Meticulous.Api.BlockView", [], BlockView, () => [["kind", string_type], ["level", int32_type], ["title", string_type], ["name", string_type], ["gloss", string_type], ["formula", string_type], ["verdict", string_type], ["atoms", array_type(string_type)], ["rows", array_type(array_type(bool_type))], ["results", array_type(bool_type)], ["line", int32_type]]);
}

const empty = new BlockView("", 0, "", "", "", "", "", [], [], [], 0);

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

function tableBlock(f) {
    const t = truthTable(f);
    const formula = toUnicode(f);
    const atoms = toArray(t.Atoms);
    const rows = toArray(map((tupledArg) => toArray(map((a) => FSharpMap__get_Item(tupledArg[0], a), t.Atoms)), t.Rows));
    const results = toArray(map((tuple) => tuple[1], t.Rows));
    return new BlockView("table", empty.level, empty.title, empty.name, empty.gloss, formula, verdictName(t.Verdict), atoms, rows, results, empty.line);
}

function toBlock(defs, st) {
    switch (st.tag) {
        case 1:
            return new BlockView("prose", empty.level, st.fields[0], empty.name, empty.gloss, empty.formula, empty.verdict, empty.atoms, empty.rows, empty.results, empty.line);
        case 2:
            return new BlockView("prop", empty.level, empty.title, st.fields[0], st.fields[1], empty.formula, empty.verdict, empty.atoms, empty.rows, empty.results, empty.line);
        case 3:
            return new BlockView("claim", empty.level, empty.title, st.fields[0], empty.gloss, toUnicode(st.fields[1]), empty.verdict, empty.atoms, empty.rows, empty.results, empty.line);
        case 4:
            return tableBlock((st.fields[0].tag === 0) ? resolve(defs, new Formula(0, [st.fields[0].fields[0]])) : resolve(defs, st.fields[0].fields[0]));
        case 5:
            if (st.fields[0].tag === 1) {
                const matchValue = resolve(defs, st.fields[0].fields[0]);
                const rb = resolve(defs, st.fields[0].fields[1]);
                const ra = matchValue;
                return new BlockView("check", empty.level, empty.title, empty.name, empty.gloss, (toUnicode(ra) + " ≡ ") + toUnicode(rb), equivalent(ra, rb) ? "equivalent" : "not-equivalent", empty.atoms, empty.rows, empty.results, empty.line);
            }
            else {
                const bind$0040 = tableBlock(resolve(defs, st.fields[0].fields[0]));
                return new BlockView("check", bind$0040.level, bind$0040.title, bind$0040.name, bind$0040.gloss, bind$0040.formula, bind$0040.verdict, bind$0040.atoms, bind$0040.rows, bind$0040.results, bind$0040.line);
            }
        default:
            return new BlockView("heading", st.fields[0], st.fields[1], empty.name, empty.gloss, empty.formula, empty.verdict, empty.atoms, empty.rows, empty.results, empty.line);
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
    const parsed = ofArray(mapIndexed((i, line) => [i + 1, parseLine(line)], split(replace(source, "\r\n", "\n"), ["\n"], undefined, 0)));
    const defs = ofList(choose((tupledArg) => {
        const r = tupledArg[1];
        let matchResult, f, n;
        if (r.tag === 0) {
            if (r.fields[0] != null) {
                if (r.fields[0].tag === 3) {
                    matchResult = 0;
                    f = r.fields[0].fields[1];
                    n = r.fields[0].fields[0];
                }
                else {
                    matchResult = 1;
                }
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
                return [n, f];
            default:
                return undefined;
        }
    }, parsed), {
        Compare: (x, y) => (comparePrimitives(x, y) | 0),
    });
    return toArray(choose((tupledArg_1) => {
        const r_1 = tupledArg_1[1];
        if (r_1.tag === 1) {
            return new BlockView("error", empty.level, r_1.fields[0], empty.name, empty.gloss, empty.formula, empty.verdict, empty.atoms, empty.rows, empty.results, tupledArg_1[0]);
        }
        else if (r_1.fields[0] != null) {
            return toBlock(defs, r_1.fields[0]);
        }
        else {
            return undefined;
        }
    }, parsed));
}

