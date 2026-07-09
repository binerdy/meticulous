
import { map, defaultArg } from "./fable_modules/fable-library-js.5.6.0/Option.js";
import { isLower, isUpper } from "./fable_modules/fable-library-js.5.6.0/Char.js";
import { substring } from "./fable_modules/fable-library-js.5.6.0/String.js";

function precedence(f) {
    switch (f.tag) {
        case 2:
        case 8:
        case 9:
            return 90;
        case 3:
            return 80;
        case 4:
            return 70;
        case 5:
            return 60;
        case 6:
            return 50;
        case 7:
            return 40;
        default:
            return 100;
    }
}

/**
 * Render a formula to a minimally-parenthesised Unicode string.
 */
export function toUnicode(formula) {
    const go = (f) => {
        const parentPrec = precedence(f) | 0;
        const wrap = (onLeft, child) => {
            const childPrec = precedence(child) | 0;
            if ((childPrec < parentPrec) ? true : ((childPrec === parentPrec) && ((f.tag === 6) ? onLeft : !onLeft))) {
                return ("(" + go(child)) + ")";
            }
            else {
                return go(child);
            }
        };
        switch (f.tag) {
            case 1:
                if (f.fields[0]) {
                    return "⊤";
                }
                else {
                    return "⊥";
                }
            case 2:
                return "¬" + wrap(true, f.fields[0]);
            case 8:
                return "□" + wrap(true, f.fields[0]);
            case 9:
                return "◇" + wrap(true, f.fields[0]);
            case 3:
                return (wrap(true, f.fields[0]) + " ∧ ") + wrap(false, f.fields[1]);
            case 4:
                return (wrap(true, f.fields[0]) + " ∨ ") + wrap(false, f.fields[1]);
            case 5:
                return (wrap(true, f.fields[0]) + " ⊕ ") + wrap(false, f.fields[1]);
            case 6:
                return (wrap(true, f.fields[0]) + " → ") + wrap(false, f.fields[1]);
            case 7:
                return (wrap(true, f.fields[0]) + " ↔ ") + wrap(false, f.fields[1]);
            default:
                return f.fields[0];
        }
    };
    return go(formula);
}

/**
 * Render a formula as an English sentence, using each proposition's gloss
 * where the document declared one. This is what lets a claim read back as
 * the thought it formalises: `policy -> growth` becomes
 * "If the tax cut was enacted, then the economy grew."
 */
export function toEnglish(glossOf, formula) {
    const go = (f) => {
        switch (f.tag) {
            case 1:
                if (f.fields[0]) {
                    return "true";
                }
                else {
                    return "false";
                }
            case 2:
                return "it is not the case that " + go(f.fields[0]);
            case 8:
                return "it is necessary that " + go(f.fields[0]);
            case 9:
                return "it is possible that " + go(f.fields[0]);
            case 3:
                return (("both " + go(f.fields[0])) + ", and ") + go(f.fields[1]);
            case 4:
                return (("either " + go(f.fields[0])) + ", or ") + go(f.fields[1]);
            case 5:
                return ((("either " + go(f.fields[0])) + " or ") + go(f.fields[1])) + ", but not both";
            case 6:
                return (("if " + go(f.fields[0])) + ", then ") + go(f.fields[1]);
            case 7:
                return (go(f.fields[0]) + " exactly when ") + go(f.fields[1]);
            default:
                return defaultArg(map((s) => {
                    if (((s.length >= 2) && isUpper(s[0])) && isLower(s[1])) {
                        return s[0].toLocaleLowerCase() + substring(s, 1);
                    }
                    else {
                        return s;
                    }
                }, glossOf(f.fields[0])), f.fields[0]);
        }
    };
    const sentence = go(formula);
    if (sentence === "") {
        return "";
    }
    else {
        return (sentence[0].toLocaleUpperCase() + substring(sentence, 1)) + ".";
    }
}

