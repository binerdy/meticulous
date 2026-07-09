
import { Union } from "./fable_modules/fable-library-js.5.6.0/Types.js";
import { union_type, string_type } from "./fable_modules/fable-library-js.5.6.0/Reflection.js";
import { isLetter, isLetterOrDigit } from "./fable_modules/fable-library-js.5.6.0/Char.js";
import { empty, cons, reverse } from "./fable_modules/fable-library-js.5.6.0/List.js";
import { FSharpResult$2 } from "./fable_modules/fable-library-js.5.6.0/Result.js";
import { printf, toText, substring } from "./fable_modules/fable-library-js.5.6.0/String.js";

export class Token extends Union {
    constructor(tag, fields) {
        super();
        this.tag = tag;
        this.fields = fields;
    }
    cases() {
        return ["TIdent", "TTrue", "TFalse", "TNot", "TAnd", "TOr", "TXor", "TImplies", "TIff", "TBox", "TDiamond", "TLParen", "TRParen"];
    }
}

export function Token_$reflection() {
    return union_type("Meticulous.Tokenizer.Token", [], Token, () => [[["Item", string_type]], [], [], [], [], [], [], [], [], [], [], [], []]);
}

function isIdentChar(c) {
    if (isLetterOrDigit(c)) {
        return true;
    }
    else {
        return c === "_";
    }
}

function wordToToken(word) {
    switch (word) {
        case "not":
            return new Token(3, []);
        case "and":
            return new Token(4, []);
        case "or":
            return new Token(5, []);
        case "xor":
            return new Token(6, []);
        case "implies":
            return new Token(7, []);
        case "iff":
            return new Token(8, []);
        case "necessarily":
            return new Token(9, []);
        case "possibly":
            return new Token(10, []);
        case "true":
            return new Token(1, []);
        case "false":
            return new Token(2, []);
        default:
            return new Token(0, [word]);
    }
}

/**
 * Tokenize a formula string. Returns Ok tokens, or Error with a message.
 */
export function tokenize(input) {
    const loop = (i_mut, acc_mut) => {
        loop:
        while (true) {
            const i = i_mut, acc = acc_mut;
            if (i >= input.length) {
                return new FSharpResult$2(0, [reverse(acc)]);
            }
            else {
                const c = input[i];
                let matchResult, other;
                switch (c) {
                    case "\t":
                    case " ": {
                        matchResult = 0;
                        break;
                    }
                    case "!":
                    case "~":
                    case "¬": {
                        matchResult = 5;
                        break;
                    }
                    case "&":
                    case "∧": {
                        matchResult = 3;
                        break;
                    }
                    case "(": {
                        matchResult = 1;
                        break;
                    }
                    case ")": {
                        matchResult = 2;
                        break;
                    }
                    case "|":
                    case "∨": {
                        matchResult = 4;
                        break;
                    }
                    case "→": {
                        matchResult = 7;
                        break;
                    }
                    case "↔": {
                        matchResult = 8;
                        break;
                    }
                    case "⊕": {
                        matchResult = 6;
                        break;
                    }
                    case "⊤": {
                        matchResult = 9;
                        break;
                    }
                    case "⊥": {
                        matchResult = 10;
                        break;
                    }
                    case "□": {
                        matchResult = 11;
                        break;
                    }
                    case "◇": {
                        matchResult = 12;
                        break;
                    }
                    case "-": {
                        if (((i + 1) < input.length) && (input[i + 1] === ">")) {
                            matchResult = 14;
                        }
                        else if (isLetter(c)) {
                            matchResult = 17;
                        }
                        else {
                            matchResult = 18;
                            other = c;
                        }
                        break;
                    }
                    case "<": {
                        if ((((i + 2) < input.length) && (input[i + 1] === "-")) && (input[i + 2] === ">")) {
                            matchResult = 15;
                        }
                        else if (((i + 1) < input.length) && (input[i + 1] === ">")) {
                            matchResult = 16;
                        }
                        else if (isLetter(c)) {
                            matchResult = 17;
                        }
                        else {
                            matchResult = 18;
                            other = c;
                        }
                        break;
                    }
                    case "[": {
                        if (((i + 1) < input.length) && (input[i + 1] === "]")) {
                            matchResult = 13;
                        }
                        else if (isLetter(c)) {
                            matchResult = 17;
                        }
                        else {
                            matchResult = 18;
                            other = c;
                        }
                        break;
                    }
                    default:
                        if (isLetter(c)) {
                            matchResult = 17;
                        }
                        else {
                            matchResult = 18;
                            other = c;
                        }
                }
                switch (matchResult) {
                    case 0: {
                        i_mut = (i + 1);
                        acc_mut = acc;
                        continue loop;
                    }
                    case 1: {
                        i_mut = (i + 1);
                        acc_mut = cons(new Token(11, []), acc);
                        continue loop;
                    }
                    case 2: {
                        i_mut = (i + 1);
                        acc_mut = cons(new Token(12, []), acc);
                        continue loop;
                    }
                    case 3: {
                        i_mut = (i + 1);
                        acc_mut = cons(new Token(4, []), acc);
                        continue loop;
                    }
                    case 4: {
                        i_mut = (i + 1);
                        acc_mut = cons(new Token(5, []), acc);
                        continue loop;
                    }
                    case 5: {
                        i_mut = (i + 1);
                        acc_mut = cons(new Token(3, []), acc);
                        continue loop;
                    }
                    case 6: {
                        i_mut = (i + 1);
                        acc_mut = cons(new Token(6, []), acc);
                        continue loop;
                    }
                    case 7: {
                        i_mut = (i + 1);
                        acc_mut = cons(new Token(7, []), acc);
                        continue loop;
                    }
                    case 8: {
                        i_mut = (i + 1);
                        acc_mut = cons(new Token(8, []), acc);
                        continue loop;
                    }
                    case 9: {
                        i_mut = (i + 1);
                        acc_mut = cons(new Token(1, []), acc);
                        continue loop;
                    }
                    case 10: {
                        i_mut = (i + 1);
                        acc_mut = cons(new Token(2, []), acc);
                        continue loop;
                    }
                    case 11: {
                        i_mut = (i + 1);
                        acc_mut = cons(new Token(9, []), acc);
                        continue loop;
                    }
                    case 12: {
                        i_mut = (i + 1);
                        acc_mut = cons(new Token(10, []), acc);
                        continue loop;
                    }
                    case 13: {
                        i_mut = (i + 2);
                        acc_mut = cons(new Token(9, []), acc);
                        continue loop;
                    }
                    case 14: {
                        i_mut = (i + 2);
                        acc_mut = cons(new Token(7, []), acc);
                        continue loop;
                    }
                    case 15: {
                        i_mut = (i + 3);
                        acc_mut = cons(new Token(8, []), acc);
                        continue loop;
                    }
                    case 16: {
                        i_mut = (i + 2);
                        acc_mut = cons(new Token(10, []), acc);
                        continue loop;
                    }
                    case 17: {
                        const start = i | 0;
                        let j = i;
                        while ((j < input.length) && (isIdentChar(input[j]) ? true : (((input[j] === "-") && ((j + 1) < input.length)) && isLetterOrDigit(input[j + 1])))) {
                            j = ((j + 1) | 0);
                        }
                        const word = substring(input, start, j - start);
                        i_mut = j;
                        acc_mut = cons(wordToToken(word), acc);
                        continue loop;
                    }
                    default:
                        return new FSharpResult$2(1, [toText(printf("Unexpected character \'%c\' in formula"))(other)]);
                }
            }
            break;
        }
    };
    return loop(0, empty());
}

