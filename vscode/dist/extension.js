"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode = __toESM(require("vscode"));
var path = __toESM(require("path"));

// src/core/fable_modules/fable-library-js.5.6.0/Util.js
var DateTimeKind = {
  Unspecified: 0,
  Utc: 1,
  Local: 2
};
var Exception = class {
  constructor(msg, innerException) {
    this.message = msg ?? "";
    this.innerException = innerException;
  }
  toString() {
    return this.message;
  }
};
function isArrayLike(x) {
  return Array.isArray(x) || ArrayBuffer.isView(x);
}
function isEnumerable(x) {
  return x != null && typeof x.GetEnumerator === "function";
}
function isComparable(x) {
  return x != null && typeof x.CompareTo === "function";
}
function isEquatable(x) {
  return x != null && typeof x.Equals === "function";
}
function isHashable(x) {
  return x != null && typeof x.GetHashCode === "function";
}
function isDisposable(x) {
  return x != null && typeof x.Dispose === "function";
}
function disposeSafe(x) {
  if (isDisposable(x)) {
    x.Dispose();
  }
}
function defaultOf() {
  return null;
}
function sameConstructor(x, y) {
  return Object.getPrototypeOf(x)?.constructor === Object.getPrototypeOf(y)?.constructor;
}
var Enumerator = class {
  constructor(iter) {
    this.current = defaultOf();
    this.iter = iter;
  }
  ["System.Collections.Generic.IEnumerator`1.get_Current"]() {
    return this.current;
  }
  ["System.Collections.IEnumerator.get_Current"]() {
    return this.current;
  }
  ["System.Collections.IEnumerator.MoveNext"]() {
    const cur = this.iter.next();
    this.current = cur.value;
    return !cur.done;
  }
  ["System.Collections.IEnumerator.Reset"]() {
    throw new Exception("JS iterators cannot be reset");
  }
  Dispose() {
    return;
  }
};
function getEnumerator(e) {
  if (isEnumerable(e)) {
    return e.GetEnumerator();
  } else {
    return new Enumerator(e[Symbol.iterator]());
  }
}
function toIterator(en) {
  return {
    next() {
      const hasNext = en["System.Collections.IEnumerator.MoveNext"]();
      const current = hasNext ? en["System.Collections.Generic.IEnumerator`1.get_Current"]() : void 0;
      return { done: !hasNext, value: current };
    }
  };
}
function padWithZeros(i, length2) {
  return i.toString(10).padStart(length2, "0");
}
function dateOffset(date) {
  const date1 = date;
  return typeof date1.offset === "number" ? date1.offset : date.kind === DateTimeKind.Utc ? 0 : date.getTimezoneOffset() * -6e4;
}
var ObjectRef = class _ObjectRef {
  static id(o) {
    if (!_ObjectRef.idMap.has(o)) {
      _ObjectRef.idMap.set(o, ++_ObjectRef.count);
    }
    return _ObjectRef.idMap.get(o);
  }
};
ObjectRef.idMap = /* @__PURE__ */ new WeakMap();
ObjectRef.count = 0;
function stringHash(s) {
  let i = 0;
  let h = 5381;
  const len = s.length;
  while (i < len) {
    h = h * 33 ^ s.charCodeAt(i++);
  }
  return h;
}
function numberHash(x) {
  return x * 2654435761 | 0;
}
function bigintHash(x) {
  return stringHash(x.toString(32));
}
function combineHashCodes(hashes) {
  let h1 = 0;
  const len = hashes.length;
  for (let i = 0; i < len; i++) {
    const h2 = hashes[i];
    h1 = (h1 << 5) + h1 ^ h2;
  }
  return h1;
}
function dateHash(x) {
  return x.getTime();
}
function arrayHash(x) {
  const len = x.length;
  const hashes = new Array(len);
  for (let i = 0; i < len; i++) {
    hashes[i] = structuralHash(x[i]);
  }
  return combineHashCodes(hashes);
}
function structuralHash(x) {
  if (x == null) {
    return 0;
  }
  switch (typeof x) {
    case "boolean":
      return x ? 1 : 0;
    case "number":
      return numberHash(x);
    case "bigint":
      return bigintHash(x);
    case "string":
      return stringHash(x);
    default: {
      if (isHashable(x)) {
        return x.GetHashCode();
      } else if (isArrayLike(x)) {
        return arrayHash(x);
      } else if (x instanceof Date) {
        return dateHash(x);
      } else if (Object.getPrototypeOf(x)?.constructor === Object) {
        const hashes = Object.values(x).map((v) => structuralHash(v));
        return combineHashCodes(hashes);
      } else {
        return numberHash(ObjectRef.id(x));
      }
    }
  }
}
function equalArraysWith(x, y, eq) {
  if (x == null) {
    return y == null;
  }
  if (y == null) {
    return false;
  }
  if (x.length !== y.length) {
    return false;
  }
  for (let i = 0; i < x.length; i++) {
    if (!eq(x[i], y[i])) {
      return false;
    }
  }
  return true;
}
function equalArrays(x, y) {
  return equalArraysWith(x, y, equals);
}
function equalObjects(x, y) {
  const xKeys = Object.keys(x);
  const yKeys = Object.keys(y);
  if (xKeys.length !== yKeys.length) {
    return false;
  }
  xKeys.sort();
  yKeys.sort();
  for (let i = 0; i < xKeys.length; i++) {
    if (xKeys[i] !== yKeys[i] || !equals(x[xKeys[i]], y[yKeys[i]])) {
      return false;
    }
  }
  return true;
}
function equals(x, y) {
  if (x === y) {
    return true;
  } else if (x == null) {
    return y == null;
  } else if (y == null) {
    return false;
  } else if (isEquatable(x)) {
    return x.Equals(y);
  } else if (isArrayLike(x)) {
    return isArrayLike(y) && equalArrays(x, y);
  } else if (typeof x !== "object") {
    return false;
  } else if (x instanceof Date) {
    return y instanceof Date && compareDates(x, y) === 0;
  } else {
    return Object.getPrototypeOf(x)?.constructor === Object && equalObjects(x, y);
  }
}
function compareDates(x, y) {
  let xtime;
  let ytime;
  if ("offset" in x && "offset" in y) {
    xtime = x.getTime();
    ytime = y.getTime();
  } else {
    xtime = x.getTime() + dateOffset(x);
    ytime = y.getTime() + dateOffset(y);
  }
  return xtime === ytime ? 0 : xtime < ytime ? -1 : 1;
}
function comparePrimitives(x, y) {
  return x === y ? 0 : x < y ? -1 : 1;
}
function compareArraysWith(x, y, comp) {
  if (x == null) {
    return y == null ? 0 : 1;
  }
  if (y == null) {
    return -1;
  }
  if (x.length !== y.length) {
    return x.length < y.length ? -1 : 1;
  }
  for (let i = 0, j = 0; i < x.length; i++) {
    j = comp(x[i], y[i]);
    if (j !== 0) {
      return j;
    }
  }
  return 0;
}
function compareArrays(x, y) {
  return compareArraysWith(x, y, compare);
}
function compareObjects(x, y) {
  const xKeys = Object.keys(x);
  const yKeys = Object.keys(y);
  if (xKeys.length !== yKeys.length) {
    return xKeys.length < yKeys.length ? -1 : 1;
  }
  xKeys.sort();
  yKeys.sort();
  for (let i = 0, j = 0; i < xKeys.length; i++) {
    const key = xKeys[i];
    if (key !== yKeys[i]) {
      return key < yKeys[i] ? -1 : 1;
    } else {
      j = compare(x[key], y[key]);
      if (j !== 0) {
        return j;
      }
    }
  }
  return 0;
}
function compare(x, y) {
  if (x === y) {
    return 0;
  } else if (x == null) {
    return y == null ? 0 : -1;
  } else if (y == null) {
    return 1;
  } else if (isComparable(x)) {
    return x.CompareTo(y);
  } else if (isArrayLike(x)) {
    return isArrayLike(y) ? compareArrays(x, y) : -1;
  } else if (typeof x !== "object") {
    return x < y ? -1 : 1;
  } else if (x instanceof Date) {
    return y instanceof Date ? compareDates(x, y) : -1;
  } else {
    return Object.getPrototypeOf(x)?.constructor === Object ? compareObjects(x, y) : -1;
  }
}

// src/core/fable_modules/fable-library-js.5.6.0/Types.js
function seqToString(self) {
  let count = 0;
  let str = "[";
  for (const x of self) {
    if (count === 0) {
      str += toString(x);
    } else if (count === 100) {
      str += "; ...";
      break;
    } else {
      str += "; " + toString(x);
    }
    count++;
  }
  return str + "]";
}
function toString(x, callStack = 0) {
  if (x != null && typeof x === "object") {
    if (typeof x.toString === "function" && x.toString !== Object.prototype.toString) {
      return x.toString();
    } else if (Symbol.iterator in x) {
      return seqToString(x);
    } else {
      const cons2 = Object.getPrototypeOf(x)?.constructor;
      return cons2 === Object && callStack < 10 ? "{ " + Object.entries(x).map(([k, v]) => k + " = " + toString(v, callStack + 1)).join("\n  ") + " }" : cons2?.name ?? "";
    }
  }
  return String(x);
}
function unionToString(name, fields) {
  function unionFieldToString(x) {
    if (typeof x === "string") {
      return '"' + x + '"';
    }
    return toString(x);
  }
  if (fields.length === 0) {
    return name;
  } else {
    let fieldStr;
    let withParens = true;
    if (fields.length === 1) {
      fieldStr = unionFieldToString(fields[0]);
      withParens = fieldStr.indexOf(" ") >= 0;
    } else {
      fieldStr = fields.map((x) => unionFieldToString(x)).join(", ");
    }
    return name + (withParens ? " (" : " ") + fieldStr + (withParens ? ")" : "");
  }
}
var Union = class {
  get name() {
    return this.cases()[this.tag];
  }
  toJSON() {
    return this.fields.length === 0 ? this.name : [this.name].concat(this.fields);
  }
  toString() {
    return unionToString(this.name, this.fields);
  }
  GetHashCode() {
    const hashes = this.fields.map((x) => structuralHash(x));
    hashes.splice(0, 0, numberHash(this.tag));
    return combineHashCodes(hashes);
  }
  Equals(other) {
    if (this === other) {
      return true;
    } else if (!sameConstructor(this, other)) {
      return false;
    } else if (this.tag === other.tag) {
      return equalArrays(this.fields, other.fields);
    } else {
      return false;
    }
  }
  CompareTo(other) {
    if (this === other) {
      return 0;
    } else if (!sameConstructor(this, other)) {
      return -1;
    } else if (this.tag === other.tag) {
      return compareArrays(this.fields, other.fields);
    } else {
      return this.tag < other.tag ? -1 : 1;
    }
  }
};
function recordToJSON(self) {
  const o = {};
  const keys = Object.keys(self);
  for (let i = 0; i < keys.length; i++) {
    o[keys[i]] = self[keys[i]];
  }
  return o;
}
function recordToString(self) {
  return "{ " + Object.entries(self).map(([k, v]) => k + " = " + toString(v)).join("\n  ") + " }";
}
function recordGetHashCode(self) {
  const hashes = Object.values(self).map((v) => structuralHash(v));
  return combineHashCodes(hashes);
}
function recordEquals(self, other) {
  if (self === other) {
    return true;
  } else if (!sameConstructor(self, other)) {
    return false;
  } else {
    const thisNames = Object.keys(self);
    for (let i = 0; i < thisNames.length; i++) {
      if (!equals(self[thisNames[i]], other[thisNames[i]])) {
        return false;
      }
    }
    return true;
  }
}
function recordCompareTo(self, other) {
  if (self === other) {
    return 0;
  } else if (!sameConstructor(self, other)) {
    return -1;
  } else {
    const thisNames = Object.keys(self);
    for (let i = 0; i < thisNames.length; i++) {
      const result = compare(self[thisNames[i]], other[thisNames[i]]);
      if (result !== 0) {
        return result;
      }
    }
    return 0;
  }
}
var Record = class {
  toJSON() {
    return recordToJSON(this);
  }
  toString() {
    return recordToString(this);
  }
  GetHashCode() {
    return recordGetHashCode(this);
  }
  Equals(other) {
    return recordEquals(this, other);
  }
  CompareTo(other) {
    return recordCompareTo(this, other);
  }
};

// src/core/fable_modules/fable-library-js.5.6.0/Numeric.js
var symbol = Symbol("numeric");
function isNumeric(x) {
  return typeof x === "number" || typeof x === "bigint" || x?.[symbol];
}
function isIntegral(x) {
  return typeof x === "number" && Number.isInteger(x) || typeof x === "bigint";
}
function compare2(x, y) {
  if (typeof x === "number") {
    return x < y ? -1 : x > y ? 1 : 0;
  } else if (typeof x === "bigint") {
    return x < y ? -1 : x > y ? 1 : 0;
  } else {
    return x.CompareTo(y);
  }
}
function multiply(x, y) {
  if (typeof x === "number") {
    return x * y;
  } else if (typeof x === "bigint") {
    return x * BigInt(y);
  } else {
    return x[symbol]().multiply(y);
  }
}
function toFixed(x, dp) {
  if (typeof x === "number") {
    return x.toFixed(dp);
  } else if (typeof x === "bigint") {
    return x.toString();
  } else {
    return x[symbol]().toFixed(dp);
  }
}
function toPrecision(x, sd) {
  if (typeof x === "number") {
    return x.toPrecision(sd);
  } else if (typeof x === "bigint") {
    return x.toString();
  } else {
    return x[symbol]().toPrecision(sd);
  }
}
function toExponential(x, dp) {
  if (typeof x === "number") {
    return x.toExponential(dp);
  } else if (typeof x === "bigint") {
    return x;
  } else {
    return x[symbol]().toExponential(dp);
  }
}
function toHex(x) {
  if (typeof x === "number") {
    return (Number(x) >>> 0).toString(16);
  } else if (typeof x === "bigint") {
    return BigInt.asUintN(64, x).toString(16);
  } else {
    return x[symbol]().toHex();
  }
}

// src/core/fable_modules/fable-library-js.5.6.0/Option.js
var Some = class _Some {
  constructor(value2) {
    this.value = value2;
  }
  toJSON() {
    return this.value;
  }
  // Don't add "Some" for consistency with erased options
  toString() {
    return String(this.value);
  }
  GetHashCode() {
    return structuralHash(this.value);
  }
  Equals(other) {
    if (other == null) {
      return false;
    } else {
      return equals(this.value, other instanceof _Some ? other.value : other);
    }
  }
  CompareTo(other) {
    if (other == null) {
      return 1;
    } else {
      return compare(this.value, other instanceof _Some ? other.value : other);
    }
  }
};
function value(x) {
  if (x == null) {
    throw new Exception("Option has no value");
  } else {
    return x instanceof Some ? x.value : x;
  }
}
function some(x) {
  return x == null || x instanceof Some ? new Some(x) : x;
}
function defaultArg(opt, defaultValue) {
  return opt != null ? value(opt) : defaultValue;
}

// src/core/Ast.js
var Formula = class extends Union {
  constructor(tag, fields) {
    super();
    this.tag = tag;
    this.fields = fields;
  }
  cases() {
    return ["Atom", "Const", "Not", "And", "Or", "Xor", "Implies", "Iff"];
  }
};
var TableTarget = class extends Union {
  constructor(tag, fields) {
    super();
    this.tag = tag;
    this.fields = fields;
  }
  cases() {
    return ["TargetRef", "TargetFormula"];
  }
};
var CheckKind = class extends Union {
  constructor(tag, fields) {
    super();
    this.tag = tag;
    this.fields = fields;
  }
  cases() {
    return ["Verdict", "Equivalent"];
  }
};
var Statement = class extends Union {
  constructor(tag, fields) {
    super();
    this.tag = tag;
    this.fields = fields;
  }
  cases() {
    return ["Heading", "Prose", "Prop", "Claim", "Table", "Check"];
  }
};

// src/core/fable_modules/fable-library-js.5.6.0/Global.js
var SR_inputWasEmpty = "Collection was empty.";
var SR_ArgumentNull_Generic = "Value cannot be null.";
var SR_Arg_ParamName_Name = " (Parameter '";
var SR_Arg_KeyNotFound = "The given key was not present in the dictionary.";

// src/core/fable_modules/fable-library-js.5.6.0/Date.js
var shortDays = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat"
];
var longDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];
var shortMonths = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];
var longMonths = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
function parseRepeatToken(format2, pos, patternChar) {
  let tokenLength = 0;
  let internalPos = pos;
  while (internalPos < format2.length && format2[internalPos] === patternChar) {
    internalPos++;
    tokenLength++;
  }
  return tokenLength;
}
function parseNextChar(format2, pos) {
  if (pos >= format2.length - 1) {
    return -1;
  }
  return format2.charCodeAt(pos + 1);
}
function parseQuotedString(format2, pos) {
  let beginPos = pos;
  const quoteChar = format2[pos];
  let result = "";
  let foundQuote = false;
  while (pos < format2.length) {
    pos++;
    const currentChar = format2[pos];
    if (currentChar === quoteChar) {
      foundQuote = true;
      break;
    } else if (currentChar === "\\") {
      if (pos < format2.length) {
        pos++;
        result += format2[pos];
      } else {
        throw new Exception("Invalid string format");
      }
    } else {
      result += currentChar;
    }
  }
  if (!foundQuote) {
    throw new Exception(`Invalid string format could not find matching quote for ${quoteChar}`);
  }
  return [result, pos - beginPos + 1];
}
function dateToStringWithCustomFormat(date, format2, utc) {
  let cursorPos = 0;
  let tokenLength = 0;
  let result = "";
  const localizedDate = utc ? DateTime(date.getTime(), DateTimeKind.Utc) : date;
  while (cursorPos < format2.length) {
    const token = format2[cursorPos];
    switch (token) {
      case "d":
        tokenLength = parseRepeatToken(format2, cursorPos, "d");
        cursorPos += tokenLength;
        switch (tokenLength) {
          case 1:
            result += day(localizedDate);
            break;
          case 2:
            result += padWithZeros(day(localizedDate), 2);
            break;
          case 3:
            result += shortDays[dayOfWeek(localizedDate)];
            break;
          case 4:
          default:
            result += longDays[dayOfWeek(localizedDate)];
            break;
        }
        break;
      case "f":
        tokenLength = parseRepeatToken(format2, cursorPos, "f");
        cursorPos += tokenLength;
        if (tokenLength <= 3) {
          const precision = 10 ** (3 - tokenLength);
          result += padWithZeros(Math.floor(millisecond(localizedDate) / precision), tokenLength);
        } else if (tokenLength <= 7) {
          result += ("" + millisecond(localizedDate)).padEnd(tokenLength, "0");
        } else {
          throw "Input string was not in a correct format.";
        }
        break;
      case "F":
        tokenLength = parseRepeatToken(format2, cursorPos, "F");
        cursorPos += tokenLength;
        if (tokenLength <= 3) {
          const precision = 10 ** (3 - tokenLength);
          const value2 = Math.floor(millisecond(localizedDate) / precision);
          if (value2 != 0) {
            result += padWithZeros(value2, tokenLength);
          }
        } else if (tokenLength <= 7) {
          const value2 = millisecond(localizedDate);
          if (value2 != 0) {
            result += padWithZeros(value2, 3);
          }
        } else {
          throw "Input string was not in a correct format.";
        }
        break;
      case "g":
        tokenLength = parseRepeatToken(format2, cursorPos, "g");
        cursorPos += tokenLength;
        result += "A.D.";
        break;
      case "h":
        tokenLength = parseRepeatToken(format2, cursorPos, "h");
        cursorPos += tokenLength;
        switch (tokenLength) {
          case 1:
            const h1Value = hour(localizedDate) % 12;
            result += h1Value ? h1Value : 12;
            break;
          case 2:
          default:
            const h2Value = hour(localizedDate) % 12;
            result += padWithZeros(h2Value ? h2Value : 12, 2);
            break;
        }
        break;
      case "H":
        tokenLength = parseRepeatToken(format2, cursorPos, "H");
        cursorPos += tokenLength;
        switch (tokenLength) {
          case 1:
            result += hour(localizedDate);
            break;
          case 2:
          default:
            result += padWithZeros(hour(localizedDate), 2);
            break;
        }
        break;
      case "K":
        tokenLength = parseRepeatToken(format2, cursorPos, "K");
        cursorPos += tokenLength;
        switch (tokenLength) {
          case 1:
            switch (getKind(localizedDate)) {
              case DateTimeKind.Utc:
                result += "Z";
                break;
              case DateTimeKind.Local:
                result += dateOffsetToString(localizedDate.getTimezoneOffset() * -6e4);
                break;
              case DateTimeKind.Unspecified:
                break;
            }
            break;
          default:
            break;
        }
        break;
      case "m":
        tokenLength = parseRepeatToken(format2, cursorPos, "m");
        cursorPos += tokenLength;
        switch (tokenLength) {
          case 1:
            result += minute(localizedDate);
            break;
          case 2:
          default:
            result += padWithZeros(minute(localizedDate), 2);
            break;
        }
        break;
      case "M":
        tokenLength = parseRepeatToken(format2, cursorPos, "M");
        cursorPos += tokenLength;
        switch (tokenLength) {
          case 1:
            result += month(localizedDate);
            break;
          case 2:
            result += padWithZeros(month(localizedDate), 2);
            break;
          case 3:
            result += shortMonths[month(localizedDate) - 1];
            break;
          case 4:
          default:
            result += longMonths[month(localizedDate) - 1];
            break;
        }
        break;
      case "s":
        tokenLength = parseRepeatToken(format2, cursorPos, "s");
        cursorPos += tokenLength;
        switch (tokenLength) {
          case 1:
            result += second(localizedDate);
            break;
          case 2:
          default:
            result += padWithZeros(second(localizedDate), 2);
            break;
        }
        break;
      case "t":
        tokenLength = parseRepeatToken(format2, cursorPos, "t");
        cursorPos += tokenLength;
        switch (tokenLength) {
          case 1:
            result += localizedDate.getHours() < 12 ? "A" : "P";
            break;
          case 2:
          default:
            result += localizedDate.getHours() < 12 ? "AM" : "PM";
            break;
        }
        break;
      case "y":
        tokenLength = parseRepeatToken(format2, cursorPos, "y");
        cursorPos += tokenLength;
        switch (tokenLength) {
          case 1:
            result += year(localizedDate) % 100;
            break;
          case 2:
            result += padWithZeros(year(localizedDate) % 100, 2);
            break;
          default:
            result += padWithZeros(year(localizedDate), tokenLength);
            break;
        }
        break;
      case "z":
        tokenLength = parseRepeatToken(format2, cursorPos, "z");
        cursorPos += tokenLength;
        let utcOffsetText = "";
        switch (getKind(localizedDate)) {
          case DateTimeKind.Utc:
            utcOffsetText = "+00:00";
            break;
          case DateTimeKind.Local:
            utcOffsetText = dateOffsetToString(localizedDate.getTimezoneOffset() * -6e4);
            break;
          case DateTimeKind.Unspecified:
            utcOffsetText = dateOffsetToString(toLocalTime(localizedDate).getTimezoneOffset() * -6e4);
            break;
        }
        const sign = utcOffsetText[0] === "-" ? "-" : "+";
        const hours = parseInt(utcOffsetText.substring(1, 3), 10);
        const minutes = parseInt(utcOffsetText.substring(4, 6), 10);
        switch (tokenLength) {
          case 1:
            result += `${sign}${hours}`;
            break;
          case 2:
            result += `${sign}${padWithZeros(hours, 2)}`;
            break;
          default:
            result += `${sign}${padWithZeros(hours, 2)}:${padWithZeros(minutes, 2)}`;
            break;
        }
        break;
      case ":":
        result += ":";
        cursorPos++;
        break;
      case "/":
        result += "/";
        cursorPos++;
        break;
      case "'":
      case '"':
        const [quotedString, quotedStringLenght] = parseQuotedString(format2, cursorPos);
        result += quotedString;
        cursorPos += quotedStringLenght;
        break;
      case "%":
        const nextChar = parseNextChar(format2, cursorPos);
        if (nextChar >= 0 && nextChar !== "%".charCodeAt(0)) {
          cursorPos += 2;
          result += dateToStringWithCustomFormat(localizedDate, String.fromCharCode(nextChar), utc);
        } else {
          throw new Exception("Invalid format string");
        }
        break;
      case "\\":
        const nextChar2 = parseNextChar(format2, cursorPos);
        if (nextChar2 >= 0) {
          cursorPos += 2;
          result += String.fromCharCode(nextChar2);
        } else {
          throw new Exception("Invalid format string");
        }
        break;
      default:
        cursorPos++;
        result += token;
        break;
    }
  }
  return result;
}
function getKind(value2) {
  return value2.kind ?? DateTimeKind.Unspecified;
}
function dateOffsetToString(offset) {
  const isMinus = offset < 0;
  offset = Math.abs(offset);
  const hours = ~~(offset / 36e5);
  const minutes = offset % 36e5 / 6e4;
  return (isMinus ? "-" : "+") + padWithZeros(hours, 2) + ":" + padWithZeros(minutes, 2);
}
function dateToISOString(d, utc) {
  if (utc) {
    return d.toISOString();
  } else {
    const printOffset = d.kind == null ? true : d.kind === DateTimeKind.Local;
    return padWithZeros(d.getFullYear(), 4) + "-" + padWithZeros(d.getMonth() + 1, 2) + "-" + padWithZeros(d.getDate(), 2) + "T" + padWithZeros(d.getHours(), 2) + ":" + padWithZeros(d.getMinutes(), 2) + ":" + padWithZeros(d.getSeconds(), 2) + "." + padWithZeros(d.getMilliseconds(), 3) + (printOffset ? dateOffsetToString(d.getTimezoneOffset() * -6e4) : "");
  }
}
function dateToISOStringWithOffset(dateWithOffset, offset) {
  const str = dateWithOffset.toISOString();
  return str.substring(0, str.length - 1) + dateOffsetToString(offset);
}
function dateToStringWithOffset(date, format2) {
  const d = new Date(date.getTime() + (date.offset ?? 0));
  if (typeof format2 !== "string") {
    return d.toISOString().replace(/\.\d+/, "").replace(/[A-Z]|\.\d+/g, " ") + dateOffsetToString(date.offset ?? 0);
  } else if (format2.length === 1) {
    switch (format2) {
      case "D":
        return dateToString_D(d);
      case "d":
        return dateToString_d(d);
      case "F":
        return dateToString_D(d) + " " + dateToString_T(d);
      case "f":
        return dateToString_D(d) + " " + dateToString_t(d);
      case "G":
        return dateToString_d(d) + " " + dateToString_T(d);
      case "g":
        return dateToString_d(d) + " " + dateToString_t(d);
      case "M":
      case "m":
        return dateToString_M(d);
      case "O":
      case "o":
        return dateToISOStringWithOffset(d, date.offset ?? 0);
      case "R":
      case "r": {
        const utcDate = DateTime(date.getTime(), DateTimeKind.Utc);
        return dateToString_R(utcDate);
      }
      case "s":
        return dateToString_s(toUniversalTime(d));
      case "T":
        return dateToString_T(toUniversalTime(d));
      case "t":
        return dateToString_t(toUniversalTime(d));
      case "u": {
        const utcDate = DateTime(date.getTime(), DateTimeKind.Utc);
        return dateToString_u(utcDate);
      }
      case "U": {
        const utcDate = DateTime(date.getTime(), DateTimeKind.Utc);
        return dateToString_D(utcDate) + " " + dateToString_T(utcDate);
      }
      case "Y":
      case "y":
        return dateToString_Y(d);
      default:
        throw new Exception("Unrecognized Date print format");
    }
  } else {
    return dateToStringWithCustomFormat(d, format2, true);
  }
}
function dateToString_D(date) {
  return longDays[dayOfWeek(date)] + ", " + padWithZeros(day(date), 2) + " " + longMonths[month(date) - 1] + " " + year(date);
}
function dateToString_d(date) {
  return padWithZeros(month(date), 2) + "/" + padWithZeros(day(date), 2) + "/" + year(date);
}
function dateToString_T(date) {
  return padWithZeros(hour(date), 2) + ":" + padWithZeros(minute(date), 2) + ":" + padWithZeros(second(date), 2);
}
function dateToString_t(date) {
  return padWithZeros(hour(date), 2) + ":" + padWithZeros(minute(date), 2);
}
function dateToString_R(date) {
  const utcDate = toUniversalTime(date);
  return shortDays[dayOfWeek(utcDate)] + ", " + padWithZeros(day(utcDate), 2) + " " + shortMonths[month(utcDate) - 1] + " " + year(utcDate) + " " + padWithZeros(hour(utcDate), 2) + ":" + padWithZeros(minute(utcDate), 2) + ":" + padWithZeros(second(utcDate), 2) + " GMT";
}
function dateToString_s(date) {
  return padWithZeros(year(date), 4) + "-" + padWithZeros(month(date), 2) + "-" + padWithZeros(day(date), 2) + "T" + padWithZeros(hour(date), 2) + ":" + padWithZeros(minute(date), 2) + ":" + padWithZeros(second(date), 2);
}
function dateToString_u(date) {
  const utcDate = toUniversalTime(date);
  return padWithZeros(year(utcDate), 4) + "-" + padWithZeros(month(utcDate), 2) + "-" + padWithZeros(day(utcDate), 2) + " " + padWithZeros(hour(utcDate), 2) + ":" + padWithZeros(minute(utcDate), 2) + ":" + padWithZeros(second(utcDate), 2) + "Z";
}
function dateToString_M(date) {
  return longMonths[month(date) - 1] + " " + padWithZeros(day(date), 2);
}
function dateToString_Y(date) {
  return year(date) + " " + longMonths[month(date) - 1];
}
function dateToStringWithKind(date, format2) {
  const utc = date.kind === DateTimeKind.Utc;
  if (typeof format2 !== "string") {
    return dateToString_d(date) + " " + dateToString_T(date);
  } else if (format2.length === 1) {
    switch (format2) {
      case "D":
        return dateToString_D(date);
      case "d":
        return dateToString_d(date);
      case "F":
        return dateToString_D(date) + " " + dateToString_T(date);
      case "f":
        return dateToString_D(date) + " " + dateToString_t(date);
      case "G":
        return dateToString_d(date) + " " + dateToString_T(date);
      case "g":
        return dateToString_d(date) + " " + dateToString_t(date);
      case "M":
      case "m":
        return dateToString_M(date);
      case "O":
      case "o":
        return dateToISOString(date, utc);
      case "R":
      case "r":
        return dateToString_R(date);
      case "s":
        return dateToString_s(date);
      case "T":
        return dateToString_T(date);
      case "t":
        return dateToString_t(date);
      case "u":
        return dateToString_u(date);
      case "U":
        return dateToString_D(toUniversalTime(date)) + " " + dateToString_T(toUniversalTime(date));
      case "Y":
      case "y":
        return dateToString_Y(date);
      default:
        throw new Exception("Unrecognized Date print format");
    }
  } else {
    return dateToStringWithCustomFormat(date, format2, utc);
  }
}
function toString2(date, format2, _provider) {
  return date.offset != null ? dateToStringWithOffset(date, format2) : dateToStringWithKind(date, format2);
}
function DateTime(value2, kind) {
  const d = new Date(value2);
  d.kind = kind == null ? DateTimeKind.Unspecified : kind;
  return d;
}
function toUniversalTime(date) {
  return date.kind === DateTimeKind.Utc ? date : DateTime(date.getTime(), DateTimeKind.Utc);
}
function toLocalTime(date) {
  return date.kind === DateTimeKind.Local ? date : DateTime(date.getTime(), DateTimeKind.Local);
}
function day(d) {
  return d.kind === DateTimeKind.Utc ? d.getUTCDate() : d.getDate();
}
function hour(d) {
  return d.kind === DateTimeKind.Utc ? d.getUTCHours() : d.getHours();
}
function millisecond(d) {
  return d.kind === DateTimeKind.Utc ? d.getUTCMilliseconds() : d.getMilliseconds();
}
function minute(d) {
  return d.kind === DateTimeKind.Utc ? d.getUTCMinutes() : d.getMinutes();
}
function month(d) {
  return (d.kind === DateTimeKind.Utc ? d.getUTCMonth() : d.getMonth()) + 1;
}
function second(d) {
  return d.kind === DateTimeKind.Utc ? d.getUTCSeconds() : d.getSeconds();
}
function year(d) {
  return d.kind === DateTimeKind.Utc ? d.getUTCFullYear() : d.getFullYear();
}
function dayOfWeek(d) {
  return d.kind === DateTimeKind.Utc ? d.getUTCDay() : d.getDay();
}

// src/core/fable_modules/fable-library-js.5.6.0/RegExp.js
function escape(str) {
  return str.replace(/[$()*+.?[\\\^{|}\]]/g, "\\$&");
}

// src/core/fable_modules/fable-library-js.5.6.0/String.js
var fsFormatRegExp = /(^|[^%])%([0+\- ]*)(\*|\d+)?(?:\.(\d+))?(\w)/g;
var formatRegExp = /\{(\d+)(,-?\d+)?(?:\:([a-zA-Z])(\d{0,2})|\:(.+?))?\}/g;
function isLessThan(x, y) {
  return compare2(x, y) < 0;
}
function printf(input) {
  return {
    input,
    cont: fsFormat(input)
  };
}
function continuePrint(cont, arg) {
  return typeof arg === "string" ? cont(arg) : arg.cont(cont);
}
function toText(arg) {
  return continuePrint((x) => x, arg);
}
function formatReplacement(rep, flags, padLength, precision, format2) {
  let sign = "";
  flags = flags || "";
  format2 = format2 || "";
  if (isNumeric(rep)) {
    if (format2.toLowerCase() !== "x") {
      if (isLessThan(rep, 0)) {
        rep = multiply(rep, -1);
        sign = "-";
      } else {
        if (flags.indexOf(" ") >= 0) {
          sign = " ";
        } else if (flags.indexOf("+") >= 0) {
          sign = "+";
        }
      }
    }
    precision = precision == null ? null : parseInt(precision, 10);
    switch (format2) {
      case "f":
      case "F":
        precision = precision != null ? precision : 6;
        rep = toFixed(rep, precision);
        break;
      case "g":
      case "G":
        rep = precision != null ? toPrecision(rep, precision) : toPrecision(rep);
        break;
      case "e":
      case "E":
        rep = precision != null ? toExponential(rep, precision) : toExponential(rep);
        break;
      case "x":
        rep = toHex(rep);
        break;
      case "X":
        rep = toHex(rep).toUpperCase();
        break;
      default:
        rep = String(rep);
        break;
    }
  } else if (rep instanceof Date) {
    rep = toString2(rep);
  } else {
    rep = toString(rep);
  }
  padLength = typeof padLength === "number" ? padLength : parseInt(padLength, 10);
  if (!isNaN(padLength)) {
    const zeroFlag = flags.indexOf("0") >= 0;
    const minusFlag = flags.indexOf("-") >= 0;
    const ch = minusFlag || !zeroFlag ? " " : "0";
    if (ch === "0") {
      rep = pad(rep, padLength - sign.length, ch, minusFlag);
      rep = sign + rep;
    } else {
      rep = pad(sign + rep, padLength, ch, minusFlag);
    }
  } else {
    rep = sign + rep;
  }
  return rep;
}
function createPrinter(cont, _strParts, _matches, _result = "", padArg = -1) {
  return (...args) => {
    let result = _result;
    const strParts = _strParts.slice();
    const matches = _matches.slice();
    for (const arg of args) {
      const [, , flags, _padLength, precision, format2] = matches[0];
      let padLength = _padLength;
      if (padArg >= 0) {
        padLength = padArg;
        padArg = -1;
      } else if (padLength === "*") {
        if (arg < 0) {
          throw new Exception("Non-negative number required");
        }
        padArg = arg;
        continue;
      }
      result += strParts[0];
      result += formatReplacement(arg, flags, padLength, precision, format2);
      strParts.splice(0, 1);
      matches.splice(0, 1);
    }
    if (matches.length === 0) {
      result += strParts[0];
      return cont(result);
    } else {
      return createPrinter(cont, strParts, matches, result, padArg);
    }
  };
}
function fsFormat(str) {
  return (cont) => {
    fsFormatRegExp.lastIndex = 0;
    const strParts = [];
    const matches = [];
    let strIdx = 0;
    let match = fsFormatRegExp.exec(str);
    while (match) {
      const matchIndex = match.index + (match[1] || "").length;
      strParts.push(str.substring(strIdx, matchIndex).replace(/%%/g, "%"));
      matches.push(match);
      strIdx = fsFormatRegExp.lastIndex;
      fsFormatRegExp.lastIndex -= 1;
      match = fsFormatRegExp.exec(str);
    }
    if (strParts.length === 0) {
      return cont(str.replace(/%%/g, "%"));
    } else {
      strParts.push(str.substring(strIdx).replace(/%%/g, "%"));
      return createPrinter(cont, strParts, matches);
    }
  };
}
function splitIntAndDecimalPart(value2) {
  let [repInt, repDecimal] = value2.split(".");
  repDecimal === void 0 && (repDecimal = "");
  return {
    integral: repInt,
    decimal: repDecimal
  };
}
function thousandSeparate(value2) {
  return value2.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function format(str, ...args) {
  let str2;
  if (typeof str === "object") {
    str2 = String(args[0]);
    args.shift();
  } else {
    str2 = str;
  }
  return str2.replace(formatRegExp, (_, idx, padLength, format2, precision, pattern) => {
    if (idx < 0 || idx >= args.length) {
      throw new Exception("Index must be greater or equal to zero and less than the arguments' length.");
    }
    let rep = args[idx];
    let parts;
    if (isNumeric(rep)) {
      precision = precision == "" ? null : parseInt(precision, 10);
      switch (format2) {
        case "b":
        case "B":
          if (!isIntegral(rep)) {
            throw new Exception("Format specifier was invalid.");
          }
          rep = (rep >>> 0).toString(2).replace(/^0+/, "").padStart(precision || 1, "0");
          break;
        case "c":
        case "C":
          const isNegative = isLessThan(rep, 0);
          if (isLessThan(rep, 0)) {
            rep = multiply(rep, -1);
          }
          precision = precision == null ? 2 : precision;
          rep = toFixed(rep, precision);
          parts = splitIntAndDecimalPart(rep);
          if (precision > 0) {
            rep = "\xA4" + thousandSeparate(parts.integral) + "." + padRight(parts.decimal, precision, "0");
          } else {
            rep = "\xA4" + thousandSeparate(parts.integral);
          }
          if (isNegative) {
            rep = "(" + rep + ")";
          }
          break;
        case "d":
        case "D":
          if (!isIntegral(rep)) {
            throw new Exception("Format specifier was invalid.");
          }
          rep = String(rep);
          if (precision != null) {
            if (rep.startsWith("-")) {
              rep = "-" + padLeft(rep.substring(1), precision, "0");
            } else {
              rep = padLeft(rep, precision, "0");
            }
          }
          break;
        case "e":
        case "E":
          rep = precision != null ? toExponential(rep, precision) : toExponential(rep);
          break;
        case "f":
        case "F":
          precision = precision != null ? precision : 2;
          rep = toFixed(rep, precision);
          if (precision > 0) {
            parts = splitIntAndDecimalPart(rep);
            rep = parts.integral + "." + padRight(parts.decimal, precision, "0");
          }
          break;
        case "g":
        case "G": {
          rep = precision != null ? toPrecision(rep, precision) : toPrecision(rep);
          const eIdx = rep.indexOf("e");
          if (eIdx >= 0) {
            const mantissa = trimEnd(trimEnd(rep.slice(0, eIdx), "0"), ".");
            const expSign = rep[eIdx + 1];
            const expDigits = rep.slice(eIdx + 2);
            const paddedExpDigits = expDigits.length < 2 ? "0" + expDigits : expDigits;
            const eChar = format2 === "G" ? "E" : "e";
            rep = mantissa + eChar + expSign + paddedExpDigits;
          } else {
            rep = trimEnd(trimEnd(rep, "0"), ".");
          }
          break;
        }
        case "n":
        case "N":
          precision = precision != null ? precision : 2;
          rep = toFixed(rep, precision);
          parts = splitIntAndDecimalPart(rep);
          if (precision > 0) {
            rep = thousandSeparate(parts.integral) + "." + padRight(parts.decimal, precision, "0");
          } else {
            rep = thousandSeparate(parts.integral);
          }
          break;
        case "p":
        case "P":
          precision = precision != null ? precision : 2;
          rep = toFixed(multiply(rep, 100), precision);
          parts = splitIntAndDecimalPart(rep);
          if (precision > 0) {
            rep = thousandSeparate(parts.integral) + "." + padRight(parts.decimal, precision, "0") + " %";
          } else {
            rep = thousandSeparate(parts.integral) + " %";
          }
          break;
        case "r":
        case "R":
          throw new Exception("The round-trip format is not supported by Fable");
        case "x":
        case "X":
          if (!isIntegral(rep)) {
            throw new Exception("Format specifier was invalid.");
          }
          precision = precision != null ? precision : 1;
          rep = padLeft(toHex(rep), precision, "0");
          if (format2 === "X") {
            rep = rep.toUpperCase();
          }
          break;
        default:
          if (format2) {
            throw new Exception("Format specifier was invalid.");
          }
          if (pattern) {
            let sign = "";
            rep = pattern.replace(/([0#,]+)(\.[0#]+)?/, (_2, intPart, decimalPart) => {
              if (isLessThan(rep, 0)) {
                rep = multiply(rep, -1);
                sign = "-";
              }
              decimalPart = decimalPart == null ? "" : decimalPart.substring(1);
              rep = toFixed(rep, Math.max(decimalPart.length, 0));
              let [repInt, repDecimal] = rep.split(".");
              repDecimal || (repDecimal = "");
              const leftZeroes = intPart.replace(/,/g, "").replace(/^#+/, "").length;
              repInt = padLeft(repInt, leftZeroes, "0");
              const rightZeros = decimalPart.replace(/#+$/, "").length;
              if (rightZeros > repDecimal.length) {
                repDecimal = padRight(repDecimal, rightZeros, "0");
              } else if (rightZeros < repDecimal.length) {
                repDecimal = repDecimal.substring(0, rightZeros) + repDecimal.substring(rightZeros).replace(/0+$/, "");
              }
              if (intPart.indexOf(",") > 0) {
                const i = repInt.length % 3;
                const thousandGroups = Math.floor(repInt.length / 3);
                let thousands = i > 0 ? repInt.substr(0, i) + (thousandGroups > 0 ? "," : "") : "";
                for (let j = 0; j < thousandGroups; j++) {
                  thousands += repInt.substr(i + j * 3, 3) + (j < thousandGroups - 1 ? "," : "");
                }
                repInt = thousands;
              }
              return repDecimal.length > 0 ? repInt + "." + repDecimal : repInt;
            });
            rep = sign + rep;
          }
      }
    } else if (rep instanceof Date) {
      rep = toString2(rep, pattern || format2);
    } else {
      rep = toString(rep);
    }
    padLength = parseInt((padLength || " ").substring(1), 10);
    if (!isNaN(padLength)) {
      rep = pad(String(rep), Math.abs(padLength), " ", padLength < 0);
    }
    return rep;
  });
}
function isNullOrEmpty(str) {
  return typeof str !== "string" || str.length === 0;
}
function join(delimiter, xs) {
  if (Array.isArray(xs)) {
    return xs.join(delimiter);
  } else {
    return Array.from(xs).join(delimiter);
  }
}
function pad(str, len, ch, isRight) {
  ch = ch || " ";
  len = len - str.length;
  for (let i = 0; i < len; i++) {
    str = isRight ? str + ch : ch + str;
  }
  return str;
}
function padLeft(str, len, ch) {
  return pad(str, len, ch);
}
function padRight(str, len, ch) {
  return pad(str, len, ch, true);
}
function replace(str, search, replace2) {
  return str.replace(new RegExp(escape(search), "g"), replace2);
}
function split(str, splitters, count, options) {
  count = typeof count === "number" ? count : void 0;
  options = typeof options === "number" ? options : 0;
  if (count && count < 0) {
    throw new Exception("Count cannot be less than zero");
  }
  if (count === 0) {
    return [];
  }
  const removeEmpty = (options & 1) === 1;
  const trim = (options & 2) === 2;
  splitters = splitters || [];
  splitters = splitters.filter((x) => x).map(escape);
  splitters = splitters.length > 0 ? splitters : ["\\s"];
  const splits = [];
  const reg = new RegExp(splitters.join("|"), "g");
  let findSplits = true;
  let i = 0;
  do {
    const match = reg.exec(str);
    if (match === null) {
      const candidate = trim ? str.substring(i).trim() : str.substring(i);
      if (!removeEmpty || candidate.length > 0) {
        splits.push(candidate);
      }
      findSplits = false;
    } else {
      const candidate = trim ? str.substring(i, match.index).trim() : str.substring(i, match.index);
      if (!removeEmpty || candidate.length > 0) {
        if (count != null && splits.length + 1 === count) {
          splits.push(trim ? str.substring(i).trim() : str.substring(i));
          findSplits = false;
        } else {
          splits.push(candidate);
        }
      }
      i = reg.lastIndex;
    }
  } while (findSplits);
  return splits;
}
function trimStart(str, ...chars) {
  return chars.length === 0 ? str.trimStart() : str.replace(new RegExp("^[" + escape(chars.join("")) + "]+"), "");
}
function trimEnd(str, ...chars) {
  return chars.length === 0 ? str.trimEnd() : str.replace(new RegExp("[" + escape(chars.join("")) + "]+$"), "");
}
function substring(str, startIndex, length2) {
  if (startIndex + (length2 || 0) > str.length) {
    throw new Exception("Invalid startIndex and/or length");
  }
  return length2 != null ? str.substr(startIndex, length2) : str.substr(startIndex);
}

// src/core/fable_modules/fable-library-js.5.6.0/System.js
var InvalidOperationException = class extends Exception {
  constructor(message) {
    super(message);
  }
};
function InvalidOperationException_$ctor_Z721C83C5(message) {
  return new InvalidOperationException(message);
}
var NotSupportedException = class extends Exception {
  constructor(message) {
    super(message);
  }
};
function NotSupportedException_$ctor_Z721C83C5(message) {
  return new NotSupportedException(message);
}
var ArgumentException = class extends Exception {
  constructor(message, paramName, innerException) {
    super(isNullOrEmpty(paramName) ? message : message + SR_Arg_ParamName_Name + paramName + "')", innerException);
    this.paramName = paramName;
  }
};
var ArgumentNullException = class extends ArgumentException {
  constructor(paramName, message) {
    super(message, paramName, defaultOf());
  }
};
function ArgumentNullException_$ctor_Z384F8060(paramName, message) {
  return new ArgumentNullException(paramName, message);
}
function ArgumentNullException_$ctor_Z721C83C5(paramName) {
  return ArgumentNullException_$ctor_Z384F8060(paramName, SR_ArgumentNull_Generic);
}

// src/core/fable_modules/fable-library-js.5.6.0/Native.js
function Helpers_allocateArrayFromCons(cons2, len) {
  if (cons2 == null) {
    return new Array(len);
  } else {
    const cons_1 = cons2;
    if (typeof cons_1 === "function") {
      return new cons_1(len);
    } else {
      return new Array(len);
    }
  }
}

// src/core/fable_modules/fable-library-js.5.6.0/Array.js
function fill(target, targetIndex, count, value2) {
  const start = targetIndex | 0;
  return target.fill(value2, start, start + count);
}
function mapIndexed(f, source, cons2) {
  const len = source.length | 0;
  const target = Helpers_allocateArrayFromCons(cons2, len);
  for (let i = 0; i <= len - 1; i++) {
    setItem(target, i, f(i, item(i, source)));
  }
  return target;
}
function item(index, array) {
  if (index < 0 ? true : index >= array.length) {
    throw new Exception("Index was outside the bounds of the array. (Parameter 'index')");
  } else {
    return array[index];
  }
}
function setItem(array, index, value2) {
  if (index < 0 ? true : index >= array.length) {
    throw new Exception("Index was outside the bounds of the array. (Parameter 'index')");
  } else {
    array[index] = value2;
  }
}

// src/core/fable_modules/fable-library-js.5.6.0/FSharp.Core.js
function Operators_NullArgCheck(argumentName, value2) {
  if (equals(value2, defaultOf())) {
    throw ArgumentNullException_$ctor_Z721C83C5(argumentName);
  } else {
    return value2;
  }
}

// src/core/fable_modules/fable-library-js.5.6.0/List.js
var FSharpList = class _FSharpList extends Record {
  constructor(head2, tail2) {
    super();
    this.head = head2;
    this.tail = tail2;
  }
  toString() {
    const xs = this;
    return "[" + join("; ", xs) + "]";
  }
  Equals(other) {
    const xs = this;
    if (xs === other) {
      return true;
    } else if (other instanceof _FSharpList) {
      const ys = other;
      const loop = (xs_1_mut, ys_1_mut) => {
        loop: while (true) {
          const xs_1 = xs_1_mut, ys_1 = ys_1_mut;
          const matchValue = xs_1.tail;
          const matchValue_1 = ys_1.tail;
          if (matchValue != null) {
            if (matchValue_1 != null) {
              const xt = value(matchValue);
              const yt = value(matchValue_1);
              if (equals(xs_1.head, ys_1.head)) {
                xs_1_mut = xt;
                ys_1_mut = yt;
                continue loop;
              } else {
                return false;
              }
            } else {
              return false;
            }
          } else if (matchValue_1 != null) {
            return false;
          } else {
            return true;
          }
          break;
        }
      };
      return loop(xs, ys);
    } else {
      return false;
    }
  }
  GetHashCode() {
    const xs = this;
    const loop = (i_mut, h_mut, xs_1_mut) => {
      loop: while (true) {
        const i = i_mut, h = h_mut, xs_1 = xs_1_mut;
        const matchValue = xs_1.tail;
        if (matchValue != null) {
          const t = value(matchValue);
          if (i > 18) {
            return h | 0;
          } else {
            i_mut = i + 1;
            h_mut = (h << 1) + structuralHash(xs_1.head) + 631 * i;
            xs_1_mut = t;
            continue loop;
          }
        } else {
          return h | 0;
        }
        break;
      }
    };
    return loop(0, 0, xs) | 0;
  }
  toJSON() {
    const this$ = this;
    return Array.from(this$);
  }
  CompareTo(other) {
    const xs = this;
    if (other instanceof _FSharpList) {
      const ys = other;
      const loop = (xs_1_mut, ys_1_mut) => {
        loop: while (true) {
          const xs_1 = xs_1_mut, ys_1 = ys_1_mut;
          const matchValue = xs_1.tail;
          const matchValue_1 = ys_1.tail;
          if (matchValue != null) {
            if (matchValue_1 != null) {
              const xt = value(matchValue);
              const yt = value(matchValue_1);
              const c = compare(xs_1.head, ys_1.head) | 0;
              if (c === 0) {
                xs_1_mut = xt;
                ys_1_mut = yt;
                continue loop;
              } else {
                return c | 0;
              }
            } else {
              return 1;
            }
          } else if (matchValue_1 != null) {
            return -1;
          } else {
            return 0;
          }
          break;
        }
      };
      return loop(xs, ys) | 0;
    } else {
      return 1;
    }
  }
  GetEnumerator() {
    const xs = this;
    return ListEnumerator$1_$ctor_3002E699(xs);
  }
  [Symbol.iterator]() {
    return toIterator(getEnumerator(this));
  }
  "System.Collections.IEnumerable.GetEnumerator"() {
    const xs = this;
    return getEnumerator(xs);
  }
};
var ListEnumerator$1 = class {
  constructor(xs) {
    this.xs = xs;
    this.it = this.xs;
    this.current = defaultOf();
  }
  "System.Collections.Generic.IEnumerator`1.get_Current"() {
    const _ = this;
    return _.current;
  }
  "System.Collections.IEnumerator.get_Current"() {
    const _ = this;
    return _.current;
  }
  "System.Collections.IEnumerator.MoveNext"() {
    const _ = this;
    const matchValue = _.it.tail;
    if (matchValue != null) {
      const t = value(matchValue);
      _.current = _.it.head;
      _.it = t;
      return true;
    } else {
      return false;
    }
  }
  "System.Collections.IEnumerator.Reset"() {
    const _ = this;
    _.it = _.xs;
    _.current = defaultOf();
  }
  Dispose() {
  }
};
function ListEnumerator$1_$ctor_3002E699(xs) {
  return new ListEnumerator$1(xs);
}
function FSharpList_get_Empty() {
  return new FSharpList(defaultOf(), void 0);
}
function FSharpList_Cons_305B8EAC(x, xs) {
  return new FSharpList(x, xs);
}
function FSharpList__get_IsEmpty(xs) {
  return xs.tail == null;
}
function FSharpList__get_Length(xs) {
  const loop = (i_mut, xs_1_mut) => {
    loop: while (true) {
      const i = i_mut, xs_1 = xs_1_mut;
      const matchValue = xs_1.tail;
      if (matchValue != null) {
        i_mut = i + 1;
        xs_1_mut = value(matchValue);
        continue loop;
      } else {
        return i | 0;
      }
      break;
    }
  };
  return loop(0, xs) | 0;
}
function FSharpList__get_Head(xs) {
  const matchValue = xs.tail;
  if (matchValue != null) {
    return xs.head;
  } else {
    throw new Exception(SR_inputWasEmpty + " (Parameter 'list')");
  }
}
function FSharpList__get_Tail(xs) {
  const matchValue = xs.tail;
  if (matchValue != null) {
    return value(matchValue);
  } else {
    throw new Exception(SR_inputWasEmpty + " (Parameter 'list')");
  }
}
function empty() {
  return FSharpList_get_Empty();
}
function cons(x, xs) {
  return FSharpList_Cons_305B8EAC(x, xs);
}
function singleton(x) {
  return FSharpList_Cons_305B8EAC(x, FSharpList_get_Empty());
}
function isEmpty(xs) {
  return FSharpList__get_IsEmpty(xs);
}
function length(xs) {
  return FSharpList__get_Length(xs) | 0;
}
function head(xs) {
  return FSharpList__get_Head(xs);
}
function tail(xs) {
  return FSharpList__get_Tail(xs);
}
function toArray(xs) {
  const len = FSharpList__get_Length(xs) | 0;
  const res = fill(new Array(len), 0, len, null);
  const loop = (i_mut, xs_1_mut) => {
    loop: while (true) {
      const i = i_mut, xs_1 = xs_1_mut;
      if (!FSharpList__get_IsEmpty(xs_1)) {
        setItem(res, i, FSharpList__get_Head(xs_1));
        i_mut = i + 1;
        xs_1_mut = FSharpList__get_Tail(xs_1);
        continue loop;
      }
      break;
    }
  };
  loop(0, xs);
  return res;
}
function fold(folder, state, xs) {
  let acc = state;
  let xs_1 = xs;
  while (!FSharpList__get_IsEmpty(xs_1)) {
    acc = folder(acc, head(xs_1));
    xs_1 = FSharpList__get_Tail(xs_1);
  }
  return acc;
}
function reverse(xs) {
  return fold((acc, x) => FSharpList_Cons_305B8EAC(x, acc), FSharpList_get_Empty(), xs);
}
function foldIndexed(folder, state, xs) {
  const loop = (i_mut, acc_mut, xs_1_mut) => {
    loop: while (true) {
      const i = i_mut, acc = acc_mut, xs_1 = xs_1_mut;
      if (FSharpList__get_IsEmpty(xs_1)) {
        return acc;
      } else {
        i_mut = i + 1;
        acc_mut = folder(i, acc, FSharpList__get_Head(xs_1));
        xs_1_mut = FSharpList__get_Tail(xs_1);
        continue loop;
      }
      break;
    }
  };
  return loop(0, state, xs);
}
function ofArrayWithTail(xs, tail_1) {
  let res = tail_1;
  for (let i = xs.length - 1; i >= 0; i--) {
    res = FSharpList_Cons_305B8EAC(item(i, xs), res);
  }
  return res;
}
function ofArray(xs) {
  return ofArrayWithTail(xs, FSharpList_get_Empty());
}
function ofSeq(xs) {
  if (isArrayLike(xs)) {
    return ofArray(xs);
  } else if (xs instanceof FSharpList) {
    return xs;
  } else {
    const root = FSharpList_get_Empty();
    let node = root;
    const enumerator = getEnumerator(xs);
    try {
      while (enumerator["System.Collections.IEnumerator.MoveNext"]()) {
        let xs_3 = void 0, t = void 0;
        const x = enumerator["System.Collections.Generic.IEnumerator`1.get_Current"]();
        node = (xs_3 = node, t = new FSharpList(x, void 0), xs_3.tail = t, t);
      }
    } finally {
      disposeSafe(enumerator);
    }
    const xs_5 = node;
    const t_2 = FSharpList_get_Empty();
    xs_5.tail = t_2;
    return FSharpList__get_Tail(root);
  }
}
function append(xs, ys) {
  return fold((acc, x) => FSharpList_Cons_305B8EAC(x, acc), ys, reverse(xs));
}
function mapIndexed2(mapping, xs) {
  const root = FSharpList_get_Empty();
  const node = foldIndexed((i, acc, x) => {
    const t = new FSharpList(mapping(i, x), void 0);
    acc.tail = t;
    return t;
  }, root, xs);
  const t_2 = FSharpList_get_Empty();
  node.tail = t_2;
  return FSharpList__get_Tail(root);
}
function map2(mapping, xs) {
  const root = FSharpList_get_Empty();
  const node = fold((acc, x) => {
    const t = new FSharpList(mapping(x), void 0);
    acc.tail = t;
    return t;
  }, root, xs);
  const t_2 = FSharpList_get_Empty();
  node.tail = t_2;
  return FSharpList__get_Tail(root);
}
function tryFindIndex(f, xs) {
  const loop = (i_mut, xs_1_mut) => {
    loop: while (true) {
      const i = i_mut, xs_1 = xs_1_mut;
      if (FSharpList__get_IsEmpty(xs_1)) {
        return void 0;
      } else if (f(FSharpList__get_Head(xs_1))) {
        return i;
      } else {
        i_mut = i + 1;
        xs_1_mut = FSharpList__get_Tail(xs_1);
        continue loop;
      }
      break;
    }
  };
  return loop(0, xs);
}
function choose(f, xs) {
  const root = FSharpList_get_Empty();
  const node = fold((acc, x) => {
    const matchValue = f(x);
    if (matchValue == null) {
      return acc;
    } else {
      const t = new FSharpList(value(matchValue), void 0);
      acc.tail = t;
      return t;
    }
  }, root, xs);
  const t_2 = FSharpList_get_Empty();
  node.tail = t_2;
  return FSharpList__get_Tail(root);
}
function contains(value2, xs, eq) {
  return tryFindIndex((v) => eq.Equals(value2, v), xs) != null;
}
function forAll(f, xs) {
  return fold((acc, x) => acc && f(x), true, xs);
}

// src/core/fable_modules/fable-library-js.5.6.0/Seq.js
var SR_enumerationAlreadyFinished = "Enumeration already finished.";
var SR_enumerationNotStarted = "Enumeration has not started. Call MoveNext.";
var SR_resetNotSupported = "Reset is not supported on this enumerator.";
function Enumerator_noReset() {
  throw NotSupportedException_$ctor_Z721C83C5(SR_resetNotSupported);
}
function Enumerator_notStarted() {
  throw InvalidOperationException_$ctor_Z721C83C5(SR_enumerationNotStarted);
}
function Enumerator_alreadyFinished() {
  throw InvalidOperationException_$ctor_Z721C83C5(SR_enumerationAlreadyFinished);
}
var Enumerator_Seq = class {
  constructor(f) {
    this.f = f;
  }
  toString() {
    const xs = this;
    let i = 0;
    let str = "seq [";
    const e = getEnumerator(xs);
    try {
      while (i < 4 && e["System.Collections.IEnumerator.MoveNext"]()) {
        if (i > 0) {
          str = str + "; ";
        }
        str = str + toString(e["System.Collections.Generic.IEnumerator`1.get_Current"]());
        i = i + 1 | 0;
      }
      if (i === 4) {
        str = str + "; ...";
      }
      return str + "]";
    } finally {
      disposeSafe(e);
    }
  }
  GetEnumerator() {
    const x = this;
    return x.f();
  }
  [Symbol.iterator]() {
    return toIterator(getEnumerator(this));
  }
  "System.Collections.IEnumerable.GetEnumerator"() {
    const x = this;
    return x.f();
  }
};
function Enumerator_Seq_$ctor_673A07F2(f) {
  return new Enumerator_Seq(f);
}
var Enumerator_FromFunctions$1 = class {
  constructor(current, next, dispose) {
    this.current = current;
    this.next = next;
    this.dispose = dispose;
  }
  "System.Collections.Generic.IEnumerator`1.get_Current"() {
    const _ = this;
    return _.current();
  }
  "System.Collections.IEnumerator.get_Current"() {
    const _ = this;
    return _.current();
  }
  "System.Collections.IEnumerator.MoveNext"() {
    const _ = this;
    return _.next();
  }
  "System.Collections.IEnumerator.Reset"() {
    Enumerator_noReset();
  }
  Dispose() {
    const _ = this;
    _.dispose();
  }
};
function Enumerator_FromFunctions$1_$ctor_58C54629(current, next, dispose) {
  return new Enumerator_FromFunctions$1(current, next, dispose);
}
function Enumerator_generateWhileSome(openf, compute, closef) {
  let started = false;
  let curr = void 0;
  let state = some(openf());
  const dispose = () => {
    if (state != null) {
      const x_1 = value(state);
      try {
        closef(x_1);
      } finally {
        state = void 0;
      }
    }
  };
  const finish = () => {
    try {
      dispose();
    } finally {
      curr = void 0;
    }
  };
  return Enumerator_FromFunctions$1_$ctor_58C54629(() => {
    if (!started) {
      Enumerator_notStarted();
    }
    if (curr != null) {
      return value(curr);
    } else {
      return Enumerator_alreadyFinished();
    }
  }, () => {
    if (!started) {
      started = true;
    }
    if (state != null) {
      const s = value(state);
      let matchValue_1;
      try {
        matchValue_1 = compute(s);
      } catch (matchValue) {
        finish();
        throw matchValue;
      }
      if (matchValue_1 != null) {
        curr = matchValue_1;
        return true;
      } else {
        finish();
        return false;
      }
    } else {
      return false;
    }
  }, dispose);
}
function Enumerator_unfold(f, state) {
  let curr = void 0;
  let acc = state;
  return Enumerator_FromFunctions$1_$ctor_58C54629(() => {
    if (curr != null) {
      const x = value(curr)[0];
      const st = value(curr)[1];
      return x;
    } else {
      return Enumerator_notStarted();
    }
  }, () => {
    curr = f(acc);
    if (curr != null) {
      const x_1 = value(curr)[0];
      const st_1 = value(curr)[1];
      acc = st_1;
      return true;
    } else {
      return false;
    }
  }, () => {
  });
}
function mkSeq(f) {
  return Enumerator_Seq_$ctor_673A07F2(f);
}
function ofSeq2(xs) {
  return getEnumerator(Operators_NullArgCheck("source", xs));
}
function delay(generator) {
  return mkSeq(() => getEnumerator(generator()));
}
function unfold(generator, state) {
  return mkSeq(() => Enumerator_unfold(generator, state));
}
function toList(xs) {
  if (isArrayLike(xs)) {
    return ofArray(xs);
  } else if (xs instanceof FSharpList) {
    return xs;
  } else {
    return ofSeq(xs);
  }
}
function generate(create, compute, dispose) {
  return mkSeq(() => Enumerator_generateWhileSome(create, compute, dispose));
}
function compareWith(comparer, xs, ys) {
  const e1 = ofSeq2(xs);
  try {
    const e2 = ofSeq2(ys);
    try {
      let c = 0;
      let b1 = e1["System.Collections.IEnumerator.MoveNext"]();
      let b2 = e2["System.Collections.IEnumerator.MoveNext"]();
      while (c === 0 && b1 && b2) {
        c = comparer(e1["System.Collections.Generic.IEnumerator`1.get_Current"](), e2["System.Collections.Generic.IEnumerator`1.get_Current"]()) | 0;
        if (c === 0) {
          b1 = e1["System.Collections.IEnumerator.MoveNext"]();
          b2 = e2["System.Collections.IEnumerator.MoveNext"]();
        }
      }
      return (c !== 0 ? c : b1 ? 1 : b2 ? -1 : 0) | 0;
    } finally {
      disposeSafe(e2);
    }
  } finally {
    disposeSafe(e1);
  }
}
function exists(predicate, xs) {
  const e = ofSeq2(xs);
  try {
    let found = false;
    while (!found && e["System.Collections.IEnumerator.MoveNext"]()) {
      found = predicate(e["System.Collections.Generic.IEnumerator`1.get_Current"]());
    }
    return found;
  } finally {
    disposeSafe(e);
  }
}
function fold2(folder, state, xs) {
  const e = ofSeq2(xs);
  try {
    let acc = state;
    while (e["System.Collections.IEnumerator.MoveNext"]()) {
      acc = folder(acc, e["System.Collections.Generic.IEnumerator`1.get_Current"]());
    }
    return acc;
  } finally {
    disposeSafe(e);
  }
}
function forAll2(predicate, xs) {
  return !exists((x) => !predicate(x), xs);
}
function iterate(action, xs) {
  fold2((unitVar, x) => {
    action(x);
  }, void 0, xs);
}
function map3(mapping, xs) {
  return generate(() => ofSeq2(xs), (e) => e["System.Collections.IEnumerator.MoveNext"]() ? some(mapping(e["System.Collections.Generic.IEnumerator`1.get_Current"]())) : void 0, (e_1) => {
    disposeSafe(e_1);
  });
}

// src/core/fable_modules/fable-library-js.5.6.0/System.Collections.Generic.js
var KeyNotFoundException = class extends Exception {
  constructor(message) {
    super(message);
  }
};
function KeyNotFoundException_$ctor_Z721C83C5(message) {
  return new KeyNotFoundException(message);
}
function KeyNotFoundException_$ctor() {
  return KeyNotFoundException_$ctor_Z721C83C5(SR_Arg_KeyNotFound);
}

// src/core/fable_modules/fable-library-js.5.6.0/Map.js
var MapTreeLeaf$2 = class {
  constructor(k, v) {
    this.k = k;
    this.v = v;
  }
};
function MapTreeLeaf$2_$ctor_5BDDA1(k, v) {
  return new MapTreeLeaf$2(k, v);
}
function MapTreeLeaf$2__get_Key(_) {
  return _.k;
}
function MapTreeLeaf$2__get_Value(_) {
  return _.v;
}
var MapTreeNode$2 = class extends MapTreeLeaf$2 {
  constructor(k, v, left, right, h) {
    super(k, v);
    this.left = left;
    this.right = right;
    this.h = h | 0;
  }
};
function MapTreeNode$2_$ctor_Z39DE9543(k, v, left, right, h) {
  return new MapTreeNode$2(k, v, left, right, h);
}
function MapTreeNode$2__get_Left(_) {
  return _.left;
}
function MapTreeNode$2__get_Right(_) {
  return _.right;
}
function MapTreeNode$2__get_Height(_) {
  return _.h | 0;
}
function MapTreeModule_empty() {
  return void 0;
}
function MapTreeModule_sizeAux(acc_mut, m_mut) {
  MapTreeModule_sizeAux: while (true) {
    const acc = acc_mut, m = m_mut;
    if (m != null) {
      const m2 = value(m);
      if (m2 instanceof MapTreeNode$2) {
        const mn = m2;
        acc_mut = MapTreeModule_sizeAux(acc + 1, MapTreeNode$2__get_Left(mn));
        m_mut = MapTreeNode$2__get_Right(mn);
        continue MapTreeModule_sizeAux;
      } else {
        return acc + 1 | 0;
      }
    } else {
      return acc | 0;
    }
    break;
  }
}
function MapTreeModule_size(x) {
  return MapTreeModule_sizeAux(0, x) | 0;
}
function MapTreeModule_mk(l, k, v, r) {
  let mn = void 0, mn_1 = void 0;
  let hl;
  const m = l;
  if (m != null) {
    const m2 = value(m);
    hl = m2 instanceof MapTreeNode$2 ? (mn = m2, MapTreeNode$2__get_Height(mn)) : 1;
  } else {
    hl = 0;
  }
  let hr;
  const m_1 = r;
  if (m_1 != null) {
    const m2_1 = value(m_1);
    hr = m2_1 instanceof MapTreeNode$2 ? (mn_1 = m2_1, MapTreeNode$2__get_Height(mn_1)) : 1;
  } else {
    hr = 0;
  }
  const m_2 = (hl < hr ? hr : hl) | 0;
  if (m_2 === 0) {
    return MapTreeLeaf$2_$ctor_5BDDA1(k, v);
  } else {
    return MapTreeNode$2_$ctor_Z39DE9543(k, v, l, r, m_2 + 1);
  }
}
function MapTreeModule_rebalance(t1, k, v, t2) {
  let mn = void 0, mn_1 = void 0, m_2 = void 0, m2_2 = void 0, mn_2 = void 0, m_3 = void 0, m2_3 = void 0, mn_3 = void 0;
  let t1h;
  const m = t1;
  if (m != null) {
    const m2 = value(m);
    t1h = m2 instanceof MapTreeNode$2 ? (mn = m2, MapTreeNode$2__get_Height(mn)) : 1;
  } else {
    t1h = 0;
  }
  let t2h;
  const m_1 = t2;
  if (m_1 != null) {
    const m2_1 = value(m_1);
    t2h = m2_1 instanceof MapTreeNode$2 ? (mn_1 = m2_1, MapTreeNode$2__get_Height(mn_1)) : 1;
  } else {
    t2h = 0;
  }
  if (t2h > t1h + 2) {
    const matchValue = value(t2);
    if (matchValue instanceof MapTreeNode$2) {
      const t2$0027 = matchValue;
      if ((m_2 = MapTreeNode$2__get_Left(t2$0027), m_2 != null ? (m2_2 = value(m_2), m2_2 instanceof MapTreeNode$2 ? (mn_2 = m2_2, MapTreeNode$2__get_Height(mn_2)) : 1) : 0) > t1h + 1) {
        const matchValue_1 = value(MapTreeNode$2__get_Left(t2$0027));
        if (matchValue_1 instanceof MapTreeNode$2) {
          const t2l = matchValue_1;
          return MapTreeModule_mk(MapTreeModule_mk(t1, k, v, MapTreeNode$2__get_Left(t2l)), MapTreeLeaf$2__get_Key(t2l), MapTreeLeaf$2__get_Value(t2l), MapTreeModule_mk(MapTreeNode$2__get_Right(t2l), MapTreeLeaf$2__get_Key(t2$0027), MapTreeLeaf$2__get_Value(t2$0027), MapTreeNode$2__get_Right(t2$0027)));
        } else {
          throw new Exception("internal error: Map.rebalance");
        }
      } else {
        return MapTreeModule_mk(MapTreeModule_mk(t1, k, v, MapTreeNode$2__get_Left(t2$0027)), MapTreeLeaf$2__get_Key(t2$0027), MapTreeLeaf$2__get_Value(t2$0027), MapTreeNode$2__get_Right(t2$0027));
      }
    } else {
      throw new Exception("internal error: Map.rebalance");
    }
  } else if (t1h > t2h + 2) {
    const matchValue_2 = value(t1);
    if (matchValue_2 instanceof MapTreeNode$2) {
      const t1$0027 = matchValue_2;
      if ((m_3 = MapTreeNode$2__get_Right(t1$0027), m_3 != null ? (m2_3 = value(m_3), m2_3 instanceof MapTreeNode$2 ? (mn_3 = m2_3, MapTreeNode$2__get_Height(mn_3)) : 1) : 0) > t2h + 1) {
        const matchValue_3 = value(MapTreeNode$2__get_Right(t1$0027));
        if (matchValue_3 instanceof MapTreeNode$2) {
          const t1r = matchValue_3;
          return MapTreeModule_mk(MapTreeModule_mk(MapTreeNode$2__get_Left(t1$0027), MapTreeLeaf$2__get_Key(t1$0027), MapTreeLeaf$2__get_Value(t1$0027), MapTreeNode$2__get_Left(t1r)), MapTreeLeaf$2__get_Key(t1r), MapTreeLeaf$2__get_Value(t1r), MapTreeModule_mk(MapTreeNode$2__get_Right(t1r), k, v, t2));
        } else {
          throw new Exception("internal error: Map.rebalance");
        }
      } else {
        return MapTreeModule_mk(MapTreeNode$2__get_Left(t1$0027), MapTreeLeaf$2__get_Key(t1$0027), MapTreeLeaf$2__get_Value(t1$0027), MapTreeModule_mk(MapTreeNode$2__get_Right(t1$0027), k, v, t2));
      }
    } else {
      throw new Exception("internal error: Map.rebalance");
    }
  } else {
    return MapTreeModule_mk(t1, k, v, t2);
  }
}
function MapTreeModule_add(comparer, k, v, m) {
  if (m != null) {
    const m2 = value(m);
    const c = comparer.Compare(k, MapTreeLeaf$2__get_Key(m2)) | 0;
    if (m2 instanceof MapTreeNode$2) {
      const mn = m2;
      if (c < 0) {
        return MapTreeModule_rebalance(MapTreeModule_add(comparer, k, v, MapTreeNode$2__get_Left(mn)), MapTreeLeaf$2__get_Key(mn), MapTreeLeaf$2__get_Value(mn), MapTreeNode$2__get_Right(mn));
      } else if (c === 0) {
        return MapTreeNode$2_$ctor_Z39DE9543(k, v, MapTreeNode$2__get_Left(mn), MapTreeNode$2__get_Right(mn), MapTreeNode$2__get_Height(mn));
      } else {
        return MapTreeModule_rebalance(MapTreeNode$2__get_Left(mn), MapTreeLeaf$2__get_Key(mn), MapTreeLeaf$2__get_Value(mn), MapTreeModule_add(comparer, k, v, MapTreeNode$2__get_Right(mn)));
      }
    } else if (c < 0) {
      return MapTreeNode$2_$ctor_Z39DE9543(k, v, MapTreeModule_empty(), m, 2);
    } else if (c === 0) {
      return MapTreeLeaf$2_$ctor_5BDDA1(k, v);
    } else {
      return MapTreeNode$2_$ctor_Z39DE9543(k, v, m, MapTreeModule_empty(), 2);
    }
  } else {
    return MapTreeLeaf$2_$ctor_5BDDA1(k, v);
  }
}
function MapTreeModule_tryFind(comparer_mut, k_mut, m_mut) {
  MapTreeModule_tryFind: while (true) {
    const comparer = comparer_mut, k = k_mut, m = m_mut;
    if (m != null) {
      const m2 = value(m);
      const c = comparer.Compare(k, MapTreeLeaf$2__get_Key(m2)) | 0;
      if (c === 0) {
        return some(MapTreeLeaf$2__get_Value(m2));
      } else if (m2 instanceof MapTreeNode$2) {
        const mn = m2;
        comparer_mut = comparer;
        k_mut = k;
        m_mut = c < 0 ? MapTreeNode$2__get_Left(mn) : MapTreeNode$2__get_Right(mn);
        continue MapTreeModule_tryFind;
      } else {
        return void 0;
      }
    } else {
      return void 0;
    }
    break;
  }
}
function MapTreeModule_find(comparer, k, m) {
  const matchValue = MapTreeModule_tryFind(comparer, k, m);
  if (matchValue == null) {
    throw KeyNotFoundException_$ctor();
  } else {
    return value(matchValue);
  }
}
function MapTreeModule_mem(comparer_mut, k_mut, m_mut) {
  MapTreeModule_mem: while (true) {
    const comparer = comparer_mut, k = k_mut, m = m_mut;
    if (m != null) {
      const m2 = value(m);
      const c = comparer.Compare(k, MapTreeLeaf$2__get_Key(m2)) | 0;
      if (m2 instanceof MapTreeNode$2) {
        const mn = m2;
        if (c < 0) {
          comparer_mut = comparer;
          k_mut = k;
          m_mut = MapTreeNode$2__get_Left(mn);
          continue MapTreeModule_mem;
        } else if (c === 0) {
          return true;
        } else {
          comparer_mut = comparer;
          k_mut = k;
          m_mut = MapTreeNode$2__get_Right(mn);
          continue MapTreeModule_mem;
        }
      } else {
        return c === 0;
      }
    } else {
      return false;
    }
    break;
  }
}
function MapTreeModule_iterOpt(f_mut, m_mut) {
  MapTreeModule_iterOpt: while (true) {
    const f = f_mut, m = m_mut;
    if (m != null) {
      const m2 = value(m);
      if (m2 instanceof MapTreeNode$2) {
        const mn = m2;
        MapTreeModule_iterOpt(f, MapTreeNode$2__get_Left(mn));
        f(MapTreeLeaf$2__get_Key(mn), MapTreeLeaf$2__get_Value(mn));
        f_mut = f;
        m_mut = MapTreeNode$2__get_Right(mn);
        continue MapTreeModule_iterOpt;
      } else {
        f(MapTreeLeaf$2__get_Key(m2), MapTreeLeaf$2__get_Value(m2));
      }
    }
    break;
  }
}
function MapTreeModule_iter(f, m) {
  MapTreeModule_iterOpt(f, m);
}
function MapTreeModule_copyToArray(m, arr, i) {
  let j = i;
  MapTreeModule_iter((x, y) => {
    setItem(arr, j, [x, y]);
    j = j + 1 | 0;
  }, m);
}
function MapTreeModule_ofList(comparer, l) {
  return fold((acc, tupledArg) => MapTreeModule_add(comparer, tupledArg[0], tupledArg[1], acc), MapTreeModule_empty(), l);
}
function MapTreeModule_mkFromEnumerator(comparer_mut, acc_mut, e_mut) {
  MapTreeModule_mkFromEnumerator: while (true) {
    const comparer = comparer_mut, acc = acc_mut, e = e_mut;
    if (e["System.Collections.IEnumerator.MoveNext"]()) {
      const patternInput = e["System.Collections.Generic.IEnumerator`1.get_Current"]();
      comparer_mut = comparer;
      acc_mut = MapTreeModule_add(comparer, patternInput[0], patternInput[1], acc);
      e_mut = e;
      continue MapTreeModule_mkFromEnumerator;
    } else {
      return acc;
    }
    break;
  }
}
function MapTreeModule_ofArray(comparer, arr) {
  let res = MapTreeModule_empty();
  for (let idx = 0; idx <= arr.length - 1; idx++) {
    const forLoopVar = item(idx, arr);
    res = MapTreeModule_add(comparer, forLoopVar[0], forLoopVar[1], res);
  }
  return res;
}
function MapTreeModule_ofSeq(comparer, c) {
  if (isArrayLike(c)) {
    return MapTreeModule_ofArray(comparer, c);
  } else if (c instanceof FSharpList) {
    return MapTreeModule_ofList(comparer, c);
  } else {
    const ie = getEnumerator(c);
    try {
      return MapTreeModule_mkFromEnumerator(comparer, MapTreeModule_empty(), ie);
    } finally {
      disposeSafe(ie);
    }
  }
}
var MapTreeModule_MapIterator$2 = class extends Record {
  constructor(stack, started) {
    super();
    this.stack = stack;
    this.started = started;
  }
};
function MapTreeModule_collapseLHS(stack_mut) {
  MapTreeModule_collapseLHS: while (true) {
    const stack = stack_mut;
    if (!isEmpty(stack)) {
      const rest = tail(stack);
      const m = head(stack);
      if (m != null) {
        const m2 = value(m);
        if (m2 instanceof MapTreeNode$2) {
          const mn = m2;
          stack_mut = ofArrayWithTail([MapTreeNode$2__get_Left(mn), MapTreeLeaf$2_$ctor_5BDDA1(MapTreeLeaf$2__get_Key(mn), MapTreeLeaf$2__get_Value(mn)), MapTreeNode$2__get_Right(mn)], rest);
          continue MapTreeModule_collapseLHS;
        } else {
          return stack;
        }
      } else {
        stack_mut = rest;
        continue MapTreeModule_collapseLHS;
      }
    } else {
      return empty();
    }
    break;
  }
}
function MapTreeModule_mkIterator(m) {
  return new MapTreeModule_MapIterator$2(MapTreeModule_collapseLHS(singleton(m)), false);
}
function MapTreeModule_notStarted() {
  throw new Exception("enumeration not started");
}
function MapTreeModule_alreadyFinished() {
  throw new Exception("enumeration already finished");
}
function MapTreeModule_current(i) {
  if (i.started) {
    const matchValue = i.stack;
    if (!isEmpty(matchValue)) {
      if (head(matchValue) != null) {
        const m = value(head(matchValue));
        if (m instanceof MapTreeNode$2) {
          throw new Exception("Please report error: Map iterator, unexpected stack for current");
        } else {
          return [MapTreeLeaf$2__get_Key(m), MapTreeLeaf$2__get_Value(m)];
        }
      } else {
        throw new Exception("Please report error: Map iterator, unexpected stack for current");
      }
    } else {
      return MapTreeModule_alreadyFinished();
    }
  } else {
    return MapTreeModule_notStarted();
  }
}
function MapTreeModule_moveNext(i) {
  if (i.started) {
    const matchValue = i.stack;
    if (!isEmpty(matchValue)) {
      if (head(matchValue) != null) {
        const m = value(head(matchValue));
        if (m instanceof MapTreeNode$2) {
          throw new Exception("Please report error: Map iterator, unexpected stack for moveNext");
        } else {
          i.stack = MapTreeModule_collapseLHS(tail(matchValue));
          return !isEmpty(i.stack);
        }
      } else {
        throw new Exception("Please report error: Map iterator, unexpected stack for moveNext");
      }
    } else {
      return false;
    }
  } else {
    i.started = true;
    return !isEmpty(i.stack);
  }
}
function MapTreeModule_mkIEnumerator(m) {
  let i = MapTreeModule_mkIterator(m);
  return {
    "System.Collections.Generic.IEnumerator`1.get_Current"() {
      return MapTreeModule_current(i);
    },
    "System.Collections.IEnumerator.get_Current"() {
      return MapTreeModule_current(i);
    },
    "System.Collections.IEnumerator.MoveNext"() {
      return MapTreeModule_moveNext(i);
    },
    "System.Collections.IEnumerator.Reset"() {
      i = MapTreeModule_mkIterator(m);
    },
    Dispose() {
    }
  };
}
var FSharpMap = class _FSharpMap {
  constructor(comparer, tree) {
    this.comparer = comparer;
    this.tree = tree;
  }
  GetHashCode() {
    const this$ = this;
    return FSharpMap__ComputeHashCode(this$) | 0;
  }
  Equals(other) {
    const this$ = this;
    if (other instanceof _FSharpMap) {
      const that = other;
      const e1 = getEnumerator(this$);
      try {
        const e2 = getEnumerator(that);
        try {
          const loop = () => {
            const m1 = e1["System.Collections.IEnumerator.MoveNext"]();
            if (m1 === e2["System.Collections.IEnumerator.MoveNext"]()) {
              if (!m1) {
                return true;
              } else {
                const e1c = e1["System.Collections.Generic.IEnumerator`1.get_Current"]();
                const e2c = e2["System.Collections.Generic.IEnumerator`1.get_Current"]();
                if (equals(e1c[0], e2c[0]) && equals(e1c[1], e2c[1])) {
                  return loop();
                } else {
                  return false;
                }
              }
            } else {
              return false;
            }
          };
          return loop();
        } finally {
          disposeSafe(e2);
        }
      } finally {
        disposeSafe(e1);
      }
    } else {
      return false;
    }
  }
  toString() {
    const this$ = this;
    return "map [" + join("; ", map3((kv) => format("({0}, {1})", kv[0], kv[1]), this$)) + "]";
  }
  get [Symbol.toStringTag]() {
    return "FSharpMap";
  }
  toJSON() {
    const this$ = this;
    return Array.from(this$);
  }
  GetEnumerator() {
    const _ = this;
    return MapTreeModule_mkIEnumerator(_.tree);
  }
  [Symbol.iterator]() {
    return toIterator(getEnumerator(this));
  }
  "System.Collections.IEnumerable.GetEnumerator"() {
    const _ = this;
    return MapTreeModule_mkIEnumerator(_.tree);
  }
  CompareTo(other) {
    let that = void 0;
    const this$ = this;
    return (other instanceof _FSharpMap ? (that = other, compareWith((kvp1, kvp2) => {
      const c = this$.comparer.Compare(kvp1[0], kvp2[0]) | 0;
      return (c !== 0 ? c : compare(kvp1[1], kvp2[1])) | 0;
    }, this$, that)) : 1) | 0;
  }
  "System.Collections.Generic.ICollection`1.Add2B595"(x) {
    throw NotSupportedException_$ctor_Z721C83C5("Map cannot be mutated");
  }
  "System.Collections.Generic.ICollection`1.Clear"() {
    throw NotSupportedException_$ctor_Z721C83C5("Map cannot be mutated");
  }
  "System.Collections.Generic.ICollection`1.Remove2B595"(x) {
    throw NotSupportedException_$ctor_Z721C83C5("Map cannot be mutated");
  }
  "System.Collections.Generic.ICollection`1.Contains2B595"(x) {
    const m = this;
    return FSharpMap__ContainsKey(m, x[0]) && equals(FSharpMap__get_Item(m, x[0]), x[1]);
  }
  "System.Collections.Generic.ICollection`1.CopyToZ3B4C077E"(arr, i) {
    const m = this;
    MapTreeModule_copyToArray(m.tree, arr, i);
  }
  "System.Collections.Generic.ICollection`1.get_IsReadOnly"() {
    return true;
  }
  "System.Collections.Generic.ICollection`1.get_Count"() {
    const m = this;
    return FSharpMap__get_Count(m) | 0;
  }
  "System.Collections.Generic.IReadOnlyCollection`1.get_Count"() {
    const m = this;
    return FSharpMap__get_Count(m) | 0;
  }
  get size() {
    const m = this;
    return FSharpMap__get_Count(m) | 0;
  }
  clear() {
    throw new Exception("Map cannot be mutated");
  }
  delete(_arg) {
    throw new Exception("Map cannot be mutated");
    return false;
  }
  entries() {
    const m = this;
    return map3((p) => [p[0], p[1]], m);
  }
  get(k) {
    const m = this;
    return FSharpMap__get_Item(m, k);
  }
  has(k) {
    const m = this;
    return FSharpMap__ContainsKey(m, k);
  }
  keys() {
    const m = this;
    return map3((p) => p[0], m);
  }
  set(k, v) {
    const m = this;
    throw new Exception("Map cannot be mutated");
    return m;
  }
  values() {
    const m = this;
    return map3((p) => p[1], m);
  }
  forEach(f, thisArg) {
    const m = this;
    iterate((p) => {
      f(p[1], p[0], m);
    }, m);
  }
};
function FSharpMap_$ctor(comparer, tree) {
  return new FSharpMap(comparer, tree);
}
function FSharpMap__get_Item(m, key) {
  return MapTreeModule_find(m.comparer, key, m.tree);
}
function FSharpMap__get_Count(m) {
  return MapTreeModule_size(m.tree) | 0;
}
function FSharpMap__ContainsKey(m, key) {
  return MapTreeModule_mem(m.comparer, key, m.tree);
}
function FSharpMap__TryFind(m, key) {
  return MapTreeModule_tryFind(m.comparer, key, m.tree);
}
function FSharpMap__ComputeHashCode(this$) {
  const combineHash = (x, y) => (x << 1) + y + 631 | 0;
  let res = 0;
  const enumerator = getEnumerator(this$);
  try {
    while (enumerator["System.Collections.IEnumerator.MoveNext"]()) {
      const activePatternResult = enumerator["System.Collections.Generic.IEnumerator`1.get_Current"]();
      res = combineHash(res, structuralHash(activePatternResult[0])) | 0;
      res = combineHash(res, structuralHash(activePatternResult[1])) | 0;
    }
  } finally {
    disposeSafe(enumerator);
  }
  return res | 0;
}
function tryFind(key, table) {
  return FSharpMap__TryFind(table, key);
}
function ofList(elements, comparer) {
  return FSharpMap_$ctor(comparer, MapTreeModule_ofSeq(comparer, elements));
}

// src/core/fable_modules/fable-library-js.5.6.0/Range.js
function makeRangeStepFunction(step, stop, zero, add) {
  const stepComparedWithZero = compare(step, zero) | 0;
  if (stepComparedWithZero === 0) {
    throw new Exception("The step of a range cannot be zero");
  }
  const stepGreaterThanZero = stepComparedWithZero > 0;
  return (x) => {
    const comparedWithLast = compare(x, stop) | 0;
    return (stepGreaterThanZero && comparedWithLast <= 0 ? true : !stepGreaterThanZero && comparedWithLast >= 0) ? [x, add(x, step)] : void 0;
  };
}
function integralRangeStep(start, step, stop, zero, add) {
  const stepFn = makeRangeStepFunction(step, stop, zero, add);
  return delay(() => unfold(stepFn, start));
}
function rangeDouble(start, step, stop) {
  return integralRangeStep(start, step, stop, 0, (x, y) => x + y);
}

// src/core/Engine.js
function resolve(defs_mut, f_mut) {
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
          } else {
            defs_mut = defs;
            f_mut = matchValue;
            continue resolve;
          }
        }
      }
      break;
    }
}
function atoms(f) {
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
              Equals: (x, y) => x === y,
              GetHashCode: (x) => stringHash(x) | 0
            })) {
              return acc;
            } else {
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
function eval$(env_mut, f_mut) {
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
          } else {
            return false;
          }
        case 4:
          if (eval$(env, f.fields[0])) {
            return true;
          } else {
            env_mut = env;
            f_mut = f.fields[1];
            continue eval$;
          }
        case 5:
          return eval$(env, f.fields[0]) !== eval$(env, f.fields[1]);
        case 6:
          if (!eval$(env, f.fields[0])) {
            return true;
          } else {
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
function assignments(names) {
  const n = length(names) | 0;
  return toList(delay(() => map3((i) => ofList(mapIndexed2((bit, name) => [name, (i >> n - 1 - bit & 1) === 1], names), {
    Compare: (x, y) => comparePrimitives(x, y) | 0
  }), rangeDouble(0, 1, (1 << n) - 1))));
}
var Verdict = class extends Union {
  constructor(tag, fields) {
    super();
    this.tag = tag;
    this.fields = fields;
  }
  cases() {
    return ["Tautology", "Contradiction", "Contingent"];
  }
};
var TruthTable = class extends Record {
  constructor(Atoms, Rows, Verdict2) {
    super();
    this.Atoms = Atoms;
    this.Rows = Rows;
    this.Verdict = Verdict2;
  }
};
function truthTable(f) {
  const names = atoms(f);
  const rows = map2((env) => [env, eval$(env, f)], assignments(names));
  const results = map2((tuple) => tuple[1], rows);
  return new TruthTable(names, rows, forAll((x) => x, results) ? new Verdict(0, []) : forAll((value2) => !value2, results) ? new Verdict(1, []) : new Verdict(2, []));
}
function equivalent(a, b) {
  return equals(truthTable(new Formula(7, [a, b])).Verdict, new Verdict(0, []));
}

// src/core/Render.js
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
function toUnicode(formula) {
  const go = (f) => {
    const parentPrec = precedence(f) | 0;
    const wrap = (onLeft, child) => {
      const childPrec = precedence(child) | 0;
      if (childPrec < parentPrec ? true : childPrec === parentPrec && (f.tag === 6 ? onLeft : !onLeft)) {
        return "(" + go(child) + ")";
      } else {
        return go(child);
      }
    };
    switch (f.tag) {
      case 1:
        if (f.fields[0]) {
          return "\u22A4";
        } else {
          return "\u22A5";
        }
      case 2:
        return "\xAC" + wrap(true, f.fields[0]);
      case 3:
        return wrap(true, f.fields[0]) + " \u2227 " + wrap(false, f.fields[1]);
      case 4:
        return wrap(true, f.fields[0]) + " \u2228 " + wrap(false, f.fields[1]);
      case 5:
        return wrap(true, f.fields[0]) + " \u2295 " + wrap(false, f.fields[1]);
      case 6:
        return wrap(true, f.fields[0]) + " \u2192 " + wrap(false, f.fields[1]);
      case 7:
        return wrap(true, f.fields[0]) + " \u2194 " + wrap(false, f.fields[1]);
      default:
        return f.fields[0];
    }
  };
  return go(formula);
}

// src/core/fable_modules/fable-library-js.5.6.0/Result.js
function FSharpResult$2_Ok(ResultValue) {
  return new FSharpResult$2(0, [ResultValue]);
}
function FSharpResult$2_Error$(ErrorValue) {
  return new FSharpResult$2(1, [ErrorValue]);
}
var FSharpResult$2 = class extends Union {
  constructor(tag, fields) {
    super();
    this.tag = tag;
    this.fields = fields;
  }
  cases() {
    return ["Ok", "Error"];
  }
};
function Result_Map(mapping, result) {
  if (result.tag === /* Ok */
  0) {
    return FSharpResult$2_Ok(mapping(result.fields[0]));
  } else {
    return FSharpResult$2_Error$(result.fields[0]);
  }
}
function Result_Bind(binder, result) {
  if (result.tag === /* Ok */
  0) {
    return binder(result.fields[0]);
  } else {
    return FSharpResult$2_Error$(result.fields[0]);
  }
}

// src/core/fable_modules/fable-library-js.5.6.0/Unicode.13.0.0.js
var rangeDeltas = "#C$&$&$$$$$$%-%&%=$$$$$$=$$$$D$$'$$$$$$$$$$$$%$$%$$$$&$:$*;$+$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$%$$$$$$$$$$$$$$$%$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$%$$$$&%$$$%$&%'$%$&&%$%$$$$$%$$%$$%$&$$$%%$$&'$$$$$$$$$$$$$$$$$$$$$$$$%$$$$$$$$$$$$$$$$$%$$$$$&$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$*%$%%$$'$$$$$$$$h$>5'/1(*$$$4\x93$$$$$$$$%$&$$'%$$&$$$%$4$,F$%&&$$$$$$$$$$$$$$$$$$$$$$$($$$$$%%VS$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$(%$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$%$$$$$$$$$$$$%$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$I%$)L$$%%$$P$$$%$%$$+>''%.)&%$%%.$$$%C$-8-'%$\x86$$*$$)%%$'%-&%$1$$$$A>%|.$1-D,%$&$%$%9'$,$&$(%2$<&%$$.X8$5.2$C$Y$$$$&+'$%$*-%%-$$2$%$+%%%9$*$$&'%$$&'%%%%$$+$'%$&%%-%%)$$$$$%%$$)'%%9$*$%$%$%%$$&%'%%&&$*'$$*-%&$$-%$$,$&$9$*$%$(%$$&($%$$%$%$2%%%-$$*$)$$%$+%%%9$*$%$(%$$$$$'%%%%$*%$'%$&%%-$$)-$$$)&&$'&%$$$%&%&&&/'%$%&&$&$%$)$1-&)$$($&$+$&$:$3&$&'$&$'*%$&(%%%-*$*$$$%$+$&$:$-$(%$$$$($$%$%%*%*$$%%%-$%0%%,$&$L%$&'$&$&$$$'&$*&%%-,$)$$%$5&;$,$$%*&$'&&$$$+)-%%$/S$%*'$)$+$-%H%$$$($;$$$-$%,$%($$$)%-%'C$&2$$&%)--$$$$$$$$$$%+$G'1$($%(.$G$+$)$%('%HN%'$)$%%%$-))%%'&$&%*&'0$%%)$$$-&$%I$$($%N$$&\u016C$'%*$$$'%L$'%D$'%*$$$'%2$\\$'%f%&,7&3-)y%)%$\u028F$$4$=$$&n&&+*0$'&.5&%,5%/0$&$%/W%$*+$%.&$&$$$%-)-))$'&$$-)F$X*(%E$$(i-B$&'%&'%$)&'$&%-A%(.O'=)-$&E:%%$%%X$$$*$$$$%+)-%$-)-)*$)%1$%b'$R$$($$($%*'-*-,,&%$A$'%%$&%-O$$%&$$&%+'G++%%&(-&&-A)%,*N%&++&$0$*'$)$%$%$(Ob0$EH]$($$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$,$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$,+)%)%++++)%)%+$$$$$$$$++1%++++++($%'$$$&&$%'$&'%%'$&+(&%&$%'$%$.()%$$$%$$$+$$($,$$'%&$$$.$$$-$($-$$%)&$$$-&$$$0&C30'$&/2%$'$%$&%&$$$%$()$$$$$$'$$'$'$%%%($'$$%$$3F$$'$%'((%'$%$%$*$B%%$$$B\u012F+$$$$7%*$$t$A<K)h<.8_q9\xDA$,$Y+\x92$\u011B$$$$$$$$$$$$$$AO($$B$$$$$$$$$$3\u0123\xA6$$$$$$$$$$$$$$$$$$$$$$b$$$$C$$\u0125S8%)J%C$\x8CR$R$$$&%$$$$$$'$$%$)%&$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$%)$$$$&$$('$%I$$($%[*$$1$:,*$*$*$*$*$*$*$*$C%$$$$&$$$$$,$%$$$$%$$$$$$$$$$($-%'$$$0%$P=$|/\xF9=/'$&$$$$$$$$$$$$$$%$$$$$$$$$$%$,'%$(%&$$$%$y%%%%$$}$&$(N$\x81$%'-CG/3B$-A+$2C-J2\u0163\u19E3c\u5220&8$\u049A&Z,K)%\u012F$&3-%7$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$&$-$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$%%i-%)+:,%$$$$$$$$$$$$$&$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$+$$$$%$$$$$$$$$$%$$$$$$$$&$$$$$$$$$$$$$$$$$$$$($($$$$$$$$$$$%$$'$$$M$$$%$*$&$'$:%%$'$&)%$$)W'+%U3%+%-)5)&$$%$-?+%:.%.$@&&$R$%'%%&0$$-'%($$,-($L)%%%%,&$+$$%-%'3$)&$$$$U$$&%%(%$$$;%$%.$%%%$%$$-)%)%),*$*$N$',$%'sF%$%$%$$$%-)\u2BC7/:'T'\u0823\u1923\u0191%\x8DI*/(($$-$0$($$$%$%$\x8F34\u018E$$3c%YK/$$%3*$$$)3$%%$$$$$$$$$$$$$$$$%$$'&&$'$$$$$$$&$$&$$$%'($\xAA%$$&$&$$$$$$%-%&%=$$$$$$=$$$$$$$$$%-$P%B&)%)%)%&&%$$$%$$'%-&%%/$=$6$%$2%1E\x9E(&'P&,X'4%&$0&$RP$\xA5@&T2$>'C',7$+$(I((A$$G'+$(MKKq%-)G'G'K+W.$\xB3\u015A,9-+\xBB)%$$O$%&$%:$$+:%*B+,S6$%((9)&$=($c['%%3%Q$&$%(''$&$@%&'$,*,*@%$@&C+$?%'(*,Y&*9%+6(+5*'/*slZV0V*)G'+-\u0149B$M$%$%%q@-$+9.'(y8*7:,$$$X2*'7-2&$P&'%%%$'.$%<*-)&G($+$-'$%$+F$%$,%$S&,%'''$$$-$$$&$7.5$<&&%$$%)$d*$$$'$2$-$)R$&+(-)%%$+%%%9$*$%$($%$%$'%%%&%$)$((%%*&(\xAEX&+%&$$'(-%$$$&AS&)$$'%$%%$$+-\xC9R&'%'%$%:'%ES&+%$$%&$.-)06N$$$%)$$$*-Y>%&%'$('-%&$\xE3O&,$%$\x87CC-,/+%$%+$%$;)$%%%$$$$$$$&,-i+%J&'%%'$$$$$>$-K)$$'+$+$)%&Q0$%&$(@\\\u012A,$H$*$)$$$(--6&%A%9$$*$%$%l*$%$I)&$$%$*$$+-))$%$C($%$%$$$$*-\u01596%%%\xDA$28+'40$\u03BD\x89\x92$(.\xE7\u0ADF\u0452$,\u0FEA\u026A\u21DC\u025C*B$-'%\x83A%($-S*(''$$--$*$8(6\u02D3CC:'\x88n'$$Z*'0c%$$$.%1\u181B+\u04F9M,\u231A\u0142T&4'+\u01AF\u0927\x8E(0&,*-%$%$'\u137F\u0119-J%_%&&)++%*A'^:e&$\xBD7/z,<\xAA===*$5==$$%%$%%%'$+'$$$*$.==%$'%+$*$=%$'$($$&*$============?%<$<$)<$<$)<$<$)<$<$)<$<$)$$%U\u0223Z'U+$1$%(2($2\u0573*$4%*$%$(\xF8P&**%-'$$\u0193O'-($\u0523\xE8%,*LEE*$'-'%\u0334^$&$'oP$2\xE5'$>$%$$%$$-$'$$$$)$'$$$$$$&$%$$%$$$$$$$$$$%$$%'$*$'$'$$$-$4(&$($4W%\u0131O'\x87/2%2$2$H-0\xC4[@0O',*%1)\xBD\u011E(\u02FB+0&0&\x97/|*/7/'[+-)K+A%%q\x9C$u$\xAA/1%(&&(*,<**,&0*L\xB6$ZH-\u0429\uA701E\u1058.\u0101%\u16A51\u1D54\u0C42\u0241\u0605\u136E\u{AECD9}$A\x83\xA3\u0113\uFE33\u{10021}%\u{10021}";
var categories = "1.;=;78;<;6;+;<;#7;8>5>$7<8<1.;=?;>?'9<2?>?<->$;>-':-;#<#$<$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$'#$'#%$#%$#%$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#%$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$'$&>&>&>&>&>(#$#$&>#$@&$;#@>#;#@#@#$#@#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$<#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$?(*#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$@#@&;$;6@?=@(6(;(;(;(@'@';@2<;=;?(;2@;'&'(+;'(';'(2?(&(?('+'?';@2'('(@'('@+'(&?;&@(='(&(&(&(@;@'(@;@'@'@'@(2()'()(')()()'('(;+;&'()@'@'@'@'@'@'@(')(@)@)('@)@'@'(@+'=-?=';(@()@'@'@'@'@'@'@'@(@)(@(@(@(@'@'@+('(;@()@'@'@'@'@'@'@(')(@()@)(@'@'(@+;=@'(@()@'@'@'@'@'@'@(')()(@)@)(@()@'@'(@+?'-@('@'@'@'@'@'@'@'@'@'@)()@)@)(@'@)@+-?=?@()('@'@'@'@'()@(@(@(@'@'(@+@;-?'();'@'@'@'@'@(')()@()@)(@)@'@'(@+@'@()'@'@'(')(@)@)('?@')-'(@+-?'@()@'@'@'@'@'@(@)(@(@)@+@);@'('(@='&(;+;@'@'@'@'@'@'('('@'@&@(@+@'@'?;?;?(?+-?(?(?(7878)'@'@()(;('(@(@?(?@?;?;@')()()()('+;')('(')')'('()()(')+)(?#@#@#@$;&$'@'@'@'@'@'@'@'@'@'@'@'@'@'@'@'@(;-@'?@#@$@6'?;'.'78@';,'@'@'(@'(;@'(@'@'@(@'()()()(;&;='(@+@-@;6;(2@+@'&'@'('('@'@'@()()@)()(@?@;+'@'@'@'@+-@?'()(@;')()(@()()()(@(+@+@;&;@(*(@()'()()()()'@+;?(?@()')()()('+'()()()()@;')()(@;+@'+'&;$@#@#;@(;()('('(')('@$&$&$&(@(#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$@#@$#$#$@#@$@#@#@#@#$#$@$%$%$%$@$#%>$>$@$#%>$@$#@>$#>@$@$#%>@.26;9:79:79;/02.;9:;5;<78;<;5;.2@2-&@-<78&-<78@&@=@(*(*(@?#?#?$#$#$?#?<#?#?#?#?#?$#$'$?$#<#$?<?$?-,#$,-?@<?<?<?<?<?<?<?<?<?<?7878?<?78?<?<?<?@?@-?-?<?<?<?<?78787878787878-?<78<7878787878<?<7878787878787878787878<7878<78<?<?<?@?@?#@$@#$#$#$#$#$#$#$#$&#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$?#$#$(#$@;-;$@$@$@'@&;@('@'@'@'@'@'@'@'@'@(;9:9:;9:;9:;6;6;9:;9:78787878;&;6;6;7;?;@?@?@?@?@.;?&',7878787878?78787878678?,()6&?,&';?@'@(>&'6';&'@'@'@?-?'?@'?@-?-?-?-?-?'?'@'&'@?@'&;'&;'+'@#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$'(*;(;&#$#$#$#$#$#$#$#$#$#$#$#$#$#$&(',(;@>&>#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$&$#$#$#$#$#$#$#$&>#$#$'#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$#$@#$#$#$@#$'&$'('('(')()?(@-?=?@';@)')(@;+@(';';'(+'(;'()@;'@()'()()();@&+@;'(&'+'@'()()(@'('()@+@;'&'?')()'('('('('('@'&;')();'&)(@'@'@'@'@'@$>&$&>@$')()();)(@+@'@'@'@34'@'@$@$@'('<'@'@'@'@'@'>@'87@'@'@'=?@(;78;@(;657878787878787878;78;5;@;6787878;<6<@;=;@'@'@2@;=;78;<;6;+;<;#7;8>5>$7<8<78;78;'&'&'@'@'@'@'@=<>?=@?<?@2?@'@'@'@'@'@'@'@;@-@?,-?-?@?@?@?(@'@'@(-@'-@',',@'(@'@;'@';,@#$'@+@#@$@'@'@;@'@'@'@'@'@'@'@'@'@;-'?-'@-@'@'@-'-@;'@;@'@-'-@-'(@(@('@'@'@(@(-@;@'-;'-@'?'(@-;@'@;'@-'@-'@;@-@'@#@$@-'(@+@-@'@(6@'@'-'@'(-;@'-@'@)()'(;@-+@()')()(;2;@2@'@+@('()(@+;')'@'(;'@()')()';(;)(+';';@-@'@')()()(;(@'@'@'@'@';@'()(@+@()@'@'@'@'@'@'@(')()@)@)@'@)@')@(@(@')()()(';+;@;('@')()()()(';'@+@')(@)()(;'(@')()()(;'@+@;@'()()()('@+@'@()()(@+-;?@')()(;@#$+-@'@'@'@'@')@)@()(')')(;@+@'@')(@()(';')@'('()'(;(@'()('()(;';@'@'@')(@()(';@+-@;'@(@)()()(@'@'@'(@(@(@('(@+@'@'@')@(@)()('@+@'();@'@-?=?@;'@,@;@'@'@2@'@'@'@+@;@'@(;@'(;?&;?@+@-@'@'@#$-;@'@(')@(&@&;&(@)@'@'@'@'@'@'@'@'@'@'@'@?(;2@?@?@?)(?)2(?(?(?@?(?@-@?@-@#$#$@$#$#@#@#@#@#@#$@$@$@$#$#@#@#@#@$#@#@#@#@#@$#$#$#$#$#$#$@#<$<$#<$<$#<$<$#<$<$#<$<$#$@+?(?(?(?(?;@(@(@(@(@(@(@(@'@(&@+@'?@'(+@=@'@-(@#$(&@+@;@-?-=-@-?-@'@'@'@'@'@'@'@'@'@'@'@'@'@'@'@'@'@'@'@'@'@'@'@'@'@'@'@'@'@'@'@'@'@<@?@?@?@?@?@?@-?@?@?@?@?@?@?>?@?@?@?@?@?@?@?@?@?@?@?@?@?@?@?@?@?@?@?@?@?@?@?@?@+@'@'@'@'@'@'@'@2@2@(@4@4@";

// src/core/fable_modules/fable-library-js.5.6.0/Char.js
function getCategoryFunc() {
  const offset = 35;
  const a1 = [...rangeDeltas].map((ch) => (ch.codePointAt(0) ?? 0) - offset);
  const a2 = [...categories].map((ch) => (ch.codePointAt(0) ?? 0) - offset);
  const codepoints = new Uint32Array(a1);
  const categories2 = new Uint8Array(a2);
  for (let i = 1; i < codepoints.length; ++i) {
    codepoints[i] += codepoints[i - 1];
  }
  return (cp) => {
    let hi = codepoints.length;
    let lo = 0;
    while (hi - lo > 1) {
      const mid = Math.floor((hi + lo) / 2);
      const test = codepoints[mid];
      if (cp < test) {
        hi = mid;
      } else if (cp === test) {
        hi = lo = mid;
        break;
      } else if (test < cp) {
        lo = mid;
      }
    }
    return categories2[lo];
  };
}
var UnicodeCategory = {
  UppercaseLetter: 0,
  LowercaseLetter: 1,
  TitlecaseLetter: 2,
  ModifierLetter: 3,
  OtherLetter: 4,
  NonSpacingMark: 5,
  SpacingCombiningMark: 6,
  EnclosingMark: 7,
  DecimalDigitNumber: 8,
  LetterNumber: 9,
  OtherNumber: 10,
  SpaceSeparator: 11,
  LineSeparator: 12,
  ParagraphSeparator: 13,
  Control: 14,
  Format: 15,
  Surrogate: 16,
  PrivateUse: 17,
  ConnectorPunctuation: 18,
  DashPunctuation: 19,
  OpenPunctuation: 20,
  ClosePunctuation: 21,
  InitialQuotePunctuation: 22,
  FinalQuotePunctuation: 23,
  OtherPunctuation: 24,
  MathSymbol: 25,
  CurrencySymbol: 26,
  ModifierSymbol: 27,
  OtherSymbol: 28,
  OtherNotAssigned: 29
};
var isControlMask = 1 << UnicodeCategory.Control;
var isDigitMask = 1 << UnicodeCategory.DecimalDigitNumber;
var isLetterMask = 0 | 1 << UnicodeCategory.UppercaseLetter | 1 << UnicodeCategory.LowercaseLetter | 1 << UnicodeCategory.TitlecaseLetter | 1 << UnicodeCategory.ModifierLetter | 1 << UnicodeCategory.OtherLetter;
var isLetterOrDigitMask = isLetterMask | isDigitMask;
var isUpperMask = 1 << UnicodeCategory.UppercaseLetter;
var isLowerMask = 1 << UnicodeCategory.LowercaseLetter;
var isNumberMask = 0 | 1 << UnicodeCategory.DecimalDigitNumber | 1 << UnicodeCategory.LetterNumber | 1 << UnicodeCategory.OtherNumber;
var isPunctuationMask = 0 | 1 << UnicodeCategory.ConnectorPunctuation | 1 << UnicodeCategory.DashPunctuation | 1 << UnicodeCategory.OpenPunctuation | 1 << UnicodeCategory.ClosePunctuation | 1 << UnicodeCategory.InitialQuotePunctuation | 1 << UnicodeCategory.FinalQuotePunctuation | 1 << UnicodeCategory.OtherPunctuation;
var isSeparatorMask = 0 | 1 << UnicodeCategory.SpaceSeparator | 1 << UnicodeCategory.LineSeparator | 1 << UnicodeCategory.ParagraphSeparator;
var isSymbolMask = 0 | 1 << UnicodeCategory.MathSymbol | 1 << UnicodeCategory.CurrencySymbol | 1 << UnicodeCategory.ModifierSymbol | 1 << UnicodeCategory.OtherSymbol;
var isWhiteSpaceMask = 0 | 1 << UnicodeCategory.SpaceSeparator | 1 << UnicodeCategory.LineSeparator | 1 << UnicodeCategory.ParagraphSeparator;
var unicodeCategoryFunc = getCategoryFunc();
function charCodeAt(s, index) {
  if (index >= 0 && index < s.length) {
    return s.charCodeAt(index);
  } else {
    throw new Exception("Index out of range.");
  }
}
var isLetter = (s) => isLetter2(s, 0);
var isLetterOrDigit = (s) => isLetterOrDigit2(s, 0);
function getUnicodeCategory2(s, index) {
  const cp = charCodeAt(s, index);
  return unicodeCategoryFunc(cp);
}
function isLetter2(s, index) {
  const test = 1 << getUnicodeCategory2(s, index);
  return (test & isLetterMask) !== 0;
}
function isLetterOrDigit2(s, index) {
  const test = 1 << getUnicodeCategory2(s, index);
  return (test & isLetterOrDigitMask) !== 0;
}

// src/core/Tokenizer.js
var Token = class extends Union {
  constructor(tag, fields) {
    super();
    this.tag = tag;
    this.fields = fields;
  }
  cases() {
    return ["TIdent", "TTrue", "TFalse", "TNot", "TAnd", "TOr", "TXor", "TImplies", "TIff", "TLParen", "TRParen"];
  }
};
function isIdentChar(c) {
  if (isLetterOrDigit(c)) {
    return true;
  } else {
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
    case "true":
      return new Token(1, []);
    case "false":
      return new Token(2, []);
    default:
      return new Token(0, [word]);
  }
}
function tokenize(input) {
  const loop = (i_mut, acc_mut) => {
    loop:
      while (true) {
        const i = i_mut, acc = acc_mut;
        if (i >= input.length) {
          return new FSharpResult$2(0, [reverse(acc)]);
        } else {
          const c = input[i];
          let matchResult, other;
          switch (c) {
            case "	":
            case " ": {
              matchResult = 0;
              break;
            }
            case "!":
            case "~":
            case "\xAC": {
              matchResult = 5;
              break;
            }
            case "&":
            case "\u2227": {
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
            case "\u2228": {
              matchResult = 4;
              break;
            }
            case "\u2192": {
              matchResult = 7;
              break;
            }
            case "\u2194": {
              matchResult = 8;
              break;
            }
            case "\u2295": {
              matchResult = 6;
              break;
            }
            case "\u22A4": {
              matchResult = 9;
              break;
            }
            case "\u22A5": {
              matchResult = 10;
              break;
            }
            case "-": {
              if (i + 1 < input.length && input[i + 1] === ">") {
                matchResult = 11;
              } else if (isLetter(c)) {
                matchResult = 13;
              } else {
                matchResult = 14;
                other = c;
              }
              break;
            }
            case "<": {
              if (i + 2 < input.length && input[i + 1] === "-" && input[i + 2] === ">") {
                matchResult = 12;
              } else if (isLetter(c)) {
                matchResult = 13;
              } else {
                matchResult = 14;
                other = c;
              }
              break;
            }
            default:
              if (isLetter(c)) {
                matchResult = 13;
              } else {
                matchResult = 14;
                other = c;
              }
          }
          switch (matchResult) {
            case 0: {
              i_mut = i + 1;
              acc_mut = acc;
              continue loop;
            }
            case 1: {
              i_mut = i + 1;
              acc_mut = cons(new Token(9, []), acc);
              continue loop;
            }
            case 2: {
              i_mut = i + 1;
              acc_mut = cons(new Token(10, []), acc);
              continue loop;
            }
            case 3: {
              i_mut = i + 1;
              acc_mut = cons(new Token(4, []), acc);
              continue loop;
            }
            case 4: {
              i_mut = i + 1;
              acc_mut = cons(new Token(5, []), acc);
              continue loop;
            }
            case 5: {
              i_mut = i + 1;
              acc_mut = cons(new Token(3, []), acc);
              continue loop;
            }
            case 6: {
              i_mut = i + 1;
              acc_mut = cons(new Token(6, []), acc);
              continue loop;
            }
            case 7: {
              i_mut = i + 1;
              acc_mut = cons(new Token(7, []), acc);
              continue loop;
            }
            case 8: {
              i_mut = i + 1;
              acc_mut = cons(new Token(8, []), acc);
              continue loop;
            }
            case 9: {
              i_mut = i + 1;
              acc_mut = cons(new Token(1, []), acc);
              continue loop;
            }
            case 10: {
              i_mut = i + 1;
              acc_mut = cons(new Token(2, []), acc);
              continue loop;
            }
            case 11: {
              i_mut = i + 2;
              acc_mut = cons(new Token(7, []), acc);
              continue loop;
            }
            case 12: {
              i_mut = i + 3;
              acc_mut = cons(new Token(8, []), acc);
              continue loop;
            }
            case 13: {
              const start = i | 0;
              let j = i;
              while (j < input.length && isIdentChar(input[j])) {
                j = j + 1 | 0;
              }
              const word = substring(input, start, j - start);
              i_mut = j;
              acc_mut = cons(wordToToken(word), acc);
              continue loop;
            }
            default:
              return new FSharpResult$2(1, [toText(printf("Unexpected character '%c' in formula"))(other)]);
          }
        }
        break;
      }
  };
  return loop(0, empty());
}

// src/core/Parser.js
function parseIff(tokens) {
  return Result_Bind((tupledArg) => {
    const loop = (l, toks) => {
      let matchResult, more;
      if (!isEmpty(toks)) {
        if (head(toks).tag === 8) {
          matchResult = 0;
          more = tail(toks);
        } else {
          matchResult = 1;
        }
      } else {
        matchResult = 1;
      }
      switch (matchResult) {
        case 0:
          return Result_Bind((tupledArg_1) => loop(new Formula(7, [l, tupledArg_1[0]]), tupledArg_1[1]), parseImplies(more));
        default:
          return new FSharpResult$2(0, [[l, toks]]);
      }
    };
    return loop(tupledArg[0], tupledArg[1]);
  }, parseImplies(tokens));
}
function parseImplies(tokens) {
  return Result_Bind((tupledArg) => {
    const left = tupledArg[0];
    const rest = tupledArg[1];
    let matchResult, more;
    if (!isEmpty(rest)) {
      if (head(rest).tag === 7) {
        matchResult = 0;
        more = tail(rest);
      } else {
        matchResult = 1;
      }
    } else {
      matchResult = 1;
    }
    switch (matchResult) {
      case 0:
        return Result_Map((tupledArg_1) => [new Formula(6, [left, tupledArg_1[0]]), tupledArg_1[1]], parseImplies(more));
      default:
        return new FSharpResult$2(0, [[left, rest]]);
    }
  }, parseXor(tokens));
}
function parseXor(tokens) {
  return Result_Bind((tupledArg) => {
    const loop = (l, toks) => {
      let matchResult, more;
      if (!isEmpty(toks)) {
        if (head(toks).tag === 6) {
          matchResult = 0;
          more = tail(toks);
        } else {
          matchResult = 1;
        }
      } else {
        matchResult = 1;
      }
      switch (matchResult) {
        case 0:
          return Result_Bind((tupledArg_1) => loop(new Formula(5, [l, tupledArg_1[0]]), tupledArg_1[1]), parseOr(more));
        default:
          return new FSharpResult$2(0, [[l, toks]]);
      }
    };
    return loop(tupledArg[0], tupledArg[1]);
  }, parseOr(tokens));
}
function parseOr(tokens) {
  return Result_Bind((tupledArg) => {
    const loop = (l, toks) => {
      let matchResult, more;
      if (!isEmpty(toks)) {
        if (head(toks).tag === 5) {
          matchResult = 0;
          more = tail(toks);
        } else {
          matchResult = 1;
        }
      } else {
        matchResult = 1;
      }
      switch (matchResult) {
        case 0:
          return Result_Bind((tupledArg_1) => loop(new Formula(4, [l, tupledArg_1[0]]), tupledArg_1[1]), parseAnd(more));
        default:
          return new FSharpResult$2(0, [[l, toks]]);
      }
    };
    return loop(tupledArg[0], tupledArg[1]);
  }, parseAnd(tokens));
}
function parseAnd(tokens) {
  return Result_Bind((tupledArg) => {
    const loop = (l, toks) => {
      let matchResult, more;
      if (!isEmpty(toks)) {
        if (head(toks).tag === 4) {
          matchResult = 0;
          more = tail(toks);
        } else {
          matchResult = 1;
        }
      } else {
        matchResult = 1;
      }
      switch (matchResult) {
        case 0:
          return Result_Bind((tupledArg_1) => loop(new Formula(3, [l, tupledArg_1[0]]), tupledArg_1[1]), parseUnary(more));
        default:
          return new FSharpResult$2(0, [[l, toks]]);
      }
    };
    return loop(tupledArg[0], tupledArg[1]);
  }, parseUnary(tokens));
}
function parseUnary(tokens) {
  let matchResult, more;
  if (!isEmpty(tokens)) {
    if (head(tokens).tag === 3) {
      matchResult = 0;
      more = tail(tokens);
    } else {
      matchResult = 1;
    }
  } else {
    matchResult = 1;
  }
  switch (matchResult) {
    case 0:
      return Result_Map((tupledArg) => [new Formula(2, [tupledArg[0]]), tupledArg[1]], parseUnary(more));
    default:
      return parseAtom(tokens);
  }
}
function parseAtom(tokens) {
  if (isEmpty(tokens)) {
    return new FSharpResult$2(1, ["Unexpected end of formula"]);
  } else {
    switch (head(tokens).tag) {
      case 0:
        return new FSharpResult$2(0, [[new Formula(0, [head(tokens).fields[0]]), tail(tokens)]]);
      case 1:
        return new FSharpResult$2(0, [[new Formula(1, [true]), tail(tokens)]]);
      case 2:
        return new FSharpResult$2(0, [[new Formula(1, [false]), tail(tokens)]]);
      case 9:
        return Result_Bind((tupledArg) => {
          const rest$0027 = tupledArg[1];
          let matchResult, rest$0027$0027;
          if (!isEmpty(rest$0027)) {
            if (head(rest$0027).tag === 10) {
              matchResult = 0;
              rest$0027$0027 = tail(rest$0027);
            } else {
              matchResult = 1;
            }
          } else {
            matchResult = 1;
          }
          switch (matchResult) {
            case 0:
              return new FSharpResult$2(0, [[tupledArg[0], rest$0027$0027]]);
            default:
              return new FSharpResult$2(1, ["Expected a closing ')'"]);
          }
        }, parseIff(tail(tokens)));
      default:
        return new FSharpResult$2(1, ["Expected a proposition, a constant, or '('"]);
    }
  }
}
function parseFormula(text) {
  return Result_Bind((tokens) => Result_Bind((tupledArg) => {
    if (isEmpty(tupledArg[1])) {
      return new FSharpResult$2(0, [tupledArg[0]]);
    } else {
      return new FSharpResult$2(1, ["Unexpected leftover input after the formula"]);
    }
  }, parseIff(tokens)), tokenize(text));
}
function stripComment(line) {
  const matchValue = line.indexOf("//") | 0;
  if (matchValue === -1) {
    return line;
  } else {
    return substring(line, 0, matchValue);
  }
}
function isSingleIdentifier(s) {
  if (s.length > 0 && isLetter(s[0])) {
    return forAll2((c) => {
      if (isLetterOrDigit(c)) {
        return true;
      } else {
        return c === "_";
      }
    }, s.split(""));
  } else {
    return false;
  }
}
function splitOnKeyword(s, kw) {
  const marker = " " + kw + " ";
  const matchValue = s.indexOf(marker) | 0;
  if (matchValue === -1) {
    return void 0;
  } else {
    const idx = matchValue | 0;
    return [substring(s, 0, idx).trim(), substring(s, idx + marker.length).trim()];
  }
}
function parseLine(raw) {
  const line = stripComment(raw).trim();
  if (line === "") {
    return new FSharpResult$2(0, [void 0]);
  } else if (line.startsWith("#")) {
    return new FSharpResult$2(0, [new Statement(0, [line.length - trimStart(line, "#").length, trimStart(line, "#").trim()])]);
  } else if (line.startsWith("prop ")) {
    const rest = substring(line, 5);
    const matchValue = rest.indexOf(":") | 0;
    if (matchValue === -1) {
      return new FSharpResult$2(1, ["a `prop` needs a ':'  \u2014 e.g.  prop p : It is raining"]);
    } else {
      const idx = matchValue | 0;
      return new FSharpResult$2(0, [new Statement(2, [substring(rest, 0, idx).trim(), substring(rest, idx + 1).trim()])]);
    }
  } else if (line.startsWith("claim ")) {
    const rest_1 = substring(line, 6);
    const matchValue_1 = rest_1.indexOf(":") | 0;
    if (matchValue_1 === -1) {
      return new FSharpResult$2(1, ["a `claim` needs a ':'  \u2014 e.g.  claim C1 : p -> q"]);
    } else {
      const idx_1 = matchValue_1 | 0;
      const name_1 = substring(rest_1, 0, idx_1).trim();
      return Result_Map((f) => new Statement(3, [name_1, f]), parseFormula(substring(rest_1, idx_1 + 1).trim()));
    }
  } else if (line.startsWith("table ")) {
    const target = substring(line, 6).trim();
    if (isSingleIdentifier(target)) {
      return new FSharpResult$2(0, [new Statement(4, [new TableTarget(0, [target])])]);
    } else {
      return Result_Map((f_1) => new Statement(4, [new TableTarget(1, [f_1])]), parseFormula(target));
    }
  } else if (line.startsWith("check ")) {
    const rest_2 = substring(line, 6).trim();
    const matchValue_2 = splitOnKeyword(rest_2, "equivalent");
    if (matchValue_2 == null) {
      return Result_Map((f_2) => new Statement(5, [new CheckKind(0, [f_2])]), parseFormula(rest_2));
    } else {
      const r = matchValue_2[1];
      return Result_Bind((lf) => Result_Map((rf) => new Statement(5, [new CheckKind(1, [lf, rf])]), parseFormula(r)), parseFormula(matchValue_2[0]));
    }
  } else {
    return new FSharpResult$2(0, [new Statement(1, [line])]);
  }
}

// src/core/Api.js
var BlockView = class extends Record {
  constructor(kind, level, title, name, gloss, formula, verdict, atoms2, rows, results, line) {
    super();
    this.kind = kind;
    this.level = level | 0;
    this.title = title;
    this.name = name;
    this.gloss = gloss;
    this.formula = formula;
    this.verdict = verdict;
    this.atoms = atoms2;
    this.rows = rows;
    this.results = results;
    this.line = line | 0;
  }
};
var empty2 = new BlockView("", 0, "", "", "", "", "", [], [], [], 0);
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
  const atoms2 = toArray(t.Atoms);
  const rows = toArray(map2((tupledArg) => toArray(map2((a) => FSharpMap__get_Item(tupledArg[0], a), t.Atoms)), t.Rows));
  const results = toArray(map2((tuple) => tuple[1], t.Rows));
  return new BlockView("table", empty2.level, empty2.title, empty2.name, empty2.gloss, formula, verdictName(t.Verdict), atoms2, rows, results, empty2.line);
}
function toBlock(defs, st) {
  switch (st.tag) {
    case 1:
      return new BlockView("prose", empty2.level, st.fields[0], empty2.name, empty2.gloss, empty2.formula, empty2.verdict, empty2.atoms, empty2.rows, empty2.results, empty2.line);
    case 2:
      return new BlockView("prop", empty2.level, empty2.title, st.fields[0], st.fields[1], empty2.formula, empty2.verdict, empty2.atoms, empty2.rows, empty2.results, empty2.line);
    case 3:
      return new BlockView("claim", empty2.level, empty2.title, st.fields[0], empty2.gloss, toUnicode(st.fields[1]), empty2.verdict, empty2.atoms, empty2.rows, empty2.results, empty2.line);
    case 4:
      return tableBlock(st.fields[0].tag === 0 ? resolve(defs, new Formula(0, [st.fields[0].fields[0]])) : resolve(defs, st.fields[0].fields[0]));
    case 5:
      if (st.fields[0].tag === 1) {
        const matchValue = resolve(defs, st.fields[0].fields[0]);
        const rb = resolve(defs, st.fields[0].fields[1]);
        const ra = matchValue;
        return new BlockView("check", empty2.level, empty2.title, empty2.name, empty2.gloss, toUnicode(ra) + " \u2261 " + toUnicode(rb), equivalent(ra, rb) ? "equivalent" : "not-equivalent", empty2.atoms, empty2.rows, empty2.results, empty2.line);
      } else {
        const bind$0040 = tableBlock(resolve(defs, st.fields[0].fields[0]));
        return new BlockView("check", bind$0040.level, bind$0040.title, bind$0040.name, bind$0040.gloss, bind$0040.formula, bind$0040.verdict, bind$0040.atoms, bind$0040.rows, bind$0040.results, bind$0040.line);
      }
    default:
      return new BlockView("heading", st.fields[0], st.fields[1], empty2.name, empty2.gloss, empty2.formula, empty2.verdict, empty2.atoms, empty2.rows, empty2.results, empty2.line);
  }
}
function analyze(source) {
  const parsed = ofArray(mapIndexed((i, line) => [i + 1, parseLine(line)], split(replace(source, "\r\n", "\n"), ["\n"], void 0, 0)));
  const defs = ofList(choose((tupledArg) => {
    const r = tupledArg[1];
    let matchResult, f, n;
    if (r.tag === 0) {
      if (r.fields[0] != null) {
        if (r.fields[0].tag === 3) {
          matchResult = 0;
          f = r.fields[0].fields[1];
          n = r.fields[0].fields[0];
        } else {
          matchResult = 1;
        }
      } else {
        matchResult = 1;
      }
    } else {
      matchResult = 1;
    }
    switch (matchResult) {
      case 0:
        return [n, f];
      default:
        return void 0;
    }
  }, parsed), {
    Compare: (x, y) => comparePrimitives(x, y) | 0
  });
  return toArray(choose((tupledArg_1) => {
    const r_1 = tupledArg_1[1];
    if (r_1.tag === 1) {
      return new BlockView("error", empty2.level, r_1.fields[0], empty2.name, empty2.gloss, empty2.formula, empty2.verdict, empty2.atoms, empty2.rows, empty2.results, tupledArg_1[0]);
    } else if (r_1.fields[0] != null) {
      return toBlock(defs, r_1.fields[0]);
    } else {
      return void 0;
    }
  }, parsed));
}

// src/core-bridge.ts
var analyze2 = analyze;

// src/render.ts
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function verdictBadge(verdict) {
  const label = {
    tautology: "tautology",
    contradiction: "contradiction",
    contingent: "contingent",
    equivalent: "equivalent",
    "not-equivalent": "not equivalent"
  };
  const text = label[verdict] ?? verdict;
  return `<span class="badge badge-${verdict}">${escapeHtml(text)}</span>`;
}
function tf(value2) {
  return `<td class="${value2 ? "t" : "f"}">${value2 ? "T" : "F"}</td>`;
}
function renderTable(block) {
  const head2 = block.atoms.map((a) => `<th>${escapeHtml(a)}</th>`).join("") + `<th class="result">${escapeHtml(block.formula)}</th>`;
  const body = block.rows.map((row, i) => {
    const cells = row.map((v) => tf(v)).join("") + tf(block.results[i]);
    return `<tr>${cells}</tr>`;
  }).join("");
  return `<table class="truth"><thead><tr>${head2}</tr></thead><tbody>${body}</tbody></table>`;
}
function renderBlock(block) {
  switch (block.kind) {
    case "heading": {
      const level = Math.min(Math.max(block.level, 1), 6);
      return `<h${level}>${escapeHtml(block.title)}</h${level}>`;
    }
    case "prose":
      return `<p class="prose">${escapeHtml(block.title)}</p>`;
    case "prop":
      return `<div class="prop"><span class="atom">${escapeHtml(block.name)}</span><span class="colon">:</span><span class="gloss">${escapeHtml(block.gloss)}</span></div>`;
    case "claim":
      return `<div class="claim"><span class="name">${escapeHtml(block.name)}</span><span class="formula">${escapeHtml(block.formula)}</span></div>`;
    case "table":
      return `<figure class="statement"><figcaption>${verdictBadge(block.verdict)}</figcaption>${renderTable(block)}</figure>`;
    case "check":
      if (block.atoms.length === 0) {
        return `<div class="check"><span class="formula">${escapeHtml(block.formula)}</span>${verdictBadge(block.verdict)}</div>`;
      }
      return `<figure class="statement"><figcaption><span class="check-label">check</span> ${verdictBadge(block.verdict)}</figcaption>${renderTable(block)}</figure>`;
    case "error":
      return `<div class="error"><span class="error-line">line ${block.line}</span> ${escapeHtml(block.title)}</div>`;
    default:
      return "";
  }
}
function renderDocument(blocks) {
  if (blocks.length === 0) {
    return `<p class="empty">Nothing to show yet \u2014 write a <code>prop</code>, <code>claim</code>, or <code>table</code>.</p>`;
  }
  return blocks.map(renderBlock).join("\n");
}

// src/extension.ts
var STYLE = `
  :root { color-scheme: light dark; }
  body {
    font-family: var(--vscode-font-family);
    color: var(--vscode-foreground);
    padding: 1rem 1.5rem;
    line-height: 1.5;
  }
  h1, h2, h3, h4, h5, h6 { border-bottom: 1px solid var(--vscode-widget-border, #8884); padding-bottom: .2em; }
  .prose { opacity: .85; }
  .prop, .claim { font-family: var(--vscode-editor-font-family); margin: .3rem 0; }
  .prop .atom, .claim .name { font-weight: 600; color: var(--vscode-symbolIcon-variableForeground, #4ec9b0); }
  .prop .colon { opacity: .5; margin: 0 .5em; }
  .prop .gloss { font-family: var(--vscode-font-family); opacity: .85; }
  .claim .formula { margin-left: .75em; }
  .check { font-family: var(--vscode-editor-font-family); margin: .5rem 0; display: flex; align-items: center; gap: .75em; }
  figure.statement { margin: .8rem 0; }
  figure.statement figcaption { margin-bottom: .35rem; display: flex; align-items: center; gap: .5em; }
  .check-label { text-transform: uppercase; font-size: .7rem; letter-spacing: .08em; opacity: .6; }
  table.truth { border-collapse: collapse; font-family: var(--vscode-editor-font-family); }
  table.truth th, table.truth td { border: 1px solid var(--vscode-widget-border, #8884); padding: .2em .7em; text-align: center; }
  table.truth th.result, table.truth td.result { font-weight: 600; }
  table.truth thead th { background: var(--vscode-editor-inactiveSelectionBackground, #8882); }
  table.truth td.t { color: var(--vscode-testing-iconPassed, #3fb950); }
  table.truth td.f { color: var(--vscode-testing-iconFailed, #f85149); opacity: .85; }
  .badge { font-size: .72rem; padding: .1em .6em; border-radius: 999px; text-transform: uppercase; letter-spacing: .05em; }
  .badge-tautology, .badge-equivalent { background: var(--vscode-testing-iconPassed, #3fb950); color: #041006; }
  .badge-contradiction, .badge-not-equivalent { background: var(--vscode-testing-iconFailed, #f85149); color: #100404; }
  .badge-contingent { background: var(--vscode-editorWarning-foreground, #cca700); color: #100c02; }
  .error { color: var(--vscode-errorForeground, #f85149); font-family: var(--vscode-editor-font-family); margin: .3rem 0; }
  .error-line { opacity: .6; margin-right: .5em; }
  .empty { opacity: .6; }
  code { background: var(--vscode-textCodeBlock-background, #8882); padding: 0 .3em; border-radius: 3px; }
`;
function wrapHtml(body) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';" />
  <style>${STYLE}</style>
</head>
<body>${body}</body>
</html>`;
}
function activate(context) {
  let panel;
  let trackedUri;
  let debounce;
  const render = () => {
    if (!panel || !trackedUri) return;
    const doc = vscode.workspace.textDocuments.find(
      (d) => d.uri.toString() === trackedUri.toString()
    );
    if (!doc) return;
    try {
      panel.webview.html = wrapHtml(renderDocument(analyze2(doc.getText())));
    } catch (err) {
      panel.webview.html = wrapHtml(
        `<div class="error">Preview failed: ${String(err)}</div>`
      );
    }
  };
  const openPreview = () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== "meticulous") {
      vscode.window.showInformationMessage("Open a .met file to preview it.");
      return;
    }
    trackedUri = editor.document.uri;
    if (!panel) {
      panel = vscode.window.createWebviewPanel(
        "meticulousPreview",
        "meticulous preview",
        { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
        { enableScripts: false }
      );
      panel.onDidDispose(
        () => {
          panel = void 0;
          trackedUri = void 0;
        },
        null,
        context.subscriptions
      );
    }
    panel.title = `Preview ${path.basename(editor.document.fileName)}`;
    render();
  };
  context.subscriptions.push(
    vscode.commands.registerCommand("meticulous.showPreview", openPreview),
    // Live update: re-render (debounced) whenever the tracked document changes.
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (trackedUri && e.document.uri.toString() === trackedUri.toString()) {
        if (debounce) clearTimeout(debounce);
        debounce = setTimeout(render, 150);
      }
    })
  );
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
