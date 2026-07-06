

function precedence(f) {
    switch (f.tag) {
        case 2:
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

