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
var vscode4 = __toESM(require("vscode"));
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
function padWithZeros(i, length3) {
  return i.toString(10).padStart(length3, "0");
}
function dateOffset(date) {
  const date1 = date;
  return typeof date1.offset === "number" ? date1.offset : date.kind === DateTimeKind.Utc ? 0 : date.getTimezoneOffset() * -6e4;
}
function int32ToString(i, radix) {
  i = i < 0 && radix != null && radix !== 10 ? 4294967295 + i + 1 : i;
  return i.toString(radix);
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
function physicalHash(x) {
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
    default:
      return numberHash(ObjectRef.id(x));
  }
}
function identityHash(x) {
  if (isHashable(x)) {
    return x.GetHashCode();
  } else {
    return physicalHash(x);
  }
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
function safeHash(x) {
  return identityHash(x);
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
function clear(col) {
  if (isArrayLike(col)) {
    col.splice(0);
  } else {
    col.clear();
  }
}
var curried = /* @__PURE__ */ new WeakMap();
function curry2(f) {
  return curried.get(f) ?? ((a1) => (a2) => f(a1, a2));
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
var FSharpRef = class {
  get contents() {
    return this.getter();
  }
  set contents(v) {
    this.setter(v);
  }
  constructor(contentsOrGetter, setter) {
    if (typeof setter === "function") {
      this.getter = contentsOrGetter;
      this.setter = setter;
    } else {
      this.getter = () => contentsOrGetter;
      this.setter = (v) => {
        contentsOrGetter = v;
      };
    }
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
function toArray(opt) {
  return opt == null ? [] : [value(opt)];
}
function defaultArg(opt, defaultValue) {
  return opt != null ? value(opt) : defaultValue;
}
function map(mapping, opt) {
  return opt != null ? some(mapping(value(opt))) : void 0;
}
function bind(binder, opt) {
  return opt != null ? binder(value(opt)) : void 0;
}

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
  const trim2 = (options & 2) === 2;
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
      const candidate = trim2 ? str.substring(i).trim() : str.substring(i);
      if (!removeEmpty || candidate.length > 0) {
        splits.push(candidate);
      }
      findSplits = false;
    } else {
      const candidate = trim2 ? str.substring(i, match.index).trim() : str.substring(i, match.index);
      if (!removeEmpty || candidate.length > 0) {
        if (count != null && splits.length + 1 === count) {
          splits.push(trim2 ? str.substring(i).trim() : str.substring(i));
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
function trim(str, ...chars) {
  if (chars.length === 0) {
    return str.trim();
  }
  const pattern = "[" + escape(chars.join("")) + "]+";
  return str.replace(new RegExp("^" + pattern), "").replace(new RegExp(pattern + "$"), "");
}
function trimStart(str, ...chars) {
  return chars.length === 0 ? str.trimStart() : str.replace(new RegExp("^[" + escape(chars.join("")) + "]+"), "");
}
function trimEnd(str, ...chars) {
  return chars.length === 0 ? str.trimEnd() : str.replace(new RegExp("[" + escape(chars.join("")) + "]+$"), "");
}
function substring(str, startIndex, length3) {
  if (startIndex + (length3 || 0) > str.length) {
    throw new Exception("Invalid startIndex and/or length");
  }
  return length3 != null ? str.substr(startIndex, length3) : str.substr(startIndex);
}

// src/core/fable_modules/fable-library-js.5.6.0/Global.js
var SR_indexOutOfBounds = "The index was outside the range of elements in the collection.";
var SR_inputWasEmpty = "Collection was empty.";
var SR_keyNotFoundAlt = "An index satisfying the predicate was not found in the collection.";
var SR_ArgumentNull_Generic = "Value cannot be null.";
var SR_Arg_ParamName_Name = " (Parameter '";
var SR_Arg_KeyNotFound = "The given key was not present in the dictionary.";

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

// src/core/fable_modules/fable-library-js.5.6.0/Choice.js
var FSharpChoice$2 = class extends Union {
  constructor(tag, fields) {
    super();
    this.tag = tag;
    this.fields = fields;
  }
  cases() {
    return ["Choice1Of2", "Choice2Of2"];
  }
};

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

// src/core/fable_modules/fable-library-js.5.6.0/Double.js
function max(x, y) {
  return x > y ? x : y;
}
function min(x, y) {
  return x < y ? x : y;
}

// src/core/fable_modules/fable-library-js.5.6.0/Array.js
function fill(target, targetIndex, count, value2) {
  const start = targetIndex | 0;
  return target.fill(value2, start, start + count);
}
function map2(f, source, cons2) {
  const len = source.length | 0;
  const target = Helpers_allocateArrayFromCons(cons2, len);
  for (let i = 0; i <= len - 1; i++) {
    setItem(target, i, f(item(i, source)));
  }
  return target;
}
function singleton(value2, cons2) {
  const ar = Helpers_allocateArrayFromCons(cons2, 1);
  setItem(ar, 0, value2);
  return ar;
}
function initialize(count, initializer, cons2) {
  if (count < 0) {
    throw new Exception("The input must be non-negative (Parameter 'count')");
  }
  const result = Helpers_allocateArrayFromCons(cons2, count);
  for (let i = 0; i <= count - 1; i++) {
    setItem(result, i, initializer(i));
  }
  return result;
}
function fold(folder, state, array) {
  const folder_1 = folder;
  return array.reduce(folder_1, state);
}
function tryHead(array) {
  if (array.length === 0) {
    return void 0;
  } else {
    return some(item(0, array));
  }
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

// src/core/fable_modules/fable-library-js.5.6.0/Seq.js
var SR_enumerationAlreadyFinished = "Enumeration already finished.";
var SR_enumerationNotStarted = "Enumeration has not started. Call MoveNext.";
var SR_keyNotFoundAlt2 = "An index satisfying the predicate was not found in the collection.";
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
function Enumerator_concat(sources) {
  let outerOpt = void 0;
  let innerOpt = void 0;
  let started = false;
  let finished = false;
  let curr = void 0;
  const finish = () => {
    finished = true;
    if (innerOpt != null) {
      const inner = value(innerOpt);
      try {
        disposeSafe(inner);
      } finally {
        innerOpt = void 0;
      }
    }
    if (outerOpt != null) {
      const outer = value(outerOpt);
      try {
        disposeSafe(outer);
      } finally {
        outerOpt = void 0;
      }
    }
  };
  return Enumerator_FromFunctions$1_$ctor_58C54629(() => {
    if (!started) {
      Enumerator_notStarted();
    } else if (finished) {
      Enumerator_alreadyFinished();
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
    if (finished) {
      return false;
    } else {
      let res = void 0;
      while (res == null) {
        let copyOfStruct = void 0;
        const outerOpt_1 = outerOpt;
        const innerOpt_1 = innerOpt;
        if (outerOpt_1 != null) {
          if (innerOpt_1 != null) {
            const inner_1 = value(innerOpt_1);
            if (inner_1["System.Collections.IEnumerator.MoveNext"]()) {
              curr = some(inner_1["System.Collections.Generic.IEnumerator`1.get_Current"]());
              res = true;
            } else {
              try {
                disposeSafe(inner_1);
              } finally {
                innerOpt = void 0;
              }
            }
          } else {
            const outer_1 = value(outerOpt_1);
            if (outer_1["System.Collections.IEnumerator.MoveNext"]()) {
              const ie = outer_1["System.Collections.Generic.IEnumerator`1.get_Current"]();
              innerOpt = (copyOfStruct = ie, getEnumerator(copyOfStruct));
            } else {
              finish();
              res = false;
            }
          }
        } else {
          outerOpt = getEnumerator(sources);
        }
      }
      return value(res);
    }
  }, () => {
    if (!finished) {
      finish();
    }
  });
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
function indexNotFound() {
  throw KeyNotFoundException_$ctor_Z721C83C5(SR_keyNotFoundAlt2);
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
function concat(sources) {
  return mkSeq(() => Enumerator_concat(sources));
}
function unfold(generator, state) {
  return mkSeq(() => Enumerator_unfold(generator, state));
}
function empty() {
  return delay(() => new Array(0));
}
function singleton2(x) {
  return delay(() => singleton(x));
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
function choose(chooser, xs) {
  return generate(() => ofSeq2(xs), (e) => {
    let curr = void 0;
    while (curr == null && e["System.Collections.IEnumerator.MoveNext"]()) {
      curr = chooser(e["System.Collections.Generic.IEnumerator`1.get_Current"]());
    }
    return curr;
  }, (e_1) => {
    disposeSafe(e_1);
  });
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
function filter(f, xs) {
  return choose((x) => {
    if (f(x)) {
      return some(x);
    } else {
      return void 0;
    }
  }, xs);
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
function tryFindIndex(predicate, xs) {
  const e = ofSeq2(xs);
  try {
    const loop = (i_mut) => {
      loop: while (true) {
        const i = i_mut;
        if (e["System.Collections.IEnumerator.MoveNext"]()) {
          if (predicate(e["System.Collections.Generic.IEnumerator`1.get_Current"]())) {
            return i;
          } else {
            i_mut = i + 1;
            continue loop;
          }
        } else {
          return void 0;
        }
        break;
      }
    };
    return loop(0);
  } finally {
    disposeSafe(e);
  }
}
function findIndex(predicate, xs) {
  const matchValue = tryFindIndex(predicate, xs);
  if (matchValue == null) {
    indexNotFound();
    return -1;
  } else {
    return value(matchValue) | 0;
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
function forAll(predicate, xs) {
  return !exists((x) => !predicate(x), xs);
}
function iterate(action, xs) {
  fold2((unitVar, x) => {
    action(x);
  }, void 0, xs);
}
function iterateIndexed(action, xs) {
  fold2((i, x) => {
    action(i, x);
    return i + 1 | 0;
  }, 0, xs);
}
function length2(xs) {
  if (isArrayLike(xs)) {
    const a = xs;
    return a.length | 0;
  } else if (xs instanceof FSharpList) {
    return length(xs) | 0;
  } else {
    const e = ofSeq2(xs);
    try {
      let count = 0;
      while (e["System.Collections.IEnumerator.MoveNext"]()) {
        count = count + 1 | 0;
      }
      return count | 0;
    } finally {
      disposeSafe(e);
    }
  }
}
function map3(mapping, xs) {
  return generate(() => ofSeq2(xs), (e) => e["System.Collections.IEnumerator.MoveNext"]() ? some(mapping(e["System.Collections.Generic.IEnumerator`1.get_Current"]())) : void 0, (e_1) => {
    disposeSafe(e_1);
  });
}
function takeWhile(predicate, xs) {
  return generate(() => ofSeq2(xs), (e) => e["System.Collections.IEnumerator.MoveNext"]() && predicate(e["System.Collections.Generic.IEnumerator`1.get_Current"]()) ? some(e["System.Collections.Generic.IEnumerator`1.get_Current"]()) : void 0, (e_1) => {
    disposeSafe(e_1);
  });
}
function collect(mapping, xs) {
  return delay(() => concat(map3(mapping, xs)));
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
function FSharpList__get_Item_Z524259A4(xs, index) {
  const loop = (i_mut, xs_1_mut) => {
    loop: while (true) {
      const i = i_mut, xs_1 = xs_1_mut;
      const matchValue = xs_1.tail;
      if (matchValue != null) {
        if (i === index) {
          return xs_1.head;
        } else {
          i_mut = i + 1;
          xs_1_mut = value(matchValue);
          continue loop;
        }
      } else {
        throw new Exception(SR_indexOutOfBounds + " (Parameter 'index')");
      }
      break;
    }
  };
  return loop(0, xs);
}
function indexNotFound2() {
  throw KeyNotFoundException_$ctor_Z721C83C5(SR_keyNotFoundAlt);
}
function empty2() {
  return FSharpList_get_Empty();
}
function cons(x, xs) {
  return FSharpList_Cons_305B8EAC(x, xs);
}
function singleton3(x) {
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
function tryLast(xs_mut) {
  tryLast: while (true) {
    const xs = xs_mut;
    if (FSharpList__get_IsEmpty(xs)) {
      return void 0;
    } else {
      const t = FSharpList__get_Tail(xs);
      if (FSharpList__get_IsEmpty(t)) {
        return some(FSharpList__get_Head(xs));
      } else {
        xs_mut = t;
        continue tryLast;
      }
    }
    break;
  }
}
function toArray2(xs) {
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
function fold3(folder, state, xs) {
  let acc = state;
  let xs_1 = xs;
  while (!FSharpList__get_IsEmpty(xs_1)) {
    acc = folder(acc, head(xs_1));
    xs_1 = FSharpList__get_Tail(xs_1);
  }
  return acc;
}
function reverse2(xs) {
  return fold3((acc, x) => FSharpList_Cons_305B8EAC(x, acc), FSharpList_get_Empty(), xs);
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
function fold22(folder, state, xs, ys) {
  let acc = state;
  let xs_1 = xs;
  let ys_1 = ys;
  while (!FSharpList__get_IsEmpty(xs_1) && !FSharpList__get_IsEmpty(ys_1)) {
    acc = folder(acc, FSharpList__get_Head(xs_1), FSharpList__get_Head(ys_1));
    xs_1 = FSharpList__get_Tail(xs_1);
    ys_1 = FSharpList__get_Tail(ys_1);
  }
  return acc;
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
  return fold3((acc, x) => FSharpList_Cons_305B8EAC(x, acc), ys, reverse2(xs));
}
function collect2(mapping, xs) {
  const root = FSharpList_get_Empty();
  let node = root;
  let ys = xs;
  while (!FSharpList__get_IsEmpty(ys)) {
    let zs = mapping(FSharpList__get_Head(ys));
    while (!FSharpList__get_IsEmpty(zs)) {
      let xs_1 = void 0, t = void 0;
      node = (xs_1 = node, t = new FSharpList(FSharpList__get_Head(zs), void 0), xs_1.tail = t, t);
      zs = FSharpList__get_Tail(zs);
    }
    ys = FSharpList__get_Tail(ys);
  }
  const xs_3 = node;
  const t_2 = FSharpList_get_Empty();
  xs_3.tail = t_2;
  return FSharpList__get_Tail(root);
}
function mapIndexed(mapping, xs) {
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
function map4(mapping, xs) {
  const root = FSharpList_get_Empty();
  const node = fold3((acc, x) => {
    const t = new FSharpList(mapping(x), void 0);
    acc.tail = t;
    return t;
  }, root, xs);
  const t_2 = FSharpList_get_Empty();
  node.tail = t_2;
  return FSharpList__get_Tail(root);
}
function map22(mapping, xs, ys) {
  const root = FSharpList_get_Empty();
  const node = fold22((acc, x, y) => {
    const t = new FSharpList(mapping(x, y), void 0);
    acc.tail = t;
    return t;
  }, root, xs, ys);
  const t_2 = FSharpList_get_Empty();
  node.tail = t_2;
  return FSharpList__get_Tail(root);
}
function tryPick(f, xs) {
  const loop = (xs_1_mut) => {
    loop: while (true) {
      const xs_1 = xs_1_mut;
      if (FSharpList__get_IsEmpty(xs_1)) {
        return void 0;
      } else {
        const matchValue = f(FSharpList__get_Head(xs_1));
        if (matchValue == null) {
          xs_1_mut = FSharpList__get_Tail(xs_1);
          continue loop;
        } else {
          return matchValue;
        }
      }
      break;
    }
  };
  return loop(xs);
}
function tryFind(f, xs) {
  return tryPick((x) => f(x) ? some(x) : void 0, xs);
}
function find(f, xs) {
  const matchValue = tryFind(f, xs);
  if (matchValue == null) {
    return indexNotFound2();
  } else {
    return value(matchValue);
  }
}
function tryFindIndex2(f, xs) {
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
function item2(n, xs) {
  return FSharpList__get_Item_Z524259A4(xs, n);
}
function filter2(f, xs) {
  const root = FSharpList_get_Empty();
  const node = fold3((acc, x) => {
    if (f(x)) {
      const t = new FSharpList(x, void 0);
      acc.tail = t;
      return t;
    } else {
      return acc;
    }
  }, root, xs);
  const t_2 = FSharpList_get_Empty();
  node.tail = t_2;
  return FSharpList__get_Tail(root);
}
function choose2(f, xs) {
  const root = FSharpList_get_Empty();
  const node = fold3((acc, x) => {
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
  return tryFindIndex2((v) => eq.Equals(value2, v), xs) != null;
}
function reduce(f, xs) {
  if (FSharpList__get_IsEmpty(xs)) {
    throw new Exception(SR_inputWasEmpty);
  } else {
    return fold3(f, head(xs), tail(xs));
  }
}
function forAll2(f, xs) {
  return fold3((acc, x) => acc && f(x), true, xs);
}
function exists2(f, xs) {
  return tryFindIndex2(f, xs) != null;
}
function zip(xs, ys) {
  return map22((x, y) => [x, y], xs, ys);
}
function sortWith(comparer, xs) {
  const arr = toArray2(xs);
  arr.sort(comparer);
  return ofArray(arr);
}
function sort(xs, comparer) {
  return sortWith((x, y) => comparer.Compare(x, y) | 0, xs);
}
function sortBy(projection, xs, comparer) {
  return sortWith((x, y) => comparer.Compare(projection(x), projection(y)) | 0, xs);
}
function max2(xs, comparer) {
  return reduce((x, y) => comparer.Compare(y, x) > 0 ? y : x, xs);
}
function truncate(count, xs) {
  const loop = (i_mut, acc_mut, xs_1_mut) => {
    loop: while (true) {
      const i = i_mut, acc = acc_mut, xs_1 = xs_1_mut;
      let t = void 0;
      if (i <= 0) {
        return acc;
      } else if (FSharpList__get_IsEmpty(xs_1)) {
        return acc;
      } else {
        i_mut = i - 1;
        acc_mut = (t = new FSharpList(FSharpList__get_Head(xs_1), void 0), acc.tail = t, t);
        xs_1_mut = FSharpList__get_Tail(xs_1);
        continue loop;
      }
      break;
    }
  };
  const root = FSharpList_get_Empty();
  const node = loop(count, root, xs);
  const t_2 = FSharpList_get_Empty();
  node.tail = t_2;
  return FSharpList__get_Tail(root);
}

// src/core/Ast.js
var Formula = class extends Union {
  constructor(tag, fields) {
    super();
    this.tag = tag;
    this.fields = fields;
  }
  cases() {
    return ["Atom", "Pred", "Const", "Not", "And", "Or", "Xor", "Implies", "Iff", "Box", "Diamond", "Forall", "Exists"];
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
var RelationKind = class extends Union {
  constructor(tag, fields) {
    super();
    this.tag = tag;
    this.fields = fields;
  }
  cases() {
    return ["Supports", "Presupposes", "Contradicts", "Entails", "EquivalentTo"];
  }
};
var RelRef = class extends Union {
  constructor(tag, fields) {
    super();
    this.tag = tag;
    this.fields = fields;
  }
  cases() {
    return ["Named", "Quoted"];
  }
};
var ProofLine = class extends Union {
  constructor(tag, fields) {
    super();
    this.tag = tag;
    this.fields = fields;
  }
  cases() {
    return ["ProofPremise", "ProofDerived"];
  }
};
var Statement = class extends Union {
  constructor(tag, fields) {
    super();
    this.tag = tag;
    this.fields = fields;
  }
  cases() {
    return ["Heading", "Prose", "Prop", "Claim", "Table", "Check", "Argument", "Proof", "Venn", "VennRef", "Analyze", "Relates", "RelationMap"];
  }
};

// src/core/fable_modules/fable-library-js.5.6.0/MapUtil.js
function tryGetValue(map6, key, defaultValue) {
  if (map6.has(key)) {
    defaultValue.contents = map6.get(key);
    return true;
  }
  return false;
}
function addToSet(v, set) {
  if (set.has(v)) {
    return false;
  }
  set.add(v);
  return true;
}
function getItemFromDict(map6, key) {
  if (map6.has(key)) {
    return map6.get(key);
  } else {
    throw new Exception(`The given key '${key}' was not present in the dictionary.`);
  }
}

// src/core/fable_modules/fable-library-js.5.6.0/MutableSet.js
var HashSet = class {
  constructor(items, comparer) {
    const this$ = new FSharpRef(defaultOf());
    this.comparer = comparer;
    this$.contents = this;
    this.hashMap = /* @__PURE__ */ new Map([]);
    this["init@9"] = 1;
    const enumerator = getEnumerator(items);
    try {
      while (enumerator["System.Collections.IEnumerator.MoveNext"]()) {
        const item3 = enumerator["System.Collections.Generic.IEnumerator`1.get_Current"]();
        HashSet__Add_2B595(this$.contents, item3);
      }
    } finally {
      disposeSafe(enumerator);
    }
  }
  get [Symbol.toStringTag]() {
    return "HashSet";
  }
  toJSON() {
    const this$ = this;
    return Array.from(this$);
  }
  "System.Collections.IEnumerable.GetEnumerator"() {
    const this$ = this;
    return getEnumerator(this$);
  }
  GetEnumerator() {
    const this$ = this;
    return getEnumerator(concat(this$.hashMap.values()));
  }
  [Symbol.iterator]() {
    return toIterator(getEnumerator(this));
  }
  "System.Collections.Generic.ICollection`1.Add2B595"(item3) {
    const this$ = this;
    HashSet__Add_2B595(this$, item3);
  }
  "System.Collections.Generic.ICollection`1.Clear"() {
    const this$ = this;
    HashSet__Clear(this$);
  }
  "System.Collections.Generic.ICollection`1.Contains2B595"(item3) {
    const this$ = this;
    return HashSet__Contains_2B595(this$, item3);
  }
  "System.Collections.Generic.ICollection`1.CopyToZ3B4C077E"(array, arrayIndex) {
    const this$ = this;
    iterateIndexed((i, e) => {
      setItem(array, arrayIndex + i, e);
    }, this$);
  }
  "System.Collections.Generic.ICollection`1.get_Count"() {
    const this$ = this;
    return HashSet__get_Count(this$) | 0;
  }
  "System.Collections.Generic.ICollection`1.get_IsReadOnly"() {
    return false;
  }
  "System.Collections.Generic.ICollection`1.Remove2B595"(item3) {
    const this$ = this;
    return HashSet__Remove_2B595(this$, item3);
  }
  get size() {
    const this$ = this;
    return HashSet__get_Count(this$) | 0;
  }
  add(k) {
    const this$ = this;
    HashSet__Add_2B595(this$, k);
    return this$;
  }
  clear() {
    const this$ = this;
    HashSet__Clear(this$);
  }
  delete(k) {
    const this$ = this;
    return HashSet__Remove_2B595(this$, k);
  }
  has(k) {
    const this$ = this;
    return HashSet__Contains_2B595(this$, k);
  }
  keys() {
    const this$ = this;
    return map3((x) => x, this$);
  }
  values() {
    const this$ = this;
    return map3((x) => x, this$);
  }
  entries() {
    const this$ = this;
    return map3((v) => [v, v], this$);
  }
  forEach(f, thisArg) {
    const this$ = this;
    iterate((x) => {
      f(x, x, this$);
    }, this$);
  }
};
function HashSet__TryFindIndex_2B595(this$, k) {
  const h = this$.comparer.GetHashCode(k) | 0;
  let matchValue;
  let outArg = defaultOf();
  matchValue = [tryGetValue(this$.hashMap, h, new FSharpRef(() => outArg, (v) => {
    outArg = v;
  })), outArg];
  if (matchValue[0]) {
    return [true, h, matchValue[1].findIndex((v_1) => this$.comparer.Equals(k, v_1))];
  } else {
    return [false, h, -1];
  }
}
function HashSet__Clear(this$) {
  this$.hashMap.clear();
}
function HashSet__get_Count(this$) {
  let count = 0;
  let enumerator = getEnumerator(this$.hashMap.values());
  try {
    while (enumerator["System.Collections.IEnumerator.MoveNext"]()) {
      const items = enumerator["System.Collections.Generic.IEnumerator`1.get_Current"]();
      count = count + items.length | 0;
    }
  } finally {
    disposeSafe(enumerator);
  }
  return count | 0;
}
function HashSet__Add_2B595(this$, k) {
  const matchValue = HashSet__TryFindIndex_2B595(this$, k);
  if (matchValue[0]) {
    if (matchValue[2] > -1) {
      return false;
    } else {
      const value2 = void getItemFromDict(this$.hashMap, matchValue[1]).push(k);
      return true;
    }
  } else {
    this$.hashMap.set(matchValue[1], [k]);
    return true;
  }
}
function HashSet__Contains_2B595(this$, k) {
  const matchValue = HashSet__TryFindIndex_2B595(this$, k);
  let matchResult = void 0;
  if (matchValue[0]) {
    if (matchValue[2] > -1) {
      matchResult = 0;
    } else {
      matchResult = 1;
    }
  } else {
    matchResult = 1;
  }
  switch (matchResult) {
    case 0:
      return true;
    default:
      return false;
  }
}
function HashSet__Remove_2B595(this$, k) {
  const matchValue = HashSet__TryFindIndex_2B595(this$, k);
  let matchResult = void 0;
  if (matchValue[0]) {
    if (matchValue[2] > -1) {
      matchResult = 0;
    } else {
      matchResult = 1;
    }
  } else {
    matchResult = 1;
  }
  switch (matchResult) {
    case 0: {
      getItemFromDict(this$.hashMap, matchValue[1]).splice(matchValue[2], 1);
      return true;
    }
    default:
      return false;
  }
}

// src/core/fable_modules/fable-library-js.5.6.0/Set.js
var SetTreeLeaf$1 = class {
  constructor(k) {
    this.k = k;
  }
};
function SetTreeLeaf$1_$ctor_2B595(k) {
  return new SetTreeLeaf$1(k);
}
function SetTreeLeaf$1__get_Key(_) {
  return _.k;
}
var SetTreeNode$1 = class extends SetTreeLeaf$1 {
  constructor(v, left, right, h) {
    super(v);
    this.left = left;
    this.right = right;
    this.h = h | 0;
  }
};
function SetTreeNode$1_$ctor_5F465FC9(v, left, right, h) {
  return new SetTreeNode$1(v, left, right, h);
}
function SetTreeNode$1__get_Left(_) {
  return _.left;
}
function SetTreeNode$1__get_Right(_) {
  return _.right;
}
function SetTreeNode$1__get_Height(_) {
  return _.h | 0;
}
function SetTreeModule_empty() {
  return void 0;
}
function SetTreeModule_countAux(t_mut, acc_mut) {
  SetTreeModule_countAux: while (true) {
    const t = t_mut, acc = acc_mut;
    if (t != null) {
      const t2 = value(t);
      if (t2 instanceof SetTreeNode$1) {
        const tn = t2;
        t_mut = SetTreeNode$1__get_Left(tn);
        acc_mut = SetTreeModule_countAux(SetTreeNode$1__get_Right(tn), acc + 1);
        continue SetTreeModule_countAux;
      } else {
        return acc + 1 | 0;
      }
    } else {
      return acc | 0;
    }
    break;
  }
}
function SetTreeModule_count(s) {
  return SetTreeModule_countAux(s, 0) | 0;
}
function SetTreeModule_mk(l, k, r) {
  let tn = void 0, tn_1 = void 0;
  let hl;
  const t = l;
  if (t != null) {
    const t2 = value(t);
    hl = t2 instanceof SetTreeNode$1 ? (tn = t2, SetTreeNode$1__get_Height(tn)) : 1;
  } else {
    hl = 0;
  }
  let hr;
  const t_1 = r;
  if (t_1 != null) {
    const t2_1 = value(t_1);
    hr = t2_1 instanceof SetTreeNode$1 ? (tn_1 = t2_1, SetTreeNode$1__get_Height(tn_1)) : 1;
  } else {
    hr = 0;
  }
  const m = (hl < hr ? hr : hl) | 0;
  if (m === 0) {
    return SetTreeLeaf$1_$ctor_2B595(k);
  } else {
    return SetTreeNode$1_$ctor_5F465FC9(k, l, r, m + 1);
  }
}
function SetTreeModule_rebalance(t1, v, t2) {
  let tn = void 0, tn_1 = void 0, t_2 = void 0, t2_3 = void 0, tn_2 = void 0, t_3 = void 0, t2_4 = void 0, tn_3 = void 0;
  let t1h;
  const t = t1;
  if (t != null) {
    const t2_1 = value(t);
    t1h = t2_1 instanceof SetTreeNode$1 ? (tn = t2_1, SetTreeNode$1__get_Height(tn)) : 1;
  } else {
    t1h = 0;
  }
  let t2h;
  const t_1 = t2;
  if (t_1 != null) {
    const t2_2 = value(t_1);
    t2h = t2_2 instanceof SetTreeNode$1 ? (tn_1 = t2_2, SetTreeNode$1__get_Height(tn_1)) : 1;
  } else {
    t2h = 0;
  }
  if (t2h > t1h + 2) {
    const matchValue = value(t2);
    if (matchValue instanceof SetTreeNode$1) {
      const t2$0027 = matchValue;
      if ((t_2 = SetTreeNode$1__get_Left(t2$0027), t_2 != null ? (t2_3 = value(t_2), t2_3 instanceof SetTreeNode$1 ? (tn_2 = t2_3, SetTreeNode$1__get_Height(tn_2)) : 1) : 0) > t1h + 1) {
        const matchValue_1 = value(SetTreeNode$1__get_Left(t2$0027));
        if (matchValue_1 instanceof SetTreeNode$1) {
          const t2l = matchValue_1;
          return SetTreeModule_mk(SetTreeModule_mk(t1, v, SetTreeNode$1__get_Left(t2l)), SetTreeLeaf$1__get_Key(t2l), SetTreeModule_mk(SetTreeNode$1__get_Right(t2l), SetTreeLeaf$1__get_Key(t2$0027), SetTreeNode$1__get_Right(t2$0027)));
        } else {
          throw new Exception("internal error: Set.rebalance");
        }
      } else {
        return SetTreeModule_mk(SetTreeModule_mk(t1, v, SetTreeNode$1__get_Left(t2$0027)), SetTreeLeaf$1__get_Key(t2$0027), SetTreeNode$1__get_Right(t2$0027));
      }
    } else {
      throw new Exception("internal error: Set.rebalance");
    }
  } else if (t1h > t2h + 2) {
    const matchValue_2 = value(t1);
    if (matchValue_2 instanceof SetTreeNode$1) {
      const t1$0027 = matchValue_2;
      if ((t_3 = SetTreeNode$1__get_Right(t1$0027), t_3 != null ? (t2_4 = value(t_3), t2_4 instanceof SetTreeNode$1 ? (tn_3 = t2_4, SetTreeNode$1__get_Height(tn_3)) : 1) : 0) > t2h + 1) {
        const matchValue_3 = value(SetTreeNode$1__get_Right(t1$0027));
        if (matchValue_3 instanceof SetTreeNode$1) {
          const t1r = matchValue_3;
          return SetTreeModule_mk(SetTreeModule_mk(SetTreeNode$1__get_Left(t1$0027), SetTreeLeaf$1__get_Key(t1$0027), SetTreeNode$1__get_Left(t1r)), SetTreeLeaf$1__get_Key(t1r), SetTreeModule_mk(SetTreeNode$1__get_Right(t1r), v, t2));
        } else {
          throw new Exception("internal error: Set.rebalance");
        }
      } else {
        return SetTreeModule_mk(SetTreeNode$1__get_Left(t1$0027), SetTreeLeaf$1__get_Key(t1$0027), SetTreeModule_mk(SetTreeNode$1__get_Right(t1$0027), v, t2));
      }
    } else {
      throw new Exception("internal error: Set.rebalance");
    }
  } else {
    return SetTreeModule_mk(t1, v, t2);
  }
}
function SetTreeModule_add(comparer, k, t) {
  if (t != null) {
    const t2 = value(t);
    const c = comparer.Compare(k, SetTreeLeaf$1__get_Key(t2)) | 0;
    if (t2 instanceof SetTreeNode$1) {
      const tn = t2;
      if (c < 0) {
        return SetTreeModule_rebalance(SetTreeModule_add(comparer, k, SetTreeNode$1__get_Left(tn)), SetTreeLeaf$1__get_Key(tn), SetTreeNode$1__get_Right(tn));
      } else if (c === 0) {
        return t;
      } else {
        return SetTreeModule_rebalance(SetTreeNode$1__get_Left(tn), SetTreeLeaf$1__get_Key(tn), SetTreeModule_add(comparer, k, SetTreeNode$1__get_Right(tn)));
      }
    } else {
      const c_1 = comparer.Compare(k, SetTreeLeaf$1__get_Key(t2)) | 0;
      if (c_1 < 0) {
        return SetTreeNode$1_$ctor_5F465FC9(k, SetTreeModule_empty(), t, 2);
      } else if (c_1 === 0) {
        return t;
      } else {
        return SetTreeNode$1_$ctor_5F465FC9(k, t, SetTreeModule_empty(), 2);
      }
    }
  } else {
    return SetTreeLeaf$1_$ctor_2B595(k);
  }
}
function SetTreeModule_balance(comparer, t1, k, t2) {
  if (t1 != null) {
    const t1$0027 = value(t1);
    if (t2 != null) {
      const t2$0027 = value(t2);
      if (t1$0027 instanceof SetTreeNode$1) {
        const t1n = t1$0027;
        if (t2$0027 instanceof SetTreeNode$1) {
          const t2n = t2$0027;
          if (SetTreeNode$1__get_Height(t1n) + 2 < SetTreeNode$1__get_Height(t2n)) {
            return SetTreeModule_rebalance(SetTreeModule_balance(comparer, t1, k, SetTreeNode$1__get_Left(t2n)), SetTreeLeaf$1__get_Key(t2n), SetTreeNode$1__get_Right(t2n));
          } else if (SetTreeNode$1__get_Height(t2n) + 2 < SetTreeNode$1__get_Height(t1n)) {
            return SetTreeModule_rebalance(SetTreeNode$1__get_Left(t1n), SetTreeLeaf$1__get_Key(t1n), SetTreeModule_balance(comparer, SetTreeNode$1__get_Right(t1n), k, t2));
          } else {
            return SetTreeModule_mk(t1, k, t2);
          }
        } else {
          return SetTreeModule_add(comparer, k, SetTreeModule_add(comparer, SetTreeLeaf$1__get_Key(t2$0027), t1));
        }
      } else {
        return SetTreeModule_add(comparer, k, SetTreeModule_add(comparer, SetTreeLeaf$1__get_Key(t1$0027), t2));
      }
    } else {
      return SetTreeModule_add(comparer, k, t1);
    }
  } else {
    return SetTreeModule_add(comparer, k, t2);
  }
}
function SetTreeModule_split(comparer, pivot, t) {
  if (t != null) {
    const t2 = value(t);
    if (t2 instanceof SetTreeNode$1) {
      const tn = t2;
      const c = comparer.Compare(pivot, SetTreeLeaf$1__get_Key(tn)) | 0;
      if (c < 0) {
        const patternInput = SetTreeModule_split(comparer, pivot, SetTreeNode$1__get_Left(tn));
        return [patternInput[0], patternInput[1], SetTreeModule_balance(comparer, patternInput[2], SetTreeLeaf$1__get_Key(tn), SetTreeNode$1__get_Right(tn))];
      } else if (c === 0) {
        return [SetTreeNode$1__get_Left(tn), true, SetTreeNode$1__get_Right(tn)];
      } else {
        const patternInput_1 = SetTreeModule_split(comparer, pivot, SetTreeNode$1__get_Right(tn));
        return [SetTreeModule_balance(comparer, SetTreeNode$1__get_Left(tn), SetTreeLeaf$1__get_Key(tn), patternInput_1[0]), patternInput_1[1], patternInput_1[2]];
      }
    } else {
      const c_1 = comparer.Compare(SetTreeLeaf$1__get_Key(t2), pivot) | 0;
      if (c_1 < 0) {
        return [t, false, SetTreeModule_empty()];
      } else if (c_1 === 0) {
        return [SetTreeModule_empty(), true, SetTreeModule_empty()];
      } else {
        return [SetTreeModule_empty(), false, t];
      }
    }
  } else {
    return [SetTreeModule_empty(), false, SetTreeModule_empty()];
  }
}
function SetTreeModule_mem(comparer_mut, k_mut, t_mut) {
  SetTreeModule_mem: while (true) {
    const comparer = comparer_mut, k = k_mut, t = t_mut;
    if (t != null) {
      const t2 = value(t);
      const c = comparer.Compare(k, SetTreeLeaf$1__get_Key(t2)) | 0;
      if (t2 instanceof SetTreeNode$1) {
        const tn = t2;
        if (c < 0) {
          comparer_mut = comparer;
          k_mut = k;
          t_mut = SetTreeNode$1__get_Left(tn);
          continue SetTreeModule_mem;
        } else if (c === 0) {
          return true;
        } else {
          comparer_mut = comparer;
          k_mut = k;
          t_mut = SetTreeNode$1__get_Right(tn);
          continue SetTreeModule_mem;
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
function SetTreeModule_iter(f_mut, t_mut) {
  SetTreeModule_iter: while (true) {
    const f = f_mut, t = t_mut;
    if (t != null) {
      const t2 = value(t);
      if (t2 instanceof SetTreeNode$1) {
        const tn = t2;
        SetTreeModule_iter(f, SetTreeNode$1__get_Left(tn));
        f(SetTreeLeaf$1__get_Key(tn));
        f_mut = f;
        t_mut = SetTreeNode$1__get_Right(tn);
        continue SetTreeModule_iter;
      } else {
        f(SetTreeLeaf$1__get_Key(t2));
      }
    }
    break;
  }
}
function SetTreeModule_union(comparer, t1, t2) {
  if (t1 != null) {
    const t1$0027 = value(t1);
    if (t2 != null) {
      const t2$0027 = value(t2);
      if (t1$0027 instanceof SetTreeNode$1) {
        const t1n = t1$0027;
        if (t2$0027 instanceof SetTreeNode$1) {
          const t2n = t2$0027;
          if (SetTreeNode$1__get_Height(t1n) > SetTreeNode$1__get_Height(t2n)) {
            const patternInput = SetTreeModule_split(comparer, SetTreeLeaf$1__get_Key(t1n), t2);
            return SetTreeModule_balance(comparer, SetTreeModule_union(comparer, SetTreeNode$1__get_Left(t1n), patternInput[0]), SetTreeLeaf$1__get_Key(t1n), SetTreeModule_union(comparer, SetTreeNode$1__get_Right(t1n), patternInput[2]));
          } else {
            const patternInput_1 = SetTreeModule_split(comparer, SetTreeLeaf$1__get_Key(t2n), t1);
            return SetTreeModule_balance(comparer, SetTreeModule_union(comparer, SetTreeNode$1__get_Left(t2n), patternInput_1[0]), SetTreeLeaf$1__get_Key(t2n), SetTreeModule_union(comparer, SetTreeNode$1__get_Right(t2n), patternInput_1[2]));
          }
        } else {
          return SetTreeModule_add(comparer, SetTreeLeaf$1__get_Key(t2$0027), t1);
        }
      } else {
        return SetTreeModule_add(comparer, SetTreeLeaf$1__get_Key(t1$0027), t2);
      }
    } else {
      return t1;
    }
  } else {
    return t2;
  }
}
var SetTreeModule_SetIterator$1 = class extends Record {
  constructor(stack, started) {
    super();
    this.stack = stack;
    this.started = started;
  }
};
function SetTreeModule_collapseLHS(stack_mut) {
  SetTreeModule_collapseLHS: while (true) {
    const stack = stack_mut;
    if (!isEmpty(stack)) {
      const x = head(stack);
      const rest = tail(stack);
      if (x != null) {
        const x2 = value(x);
        if (x2 instanceof SetTreeNode$1) {
          const xn = x2;
          stack_mut = ofArrayWithTail([SetTreeNode$1__get_Left(xn), SetTreeLeaf$1_$ctor_2B595(SetTreeLeaf$1__get_Key(xn)), SetTreeNode$1__get_Right(xn)], rest);
          continue SetTreeModule_collapseLHS;
        } else {
          return stack;
        }
      } else {
        stack_mut = rest;
        continue SetTreeModule_collapseLHS;
      }
    } else {
      return empty2();
    }
    break;
  }
}
function SetTreeModule_mkIterator(s) {
  return new SetTreeModule_SetIterator$1(SetTreeModule_collapseLHS(singleton3(s)), false);
}
function SetTreeModule_notStarted() {
  throw new Exception("Enumeration not started");
}
function SetTreeModule_alreadyFinished() {
  throw new Exception("Enumeration already started");
}
function SetTreeModule_current(i) {
  if (i.started) {
    const matchValue = i.stack;
    if (isEmpty(matchValue)) {
      return SetTreeModule_alreadyFinished();
    } else if (head(matchValue) != null) {
      const t = value(head(matchValue));
      return SetTreeLeaf$1__get_Key(t);
    } else {
      throw new Exception("Please report error: Set iterator, unexpected stack for current");
    }
  } else {
    return SetTreeModule_notStarted();
  }
}
function SetTreeModule_moveNext(i) {
  if (i.started) {
    const matchValue = i.stack;
    if (!isEmpty(matchValue)) {
      if (head(matchValue) != null) {
        const t = value(head(matchValue));
        if (t instanceof SetTreeNode$1) {
          throw new Exception("Please report error: Set iterator, unexpected stack for moveNext");
        } else {
          i.stack = SetTreeModule_collapseLHS(tail(matchValue));
          return !isEmpty(i.stack);
        }
      } else {
        throw new Exception("Please report error: Set iterator, unexpected stack for moveNext");
      }
    } else {
      return false;
    }
  } else {
    i.started = true;
    return !isEmpty(i.stack);
  }
}
function SetTreeModule_mkIEnumerator(s) {
  let i = SetTreeModule_mkIterator(s);
  return {
    "System.Collections.Generic.IEnumerator`1.get_Current"() {
      return SetTreeModule_current(i);
    },
    "System.Collections.IEnumerator.get_Current"() {
      return SetTreeModule_current(i);
    },
    "System.Collections.IEnumerator.MoveNext"() {
      return SetTreeModule_moveNext(i);
    },
    "System.Collections.IEnumerator.Reset"() {
      i = SetTreeModule_mkIterator(s);
    },
    Dispose() {
    }
  };
}
function SetTreeModule_compareStacks(comparer_mut, l1_mut, l2_mut) {
  SetTreeModule_compareStacks: while (true) {
    const comparer = comparer_mut, l1 = l1_mut, l2 = l2_mut;
    if (!isEmpty(l1)) {
      if (!isEmpty(l2)) {
        if (head(l2) != null) {
          if (head(l1) != null) {
            const x1_3 = value(head(l1));
            const x2_3 = value(head(l2));
            if (x1_3 instanceof SetTreeNode$1) {
              const x1n_2 = x1_3;
              if (SetTreeNode$1__get_Left(x1n_2) == null) {
                if (x2_3 instanceof SetTreeNode$1) {
                  const x2n_2 = x2_3;
                  if (SetTreeNode$1__get_Left(x2n_2) == null) {
                    const c = comparer.Compare(SetTreeLeaf$1__get_Key(x1n_2), SetTreeLeaf$1__get_Key(x2n_2)) | 0;
                    if (c !== 0) {
                      return c | 0;
                    } else {
                      comparer_mut = comparer;
                      l1_mut = cons(SetTreeNode$1__get_Right(x1n_2), tail(l1));
                      l2_mut = cons(SetTreeNode$1__get_Right(x2n_2), tail(l2));
                      continue SetTreeModule_compareStacks;
                    }
                  } else {
                    let matchResult = void 0, t1_6 = void 0, x1_4 = void 0, t2_6 = void 0, x2_4 = void 0;
                    if (!isEmpty(l1)) {
                      if (head(l1) != null) {
                        matchResult = 0;
                        t1_6 = tail(l1);
                        x1_4 = value(head(l1));
                      } else if (!isEmpty(l2)) {
                        if (head(l2) != null) {
                          matchResult = 1;
                          t2_6 = tail(l2);
                          x2_4 = value(head(l2));
                        } else {
                          matchResult = 2;
                        }
                      } else {
                        matchResult = 2;
                      }
                    } else if (!isEmpty(l2)) {
                      if (head(l2) != null) {
                        matchResult = 1;
                        t2_6 = tail(l2);
                        x2_4 = value(head(l2));
                      } else {
                        matchResult = 2;
                      }
                    } else {
                      matchResult = 2;
                    }
                    switch (matchResult) {
                      case 0:
                        if (x1_4 instanceof SetTreeNode$1) {
                          const x1n_3 = x1_4;
                          comparer_mut = comparer;
                          l1_mut = ofArrayWithTail([SetTreeNode$1__get_Left(x1n_3), SetTreeNode$1_$ctor_5F465FC9(SetTreeLeaf$1__get_Key(x1n_3), SetTreeModule_empty(), SetTreeNode$1__get_Right(x1n_3), 0)], t1_6);
                          l2_mut = l2;
                          continue SetTreeModule_compareStacks;
                        } else {
                          comparer_mut = comparer;
                          l1_mut = ofArrayWithTail([SetTreeModule_empty(), SetTreeLeaf$1_$ctor_2B595(SetTreeLeaf$1__get_Key(x1_4))], t1_6);
                          l2_mut = l2;
                          continue SetTreeModule_compareStacks;
                        }
                      case 1:
                        if (x2_4 instanceof SetTreeNode$1) {
                          const x2n_3 = x2_4;
                          comparer_mut = comparer;
                          l1_mut = l1;
                          l2_mut = ofArrayWithTail([SetTreeNode$1__get_Left(x2n_3), SetTreeNode$1_$ctor_5F465FC9(SetTreeLeaf$1__get_Key(x2n_3), SetTreeModule_empty(), SetTreeNode$1__get_Right(x2n_3), 0)], t2_6);
                          continue SetTreeModule_compareStacks;
                        } else {
                          comparer_mut = comparer;
                          l1_mut = l1;
                          l2_mut = ofArrayWithTail([SetTreeModule_empty(), SetTreeLeaf$1_$ctor_2B595(SetTreeLeaf$1__get_Key(x2_4))], t2_6);
                          continue SetTreeModule_compareStacks;
                        }
                      default:
                        throw new Exception("unexpected state in SetTree.compareStacks");
                    }
                  }
                } else {
                  const c_1 = comparer.Compare(SetTreeLeaf$1__get_Key(x1n_2), SetTreeLeaf$1__get_Key(x2_3)) | 0;
                  if (c_1 !== 0) {
                    return c_1 | 0;
                  } else {
                    comparer_mut = comparer;
                    l1_mut = cons(SetTreeNode$1__get_Right(x1n_2), tail(l1));
                    l2_mut = cons(SetTreeModule_empty(), tail(l2));
                    continue SetTreeModule_compareStacks;
                  }
                }
              } else {
                let matchResult_1 = void 0, t1_7 = void 0, x1_5 = void 0, t2_7 = void 0, x2_5 = void 0;
                if (!isEmpty(l1)) {
                  if (head(l1) != null) {
                    matchResult_1 = 0;
                    t1_7 = tail(l1);
                    x1_5 = value(head(l1));
                  } else if (!isEmpty(l2)) {
                    if (head(l2) != null) {
                      matchResult_1 = 1;
                      t2_7 = tail(l2);
                      x2_5 = value(head(l2));
                    } else {
                      matchResult_1 = 2;
                    }
                  } else {
                    matchResult_1 = 2;
                  }
                } else if (!isEmpty(l2)) {
                  if (head(l2) != null) {
                    matchResult_1 = 1;
                    t2_7 = tail(l2);
                    x2_5 = value(head(l2));
                  } else {
                    matchResult_1 = 2;
                  }
                } else {
                  matchResult_1 = 2;
                }
                switch (matchResult_1) {
                  case 0:
                    if (x1_5 instanceof SetTreeNode$1) {
                      const x1n_4 = x1_5;
                      comparer_mut = comparer;
                      l1_mut = ofArrayWithTail([SetTreeNode$1__get_Left(x1n_4), SetTreeNode$1_$ctor_5F465FC9(SetTreeLeaf$1__get_Key(x1n_4), SetTreeModule_empty(), SetTreeNode$1__get_Right(x1n_4), 0)], t1_7);
                      l2_mut = l2;
                      continue SetTreeModule_compareStacks;
                    } else {
                      comparer_mut = comparer;
                      l1_mut = ofArrayWithTail([SetTreeModule_empty(), SetTreeLeaf$1_$ctor_2B595(SetTreeLeaf$1__get_Key(x1_5))], t1_7);
                      l2_mut = l2;
                      continue SetTreeModule_compareStacks;
                    }
                  case 1:
                    if (x2_5 instanceof SetTreeNode$1) {
                      const x2n_4 = x2_5;
                      comparer_mut = comparer;
                      l1_mut = l1;
                      l2_mut = ofArrayWithTail([SetTreeNode$1__get_Left(x2n_4), SetTreeNode$1_$ctor_5F465FC9(SetTreeLeaf$1__get_Key(x2n_4), SetTreeModule_empty(), SetTreeNode$1__get_Right(x2n_4), 0)], t2_7);
                      continue SetTreeModule_compareStacks;
                    } else {
                      comparer_mut = comparer;
                      l1_mut = l1;
                      l2_mut = ofArrayWithTail([SetTreeModule_empty(), SetTreeLeaf$1_$ctor_2B595(SetTreeLeaf$1__get_Key(x2_5))], t2_7);
                      continue SetTreeModule_compareStacks;
                    }
                  default:
                    throw new Exception("unexpected state in SetTree.compareStacks");
                }
              }
            } else if (x2_3 instanceof SetTreeNode$1) {
              const x2n_5 = x2_3;
              if (SetTreeNode$1__get_Left(x2n_5) == null) {
                const c_2 = comparer.Compare(SetTreeLeaf$1__get_Key(x1_3), SetTreeLeaf$1__get_Key(x2n_5)) | 0;
                if (c_2 !== 0) {
                  return c_2 | 0;
                } else {
                  comparer_mut = comparer;
                  l1_mut = cons(SetTreeModule_empty(), tail(l1));
                  l2_mut = cons(SetTreeNode$1__get_Right(x2n_5), tail(l2));
                  continue SetTreeModule_compareStacks;
                }
              } else {
                let matchResult_2 = void 0, t1_8 = void 0, x1_6 = void 0, t2_8 = void 0, x2_6 = void 0;
                if (!isEmpty(l1)) {
                  if (head(l1) != null) {
                    matchResult_2 = 0;
                    t1_8 = tail(l1);
                    x1_6 = value(head(l1));
                  } else if (!isEmpty(l2)) {
                    if (head(l2) != null) {
                      matchResult_2 = 1;
                      t2_8 = tail(l2);
                      x2_6 = value(head(l2));
                    } else {
                      matchResult_2 = 2;
                    }
                  } else {
                    matchResult_2 = 2;
                  }
                } else if (!isEmpty(l2)) {
                  if (head(l2) != null) {
                    matchResult_2 = 1;
                    t2_8 = tail(l2);
                    x2_6 = value(head(l2));
                  } else {
                    matchResult_2 = 2;
                  }
                } else {
                  matchResult_2 = 2;
                }
                switch (matchResult_2) {
                  case 0:
                    if (x1_6 instanceof SetTreeNode$1) {
                      const x1n_5 = x1_6;
                      comparer_mut = comparer;
                      l1_mut = ofArrayWithTail([SetTreeNode$1__get_Left(x1n_5), SetTreeNode$1_$ctor_5F465FC9(SetTreeLeaf$1__get_Key(x1n_5), SetTreeModule_empty(), SetTreeNode$1__get_Right(x1n_5), 0)], t1_8);
                      l2_mut = l2;
                      continue SetTreeModule_compareStacks;
                    } else {
                      comparer_mut = comparer;
                      l1_mut = ofArrayWithTail([SetTreeModule_empty(), SetTreeLeaf$1_$ctor_2B595(SetTreeLeaf$1__get_Key(x1_6))], t1_8);
                      l2_mut = l2;
                      continue SetTreeModule_compareStacks;
                    }
                  case 1:
                    if (x2_6 instanceof SetTreeNode$1) {
                      const x2n_6 = x2_6;
                      comparer_mut = comparer;
                      l1_mut = l1;
                      l2_mut = ofArrayWithTail([SetTreeNode$1__get_Left(x2n_6), SetTreeNode$1_$ctor_5F465FC9(SetTreeLeaf$1__get_Key(x2n_6), SetTreeModule_empty(), SetTreeNode$1__get_Right(x2n_6), 0)], t2_8);
                      continue SetTreeModule_compareStacks;
                    } else {
                      comparer_mut = comparer;
                      l1_mut = l1;
                      l2_mut = ofArrayWithTail([SetTreeModule_empty(), SetTreeLeaf$1_$ctor_2B595(SetTreeLeaf$1__get_Key(x2_6))], t2_8);
                      continue SetTreeModule_compareStacks;
                    }
                  default:
                    throw new Exception("unexpected state in SetTree.compareStacks");
                }
              }
            } else {
              const c_3 = comparer.Compare(SetTreeLeaf$1__get_Key(x1_3), SetTreeLeaf$1__get_Key(x2_3)) | 0;
              if (c_3 !== 0) {
                return c_3 | 0;
              } else {
                comparer_mut = comparer;
                l1_mut = tail(l1);
                l2_mut = tail(l2);
                continue SetTreeModule_compareStacks;
              }
            }
          } else {
            const x2 = value(head(l2));
            let matchResult_3 = void 0, t1_2 = void 0, x1 = void 0, t2_2 = void 0, x2_1 = void 0;
            if (!isEmpty(l1)) {
              if (head(l1) != null) {
                matchResult_3 = 0;
                t1_2 = tail(l1);
                x1 = value(head(l1));
              } else if (!isEmpty(l2)) {
                if (head(l2) != null) {
                  matchResult_3 = 1;
                  t2_2 = tail(l2);
                  x2_1 = value(head(l2));
                } else {
                  matchResult_3 = 2;
                }
              } else {
                matchResult_3 = 2;
              }
            } else if (!isEmpty(l2)) {
              if (head(l2) != null) {
                matchResult_3 = 1;
                t2_2 = tail(l2);
                x2_1 = value(head(l2));
              } else {
                matchResult_3 = 2;
              }
            } else {
              matchResult_3 = 2;
            }
            switch (matchResult_3) {
              case 0:
                if (x1 instanceof SetTreeNode$1) {
                  const x1n = x1;
                  comparer_mut = comparer;
                  l1_mut = ofArrayWithTail([SetTreeNode$1__get_Left(x1n), SetTreeNode$1_$ctor_5F465FC9(SetTreeLeaf$1__get_Key(x1n), SetTreeModule_empty(), SetTreeNode$1__get_Right(x1n), 0)], t1_2);
                  l2_mut = l2;
                  continue SetTreeModule_compareStacks;
                } else {
                  comparer_mut = comparer;
                  l1_mut = ofArrayWithTail([SetTreeModule_empty(), SetTreeLeaf$1_$ctor_2B595(SetTreeLeaf$1__get_Key(x1))], t1_2);
                  l2_mut = l2;
                  continue SetTreeModule_compareStacks;
                }
              case 1:
                if (x2_1 instanceof SetTreeNode$1) {
                  const x2n = x2_1;
                  comparer_mut = comparer;
                  l1_mut = l1;
                  l2_mut = ofArrayWithTail([SetTreeNode$1__get_Left(x2n), SetTreeNode$1_$ctor_5F465FC9(SetTreeLeaf$1__get_Key(x2n), SetTreeModule_empty(), SetTreeNode$1__get_Right(x2n), 0)], t2_2);
                  continue SetTreeModule_compareStacks;
                } else {
                  comparer_mut = comparer;
                  l1_mut = l1;
                  l2_mut = ofArrayWithTail([SetTreeModule_empty(), SetTreeLeaf$1_$ctor_2B595(SetTreeLeaf$1__get_Key(x2_1))], t2_2);
                  continue SetTreeModule_compareStacks;
                }
              default:
                throw new Exception("unexpected state in SetTree.compareStacks");
            }
          }
        } else if (head(l1) != null) {
          const x1_1 = value(head(l1));
          let matchResult_4 = void 0, t1_4 = void 0, x1_2 = void 0, t2_4 = void 0, x2_2 = void 0;
          if (!isEmpty(l1)) {
            if (head(l1) != null) {
              matchResult_4 = 0;
              t1_4 = tail(l1);
              x1_2 = value(head(l1));
            } else if (!isEmpty(l2)) {
              if (head(l2) != null) {
                matchResult_4 = 1;
                t2_4 = tail(l2);
                x2_2 = value(head(l2));
              } else {
                matchResult_4 = 2;
              }
            } else {
              matchResult_4 = 2;
            }
          } else if (!isEmpty(l2)) {
            if (head(l2) != null) {
              matchResult_4 = 1;
              t2_4 = tail(l2);
              x2_2 = value(head(l2));
            } else {
              matchResult_4 = 2;
            }
          } else {
            matchResult_4 = 2;
          }
          switch (matchResult_4) {
            case 0:
              if (x1_2 instanceof SetTreeNode$1) {
                const x1n_1 = x1_2;
                comparer_mut = comparer;
                l1_mut = ofArrayWithTail([SetTreeNode$1__get_Left(x1n_1), SetTreeNode$1_$ctor_5F465FC9(SetTreeLeaf$1__get_Key(x1n_1), SetTreeModule_empty(), SetTreeNode$1__get_Right(x1n_1), 0)], t1_4);
                l2_mut = l2;
                continue SetTreeModule_compareStacks;
              } else {
                comparer_mut = comparer;
                l1_mut = ofArrayWithTail([SetTreeModule_empty(), SetTreeLeaf$1_$ctor_2B595(SetTreeLeaf$1__get_Key(x1_2))], t1_4);
                l2_mut = l2;
                continue SetTreeModule_compareStacks;
              }
            case 1:
              if (x2_2 instanceof SetTreeNode$1) {
                const x2n_1 = x2_2;
                comparer_mut = comparer;
                l1_mut = l1;
                l2_mut = ofArrayWithTail([SetTreeNode$1__get_Left(x2n_1), SetTreeNode$1_$ctor_5F465FC9(SetTreeLeaf$1__get_Key(x2n_1), SetTreeModule_empty(), SetTreeNode$1__get_Right(x2n_1), 0)], t2_4);
                continue SetTreeModule_compareStacks;
              } else {
                comparer_mut = comparer;
                l1_mut = l1;
                l2_mut = ofArrayWithTail([SetTreeModule_empty(), SetTreeLeaf$1_$ctor_2B595(SetTreeLeaf$1__get_Key(x2_2))], t2_4);
                continue SetTreeModule_compareStacks;
              }
            default:
              throw new Exception("unexpected state in SetTree.compareStacks");
          }
        } else {
          comparer_mut = comparer;
          l1_mut = tail(l1);
          l2_mut = tail(l2);
          continue SetTreeModule_compareStacks;
        }
      } else {
        return 1;
      }
    } else if (isEmpty(l2)) {
      return 0;
    } else {
      return -1;
    }
    break;
  }
}
function SetTreeModule_compare(comparer, t1, t2) {
  if (t1 == null) {
    if (t2 == null) {
      return 0;
    } else {
      return -1;
    }
  } else if (t2 == null) {
    return 1;
  } else {
    return SetTreeModule_compareStacks(comparer, singleton3(t1), singleton3(t2)) | 0;
  }
}
function SetTreeModule_toList(t) {
  const loop = (t$0027_mut, acc_mut) => {
    loop: while (true) {
      const t$0027 = t$0027_mut, acc = acc_mut;
      if (t$0027 != null) {
        const t2 = value(t$0027);
        if (t2 instanceof SetTreeNode$1) {
          const tn = t2;
          t$0027_mut = SetTreeNode$1__get_Left(tn);
          acc_mut = cons(SetTreeLeaf$1__get_Key(tn), loop(SetTreeNode$1__get_Right(tn), acc));
          continue loop;
        } else {
          return cons(SetTreeLeaf$1__get_Key(t2), acc);
        }
      } else {
        return acc;
      }
      break;
    }
  };
  return loop(t, empty2());
}
function SetTreeModule_copyToArray(s, arr, i) {
  let j = i;
  SetTreeModule_iter((x) => {
    setItem(arr, j, x);
    j = j + 1 | 0;
  }, s);
}
function SetTreeModule_mkFromEnumerator(comparer_mut, acc_mut, e_mut) {
  SetTreeModule_mkFromEnumerator: while (true) {
    const comparer = comparer_mut, acc = acc_mut, e = e_mut;
    if (e["System.Collections.IEnumerator.MoveNext"]()) {
      comparer_mut = comparer;
      acc_mut = SetTreeModule_add(comparer, e["System.Collections.Generic.IEnumerator`1.get_Current"](), acc);
      e_mut = e;
      continue SetTreeModule_mkFromEnumerator;
    } else {
      return acc;
    }
    break;
  }
}
function SetTreeModule_ofArray(comparer, l) {
  return fold((acc, k) => SetTreeModule_add(comparer, k, acc), SetTreeModule_empty(), l);
}
function SetTreeModule_ofList(comparer, l) {
  return fold3((acc, k) => SetTreeModule_add(comparer, k, acc), SetTreeModule_empty(), l);
}
function SetTreeModule_ofSeq(comparer, c) {
  if (isArrayLike(c)) {
    return SetTreeModule_ofArray(comparer, c);
  } else if (c instanceof FSharpList) {
    return SetTreeModule_ofList(comparer, c);
  } else {
    const ie = getEnumerator(c);
    try {
      return SetTreeModule_mkFromEnumerator(comparer, SetTreeModule_empty(), ie);
    } finally {
      disposeSafe(ie);
    }
  }
}
var FSharpSet = class _FSharpSet {
  constructor(comparer, tree) {
    this.comparer = comparer;
    this.tree = tree;
  }
  GetHashCode() {
    const this$ = this;
    return FSharpSet__ComputeHashCode(this$) | 0;
  }
  Equals(other) {
    let that = void 0;
    const this$ = this;
    return other instanceof _FSharpSet && (that = other, SetTreeModule_compare(FSharpSet__get_Comparer(this$), FSharpSet__get_Tree(this$), FSharpSet__get_Tree(that)) === 0);
  }
  toString() {
    const this$ = this;
    return "set [" + join("; ", this$) + "]";
  }
  get [Symbol.toStringTag]() {
    return "FSharpSet";
  }
  toJSON() {
    const this$ = this;
    return Array.from(this$);
  }
  CompareTo(other) {
    let that = void 0;
    const this$ = this;
    return (other instanceof _FSharpSet ? (that = other, SetTreeModule_compare(FSharpSet__get_Comparer(this$), FSharpSet__get_Tree(this$), FSharpSet__get_Tree(that))) : 1) | 0;
  }
  "System.Collections.Generic.ICollection`1.Add2B595"(x) {
    throw NotSupportedException_$ctor_Z721C83C5("ReadOnlyCollection");
  }
  "System.Collections.Generic.ICollection`1.Clear"() {
    throw NotSupportedException_$ctor_Z721C83C5("ReadOnlyCollection");
  }
  "System.Collections.Generic.ICollection`1.Remove2B595"(x) {
    throw NotSupportedException_$ctor_Z721C83C5("ReadOnlyCollection");
  }
  "System.Collections.Generic.ICollection`1.Contains2B595"(x) {
    const s = this;
    return SetTreeModule_mem(FSharpSet__get_Comparer(s), x, FSharpSet__get_Tree(s));
  }
  "System.Collections.Generic.ICollection`1.CopyToZ3B4C077E"(arr, i) {
    const s = this;
    SetTreeModule_copyToArray(FSharpSet__get_Tree(s), arr, i);
  }
  "System.Collections.Generic.ICollection`1.get_IsReadOnly"() {
    return true;
  }
  "System.Collections.Generic.ICollection`1.get_Count"() {
    const s = this;
    return FSharpSet__get_Count(s) | 0;
  }
  "System.Collections.Generic.IReadOnlyCollection`1.get_Count"() {
    const s = this;
    return FSharpSet__get_Count(s) | 0;
  }
  GetEnumerator() {
    const s = this;
    return SetTreeModule_mkIEnumerator(FSharpSet__get_Tree(s));
  }
  [Symbol.iterator]() {
    return toIterator(getEnumerator(this));
  }
  "System.Collections.IEnumerable.GetEnumerator"() {
    const s = this;
    return SetTreeModule_mkIEnumerator(FSharpSet__get_Tree(s));
  }
  get size() {
    const s = this;
    return FSharpSet__get_Count(s) | 0;
  }
  add(k) {
    const s = this;
    throw new Exception("Set cannot be mutated");
    return s;
  }
  clear() {
    throw new Exception("Set cannot be mutated");
  }
  delete(k) {
    throw new Exception("Set cannot be mutated");
    return false;
  }
  has(k) {
    const s = this;
    return FSharpSet__Contains(s, k);
  }
  keys() {
    const s = this;
    return map3((x) => x, s);
  }
  values() {
    const s = this;
    return map3((x) => x, s);
  }
  entries() {
    const s = this;
    return map3((v) => [v, v], s);
  }
  forEach(f, thisArg) {
    const s = this;
    iterate((x) => {
      f(x, x, s);
    }, s);
  }
};
function FSharpSet_$ctor(comparer, tree) {
  return new FSharpSet(comparer, tree);
}
function FSharpSet__get_Comparer(set$) {
  return set$.comparer;
}
function FSharpSet__get_Tree(set$) {
  return set$.tree;
}
function FSharpSet_Empty(comparer) {
  return FSharpSet_$ctor(comparer, SetTreeModule_empty());
}
function FSharpSet__Add(s, value2) {
  return FSharpSet_$ctor(FSharpSet__get_Comparer(s), SetTreeModule_add(FSharpSet__get_Comparer(s), value2, FSharpSet__get_Tree(s)));
}
function FSharpSet__get_Count(s) {
  return SetTreeModule_count(FSharpSet__get_Tree(s)) | 0;
}
function FSharpSet__Contains(s, value2) {
  return SetTreeModule_mem(FSharpSet__get_Comparer(s), value2, FSharpSet__get_Tree(s));
}
function FSharpSet_op_Addition(set1, set2) {
  if (FSharpSet__get_Tree(set2) == null) {
    return set1;
  } else if (FSharpSet__get_Tree(set1) == null) {
    return set2;
  } else {
    return FSharpSet_$ctor(FSharpSet__get_Comparer(set1), SetTreeModule_union(FSharpSet__get_Comparer(set1), FSharpSet__get_Tree(set1), FSharpSet__get_Tree(set2)));
  }
}
function FSharpSet__ToList(x) {
  return SetTreeModule_toList(FSharpSet__get_Tree(x));
}
function FSharpSet__ComputeHashCode(this$) {
  let res = 0;
  const enumerator = getEnumerator(this$);
  try {
    while (enumerator["System.Collections.IEnumerator.MoveNext"]()) {
      const x_1 = enumerator["System.Collections.Generic.IEnumerator`1.get_Current"]();
      res = (res << 1) + structuralHash(x_1) + 631 | 0;
    }
  } finally {
    disposeSafe(enumerator);
  }
  return Math.abs(res) | 0;
}
function contains2(element, set$) {
  return FSharpSet__Contains(set$, element);
}
function add(value2, set$) {
  return FSharpSet__Add(set$, value2);
}
function singleton4(value2, comparer) {
  return FSharpSet__Add(FSharpSet_Empty(comparer), value2);
}
function union(set1, set2) {
  return FSharpSet_op_Addition(set1, set2);
}
function empty3(comparer) {
  return FSharpSet_Empty(comparer);
}
function ofList(elements, comparer) {
  return FSharpSet_$ctor(comparer, SetTreeModule_ofSeq(comparer, elements));
}
function toList2(set$) {
  return FSharpSet__ToList(set$);
}
function ofSeq3(elements, comparer) {
  return FSharpSet_$ctor(comparer, SetTreeModule_ofSeq(comparer, elements));
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
function MapTreeModule_mapiOpt(f, m) {
  if (m != null) {
    const m2 = value(m);
    if (m2 instanceof MapTreeNode$2) {
      const mn = m2;
      const l2 = MapTreeModule_mapiOpt(f, MapTreeNode$2__get_Left(mn));
      const v2 = f(MapTreeLeaf$2__get_Key(mn), MapTreeLeaf$2__get_Value(mn));
      const r2 = MapTreeModule_mapiOpt(f, MapTreeNode$2__get_Right(mn));
      return MapTreeNode$2_$ctor_Z39DE9543(MapTreeLeaf$2__get_Key(mn), v2, l2, r2, MapTreeNode$2__get_Height(mn));
    } else {
      return MapTreeLeaf$2_$ctor_5BDDA1(MapTreeLeaf$2__get_Key(m2), f(MapTreeLeaf$2__get_Key(m2), MapTreeLeaf$2__get_Value(m2)));
    }
  } else {
    return MapTreeModule_empty();
  }
}
function MapTreeModule_mapi(f, m) {
  return MapTreeModule_mapiOpt(f, m);
}
function MapTreeModule_toList(m) {
  const loop = (m_1_mut, acc_mut) => {
    loop: while (true) {
      const m_1 = m_1_mut, acc = acc_mut;
      if (m_1 != null) {
        const m2 = value(m_1);
        if (m2 instanceof MapTreeNode$2) {
          const mn = m2;
          m_1_mut = MapTreeNode$2__get_Left(mn);
          acc_mut = cons([MapTreeLeaf$2__get_Key(mn), MapTreeLeaf$2__get_Value(mn)], loop(MapTreeNode$2__get_Right(mn), acc));
          continue loop;
        } else {
          return cons([MapTreeLeaf$2__get_Key(m2), MapTreeLeaf$2__get_Value(m2)], acc);
        }
      } else {
        return acc;
      }
      break;
    }
  };
  return loop(m, empty2());
}
function MapTreeModule_copyToArray(m, arr, i) {
  let j = i;
  MapTreeModule_iter((x, y) => {
    setItem(arr, j, [x, y]);
    j = j + 1 | 0;
  }, m);
}
function MapTreeModule_ofList(comparer, l) {
  return fold3((acc, tupledArg) => MapTreeModule_add(comparer, tupledArg[0], tupledArg[1], acc), MapTreeModule_empty(), l);
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
      return empty2();
    }
    break;
  }
}
function MapTreeModule_mkIterator(m) {
  return new MapTreeModule_MapIterator$2(MapTreeModule_collapseLHS(singleton3(m)), false);
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
function FSharpMap_Empty(comparer) {
  return FSharpMap_$ctor(comparer, MapTreeModule_empty());
}
function FSharpMap__Add(m, key, value2) {
  return FSharpMap_$ctor(m.comparer, MapTreeModule_add(m.comparer, key, value2, m.tree));
}
function FSharpMap__get_Item(m, key) {
  return MapTreeModule_find(m.comparer, key, m.tree);
}
function FSharpMap__Map(m, f) {
  return FSharpMap_$ctor(m.comparer, MapTreeModule_mapi(f, m.tree));
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
function FSharpMap__ToList(m) {
  return MapTreeModule_toList(m.tree);
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
function add2(key, value2, table) {
  return FSharpMap__Add(table, key, value2);
}
function find2(key, table) {
  return FSharpMap__get_Item(table, key);
}
function tryFind2(key, table) {
  return FSharpMap__TryFind(table, key);
}
function containsKey(key, table) {
  return FSharpMap__ContainsKey(table, key);
}
function map5(mapping, table) {
  return FSharpMap__Map(table, mapping);
}
function ofList2(elements, comparer) {
  return FSharpMap_$ctor(comparer, MapTreeModule_ofSeq(comparer, elements));
}
function ofSeq4(elements, comparer) {
  return FSharpMap_$ctor(comparer, MapTreeModule_ofSeq(comparer, elements));
}
function toList3(table) {
  return FSharpMap__ToList(table);
}
function empty4(comparer) {
  return FSharpMap_Empty(comparer);
}

// src/core/fable_modules/fable-library-js.5.6.0/Range.js
function makeRangeStepFunction(step, stop, zero, add3) {
  const stepComparedWithZero = compare(step, zero) | 0;
  if (stepComparedWithZero === 0) {
    throw new Exception("The step of a range cannot be zero");
  }
  const stepGreaterThanZero = stepComparedWithZero > 0;
  return (x) => {
    const comparedWithLast = compare(x, stop) | 0;
    return (stepGreaterThanZero && comparedWithLast <= 0 ? true : !stepGreaterThanZero && comparedWithLast >= 0) ? [x, add3(x, step)] : void 0;
  };
}
function integralRangeStep(start, step, stop, zero, add3) {
  const stepFn = makeRangeStepFunction(step, stop, zero, add3);
  return delay(() => unfold(stepFn, start));
}
function rangeDouble(start, step, stop) {
  return integralRangeStep(start, step, stop, 0, (x, y) => x + y);
}

// src/core/Engine.js
function resolve(defs, formula) {
  const go = (seen_mut, f_mut) => {
    go:
      while (true) {
        const seen = seen_mut, f = f_mut;
        switch (f.tag) {
          case 1:
            return f;
          case 2:
            return f;
          case 3:
            return new Formula(3, [go(seen, f.fields[0])]);
          case 4:
            return new Formula(4, [go(seen, f.fields[0]), go(seen, f.fields[1])]);
          case 5:
            return new Formula(5, [go(seen, f.fields[0]), go(seen, f.fields[1])]);
          case 6:
            return new Formula(6, [go(seen, f.fields[0]), go(seen, f.fields[1])]);
          case 7:
            return new Formula(7, [go(seen, f.fields[0]), go(seen, f.fields[1])]);
          case 8:
            return new Formula(8, [go(seen, f.fields[0]), go(seen, f.fields[1])]);
          case 9:
            return new Formula(9, [go(seen, f.fields[0])]);
          case 10:
            return new Formula(10, [go(seen, f.fields[0])]);
          case 11:
            return new Formula(11, [f.fields[0], go(seen, f.fields[1])]);
          case 12:
            return new Formula(12, [f.fields[0], go(seen, f.fields[1])]);
          default:
            if (!contains2(f.fields[0], seen)) {
              const matchValue = tryFind2(f.fields[0], defs);
              if (matchValue == null) {
                return new Formula(0, [f.fields[0]]);
              } else {
                const body = matchValue;
                seen_mut = add(f.fields[0], seen);
                f_mut = body;
                continue go;
              }
            } else {
              return new Formula(0, [f.fields[0]]);
            }
        }
        break;
      }
  };
  return go(empty3({
    Compare: (x_2, y) => comparePrimitives(x_2, y) | 0
  }), formula);
}
function atoms(f) {
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
            break;
          }
          case 3: {
            matchResult = 3;
            a = f_1.fields[0];
            break;
          }
          case 9: {
            matchResult = 3;
            a = f_1.fields[0];
            break;
          }
          case 10: {
            matchResult = 3;
            a = f_1.fields[0];
            break;
          }
          case 11: {
            matchResult = 3;
            a = f_1.fields[1];
            break;
          }
          case 12: {
            matchResult = 3;
            a = f_1.fields[1];
            break;
          }
          case 4: {
            matchResult = 4;
            a_1 = f_1.fields[0];
            b = f_1.fields[1];
            break;
          }
          case 5: {
            matchResult = 4;
            a_1 = f_1.fields[0];
            b = f_1.fields[1];
            break;
          }
          case 6: {
            matchResult = 4;
            a_1 = f_1.fields[0];
            b = f_1.fields[1];
            break;
          }
          case 7: {
            matchResult = 4;
            a_1 = f_1.fields[0];
            b = f_1.fields[1];
            break;
          }
          case 8: {
            matchResult = 4;
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
              return append(acc, singleton3(name));
            }
          }
          case 1:
            return acc;
          case 2:
            return acc;
          case 3: {
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
  return go(f, empty2());
}
function eval$(env_mut, f_mut) {
  eval$:
    while (true) {
      const env = env_mut, f = f_mut;
      let matchResult, a_6, a_7;
      switch (f.tag) {
        case 2: {
          matchResult = 1;
          break;
        }
        case 3: {
          matchResult = 2;
          break;
        }
        case 4: {
          matchResult = 3;
          break;
        }
        case 5: {
          matchResult = 4;
          break;
        }
        case 6: {
          matchResult = 5;
          break;
        }
        case 7: {
          matchResult = 6;
          break;
        }
        case 8: {
          matchResult = 7;
          break;
        }
        case 9: {
          matchResult = 8;
          a_6 = f.fields[0];
          break;
        }
        case 10: {
          matchResult = 8;
          a_6 = f.fields[0];
          break;
        }
        case 1: {
          matchResult = 9;
          break;
        }
        case 11: {
          matchResult = 10;
          a_7 = f.fields[1];
          break;
        }
        case 12: {
          matchResult = 10;
          a_7 = f.fields[1];
          break;
        }
        default:
          matchResult = 0;
      }
      switch (matchResult) {
        case 0:
          return defaultArg(tryFind2(f.fields[0], env), false);
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
        case 8: {
          env_mut = env;
          f_mut = a_6;
          continue eval$;
        }
        case 9:
          return false;
        default: {
          env_mut = env;
          f_mut = a_7;
          continue eval$;
        }
      }
      break;
    }
}
function assignments(names) {
  const n = length(names) | 0;
  return toList(delay(() => map3((i) => ofList2(mapIndexed((bit, name) => [name, (i >> n - 1 - bit & 1) === 1], names), {
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
  const rows = map4((env) => [env, eval$(env, f)], assignments(names));
  const results = map4((tuple) => tuple[1], rows);
  return new TruthTable(names, rows, forAll2((x) => x, results) ? new Verdict(0, []) : forAll2((value2) => !value2, results) ? new Verdict(1, []) : new Verdict(2, []));
}
function containsModal(f_mut) {
  containsModal:
    while (true) {
      const f = f_mut;
      let matchResult, a, a_1, b;
      switch (f.tag) {
        case 9:
        case 10: {
          matchResult = 1;
          break;
        }
        case 3: {
          matchResult = 2;
          a = f.fields[0];
          break;
        }
        case 11: {
          matchResult = 2;
          a = f.fields[1];
          break;
        }
        case 12: {
          matchResult = 2;
          a = f.fields[1];
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
        case 8: {
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
          f_mut = a;
          continue containsModal;
        }
        default:
          if (containsModal(a_1)) {
            return true;
          } else {
            f_mut = b;
            continue containsModal;
          }
      }
      break;
    }
}
function containsFO(f_mut) {
  containsFO:
    while (true) {
      const f = f_mut;
      let matchResult, a, a_1, b;
      switch (f.tag) {
        case 0:
        case 2: {
          matchResult = 1;
          break;
        }
        case 3: {
          matchResult = 2;
          a = f.fields[0];
          break;
        }
        case 9: {
          matchResult = 2;
          a = f.fields[0];
          break;
        }
        case 10: {
          matchResult = 2;
          a = f.fields[0];
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
        case 8: {
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
          return true;
        case 1:
          return false;
        case 2: {
          f_mut = a;
          continue containsFO;
        }
        default:
          if (containsFO(a_1)) {
            return true;
          } else {
            f_mut = b;
            continue containsFO;
          }
      }
      break;
    }
}
function modalOps(f_mut) {
  modalOps:
    while (true) {
      const f = f_mut;
      let matchResult, a, a_1, a_2, b;
      switch (f.tag) {
        case 9: {
          matchResult = 1;
          a = f.fields[0];
          break;
        }
        case 10: {
          matchResult = 1;
          a = f.fields[0];
          break;
        }
        case 3: {
          matchResult = 2;
          a_1 = f.fields[0];
          break;
        }
        case 11: {
          matchResult = 2;
          a_1 = f.fields[1];
          break;
        }
        case 12: {
          matchResult = 2;
          a_1 = f.fields[1];
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
        case 8: {
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
          return 1 + modalOps(a) | 0;
        case 2: {
          f_mut = a_1;
          continue modalOps;
        }
        default:
          return modalOps(a_2) + modalOps(b) | 0;
      }
      break;
    }
}
function evalS5(model_mut, w_mut, f_mut) {
  evalS5:
    while (true) {
      const model = model_mut, w = w_mut, f = f_mut;
      let matchResult, a_8;
      switch (f.tag) {
        case 2: {
          matchResult = 1;
          break;
        }
        case 3: {
          matchResult = 2;
          break;
        }
        case 4: {
          matchResult = 3;
          break;
        }
        case 5: {
          matchResult = 4;
          break;
        }
        case 6: {
          matchResult = 5;
          break;
        }
        case 7: {
          matchResult = 6;
          break;
        }
        case 8: {
          matchResult = 7;
          break;
        }
        case 9: {
          matchResult = 8;
          break;
        }
        case 10: {
          matchResult = 9;
          break;
        }
        case 1: {
          matchResult = 10;
          break;
        }
        case 11: {
          matchResult = 11;
          a_8 = f.fields[1];
          break;
        }
        case 12: {
          matchResult = 11;
          a_8 = f.fields[1];
          break;
        }
        default:
          matchResult = 0;
      }
      switch (matchResult) {
        case 0:
          return defaultArg(tryFind2(f.fields[0], w), false);
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
          } else {
            return false;
          }
        case 4:
          if (evalS5(model, w, f.fields[0])) {
            return true;
          } else {
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
          } else {
            model_mut = model;
            w_mut = w;
            f_mut = f.fields[1];
            continue evalS5;
          }
        case 7:
          return evalS5(model, w, f.fields[0]) === evalS5(model, w, f.fields[1]);
        case 8:
          return forAll2((v) => evalS5(model, v, f.fields[0]), model);
        case 9:
          return exists2((v_1) => evalS5(model, v_1, f.fields[0]), model);
        case 10:
          return false;
        default: {
          model_mut = model;
          w_mut = w;
          f_mut = a_8;
          continue evalS5;
        }
      }
      break;
    }
}
var ModalSearch = class extends Union {
  constructor(tag, fields) {
    super();
    this.tag = tag;
    this.fields = fields;
  }
  cases() {
    return ["NoModel", "Model", "TooLarge"];
  }
};
function s5Satisfy(f) {
  const valuations = toArray2(assignments(atoms(f)));
  const neededWorlds = max(1, modalOps(f) + 1) | 0;
  const maxWorlds = min(neededWorlds, 6) | 0;
  let examined = 0;
  const search = (k_mut) => {
    search:
      while (true) {
        const k = k_mut;
        if (k > maxWorlds) {
          return new ModalSearch(0, []);
        } else {
          const extend = (chosen, start) => {
            if (length(chosen) === k) {
              examined = examined + 1 | 0;
              if (examined > 2e5) {
                return new ModalSearch(2, []);
              } else {
                const worlds = map4((i) => item(i, valuations), reverse2(chosen));
                const tryActual = (idx_mut, seen_mut, indices_mut) => {
                  tryActual:
                    while (true) {
                      const idx = idx_mut, seen = seen_mut, indices = indices_mut;
                      if (!isEmpty(indices)) {
                        const rest = tail(indices);
                        const i_1 = head(indices) | 0;
                        if (contains2(i_1, seen)) {
                          idx_mut = idx + 1;
                          seen_mut = seen;
                          indices_mut = rest;
                          continue tryActual;
                        } else if (evalS5(worlds, item(i_1, valuations), f)) {
                          return new ModalSearch(1, [worlds, idx]);
                        } else {
                          idx_mut = idx + 1;
                          seen_mut = add(i_1, seen);
                          indices_mut = rest;
                          continue tryActual;
                        }
                      } else {
                        return new ModalSearch(0, []);
                      }
                      break;
                    }
                };
                return tryActual(0, empty3({
                  Compare: (x, y) => comparePrimitives(x, y) | 0
                }), reverse2(chosen));
              }
            } else {
              let result = new ModalSearch(0, []);
              let i_2 = start;
              while (equals(result, new ModalSearch(0, [])) && i_2 < valuations.length) {
                result = extend(cons(i_2, chosen), i_2);
                i_2 = i_2 + 1 | 0;
              }
              return result;
            }
          };
          const matchValue = extend(empty2(), 0);
          if (matchValue.tag === 0) {
            k_mut = k + 1;
            continue search;
          } else {
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
    } else {
      matchResult = 1;
      result_1 = matchValue_1;
    }
  } else {
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
function s5Valid(f) {
  const matchValue = s5Satisfy(new Formula(3, [f]));
  switch (matchValue.tag) {
    case 1:
      return false;
    case 2:
      return void 0;
    default:
      return true;
  }
}
var FOModel = class extends Record {
  constructor(Size, Constants, Extensions) {
    super();
    this.Size = Size | 0;
    this.Constants = Constants;
    this.Extensions = Extensions;
  }
};
function signatures(f_mut) {
  signatures:
    while (true) {
      const f = f_mut;
      let matchResult, a, a_1, b;
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
          a = f.fields[0];
          break;
        }
        case 9: {
          matchResult = 3;
          a = f.fields[0];
          break;
        }
        case 10: {
          matchResult = 3;
          a = f.fields[0];
          break;
        }
        case 11: {
          matchResult = 3;
          a = f.fields[1];
          break;
        }
        case 12: {
          matchResult = 3;
          a = f.fields[1];
          break;
        }
        case 4: {
          matchResult = 4;
          a_1 = f.fields[0];
          b = f.fields[1];
          break;
        }
        case 5: {
          matchResult = 4;
          a_1 = f.fields[0];
          b = f.fields[1];
          break;
        }
        case 6: {
          matchResult = 4;
          a_1 = f.fields[0];
          b = f.fields[1];
          break;
        }
        case 7: {
          matchResult = 4;
          a_1 = f.fields[0];
          b = f.fields[1];
          break;
        }
        case 8: {
          matchResult = 4;
          a_1 = f.fields[0];
          b = f.fields[1];
          break;
        }
        default:
          matchResult = 0;
      }
      switch (matchResult) {
        case 0:
          return singleton4([f.fields[0], 0], {
            Compare: (x, y) => compareArrays(x, y) | 0
          });
        case 1:
          return singleton4([f.fields[0], length(f.fields[1])], {
            Compare: (x_1, y_1) => compareArrays(x_1, y_1) | 0
          });
        case 2:
          return empty3({
            Compare: (x_2, y_2) => compareArrays(x_2, y_2) | 0
          });
        case 3: {
          f_mut = a;
          continue signatures;
        }
        default:
          return union(signatures(a_1), signatures(b));
      }
      break;
    }
}
function freeConstants(f) {
  const go = (bound_mut, f_1_mut) => {
    go:
      while (true) {
        const bound = bound_mut, f_1 = f_1_mut;
        let matchResult, a, a_1, x_2, a_2, b;
        switch (f_1.tag) {
          case 0:
          case 2: {
            matchResult = 1;
            break;
          }
          case 3: {
            matchResult = 2;
            a = f_1.fields[0];
            break;
          }
          case 9: {
            matchResult = 2;
            a = f_1.fields[0];
            break;
          }
          case 10: {
            matchResult = 2;
            a = f_1.fields[0];
            break;
          }
          case 11: {
            matchResult = 3;
            a_1 = f_1.fields[1];
            x_2 = f_1.fields[0];
            break;
          }
          case 12: {
            matchResult = 3;
            a_1 = f_1.fields[1];
            x_2 = f_1.fields[0];
            break;
          }
          case 4: {
            matchResult = 4;
            a_2 = f_1.fields[0];
            b = f_1.fields[1];
            break;
          }
          case 5: {
            matchResult = 4;
            a_2 = f_1.fields[0];
            b = f_1.fields[1];
            break;
          }
          case 6: {
            matchResult = 4;
            a_2 = f_1.fields[0];
            b = f_1.fields[1];
            break;
          }
          case 7: {
            matchResult = 4;
            a_2 = f_1.fields[0];
            b = f_1.fields[1];
            break;
          }
          case 8: {
            matchResult = 4;
            a_2 = f_1.fields[0];
            b = f_1.fields[1];
            break;
          }
          default:
            matchResult = 0;
        }
        switch (matchResult) {
          case 0:
            return ofList(filter2((t) => !contains2(t, bound), f_1.fields[1]), {
              Compare: (x, y) => comparePrimitives(x, y) | 0
            });
          case 1:
            return empty3({
              Compare: (x_1, y_1) => comparePrimitives(x_1, y_1) | 0
            });
          case 2: {
            bound_mut = bound;
            f_1_mut = a;
            continue go;
          }
          case 3: {
            bound_mut = add(x_2, bound);
            f_1_mut = a_1;
            continue go;
          }
          default:
            return union(go(bound, a_2), go(bound, b));
        }
        break;
      }
  };
  return toList2(go(empty3({
    Compare: (x_3, y_2) => comparePrimitives(x_3, y_2) | 0
  }), f));
}
function evalFO(m_mut, env_mut, f_mut) {
  evalFO:
    while (true) {
      const m = m_mut, env = env_mut, f = f_mut;
      const holds = (name, tuple) => defaultArg(map((set$) => contains2(tuple, set$), tryFind2(name, m.Extensions)), false);
      let matchResult, a_8;
      switch (f.tag) {
        case 0: {
          matchResult = 1;
          break;
        }
        case 1: {
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
          break;
        }
        case 11: {
          matchResult = 9;
          break;
        }
        case 12: {
          matchResult = 10;
          break;
        }
        case 9: {
          matchResult = 11;
          a_8 = f.fields[0];
          break;
        }
        case 10: {
          matchResult = 11;
          a_8 = f.fields[0];
          break;
        }
        default:
          matchResult = 0;
      }
      switch (matchResult) {
        case 0:
          return f.fields[0];
        case 1:
          return holds(f.fields[0], empty2());
        case 2:
          return holds(f.fields[0], map4((t) => {
            const matchValue = tryFind2(t, env);
            if (matchValue == null) {
              return defaultArg(tryFind2(t, m.Constants), 0) | 0;
            } else {
              return matchValue | 0;
            }
          }, f.fields[1]));
        case 3:
          return !evalFO(m, env, f.fields[0]);
        case 4:
          if (evalFO(m, env, f.fields[0])) {
            m_mut = m;
            env_mut = env;
            f_mut = f.fields[1];
            continue evalFO;
          } else {
            return false;
          }
        case 5:
          if (evalFO(m, env, f.fields[0])) {
            return true;
          } else {
            m_mut = m;
            env_mut = env;
            f_mut = f.fields[1];
            continue evalFO;
          }
        case 6:
          return evalFO(m, env, f.fields[0]) !== evalFO(m, env, f.fields[1]);
        case 7:
          if (!evalFO(m, env, f.fields[0])) {
            return true;
          } else {
            m_mut = m;
            env_mut = env;
            f_mut = f.fields[1];
            continue evalFO;
          }
        case 8:
          return evalFO(m, env, f.fields[0]) === evalFO(m, env, f.fields[1]);
        case 9:
          return forAll2((e_1) => evalFO(m, add2(f.fields[0], e_1, env), f.fields[1]), toList(rangeDouble(0, 1, m.Size - 1)));
        case 10:
          return exists2((e_2) => evalFO(m, add2(f.fields[0], e_2, env), f.fields[1]), toList(rangeDouble(0, 1, m.Size - 1)));
        default: {
          m_mut = m;
          env_mut = env;
          f_mut = a_8;
          continue evalFO;
        }
      }
      break;
    }
}
var FOSearch = class extends Union {
  constructor(tag, fields) {
    super();
    this.tag = tag;
    this.fields = fields;
  }
  cases() {
    return ["FONoModel", "FOModelFound", "FOTooLarge"];
  }
};
function foSatisfy(f) {
  const sigs = toList2(signatures(f));
  const consts = freeConstants(f);
  let budget = 3e5;
  let truncated = false;
  const search = (size_2_mut) => {
    search:
      while (true) {
        const size_2 = size_2_mut;
        if (size_2 > 4) {
          if (truncated) {
            return new FOSearch(2, []);
          } else {
            return new FOSearch(0, []);
          }
        } else {
          let matchValue_2;
          const size_1 = size_2 | 0;
          const predTuples = map4((tupledArg) => {
            let go;
            return [tupledArg[0], (go = (k_1) => {
              if (k_1 === 0) {
                return singleton3(empty2());
              } else {
                return toList(delay(() => collect((tail2) => map3((e) => cons(e, tail2), rangeDouble(0, 1, size_1 - 1)), go(k_1 - 1))));
              }
            }, go(tupledArg[1]))];
          }, sigs);
          const chooseExt = (remaining) => (ext) => {
            if (!isEmpty(remaining)) {
              const tuples = head(remaining)[1];
              const n_1 = length(tuples) | 0;
              const count = Math.pow(2, n_1) | 0;
              const loop = (mask_mut) => {
                loop:
                  while (true) {
                    const mask = mask_mut;
                    if (mask >= count) {
                      return new FOSearch(0, []);
                    } else {
                      const matchValue = chooseExt(tail(remaining))(add2(head(remaining)[0], ofList(toList(delay(() => collect((i) => (mask >> i & 1) === 1 ? singleton2(item2(i, tuples)) : empty(), rangeDouble(0, 1, n_1 - 1)))), {
                        Compare: (x_1, y_1) => compare(x_1, y_1) | 0
                      }), ext));
                      if (matchValue.tag === 0) {
                        mask_mut = mask + 1;
                        continue loop;
                      } else {
                        return matchValue;
                      }
                    }
                    break;
                  }
              };
              return loop(0);
            } else {
              return chooseConsts(consts)(empty4({
                Compare: (x, y) => comparePrimitives(x, y) | 0
              }))(ext);
            }
          };
          const chooseConsts = (remaining_1) => (assigned) => (ext_1) => {
            if (!isEmpty(remaining_1)) {
              const loop_1 = (e_1_mut) => {
                loop_1:
                  while (true) {
                    const e_1 = e_1_mut;
                    if (e_1 >= size_1) {
                      return new FOSearch(0, []);
                    } else {
                      const matchValue_1 = chooseConsts(tail(remaining_1))(add2(head(remaining_1), e_1, assigned))(ext_1);
                      if (matchValue_1.tag === 0) {
                        e_1_mut = e_1 + 1;
                        continue loop_1;
                      } else {
                        return matchValue_1;
                      }
                    }
                    break;
                  }
              };
              return loop_1(0);
            } else {
              budget = budget - 1 | 0;
              if (budget <= 0) {
                truncated = true;
                return new FOSearch(2, []);
              } else {
                const model = new FOModel(size_1, assigned, ext_1);
                return evalFO(model, empty4({
                  Compare: (x_2, y_2) => comparePrimitives(x_2, y_2) | 0
                }), f) ? new FOSearch(1, [model]) : new FOSearch(0, []);
              }
            }
          };
          matchValue_2 = chooseExt(predTuples)(empty4({
            Compare: (x_3, y_3) => comparePrimitives(x_3, y_3) | 0
          }));
          if (matchValue_2.tag === 0) {
            size_2_mut = size_2 + 1;
            continue search;
          } else {
            return matchValue_2;
          }
        }
        break;
      }
  };
  return search(1);
}
function valid(f) {
  if (containsFO(f)) {
    const matchValue = foSatisfy(new Formula(3, [f]));
    switch (matchValue.tag) {
      case 1:
        return false;
      case 2:
        return void 0;
      default:
        return true;
    }
  } else if (containsModal(f)) {
    return s5Valid(f);
  } else {
    return equals(truthTable(f).Verdict, new Verdict(0, []));
  }
}
function checkArgumentFO(premises, conclusion) {
  return foSatisfy(fold3((acc, p) => new Formula(4, [acc, p]), new Formula(3, [conclusion]), premises));
}
function predicateArities(f) {
  return sortBy((tuple) => tuple[0], toList2(signatures(f)), {
    Compare: (x, y) => comparePrimitives(x, y) | 0
  });
}
function individuals(f) {
  return freeConstants(f);
}
var CellStatus = class extends Union {
  constructor(tag, fields) {
    super();
    this.tag = tag;
    this.fields = fields;
  }
  cases() {
    return ["CellEmpty", "CellOccupied", "CellFree"];
  }
};
var VennAnalysis = class extends Record {
  constructor(Predicates, Consistent, Cells, Placement) {
    super();
    this.Predicates = Predicates;
    this.Consistent = Consistent;
    this.Cells = Cells;
    this.Placement = Placement;
  }
};
function analyzeMonadic(preds, consts, premise) {
  const cellCount = 1 << length(preds) | 0;
  const allOccupancies = toList(delay(() => map3((mask) => toList(delay(() => collect((c) => (mask >> c & 1) === 1 ? singleton2(c) : empty(), rangeDouble(0, 1, cellCount - 1)))), rangeDouble(1, 1, (1 << cellCount) - 1))));
  const placements = (occupied_1, remaining) => {
    if (!isEmpty(remaining)) {
      return toList(delay(() => collect((cell_5) => map3((tail2) => add2(head(remaining), cell_5, tail2), placements(occupied_1, tail(remaining))), occupied_1)));
    } else {
      return singleton3(empty4({
        Compare: (x_3, y_3) => comparePrimitives(x_3, y_3) | 0
      }));
    }
  };
  const satisfying = toList(delay(() => collect((occupied_2) => collect((cmap) => {
    let occupied, size2, elementOfCell, ext;
    return evalFO((occupied = occupied_2, size2 = length(occupied) | 0, elementOfCell = ofList2(mapIndexed((idx, cell_1) => [cell_1, idx], occupied), {
      Compare: (x, y) => comparePrimitives(x, y) | 0
    }), ext = ofList2(mapIndexed((j_1, name) => [name, ofList(choose2((tupledArg) => {
      if ((tupledArg[1] >> j_1 & 1) === 1) {
        return singleton3(tupledArg[0]);
      } else {
        return void 0;
      }
    }, mapIndexed((idx_1, cell_2) => [idx_1, cell_2], occupied)), {
      Compare: (x_1, y_1) => compare(x_1, y_1) | 0
    })], preds), {
      Compare: (x_2, y_2) => comparePrimitives(x_2, y_2) | 0
    }), new FOModel(size2, map5((_arg, cell_4) => find2(cell_4, elementOfCell) | 0, cmap), ext)), empty4({
      Compare: (x_4, y_4) => comparePrimitives(x_4, y_4) | 0
    }), premise) ? singleton2([occupied_2, cmap]) : empty();
  }, placements(occupied_2, consts)), allOccupancies)));
  const consistent = !isEmpty(satisfying);
  return new VennAnalysis(preds, consistent, ofList2(toList(delay(() => map3((cell_6) => [cell_6, !consistent ? new CellStatus(2, []) : !exists2((tupledArg_1) => contains(cell_6, tupledArg_1[0], {
    Equals: (x_5, y_5) => x_5 === y_5,
    GetHashCode: (x_5) => numberHash(x_5) | 0
  }), satisfying) ? new CellStatus(0, []) : !exists2((tupledArg_2) => !contains(cell_6, tupledArg_2[0], {
    Equals: (x_6, y_6) => x_6 === y_6,
    GetHashCode: (x_6) => numberHash(x_6) | 0
  }), satisfying) ? new CellStatus(1, []) : new CellStatus(2, [])], rangeDouble(0, 1, cellCount - 1)))), {
    Compare: (x_7, y_7) => comparePrimitives(x_7, y_7) | 0
  }), ofList2(map4((c_2) => [c_2, ofList(choose2((tupledArg_3) => tryFind2(c_2, tupledArg_3[1]), satisfying), {
    Compare: (x_8, y_8) => comparePrimitives(x_8, y_8) | 0
  })], consts), {
    Compare: (x_9, y_9) => comparePrimitives(x_9, y_9) | 0
  }));
}
function describeModel(m, f) {
  const elem = (i) => String.fromCharCode(~~"a".charCodeAt(0) + i & 65535);
  return append(singleton3("domain = { " + join(", ", toList(delay(() => map3(elem, rangeDouble(0, 1, m.Size - 1))))) + " }"), append(map4((c) => c + " = " + elem(defaultArg(tryFind2(c, m.Constants), 0)), freeConstants(f)), map4((tupledArg) => {
    const name = tupledArg[0];
    const ext = defaultArg(tryFind2(name, m.Extensions), empty3({
      Compare: (x_1, y_1) => compare(x_1, y_1) | 0
    }));
    if (tupledArg[1] === 0) {
      return name + " = " + (contains2(empty2(), ext) ? "true" : "false");
    } else {
      return name + " = { " + join(", ", map4((t) => {
        let matchResult, x_2;
        if (!isEmpty(t)) {
          if (isEmpty(tail(t))) {
            matchResult = 0;
            x_2 = head(t);
          } else {
            matchResult = 1;
          }
        } else {
          matchResult = 1;
        }
        switch (matchResult) {
          case 0:
            return elem(x_2);
          default:
            return "(" + join(", ", map4(elem, t)) + ")";
        }
      }, toList2(ext))) + " }";
    }
  }, sortBy((tuple) => tuple[0], toList2(signatures(f)), {
    Compare: (x, y) => comparePrimitives(x, y) | 0
  }))));
}
function equivalent2(a, b) {
  return valid(new Formula(8, [a, b]));
}
function equivalent(a, b) {
  return equals(truthTable(new Formula(8, [a, b])).Verdict, new Verdict(0, []));
}
function checkArgumentS5(premises, conclusion) {
  return s5Satisfy(fold3((acc, p) => new Formula(4, [acc, p]), new Formula(3, [conclusion]), premises));
}
function distinguishing(a, b) {
  return tryFind((env) => eval$(env, a) !== eval$(env, b), assignments(atoms(new Formula(8, [a, b]))));
}
var ArgumentCheck = class extends Record {
  constructor(Atoms, Counterexamples, IsValid) {
    super();
    this.Atoms = Atoms;
    this.Counterexamples = Counterexamples;
    this.IsValid = IsValid;
  }
};
function checkArgument(premises, conclusion) {
  const names = fold3((acc, a) => {
    if (contains(a, acc, {
      Equals: (x, y) => x === y,
      GetHashCode: (x) => stringHash(x) | 0
    })) {
      return acc;
    } else {
      return append(acc, singleton3(a));
    }
  }, empty2(), collect2(atoms, append(premises, singleton3(conclusion))));
  const counterexamples = filter2((env) => {
    if (forAll2((f_1) => eval$(env, f_1), premises)) {
      return !eval$(env, conclusion);
    } else {
      return false;
    }
  }, assignments(names));
  return new ArgumentCheck(names, counterexamples, isEmpty(counterexamples));
}
var Relation = class extends Union {
  constructor(tag, fields) {
    super();
    this.tag = tag;
    this.fields = fields;
  }
  cases() {
    return ["Equivalent", "Contradictory", "Contrary", "Subcontrary", "Entails", "EntailedBy", "Independent"];
  }
};
function relate(a, b) {
  const holds = (f) => equals(valid(f), true);
  if (holds(new Formula(8, [a, b]))) {
    return new Relation(0, []);
  } else if (holds(new Formula(8, [a, new Formula(3, [b])]))) {
    return new Relation(1, []);
  } else if (holds(new Formula(3, [new Formula(4, [a, b])]))) {
    return new Relation(2, []);
  } else if (holds(new Formula(5, [a, b]))) {
    return new Relation(3, []);
  } else if (holds(new Formula(7, [a, b]))) {
    return new Relation(4, []);
  } else if (holds(new Formula(7, [b, a]))) {
    return new Relation(5, []);
  } else {
    return new Relation(6, []);
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
var isDigit = (s) => isDigit2(s, 0);
var isLetter = (s) => isLetter2(s, 0);
var isLetterOrDigit = (s) => isLetterOrDigit2(s, 0);
var isUpper = (s) => isUpper2(s, 0);
var isLower = (s) => isLower2(s, 0);
function getUnicodeCategory2(s, index) {
  const cp = charCodeAt(s, index);
  return unicodeCategoryFunc(cp);
}
function isDigit2(s, index) {
  const test = 1 << getUnicodeCategory2(s, index);
  return (test & isDigitMask) !== 0;
}
function isLetter2(s, index) {
  const test = 1 << getUnicodeCategory2(s, index);
  return (test & isLetterMask) !== 0;
}
function isLetterOrDigit2(s, index) {
  const test = 1 << getUnicodeCategory2(s, index);
  return (test & isLetterOrDigitMask) !== 0;
}
function isUpper2(s, index) {
  const test = 1 << getUnicodeCategory2(s, index);
  return (test & isUpperMask) !== 0;
}
function isLower2(s, index) {
  const test = 1 << getUnicodeCategory2(s, index);
  return (test & isLowerMask) !== 0;
}

// src/core/Render.js
function precedence(f) {
  switch (f.tag) {
    case 3:
    case 9:
    case 10:
      return 90;
    case 4:
      return 80;
    case 5:
      return 70;
    case 6:
      return 60;
    case 7:
      return 50;
    case 8:
      return 40;
    case 11:
    case 12:
      return 20;
    default:
      return 100;
  }
}
function toUnicode(formula) {
  const go = (f) => {
    const parentPrec = precedence(f) | 0;
    const wrap = (onLeft, child) => {
      const childPrec = precedence(child) | 0;
      if (childPrec < parentPrec ? true : childPrec === parentPrec && (f.tag === 7 ? onLeft : !onLeft)) {
        return "(" + go(child) + ")";
      } else {
        return go(child);
      }
    };
    switch (f.tag) {
      case 1:
        if (isEmpty(f.fields[1])) {
          return f.fields[0];
        } else {
          return f.fields[0] + "(" + join(", ", f.fields[1]) + ")";
        }
      case 2:
        if (f.fields[0]) {
          return "\u22A4";
        } else {
          return "\u22A5";
        }
      case 3:
        return "\xAC" + wrap(true, f.fields[0]);
      case 9:
        return "\u25A1" + wrap(true, f.fields[0]);
      case 10:
        return "\u25C7" + wrap(true, f.fields[0]);
      case 11:
        return "\u2200" + f.fields[0] + ". " + wrap(false, f.fields[1]);
      case 12:
        return "\u2203" + f.fields[0] + ". " + wrap(false, f.fields[1]);
      case 4:
        return wrap(true, f.fields[0]) + " \u2227 " + wrap(false, f.fields[1]);
      case 5:
        return wrap(true, f.fields[0]) + " \u2228 " + wrap(false, f.fields[1]);
      case 6:
        return wrap(true, f.fields[0]) + " \u2295 " + wrap(false, f.fields[1]);
      case 7:
        return wrap(true, f.fields[0]) + " \u2192 " + wrap(false, f.fields[1]);
      case 8:
        return wrap(true, f.fields[0]) + " \u2194 " + wrap(false, f.fields[1]);
      default:
        return f.fields[0];
    }
  };
  return go(formula);
}
function toEnglish(glossOf, formula) {
  const soften = (s) => {
    if (s.length >= 2 && isUpper(s[0]) && isLower(s[1])) {
      return s[0].toLocaleLowerCase() + substring(s, 1);
    } else {
      return s;
    }
  };
  const go = (f) => {
    switch (f.tag) {
      case 1:
        if (isEmpty(f.fields[1])) {
          return defaultArg(map(soften, glossOf(f.fields[0])), f.fields[0]);
        } else if (isEmpty(tail(f.fields[1]))) {
          return head(f.fields[1]) + " is " + f.fields[0];
        } else {
          return f.fields[0] + " holds of " + join(", ", f.fields[1]);
        }
      case 2:
        if (f.fields[0]) {
          return "true";
        } else {
          return "false";
        }
      case 3:
        return "it is not the case that " + go(f.fields[0]);
      case 9:
        return "it is necessary that " + go(f.fields[0]);
      case 10:
        return "it is possible that " + go(f.fields[0]);
      case 11:
        return "for every " + f.fields[0] + ", " + go(f.fields[1]);
      case 12:
        return "for some " + f.fields[0] + ", " + go(f.fields[1]);
      case 4:
        return "both " + go(f.fields[0]) + ", and " + go(f.fields[1]);
      case 5:
        return "either " + go(f.fields[0]) + ", or " + go(f.fields[1]);
      case 6:
        return "either " + go(f.fields[0]) + " or " + go(f.fields[1]) + ", but not both";
      case 7:
        return "if " + go(f.fields[0]) + ", then " + go(f.fields[1]);
      case 8:
        return go(f.fields[0]) + " exactly when " + go(f.fields[1]);
      default:
        return defaultArg(map(soften, glossOf(f.fields[0])), f.fields[0]);
    }
  };
  const sentence = go(formula);
  if (sentence === "") {
    return "";
  } else {
    return sentence[0].toLocaleUpperCase() + substring(sentence, 1) + ".";
  }
}

// src/core/fable_modules/fable-library-js.5.6.0/Seq2.js
function distinct(xs, comparer) {
  return delay(() => {
    const hashSet = new HashSet([], comparer);
    return filter((x) => addToSet(x, hashSet), xs);
  });
}
function List_distinct(xs, comparer) {
  return toList(distinct(xs, comparer));
}

// src/core/InferenceRules.js
var FormKind = class extends Union {
  constructor(tag, fields) {
    super();
    this.tag = tag;
    this.fields = fields;
  }
  cases() {
    return ["ValidForm", "FallacyForm"];
  }
};
var ArgumentForm = class extends Record {
  constructor(Name, Title, Aka, Premises, Conclusion, Kind, Note) {
    super();
    this.Name = Name;
    this.Title = Title;
    this.Aka = Aka;
    this.Premises = Premises;
    this.Conclusion = Conclusion;
    this.Kind = Kind;
    this.Note = Note;
  }
};
var \u03C6 = new Formula(0, ["\u03C6"]);
var \u03C8 = new Formula(0, ["\u03C8"]);
var \u03C7 = new Formula(0, ["\u03C7"]);
var \u03C9 = new Formula(0, ["\u03C9"]);
var \u03A6x = new Formula(1, ["\u03A6", singleton3("x")]);
var \u03A8x = new Formula(1, ["\u03A8", singleton3("x")]);
var \u03A3x = new Formula(1, ["\u03A3", singleton3("x")]);
var \u03A6\u03B1 = new Formula(1, ["\u03A6", singleton3("\u03B1")]);
var \u03A8\u03B1 = new Formula(1, ["\u03A8", singleton3("\u03B1")]);
var forms = ofArray([new ArgumentForm("modus-ponens", "modus ponens", "modus ponendo ponens", ofArray([new Formula(7, [\u03C6, \u03C8]), \u03C6]), \u03C8, new FormKind(0, []), "From an if\u2013then and its if, the then follows."), new ArgumentForm("modus-tollens", "modus tollens", "modus tollendo tollens", ofArray([new Formula(7, [\u03C6, \u03C8]), new Formula(3, [\u03C8])]), new Formula(3, [\u03C6]), new FormKind(0, []), "If the consequence failed, the condition cannot have held."), new ArgumentForm("hypothetical-syllogism", "hypothetical syllogism", "", ofArray([new Formula(7, [\u03C6, \u03C8]), new Formula(7, [\u03C8, \u03C7])]), new Formula(7, [\u03C6, \u03C7]), new FormKind(0, []), "Implication chains: if \u03C6 leads to \u03C8 and \u03C8 leads to \u03C7, \u03C6 leads to \u03C7."), new ArgumentForm("disjunctive-syllogism", "disjunctive syllogism", "modus tollendo ponens", ofArray([new Formula(5, [\u03C6, \u03C8]), new Formula(3, [\u03C6])]), \u03C8, new FormKind(0, []), "One of two options; the first is out; so it's the second \u2014 affirming by denying."), new ArgumentForm("ponendo-tollens", "modus ponendo tollens", "", ofArray([new Formula(3, [new Formula(4, [\u03C6, \u03C8])]), \u03C6]), new Formula(3, [\u03C8]), new FormKind(0, []), "The two can't both hold; the first does; so the second fails \u2014 denying by affirming."), new ArgumentForm("constructive-dilemma", "constructive dilemma", "", ofArray([new Formula(7, [\u03C6, \u03C8]), new Formula(7, [\u03C7, \u03C9]), new Formula(5, [\u03C6, \u03C7])]), new Formula(5, [\u03C8, \u03C9]), new FormKind(0, []), "Either way one of the two conditions holds, so one of the two results does."), new ArgumentForm("proof-by-cases", "proof by cases", "disjunction elimination", ofArray([new Formula(5, [\u03C6, \u03C8]), new Formula(7, [\u03C6, \u03C7]), new Formula(7, [\u03C8, \u03C7])]), \u03C7, new FormKind(0, []), "Whichever option holds, the same conclusion follows \u2014 so it follows outright."), new ArgumentForm("destructive-dilemma", "destructive dilemma", "", ofArray([new Formula(7, [\u03C6, \u03C8]), new Formula(7, [\u03C7, \u03C9]), new Formula(5, [new Formula(3, [\u03C8]), new Formula(3, [\u03C9])])]), new Formula(5, [new Formula(3, [\u03C6]), new Formula(3, [\u03C7])]), new FormKind(0, []), "One of the two results fails, so one of the two conditions must fail."), new ArgumentForm("absorption", "absorption", "", singleton3(new Formula(7, [\u03C6, \u03C8])), new Formula(7, [\u03C6, new Formula(4, [\u03C6, \u03C8])]), new FormKind(0, []), "If \u03C6 brings \u03C8, then \u03C6 brings both itself and \u03C8."), new ArgumentForm("absorption-rev", "absorption", "", singleton3(new Formula(7, [\u03C6, new Formula(4, [\u03C6, \u03C8])])), new Formula(7, [\u03C6, \u03C8]), new FormKind(0, []), "If \u03C6 brings both itself and \u03C8, it brings \u03C8."), new ArgumentForm("simplification", "simplification", "", singleton3(new Formula(4, [\u03C6, \u03C8])), \u03C6, new FormKind(0, []), "From a conjunction, take either half."), new ArgumentForm("conjunction", "conjunction", "", ofArray([\u03C6, \u03C8]), new Formula(4, [\u03C6, \u03C8]), new FormKind(0, []), "Two things known separately are known together."), new ArgumentForm("addition", "addition", "", singleton3(\u03C6), new Formula(5, [\u03C6, \u03C8]), new FormKind(0, []), "Anything true may be weakened to an 'or'."), new ArgumentForm("double-negation-intro", "double negation (intro)", "", singleton3(\u03C6), new Formula(3, [new Formula(3, [\u03C6])]), new FormKind(0, []), "What is true is not not-true."), new ArgumentForm("double-negation-elim", "double negation (elim)", "", singleton3(new Formula(3, [new Formula(3, [\u03C6])])), \u03C6, new FormKind(0, []), "Two negations cancel (classically)."), new ArgumentForm("de-morgan-nand", "De Morgan's law", "", singleton3(new Formula(3, [new Formula(4, [\u03C6, \u03C8])])), new Formula(5, [new Formula(3, [\u03C6]), new Formula(3, [\u03C8])]), new FormKind(0, []), "'Not both' means at least one fails: negation flips \u2227 into \u2228."), new ArgumentForm("de-morgan-nor", "De Morgan's law", "", singleton3(new Formula(3, [new Formula(5, [\u03C6, \u03C8])])), new Formula(4, [new Formula(3, [\u03C6]), new Formula(3, [\u03C8])]), new FormKind(0, []), "'Neither' means each one fails: negation flips \u2228 into \u2227."), new ArgumentForm("de-morgan-nand-rev", "De Morgan's law", "", singleton3(new Formula(5, [new Formula(3, [\u03C6]), new Formula(3, [\u03C8])])), new Formula(3, [new Formula(4, [\u03C6, \u03C8])]), new FormKind(0, []), "At least one fails, so they cannot both hold."), new ArgumentForm("de-morgan-nor-rev", "De Morgan's law", "", singleton3(new Formula(4, [new Formula(3, [\u03C6]), new Formula(3, [\u03C8])])), new Formula(3, [new Formula(5, [\u03C6, \u03C8])]), new FormKind(0, []), "Each one fails, so neither holds."), new ArgumentForm("contraposition", "contraposition", "transposition", singleton3(new Formula(7, [\u03C6, \u03C8])), new Formula(7, [new Formula(3, [\u03C8]), new Formula(3, [\u03C6])]), new FormKind(0, []), "An implication and its contrapositive say the same thing."), new ArgumentForm("contraposition-rev", "contraposition", "transposition", singleton3(new Formula(7, [new Formula(3, [\u03C6]), new Formula(3, [\u03C8])])), new Formula(7, [\u03C8, \u03C6]), new FormKind(0, []), "An implication and its contrapositive say the same thing."), new ArgumentForm("material-implication", "material implication", "", singleton3(new Formula(7, [\u03C6, \u03C8])), new Formula(5, [new Formula(3, [\u03C6]), \u03C8]), new FormKind(0, []), "'If \u03C6 then \u03C8' just says: either \u03C6 fails, or \u03C8 holds."), new ArgumentForm("material-implication-rev", "material implication", "", singleton3(new Formula(5, [new Formula(3, [\u03C6]), \u03C8])), new Formula(7, [\u03C6, \u03C8]), new FormKind(0, []), "'If \u03C6 then \u03C8' just says: either \u03C6 fails, or \u03C8 holds."), new ArgumentForm("exportation", "exportation", "", singleton3(new Formula(7, [new Formula(4, [\u03C6, \u03C8]), \u03C7])), new Formula(7, [\u03C6, new Formula(7, [\u03C8, \u03C7])]), new FormKind(0, []), "'Both together give \u03C7' is the same as 'the first gives: the second gives \u03C7'."), new ArgumentForm("exportation-rev", "exportation", "importation", singleton3(new Formula(7, [\u03C6, new Formula(7, [\u03C8, \u03C7])])), new Formula(7, [new Formula(4, [\u03C6, \u03C8]), \u03C7]), new FormKind(0, []), "'The first gives: the second gives \u03C7' is the same as 'both together give \u03C7'."), new ArgumentForm("excluded-middle", "law of excluded middle", "tertium non datur", empty2(), new Formula(5, [\u03C6, new Formula(3, [\u03C6])]), new FormKind(0, []), "Every proposition either holds or fails \u2014 there is no third option."), new ArgumentForm("non-contradiction", "law of non-contradiction", "", empty2(), new Formula(3, [new Formula(4, [\u03C6, new Formula(3, [\u03C6])])]), new FormKind(0, []), "No proposition both holds and fails at once."), new ArgumentForm("universal-instantiation", "universal instantiation", "singular syllogism", ofArray([new Formula(11, ["x", new Formula(7, [\u03A6x, \u03A8x])]), \u03A6\u03B1]), \u03A8\u03B1, new FormKind(0, []), "What holds of every \u03A6 holds of this one in particular."), new ArgumentForm("barbara", "Barbara", "AAA-1", ofArray([new Formula(11, ["x", new Formula(7, [\u03A6x, \u03A8x])]), new Formula(11, ["x", new Formula(7, [\u03A3x, \u03A6x])])]), new Formula(11, ["x", new Formula(7, [\u03A3x, \u03A8x])]), new FormKind(0, []), "All \u03A6 are \u03A8; all \u03A3 are \u03A6; so all \u03A3 are \u03A8 \u2014 the first and firmest of the syllogisms."), new ArgumentForm("celarent", "Celarent", "EAE-1", ofArray([new Formula(11, ["x", new Formula(7, [\u03A6x, new Formula(3, [\u03A8x])])]), new Formula(11, ["x", new Formula(7, [\u03A3x, \u03A6x])])]), new Formula(11, ["x", new Formula(7, [\u03A3x, new Formula(3, [\u03A8x])])]), new FormKind(0, []), "No \u03A6 are \u03A8; all \u03A3 are \u03A6; so no \u03A3 are \u03A8."), new ArgumentForm("darii", "Darii", "AII-1", ofArray([new Formula(11, ["x", new Formula(7, [\u03A6x, \u03A8x])]), new Formula(12, ["x", new Formula(4, [\u03A3x, \u03A6x])])]), new Formula(12, ["x", new Formula(4, [\u03A3x, \u03A8x])]), new FormKind(0, []), "All \u03A6 are \u03A8; some \u03A3 are \u03A6; so some \u03A3 are \u03A8."), new ArgumentForm("ferio", "Ferio", "EIO-1", ofArray([new Formula(11, ["x", new Formula(7, [\u03A6x, new Formula(3, [\u03A8x])])]), new Formula(12, ["x", new Formula(4, [\u03A3x, \u03A6x])])]), new Formula(12, ["x", new Formula(4, [\u03A3x, new Formula(3, [\u03A8x])])]), new FormKind(0, []), "No \u03A6 are \u03A8; some \u03A3 are \u03A6; so some \u03A3 are not \u03A8."), new ArgumentForm("axiom-t", "axiom T", "necessity elimination", singleton3(new Formula(9, [\u03C6])), \u03C6, new FormKind(0, []), "What is necessary is actually so."), new ArgumentForm("possibility-intro", "possibility introduction", "", singleton3(\u03C6), new Formula(10, [\u03C6]), new FormKind(0, []), "What is actually so is possible."), new ArgumentForm("k-distribution", "K distribution", "", ofArray([new Formula(9, [new Formula(7, [\u03C6, \u03C8])]), new Formula(9, [\u03C6])]), new Formula(9, [\u03C8]), new FormKind(0, []), "Necessity distributes over implication: a necessary if\u2013then with a necessary if gives a necessary then."), new ArgumentForm("axiom-4", "axiom 4", "", singleton3(new Formula(9, [\u03C6])), new Formula(9, [new Formula(9, [\u03C6])]), new FormKind(0, []), "What is necessary is necessarily necessary."), new ArgumentForm("axiom-5", "axiom 5", "", singleton3(new Formula(10, [\u03C6])), new Formula(9, [new Formula(10, [\u03C6])]), new FormKind(0, []), "What is possible is necessarily possible \u2014 possibility doesn't vary between worlds (S5)."), new ArgumentForm("axiom-b", "axiom B", "", singleton3(\u03C6), new Formula(9, [new Formula(10, [\u03C6])]), new FormKind(0, []), "What is so is necessarily possible."), new ArgumentForm("s5-collapse", "S5 collapse", "", singleton3(new Formula(10, [new Formula(9, [\u03C6])])), new Formula(9, [\u03C6]), new FormKind(0, []), "Possibly necessary is necessary \u2014 the load-bearing step of the modal ontological argument."), new ArgumentForm("dual-box", "modal duality", "", singleton3(new Formula(3, [new Formula(10, [\u03C6])])), new Formula(9, [new Formula(3, [\u03C6])]), new FormKind(0, []), "Not possible means necessarily not \u2014 \u25C7 and \u25A1 are two sides of one coin."), new ArgumentForm("dual-diamond", "modal duality", "", singleton3(new Formula(3, [new Formula(9, [\u03C6])])), new Formula(10, [new Formula(3, [\u03C6])]), new FormKind(0, []), "Not necessary means possibly not \u2014 \u25A1 and \u25C7 are two sides of one coin."), new ArgumentForm("illicit-necessitation", "illicit necessitation", "", singleton3(\u03C6), new Formula(9, [\u03C6]), new FormKind(1, []), "True doesn't mean necessarily true \u2014 the world could have been otherwise."), new ArgumentForm("actualizing-the-possible", "actualizing the possible", "", singleton3(new Formula(10, [\u03C6])), \u03C6, new FormKind(1, []), "Possible doesn't mean actual \u2014 some possibilities stay unrealized."), new ArgumentForm("necessity-of-the-consequent", "necessity of the consequent", "modal scope fallacy", ofArray([new Formula(9, [new Formula(7, [\u03C6, \u03C8])]), \u03C6]), new Formula(9, [\u03C8]), new FormKind(1, []), "The necessity governs the whole if\u2013then, not its then: a contingent if only yields a contingent then."), new ArgumentForm("affirming-the-consequent", "affirming the consequent", "", ofArray([new Formula(7, [\u03C6, \u03C8]), \u03C8]), \u03C6, new FormKind(1, []), "\u03C8 may hold for other reasons \u2014 the arrow only runs one way."), new ArgumentForm("denying-the-antecedent", "denying the antecedent", "", ofArray([new Formula(7, [\u03C6, \u03C8]), new Formula(3, [\u03C6])]), new Formula(3, [\u03C8]), new FormKind(1, []), "Losing one reason for \u03C8 does not disprove \u03C8."), new ArgumentForm("affirming-a-disjunct", "affirming a disjunct", "", ofArray([new Formula(5, [\u03C6, \u03C8]), \u03C6]), new Formula(3, [\u03C8]), new FormKind(1, []), "An inclusive 'or' allows both sides to be true at once."), new ArgumentForm("illicit-conversion", "illicit conversion", "", singleton3(new Formula(7, [\u03C6, \u03C8])), new Formula(7, [\u03C8, \u03C6]), new FormKind(1, []), "An implication does not run backwards."), new ArgumentForm("undistributed-middle", "undistributed middle", "", ofArray([new Formula(11, ["x", new Formula(7, [\u03A6x, \u03A8x])]), new Formula(11, ["x", new Formula(7, [\u03A3x, \u03A8x])])]), new Formula(11, ["x", new Formula(7, [\u03A3x, \u03A6x])]), new FormKind(1, []), "Sharing a predicate doesn't connect two classes \u2014 all cats and all dogs are animals, yet no dogs are cats.")]);
var validForms = filter2((f) => equals(f.Kind, new FormKind(0, [])), forms);
var fallacies = filter2((f) => equals(f.Kind, new FormKind(1, [])), forms);

// src/core/Recognition.js
var predMetas = ofSeq3(["\u03A6", "\u03A8", "\u03A3"], {
  Compare: (x, y) => comparePrimitives(x, y) | 0
});
var termMetas = ofSeq3(["\u03B1", "\u03B2"], {
  Compare: (x, y) => comparePrimitives(x, y) | 0
});
function bindName(key, value2, subst) {
  const matchValue = tryFind2(key, subst);
  if (matchValue == null) {
    return add2(key, new Formula(0, [value2]), subst);
  } else if (matchValue.tag === 0) {
    const bound = matchValue.fields[0];
    if (bound === value2) {
      return subst;
    } else {
      return void 0;
    }
  } else {
    return void 0;
  }
}
function matchPattern(pattern_mut, target_mut, subst_mut) {
  matchPattern:
    while (true) {
      const pattern = pattern_mut, target = target_mut, subst = subst_mut;
      let matchResult, t_2, v, a_1, b_1, pargs_1, pn_1, targs_1, tn_1, p_2, t_3, x1_2, x2_2, p_3, t_4, x1_3, x2_3, p_4, t_5, p1, p2, t1, t2;
      switch (pattern.tag) {
        case 2: {
          if (target.tag === 2) {
            if (pattern.fields[0] === target.fields[0]) {
              matchResult = 1;
              a_1 = pattern.fields[0];
              b_1 = target.fields[0];
            } else {
              matchResult = 7;
            }
          } else {
            matchResult = 7;
          }
          break;
        }
        case 1: {
          if (target.tag === 1) {
            if (length(pattern.fields[1]) === length(target.fields[1])) {
              matchResult = 2;
              pargs_1 = pattern.fields[1];
              pn_1 = pattern.fields[0];
              targs_1 = target.fields[1];
              tn_1 = target.fields[0];
            } else {
              matchResult = 7;
            }
          } else {
            matchResult = 7;
          }
          break;
        }
        case 11: {
          if (target.tag === 11) {
            if (pattern.fields[0] === target.fields[0]) {
              matchResult = 3;
              p_2 = pattern.fields[1];
              t_3 = target.fields[1];
              x1_2 = pattern.fields[0];
              x2_2 = target.fields[0];
            } else {
              matchResult = 7;
            }
          } else {
            matchResult = 7;
          }
          break;
        }
        case 12: {
          if (target.tag === 12) {
            if (pattern.fields[0] === target.fields[0]) {
              matchResult = 4;
              p_3 = pattern.fields[1];
              t_4 = target.fields[1];
              x1_3 = pattern.fields[0];
              x2_3 = target.fields[0];
            } else {
              matchResult = 7;
            }
          } else {
            matchResult = 7;
          }
          break;
        }
        case 3: {
          if (target.tag === 3) {
            matchResult = 5;
            p_4 = pattern.fields[0];
            t_5 = target.fields[0];
          } else {
            matchResult = 7;
          }
          break;
        }
        case 9: {
          if (target.tag === 9) {
            matchResult = 5;
            p_4 = pattern.fields[0];
            t_5 = target.fields[0];
          } else {
            matchResult = 7;
          }
          break;
        }
        case 10: {
          if (target.tag === 10) {
            matchResult = 5;
            p_4 = pattern.fields[0];
            t_5 = target.fields[0];
          } else {
            matchResult = 7;
          }
          break;
        }
        case 4: {
          if (target.tag === 4) {
            matchResult = 6;
            p1 = pattern.fields[0];
            p2 = pattern.fields[1];
            t1 = target.fields[0];
            t2 = target.fields[1];
          } else {
            matchResult = 7;
          }
          break;
        }
        case 5: {
          if (target.tag === 5) {
            matchResult = 6;
            p1 = pattern.fields[0];
            p2 = pattern.fields[1];
            t1 = target.fields[0];
            t2 = target.fields[1];
          } else {
            matchResult = 7;
          }
          break;
        }
        case 6: {
          if (target.tag === 6) {
            matchResult = 6;
            p1 = pattern.fields[0];
            p2 = pattern.fields[1];
            t1 = target.fields[0];
            t2 = target.fields[1];
          } else {
            matchResult = 7;
          }
          break;
        }
        case 7: {
          if (target.tag === 7) {
            matchResult = 6;
            p1 = pattern.fields[0];
            p2 = pattern.fields[1];
            t1 = target.fields[0];
            t2 = target.fields[1];
          } else {
            matchResult = 7;
          }
          break;
        }
        case 8: {
          if (target.tag === 8) {
            matchResult = 6;
            p1 = pattern.fields[0];
            p2 = pattern.fields[1];
            t1 = target.fields[0];
            t2 = target.fields[1];
          } else {
            matchResult = 7;
          }
          break;
        }
        default: {
          matchResult = 0;
          t_2 = target;
          v = pattern.fields[0];
        }
      }
      switch (matchResult) {
        case 0: {
          const matchValue_1 = tryFind2(v, subst);
          if (matchValue_1 == null) {
            return add2(v, t_2, subst);
          } else if (equals(matchValue_1, t_2)) {
            return subst;
          } else {
            return void 0;
          }
        }
        case 1:
          return subst;
        case 2:
          return fold3((acc, tupledArg) => {
            const pa = tupledArg[0];
            const ta = tupledArg[1];
            return bind((s) => {
              if (contains2(pa, termMetas)) {
                return bindName("term:" + pa, ta, s);
              } else if (pa === ta) {
                return s;
              } else {
                return void 0;
              }
            }, acc);
          }, contains2(pn_1, predMetas) ? bindName("pred:" + pn_1, tn_1, subst) : pn_1 === tn_1 ? subst : void 0, zip(pargs_1, targs_1));
        case 3: {
          pattern_mut = p_2;
          target_mut = t_3;
          subst_mut = subst;
          continue matchPattern;
        }
        case 4: {
          pattern_mut = p_3;
          target_mut = t_4;
          subst_mut = subst;
          continue matchPattern;
        }
        case 5: {
          pattern_mut = p_4;
          target_mut = t_5;
          subst_mut = subst;
          continue matchPattern;
        }
        case 6:
          return bind((subst_1) => matchPattern(p2, t2, subst_1), matchPattern(p1, t1, subst));
        default:
          return void 0;
      }
      break;
    }
}
function matchAll(patterns, targets) {
  const list = zip(patterns, targets);
  return fold3((acc, tupledArg) => bind((subst) => matchPattern(tupledArg[0], tupledArg[1], subst), acc), empty4({
    Compare: (x, y) => comparePrimitives(x, y) | 0
  }), list);
}
function instantiate(subst, pattern) {
  switch (pattern.tag) {
    case 1:
    case 2:
      return pattern;
    case 3:
      return new Formula(3, [instantiate(subst, pattern.fields[0])]);
    case 9:
      return new Formula(9, [instantiate(subst, pattern.fields[0])]);
    case 10:
      return new Formula(10, [instantiate(subst, pattern.fields[0])]);
    case 11:
      return new Formula(11, [pattern.fields[0], instantiate(subst, pattern.fields[1])]);
    case 12:
      return new Formula(12, [pattern.fields[0], instantiate(subst, pattern.fields[1])]);
    case 4:
      return new Formula(4, [instantiate(subst, pattern.fields[0]), instantiate(subst, pattern.fields[1])]);
    case 5:
      return new Formula(5, [instantiate(subst, pattern.fields[0]), instantiate(subst, pattern.fields[1])]);
    case 6:
      return new Formula(6, [instantiate(subst, pattern.fields[0]), instantiate(subst, pattern.fields[1])]);
    case 7:
      return new Formula(7, [instantiate(subst, pattern.fields[0]), instantiate(subst, pattern.fields[1])]);
    case 8:
      return new Formula(8, [instantiate(subst, pattern.fields[0]), instantiate(subst, pattern.fields[1])]);
    default:
      return defaultArg(tryFind2(pattern.fields[0], subst), pattern);
  }
}
function permutations(lst) {
  const insertEverywhere = (x, rest) => {
    if (!isEmpty(rest)) {
      return cons(cons(x, rest), map4((p) => cons(head(rest), p), insertEverywhere(x, tail(rest))));
    } else {
      return singleton3(singleton3(x));
    }
  };
  if (!isEmpty(lst)) {
    const list_1 = permutations(tail(lst));
    return collect2(curry2(insertEverywhere)(head(lst)), list_1);
  } else {
    return singleton3(empty2());
  }
}
function recognize(forms2, premises, conclusion) {
  return tryFind((form) => {
    if (length(form.Premises) === length(premises)) {
      return exists2((arrangement) => bind((subst) => matchPattern(form.Conclusion, conclusion, subst), matchAll(form.Premises, arrangement)) != null, permutations(premises));
    } else {
      return false;
    }
  }, forms2);
}
function checkStep(rule, cited, stated) {
  if (length(rule.Premises) === length(cited)) {
    return exists2((arrangement) => bind((subst) => matchPattern(rule.Conclusion, stated, subst), matchAll(rule.Premises, arrangement)) != null, permutations(cited));
  } else {
    return false;
  }
}
var ProofStep = class extends Record {
  constructor(Formula2, Rule, Refs) {
    super();
    this.Formula = Formula2;
    this.Rule = Rule;
    this.Refs = Refs;
  }
};
function size(f) {
  let matchResult, a, a_1, b;
  switch (f.tag) {
    case 3: {
      matchResult = 1;
      a = f.fields[0];
      break;
    }
    case 9: {
      matchResult = 1;
      a = f.fields[0];
      break;
    }
    case 10: {
      matchResult = 1;
      a = f.fields[0];
      break;
    }
    case 11: {
      matchResult = 1;
      a = f.fields[1];
      break;
    }
    case 12: {
      matchResult = 1;
      a = f.fields[1];
      break;
    }
    case 4: {
      matchResult = 2;
      a_1 = f.fields[0];
      b = f.fields[1];
      break;
    }
    case 5: {
      matchResult = 2;
      a_1 = f.fields[0];
      b = f.fields[1];
      break;
    }
    case 6: {
      matchResult = 2;
      a_1 = f.fields[0];
      b = f.fields[1];
      break;
    }
    case 7: {
      matchResult = 2;
      a_1 = f.fields[0];
      b = f.fields[1];
      break;
    }
    case 8: {
      matchResult = 2;
      a_1 = f.fields[0];
      b = f.fields[1];
      break;
    }
    default:
      matchResult = 0;
  }
  switch (matchResult) {
    case 0:
      return 1;
    case 1:
      return 1 + size(a) | 0;
    default:
      return 1 + size(a_1) + size(b) | 0;
  }
}
function subformulas(f) {
  return cons(f, f.tag === 1 ? empty2() : f.tag === 2 ? empty2() : f.tag === 3 ? subformulas(f.fields[0]) : f.tag === 9 ? subformulas(f.fields[0]) : f.tag === 10 ? subformulas(f.fields[0]) : f.tag === 11 ? subformulas(f.fields[1]) : f.tag === 12 ? subformulas(f.fields[1]) : f.tag === 4 ? append(subformulas(f.fields[0]), subformulas(f.fields[1])) : f.tag === 5 ? append(subformulas(f.fields[0]), subformulas(f.fields[1])) : f.tag === 6 ? append(subformulas(f.fields[0]), subformulas(f.fields[1])) : f.tag === 7 ? append(subformulas(f.fields[0]), subformulas(f.fields[1])) : f.tag === 8 ? append(subformulas(f.fields[0]), subformulas(f.fields[1])) : empty2());
}
function prove(premises, goal) {
  const steps = [];
  const known = (f) => exists((tupledArg) => equals(tupledArg[0], f), steps);
  const enumerator = getEnumerator(premises);
  try {
    while (enumerator["System.Collections.IEnumerator.MoveNext"]()) {
      const p = enumerator["System.Collections.Generic.IEnumerator`1.get_Current"]();
      if (!known(p)) {
        void steps.push([p, "premise", empty2()]);
      }
    }
  } finally {
    disposeSafe(enumerator);
  }
  const universe = List_distinct(collect2(subformulas, append(premises, singleton3(goal))), {
    Equals: equals,
    GetHashCode: (x) => safeHash(x) | 0
  });
  const sizeLimit = max2(map4((f_2) => size(f_2) | 0, append(premises, singleton3(goal))), {
    Compare: (x_1, y_1) => comparePrimitives(x_1, y_1) | 0
  }) * 2 + 2 | 0;
  let found = known(goal);
  let round = 0;
  const chainRules = filter2((r) => !(containsFO(r.Conclusion) ? true : exists2(containsFO, r.Premises)), validForms);
  while (!found && round < 6 && steps.length < 120) {
    round = round + 1 | 0;
    const snapshot = steps.length | 0;
    const enumerator_1 = getEnumerator(chainRules);
    try {
      while (enumerator_1["System.Collections.IEnumerator.MoveNext"]()) {
        let matchValue;
        const rule = enumerator_1["System.Collections.Generic.IEnumerator`1.get_Current"]();
        const enumerator_2 = getEnumerator((matchValue = length(rule.Premises) | 0, matchValue === 1 ? toList(delay(() => map3(singleton3, rangeDouble(0, 1, snapshot - 1)))) : matchValue === 2 ? toList(delay(() => collect((i_1) => map3((j) => ofArray([i_1, j]), rangeDouble(0, 1, snapshot - 1)), rangeDouble(0, 1, snapshot - 1)))) : matchValue === 3 ? snapshot <= 20 ? toList(delay(() => collect((i_2) => collect((j_1) => map3((k) => ofArray([i_2, j_1, k]), rangeDouble(0, 1, snapshot - 1)), rangeDouble(0, 1, snapshot - 1)), rangeDouble(0, 1, snapshot - 1)))) : empty2() : empty2()));
        try {
          while (enumerator_2["System.Collections.IEnumerator.MoveNext"]()) {
            const indices = enumerator_2["System.Collections.Generic.IEnumerator`1.get_Current"]();
            if (!found && steps.length < 120) {
              const matchValue_1 = matchAll(rule.Premises, map4((i_3) => item(i_3, steps)[0], indices));
              if (matchValue_1 != null) {
                const subst = matchValue_1;
                const unbound = filter2((v) => !containsKey(v, subst), atoms(rule.Conclusion));
                const enumerator_3 = getEnumerator(!isEmpty(unbound) ? isEmpty(tail(unbound)) ? map4((u) => add2(head(unbound), u, subst), universe) : empty2() : singleton3(subst));
                try {
                  while (enumerator_3["System.Collections.IEnumerator.MoveNext"]()) {
                    const s = enumerator_3["System.Collections.Generic.IEnumerator`1.get_Current"]();
                    if (!found && steps.length < 120) {
                      const derived = instantiate(s, rule.Conclusion);
                      if (size(derived) <= sizeLimit && !known(derived)) {
                        void steps.push([derived, rule.Title, map4((i_4) => i_4 + 1 | 0, indices)]);
                        if (equals(derived, goal)) {
                          found = true;
                        }
                      }
                    }
                  }
                } finally {
                  disposeSafe(enumerator_3);
                }
              }
            }
          }
        } finally {
          disposeSafe(enumerator_2);
        }
      }
    } finally {
      disposeSafe(enumerator_1);
    }
  }
  if (!found) {
    return void 0;
  } else {
    const neededFrom = (idx, acc) => {
      const patternInput_1 = item(idx, steps);
      return fold3((a, r_1) => neededFrom(r_1 - 1, a), add(idx, acc), patternInput_1[2]);
    };
    const needed = sort(toList2(neededFrom(findIndex((tupledArg_1) => equals(tupledArg_1[0], goal), steps), empty3({
      Compare: (x_2, y_2) => comparePrimitives(x_2, y_2) | 0
    }))), {
      Compare: (x_3, y_3) => comparePrimitives(x_3, y_3) | 0
    });
    const renumber = ofList2(mapIndexed((newIdx, oldIdx) => [oldIdx, newIdx + 1], needed), {
      Compare: (x_4, y_4) => comparePrimitives(x_4, y_4) | 0
    });
    return map4((oldIdx_1) => {
      const patternInput_2 = item(oldIdx_1, steps);
      return new ProofStep(patternInput_2[0], patternInput_2[1], map4((r_2) => FSharpMap__get_Item(renumber, r_2 - 1) | 0, patternInput_2[2]));
    }, needed);
  }
}
function suggestRepairs(premises, conclusion) {
  const literals = collect2((a) => ofArray([new Formula(0, [a]), new Formula(3, [new Formula(0, [a])])]), List_distinct(collect2(atoms, append(premises, singleton3(conclusion))), {
    Equals: (x, y) => x === y,
    GetHashCode: (x) => stringHash(x) | 0
  }));
  const atomOf = (lit) => {
    let matchResult, a_1, a_2;
    switch (lit.tag) {
      case 0: {
        matchResult = 0;
        a_1 = lit.fields[0];
        break;
      }
      case 3: {
        if (lit.fields[0].tag === 0) {
          matchResult = 1;
          a_2 = lit.fields[0].fields[0];
        } else {
          matchResult = 2;
        }
        break;
      }
      default:
        matchResult = 2;
    }
    switch (matchResult) {
      case 0:
        return a_1;
      case 1:
        return a_2;
      default:
        return "";
    }
  };
  return truncate(2, fold3((kept, c_3) => {
    if (exists2((k) => equivalent(k, c_3), kept)) {
      return kept;
    } else {
      return append(kept, singleton3(c_3));
    }
  }, empty2(), sortBy((f_1) => size(f_1) | 0, filter2((c_2) => {
    if (checkArgument(cons(c_2, premises), conclusion).IsValid && !equals(truthTable(fold3((acc, p) => new Formula(4, [acc, p]), c_2, premises)).Verdict, new Verdict(1, []))) {
      return !equals(truthTable(new Formula(7, [c_2, conclusion])).Verdict, new Verdict(0, []));
    } else {
      return false;
    }
  }, append(literals, toList(delay(() => collect((x_1) => collect((y_1) => atomOf(x_1) !== atomOf(y_1) ? singleton2(new Formula(7, [x_1, y_1])) : empty(), literals), literals))))), {
    Compare: (x_2, y_2) => comparePrimitives(x_2, y_2) | 0
  })));
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

// src/core/Prose.js
var reserved = ofSeq3(["if", "then", "and", "or", "not", "either", "neither", "nor", "implies", "iff", "necessarily", "possibly", "all", "no", "some", "every", "are", "is", "a", "an", "therefore", "thus", "hence", "true", "false"], {
  Compare: (x, y) => comparePrimitives(x, y) | 0
});
function lower(w) {
  return w.toLowerCase();
}
function normalize(s) {
  return replace(replace(replace(replace(replace(trimEnd(s.trim(), "."), ",", " "), " if and only if ", " iff "), "it is not the case that ", "not "), "it is necessary that ", "necessarily "), "it is possible that ", "possibly ");
}
function tokenize(s) {
  return ofArray(split(replace(replace(normalize(s), "(", " ( "), ")", " ) "), [" ", "	"], void 0, 1));
}
function isName(w) {
  if (w.length > 0 && isLetter(w[0])) {
    return forAll((c) => {
      if (isLetterOrDigit(c) ? true : c === "_") {
        return true;
      } else {
        return c === "-";
      }
    }, w.split(""));
  } else {
    return false;
  }
}
var irregularPlurals = ofSeq4([["men", "man"], ["women", "woman"], ["children", "child"], ["people", "person"], ["feet", "foot"], ["teeth", "tooth"], ["mice", "mouse"], ["geese", "goose"]], {
  Compare: (x, y) => comparePrimitives(x, y) | 0
});
function singular(w) {
  const matchValue = tryFind2(w, irregularPlurals);
  if (matchValue == null) {
    if (w.endsWith("ies") && w.length > 3) {
      return substring(w, 0, w.length - 3) + "y";
    } else if (exists2((value2) => w.endsWith(value2), ofArray(["ses", "xes", "zes", "ches", "shes"]))) {
      return substring(w, 0, w.length - 2);
    } else if (w.endsWith("s") && !w.endsWith("ss") && w.length > 2) {
      return substring(w, 0, w.length - 1);
    } else {
      return w;
    }
  } else {
    return matchValue;
  }
}
function categorical(ws) {
  const p = (name, arg) => new Formula(1, [singular(lower(name)), singleton3(lower(arg))]);
  const matchValue = map4((w) => [w, lower(w)], ws);
  let matchResult, s, t, s_1, t_1, s_2, t_2, s_3, t_3, s_4, t_4, s_5, t_5, subj, t_6, subj_1, t_7;
  if (!isEmpty(matchValue)) {
    switch (head(matchValue)[1]) {
      case "all": {
        if (!isEmpty(tail(matchValue))) {
          if (!isEmpty(tail(tail(matchValue)))) {
            switch (head(tail(tail(matchValue)))[1]) {
              case "are": {
                if (isEmpty(tail(tail(tail(matchValue))))) {
                  if (head(tail(matchValue))[1] === "is") {
                    matchResult = 7;
                    subj_1 = head(matchValue)[0];
                    t_7 = head(tail(tail(matchValue)))[0];
                  } else {
                    matchResult = 8;
                  }
                } else if (isEmpty(tail(tail(tail(tail(matchValue)))))) {
                  matchResult = 0;
                  s = head(tail(matchValue))[0];
                  t = head(tail(tail(tail(matchValue))))[0];
                } else {
                  matchResult = 8;
                }
                break;
              }
              case "a": {
                if (isEmpty(tail(tail(tail(matchValue))))) {
                  if (head(tail(matchValue))[1] === "is") {
                    matchResult = 7;
                    subj_1 = head(matchValue)[0];
                    t_7 = head(tail(tail(matchValue)))[0];
                  } else {
                    matchResult = 8;
                  }
                } else if (isEmpty(tail(tail(tail(tail(matchValue)))))) {
                  if (head(tail(matchValue))[1] === "is") {
                    matchResult = 6;
                    subj = head(matchValue)[0];
                    t_6 = head(tail(tail(tail(matchValue))))[0];
                  } else {
                    matchResult = 8;
                  }
                } else {
                  matchResult = 8;
                }
                break;
              }
              case "an": {
                if (isEmpty(tail(tail(tail(matchValue))))) {
                  if (head(tail(matchValue))[1] === "is") {
                    matchResult = 7;
                    subj_1 = head(matchValue)[0];
                    t_7 = head(tail(tail(matchValue)))[0];
                  } else {
                    matchResult = 8;
                  }
                } else if (isEmpty(tail(tail(tail(tail(matchValue)))))) {
                  if (head(tail(matchValue))[1] === "is") {
                    matchResult = 6;
                    subj = head(matchValue)[0];
                    t_6 = head(tail(tail(tail(matchValue))))[0];
                  } else {
                    matchResult = 8;
                  }
                } else {
                  matchResult = 8;
                }
                break;
              }
              default:
                if (isEmpty(tail(tail(tail(matchValue))))) {
                  if (head(tail(matchValue))[1] === "is") {
                    matchResult = 7;
                    subj_1 = head(matchValue)[0];
                    t_7 = head(tail(tail(matchValue)))[0];
                  } else {
                    matchResult = 8;
                  }
                } else {
                  matchResult = 8;
                }
            }
          } else {
            matchResult = 8;
          }
        } else {
          matchResult = 8;
        }
        break;
      }
      case "no": {
        if (!isEmpty(tail(matchValue))) {
          if (!isEmpty(tail(tail(matchValue)))) {
            switch (head(tail(tail(matchValue)))[1]) {
              case "are": {
                if (isEmpty(tail(tail(tail(matchValue))))) {
                  if (head(tail(matchValue))[1] === "is") {
                    matchResult = 7;
                    subj_1 = head(matchValue)[0];
                    t_7 = head(tail(tail(matchValue)))[0];
                  } else {
                    matchResult = 8;
                  }
                } else if (isEmpty(tail(tail(tail(tail(matchValue)))))) {
                  matchResult = 1;
                  s_1 = head(tail(matchValue))[0];
                  t_1 = head(tail(tail(tail(matchValue))))[0];
                } else {
                  matchResult = 8;
                }
                break;
              }
              case "a": {
                if (isEmpty(tail(tail(tail(matchValue))))) {
                  if (head(tail(matchValue))[1] === "is") {
                    matchResult = 7;
                    subj_1 = head(matchValue)[0];
                    t_7 = head(tail(tail(matchValue)))[0];
                  } else {
                    matchResult = 8;
                  }
                } else if (isEmpty(tail(tail(tail(tail(matchValue)))))) {
                  if (head(tail(matchValue))[1] === "is") {
                    matchResult = 6;
                    subj = head(matchValue)[0];
                    t_6 = head(tail(tail(tail(matchValue))))[0];
                  } else {
                    matchResult = 8;
                  }
                } else {
                  matchResult = 8;
                }
                break;
              }
              case "an": {
                if (isEmpty(tail(tail(tail(matchValue))))) {
                  if (head(tail(matchValue))[1] === "is") {
                    matchResult = 7;
                    subj_1 = head(matchValue)[0];
                    t_7 = head(tail(tail(matchValue)))[0];
                  } else {
                    matchResult = 8;
                  }
                } else if (isEmpty(tail(tail(tail(tail(matchValue)))))) {
                  if (head(tail(matchValue))[1] === "is") {
                    matchResult = 6;
                    subj = head(matchValue)[0];
                    t_6 = head(tail(tail(tail(matchValue))))[0];
                  } else {
                    matchResult = 8;
                  }
                } else {
                  matchResult = 8;
                }
                break;
              }
              default:
                if (isEmpty(tail(tail(tail(matchValue))))) {
                  if (head(tail(matchValue))[1] === "is") {
                    matchResult = 7;
                    subj_1 = head(matchValue)[0];
                    t_7 = head(tail(tail(matchValue)))[0];
                  } else {
                    matchResult = 8;
                  }
                } else {
                  matchResult = 8;
                }
            }
          } else {
            matchResult = 8;
          }
        } else {
          matchResult = 8;
        }
        break;
      }
      case "some": {
        if (!isEmpty(tail(matchValue))) {
          if (!isEmpty(tail(tail(matchValue)))) {
            switch (head(tail(tail(matchValue)))[1]) {
              case "are": {
                if (isEmpty(tail(tail(tail(matchValue))))) {
                  if (head(tail(matchValue))[1] === "is") {
                    matchResult = 7;
                    subj_1 = head(matchValue)[0];
                    t_7 = head(tail(tail(matchValue)))[0];
                  } else {
                    matchResult = 8;
                  }
                } else if (head(tail(tail(tail(matchValue))))[1] === "not") {
                  if (isEmpty(tail(tail(tail(tail(matchValue)))))) {
                    matchResult = 3;
                    s_3 = head(tail(matchValue))[0];
                    t_3 = head(tail(tail(tail(matchValue))))[0];
                  } else if (isEmpty(tail(tail(tail(tail(tail(matchValue))))))) {
                    matchResult = 2;
                    s_2 = head(tail(matchValue))[0];
                    t_2 = head(tail(tail(tail(tail(matchValue)))))[0];
                  } else {
                    matchResult = 8;
                  }
                } else if (isEmpty(tail(tail(tail(tail(matchValue)))))) {
                  matchResult = 3;
                  s_3 = head(tail(matchValue))[0];
                  t_3 = head(tail(tail(tail(matchValue))))[0];
                } else {
                  matchResult = 8;
                }
                break;
              }
              case "a": {
                if (isEmpty(tail(tail(tail(matchValue))))) {
                  if (head(tail(matchValue))[1] === "is") {
                    matchResult = 7;
                    subj_1 = head(matchValue)[0];
                    t_7 = head(tail(tail(matchValue)))[0];
                  } else {
                    matchResult = 8;
                  }
                } else if (isEmpty(tail(tail(tail(tail(matchValue)))))) {
                  if (head(tail(matchValue))[1] === "is") {
                    matchResult = 6;
                    subj = head(matchValue)[0];
                    t_6 = head(tail(tail(tail(matchValue))))[0];
                  } else {
                    matchResult = 8;
                  }
                } else {
                  matchResult = 8;
                }
                break;
              }
              case "an": {
                if (isEmpty(tail(tail(tail(matchValue))))) {
                  if (head(tail(matchValue))[1] === "is") {
                    matchResult = 7;
                    subj_1 = head(matchValue)[0];
                    t_7 = head(tail(tail(matchValue)))[0];
                  } else {
                    matchResult = 8;
                  }
                } else if (isEmpty(tail(tail(tail(tail(matchValue)))))) {
                  if (head(tail(matchValue))[1] === "is") {
                    matchResult = 6;
                    subj = head(matchValue)[0];
                    t_6 = head(tail(tail(tail(matchValue))))[0];
                  } else {
                    matchResult = 8;
                  }
                } else {
                  matchResult = 8;
                }
                break;
              }
              default:
                if (isEmpty(tail(tail(tail(matchValue))))) {
                  if (head(tail(matchValue))[1] === "is") {
                    matchResult = 7;
                    subj_1 = head(matchValue)[0];
                    t_7 = head(tail(tail(matchValue)))[0];
                  } else {
                    matchResult = 8;
                  }
                } else {
                  matchResult = 8;
                }
            }
          } else {
            matchResult = 8;
          }
        } else {
          matchResult = 8;
        }
        break;
      }
      case "every": {
        if (!isEmpty(tail(matchValue))) {
          if (!isEmpty(tail(tail(matchValue)))) {
            switch (head(tail(tail(matchValue)))[1]) {
              case "is": {
                if (isEmpty(tail(tail(tail(matchValue))))) {
                  if (head(tail(matchValue))[1] === "is") {
                    matchResult = 7;
                    subj_1 = head(matchValue)[0];
                    t_7 = head(tail(tail(matchValue)))[0];
                  } else {
                    matchResult = 8;
                  }
                } else {
                  switch (head(tail(tail(tail(matchValue))))[1]) {
                    case "a": {
                      if (isEmpty(tail(tail(tail(tail(matchValue)))))) {
                        matchResult = 5;
                        s_5 = head(tail(matchValue))[0];
                        t_5 = head(tail(tail(tail(matchValue))))[0];
                      } else if (isEmpty(tail(tail(tail(tail(tail(matchValue))))))) {
                        matchResult = 4;
                        s_4 = head(tail(matchValue))[0];
                        t_4 = head(tail(tail(tail(tail(matchValue)))))[0];
                      } else {
                        matchResult = 8;
                      }
                      break;
                    }
                    case "an": {
                      if (isEmpty(tail(tail(tail(tail(matchValue)))))) {
                        matchResult = 5;
                        s_5 = head(tail(matchValue))[0];
                        t_5 = head(tail(tail(tail(matchValue))))[0];
                      } else if (isEmpty(tail(tail(tail(tail(tail(matchValue))))))) {
                        matchResult = 4;
                        s_4 = head(tail(matchValue))[0];
                        t_4 = head(tail(tail(tail(tail(matchValue)))))[0];
                      } else {
                        matchResult = 8;
                      }
                      break;
                    }
                    default:
                      if (isEmpty(tail(tail(tail(tail(matchValue)))))) {
                        matchResult = 5;
                        s_5 = head(tail(matchValue))[0];
                        t_5 = head(tail(tail(tail(matchValue))))[0];
                      } else {
                        matchResult = 8;
                      }
                  }
                }
                break;
              }
              case "a": {
                if (isEmpty(tail(tail(tail(matchValue))))) {
                  if (head(tail(matchValue))[1] === "is") {
                    matchResult = 7;
                    subj_1 = head(matchValue)[0];
                    t_7 = head(tail(tail(matchValue)))[0];
                  } else {
                    matchResult = 8;
                  }
                } else if (isEmpty(tail(tail(tail(tail(matchValue)))))) {
                  if (head(tail(matchValue))[1] === "is") {
                    matchResult = 6;
                    subj = head(matchValue)[0];
                    t_6 = head(tail(tail(tail(matchValue))))[0];
                  } else {
                    matchResult = 8;
                  }
                } else {
                  matchResult = 8;
                }
                break;
              }
              case "an": {
                if (isEmpty(tail(tail(tail(matchValue))))) {
                  if (head(tail(matchValue))[1] === "is") {
                    matchResult = 7;
                    subj_1 = head(matchValue)[0];
                    t_7 = head(tail(tail(matchValue)))[0];
                  } else {
                    matchResult = 8;
                  }
                } else if (isEmpty(tail(tail(tail(tail(matchValue)))))) {
                  if (head(tail(matchValue))[1] === "is") {
                    matchResult = 6;
                    subj = head(matchValue)[0];
                    t_6 = head(tail(tail(tail(matchValue))))[0];
                  } else {
                    matchResult = 8;
                  }
                } else {
                  matchResult = 8;
                }
                break;
              }
              default:
                if (isEmpty(tail(tail(tail(matchValue))))) {
                  if (head(tail(matchValue))[1] === "is") {
                    matchResult = 7;
                    subj_1 = head(matchValue)[0];
                    t_7 = head(tail(tail(matchValue)))[0];
                  } else {
                    matchResult = 8;
                  }
                } else {
                  matchResult = 8;
                }
            }
          } else {
            matchResult = 8;
          }
        } else {
          matchResult = 8;
        }
        break;
      }
      default:
        if (!isEmpty(tail(matchValue))) {
          if (head(tail(matchValue))[1] === "is") {
            if (!isEmpty(tail(tail(matchValue)))) {
              switch (head(tail(tail(matchValue)))[1]) {
                case "a": {
                  if (isEmpty(tail(tail(tail(matchValue))))) {
                    matchResult = 7;
                    subj_1 = head(matchValue)[0];
                    t_7 = head(tail(tail(matchValue)))[0];
                  } else if (isEmpty(tail(tail(tail(tail(matchValue)))))) {
                    matchResult = 6;
                    subj = head(matchValue)[0];
                    t_6 = head(tail(tail(tail(matchValue))))[0];
                  } else {
                    matchResult = 8;
                  }
                  break;
                }
                case "an": {
                  if (isEmpty(tail(tail(tail(matchValue))))) {
                    matchResult = 7;
                    subj_1 = head(matchValue)[0];
                    t_7 = head(tail(tail(matchValue)))[0];
                  } else if (isEmpty(tail(tail(tail(tail(matchValue)))))) {
                    matchResult = 6;
                    subj = head(matchValue)[0];
                    t_6 = head(tail(tail(tail(matchValue))))[0];
                  } else {
                    matchResult = 8;
                  }
                  break;
                }
                default:
                  if (isEmpty(tail(tail(tail(matchValue))))) {
                    matchResult = 7;
                    subj_1 = head(matchValue)[0];
                    t_7 = head(tail(tail(matchValue)))[0];
                  } else {
                    matchResult = 8;
                  }
              }
            } else {
              matchResult = 8;
            }
          } else {
            matchResult = 8;
          }
        } else {
          matchResult = 8;
        }
    }
  } else {
    matchResult = 8;
  }
  switch (matchResult) {
    case 0:
      return new Formula(11, ["x", new Formula(7, [p(s, "x"), p(t, "x")])]);
    case 1:
      return new Formula(11, ["x", new Formula(7, [p(s_1, "x"), new Formula(3, [p(t_1, "x")])])]);
    case 2:
      return new Formula(12, ["x", new Formula(4, [p(s_2, "x"), new Formula(3, [p(t_2, "x")])])]);
    case 3:
      return new Formula(12, ["x", new Formula(4, [p(s_3, "x"), p(t_3, "x")])]);
    case 4:
      return new Formula(11, ["x", new Formula(7, [p(s_4, "x"), p(t_4, "x")])]);
    case 5:
      return new Formula(11, ["x", new Formula(7, [p(s_5, "x"), p(t_5, "x")])]);
    case 6:
      return p(t_6, subj);
    case 7:
      return p(t_7, subj_1);
    default:
      return void 0;
  }
}
function parseTop(ts) {
  return parseIff(ts);
}
function parseIff(ts) {
  return Result_Bind((tupledArg) => {
    const l = tupledArg[0];
    const rest = tupledArg[1];
    let matchResult, more_1, w_1;
    if (!isEmpty(rest)) {
      if (lower(head(rest)) === "iff") {
        matchResult = 0;
        more_1 = tail(rest);
        w_1 = head(rest);
      } else {
        matchResult = 1;
      }
    } else {
      matchResult = 1;
    }
    switch (matchResult) {
      case 0:
        return Result_Map((tupledArg_1) => [new Formula(8, [l, tupledArg_1[0]]), tupledArg_1[1]], parseImp(more_1));
      default:
        return new FSharpResult$2(0, [[l, rest]]);
    }
  }, parseImp(ts));
}
function parseImp(ts) {
  let matchResult, rest_1, w_1;
  if (!isEmpty(ts)) {
    if (lower(head(ts)) === "if") {
      matchResult = 0;
      rest_1 = tail(ts);
      w_1 = head(ts);
    } else {
      matchResult = 1;
    }
  } else {
    matchResult = 1;
  }
  switch (matchResult) {
    case 0:
      return Result_Bind((tupledArg) => {
        const rest$0027 = tupledArg[1];
        let matchResult_1, more_1, t_1;
        if (!isEmpty(rest$0027)) {
          if (lower(head(rest$0027)) === "then") {
            matchResult_1 = 0;
            more_1 = tail(rest$0027);
            t_1 = head(rest$0027);
          } else {
            matchResult_1 = 1;
          }
        } else {
          matchResult_1 = 1;
        }
        switch (matchResult_1) {
          case 0:
            return Result_Map((tupledArg_1) => [new Formula(7, [tupledArg[0], tupledArg_1[0]]), tupledArg_1[1]], parseTop(more_1));
          default:
            return new FSharpResult$2(1, ["expected 'then' to close the 'if \u2026' clause"]);
        }
      }, parseOr(rest_1));
    default:
      return Result_Bind((tupledArg_2) => {
        const l = tupledArg_2[0];
        const rest_2 = tupledArg_2[1];
        let matchResult_2, more_3, w_3;
        if (!isEmpty(rest_2)) {
          if (lower(head(rest_2)) === "implies") {
            matchResult_2 = 0;
            more_3 = tail(rest_2);
            w_3 = head(rest_2);
          } else {
            matchResult_2 = 1;
          }
        } else {
          matchResult_2 = 1;
        }
        switch (matchResult_2) {
          case 0:
            return Result_Map((tupledArg_3) => [new Formula(7, [l, tupledArg_3[0]]), tupledArg_3[1]], parseImp(more_3));
          default:
            return new FSharpResult$2(0, [[l, rest_2]]);
        }
      }, parseOr(ts));
  }
}
function parseOr(ts) {
  return Result_Bind((tupledArg) => {
    const loop = (acc, toks) => {
      let matchResult, more_3, w_3;
      if (!isEmpty(toks)) {
        if (lower(head(toks)) === "or") {
          matchResult = 0;
          more_3 = tail(toks);
          w_3 = head(toks);
        } else {
          matchResult = 1;
        }
      } else {
        matchResult = 1;
      }
      switch (matchResult) {
        case 0:
          return Result_Bind((tupledArg_1) => loop(new Formula(5, [acc, tupledArg_1[0]]), tupledArg_1[1]), parseAnd(more_3));
        default:
          return new FSharpResult$2(0, [[acc, toks]]);
      }
    };
    return loop(tupledArg[0], tupledArg[1]);
  }, parseAnd(!isEmpty(ts) ? lower(head(ts)) === "either" ? tail(ts) : ts : ts));
}
function parseAnd(ts) {
  return Result_Bind((tupledArg) => {
    const loop = (acc, toks) => {
      let matchResult, more_1, w_1;
      if (!isEmpty(toks)) {
        if (lower(head(toks)) === "and") {
          matchResult = 0;
          more_1 = tail(toks);
          w_1 = head(toks);
        } else {
          matchResult = 1;
        }
      } else {
        matchResult = 1;
      }
      switch (matchResult) {
        case 0:
          return Result_Bind((tupledArg_1) => loop(new Formula(4, [acc, tupledArg_1[0]]), tupledArg_1[1]), parseNeg(more_1));
        default:
          return new FSharpResult$2(0, [[acc, toks]]);
      }
    };
    return loop(tupledArg[0], tupledArg[1]);
  }, parseNeg(ts));
}
function parseNeg(ts) {
  let matchResult, more_4, w_4, more_5, w_5, more_6, w_6, more_7, w_7;
  if (!isEmpty(ts)) {
    if (lower(head(ts)) === "not") {
      matchResult = 0;
      more_4 = tail(ts);
      w_4 = head(ts);
    } else if (lower(head(ts)) === "necessarily") {
      matchResult = 1;
      more_5 = tail(ts);
      w_5 = head(ts);
    } else if (lower(head(ts)) === "possibly") {
      matchResult = 2;
      more_6 = tail(ts);
      w_6 = head(ts);
    } else if (lower(head(ts)) === "neither") {
      matchResult = 3;
      more_7 = tail(ts);
      w_7 = head(ts);
    } else {
      matchResult = 4;
    }
  } else {
    matchResult = 4;
  }
  switch (matchResult) {
    case 0:
      return Result_Map((tupledArg) => [new Formula(3, [tupledArg[0]]), tupledArg[1]], parseNeg(more_4));
    case 1:
      return Result_Map((tupledArg_1) => [new Formula(9, [tupledArg_1[0]]), tupledArg_1[1]], parseNeg(more_5));
    case 2:
      return Result_Map((tupledArg_2) => [new Formula(10, [tupledArg_2[0]]), tupledArg_2[1]], parseNeg(more_6));
    case 3:
      return Result_Bind((tupledArg_3) => {
        const rest = tupledArg_3[1];
        let matchResult_1, r2_1, t_1;
        if (!isEmpty(rest)) {
          if (lower(head(rest)) === "nor") {
            matchResult_1 = 0;
            r2_1 = tail(rest);
            t_1 = head(rest);
          } else {
            matchResult_1 = 1;
          }
        } else {
          matchResult_1 = 1;
        }
        switch (matchResult_1) {
          case 0:
            return Result_Map((tupledArg_4) => [new Formula(4, [new Formula(3, [tupledArg_3[0]]), new Formula(3, [tupledArg_4[0]])]), tupledArg_4[1]], parseNeg(r2_1));
          default:
            return new FSharpResult$2(1, ["expected 'nor' after 'neither'"]);
        }
      }, parseAnd(more_7));
    default:
      return parseAtom(ts);
  }
}
function parseAtom(ts) {
  let w_3;
  if (isEmpty(ts)) {
    return new FSharpResult$2(1, ["the sentence ended unexpectedly"]);
  } else if (lower(head(ts)) === "(") {
    return Result_Bind((tupledArg) => {
      const rest = tupledArg[1];
      let matchResult, r_1, t_1;
      if (!isEmpty(rest)) {
        if (lower(head(rest)) === ")") {
          matchResult = 0;
          r_1 = tail(rest);
          t_1 = head(rest);
        } else {
          matchResult = 1;
        }
      } else {
        matchResult = 1;
      }
      switch (matchResult) {
        case 0:
          return new FSharpResult$2(0, [[tupledArg[0], r_1]]);
        default:
          return new FSharpResult$2(1, ["expected ')'"]);
      }
    }, parseTop(tail(ts)));
  } else if (lower(head(ts)) === "true") {
    return new FSharpResult$2(0, [[new Formula(2, [true]), tail(ts)]]);
  } else if (lower(head(ts)) === "false") {
    return new FSharpResult$2(0, [[new Formula(2, [false]), tail(ts)]]);
  } else if (w_3 = head(ts), isName(w_3) && !contains2(lower(w_3), reserved)) {
    return new FSharpResult$2(0, [[new Formula(0, [head(ts)]), tail(ts)]]);
  } else {
    return new FSharpResult$2(1, [toText(printf("didn't expect '%s' here"))(head(ts))]);
  }
}
function parseSentence(text) {
  const ws = tokenize(text);
  if (isEmpty(ws)) {
    return new FSharpResult$2(1, ["empty sentence"]);
  } else {
    const matchValue = categorical(ws);
    if (matchValue == null) {
      return Result_Bind((tupledArg) => {
        let arg;
        const rest = tupledArg[1];
        if (isEmpty(rest)) {
          return new FSharpResult$2(0, [tupledArg[0]]);
        } else {
          return new FSharpResult$2(1, [(arg = join(" ", rest), toText(printf("didn't understand the rest of the sentence: '%s'"))(arg))]);
        }
      }, parseTop(ws));
    } else {
      return new FSharpResult$2(0, [matchValue]);
    }
  }
}
var markers = ofSeq3(["therefore", "thus", "hence"], {
  Compare: (x, y) => comparePrimitives(x, y) | 0
});
function firstWord(s) {
  return defaultArg(map((w) => trim(lower(w), ",", ";", ".", ":"), tryHead(split(s.trim(), [" ", "	"], void 0, 1))), "");
}
function tryParseArgument(line) {
  let i, array_1, s_3, t, sp, idx;
  let patternInput;
  const matchValue = line.indexOf(":") | 0;
  if (i = matchValue | 0, i > 0 && forAll((c) => {
    if (isLetterOrDigit(c) ? true : c === "-") {
      return true;
    } else {
      return c === "_";
    }
  }, substring(line, 0, i).trim().split(""))) {
    const i_1 = matchValue | 0;
    patternInput = [substring(line, 0, i_1).trim(), substring(line, i_1 + 1)];
  } else {
    patternInput = ["", line];
  }
  const sentences = ofArray((array_1 = map2((s) => s.trim(), split(patternInput[1], ["."], void 0, 0)), array_1.filter((s_1) => s_1 !== "")));
  const matchValue_1 = tryFindIndex2((s_2) => contains2(firstWord(s_2), markers), sentences);
  let matchResult, idx_1;
  if (matchValue_1 != null) {
    if (idx = matchValue_1 | 0, length(sentences) >= 2) {
      matchResult = 0;
      idx_1 = matchValue_1;
    } else {
      matchResult = 1;
    }
  } else {
    matchResult = 1;
  }
  switch (matchResult) {
    case 0: {
      const parsedPremises = map4(parseSentence, map4((tuple) => tuple[1], filter2((tupledArg) => tupledArg[0] !== idx_1, mapIndexed((i_2, s_4) => [i_2, s_4], sentences))));
      const matchValue_2 = parseSentence((s_3 = item2(idx_1, sentences), t = s_3.trim(), sp = t.indexOf(" ") | 0, sp > 0 ? substring(t, sp + 1).trim() : ""));
      let matchResult_1;
      if (matchValue_2.tag === 0) {
        if (forAll2((_arg_1) => {
          if (_arg_1.tag === 0) {
            return true;
          } else {
            return false;
          }
        }, parsedPremises)) {
          matchResult_1 = 0;
        } else {
          matchResult_1 = 1;
        }
      } else {
        matchResult_1 = 1;
      }
      switch (matchResult_1) {
        case 0:
          return [patternInput[0], map4((_arg_2) => {
            if (_arg_2.tag === 0) {
              return _arg_2.fields[0];
            } else {
              return new Formula(2, [true]);
            }
          }, parsedPremises), matchValue_2.fields[0]];
        default:
          return void 0;
      }
    }
    default:
      return void 0;
  }
}

// src/core/fable_modules/fable-library-js.5.6.0/Int32.js
var NumberStyles = {
  // None: 0x00000000,
  // AllowLeadingWhite: 0x00000001,
  // AllowTrailingWhite: 0x00000002,
  // AllowLeadingSign: 0x00000004,
  // AllowTrailingSign: 0x00000008,
  // AllowParentheses: 0x00000010,
  // AllowDecimalPoint: 0x00000020,
  // AllowThousands: 0x00000040,
  // AllowExponent: 0x00000080,
  // AllowCurrencySymbol: 0x00000100,
  AllowHexSpecifier: 512
  // Integer = AllowLeadingWhite | AllowTrailingWhite | AllowLeadingSign,
  // HexNumber = AllowLeadingWhite | AllowTrailingWhite | AllowHexSpecifier,
  // Number = AllowLeadingWhite | AllowTrailingWhite | AllowLeadingSign |
  //          AllowTrailingSign | AllowDecimalPoint | AllowThousands,
  // Float = AllowLeadingWhite | AllowTrailingWhite | AllowLeadingSign |
  //         AllowDecimalPoint | AllowExponent,
  // Currency = AllowLeadingWhite | AllowTrailingWhite | AllowLeadingSign | AllowTrailingSign |
  //            AllowParentheses | AllowDecimalPoint | AllowThousands | AllowCurrencySymbol,
  // Any = AllowLeadingWhite | AllowTrailingWhite | AllowLeadingSign | AllowTrailingSign |
  //       AllowParentheses | AllowDecimalPoint | AllowThousands | AllowCurrencySymbol | AllowExponent,
};
function validResponse(regexMatch, radix) {
  const [
    /*all*/
    ,
    sign,
    prefix,
    digits
  ] = regexMatch;
  return {
    sign: sign || "",
    prefix: prefix || "",
    digits,
    radix
  };
}
function getRange(unsigned, bitsize) {
  switch (bitsize) {
    case 8:
      return unsigned ? [0, 255] : [-128, 127];
    case 16:
      return unsigned ? [0, 65535] : [-32768, 32767];
    case 32:
      return unsigned ? [0, 4294967295] : [-2147483648, 2147483647];
    default:
      throw new Exception("Invalid bit size.");
  }
}
function getInvalidDigits(radix) {
  switch (radix) {
    case 2:
      return /[^0-1]/;
    case 8:
      return /[^0-7]/;
    case 10:
      return /[^0-9]/;
    case 16:
      return /[^0-9a-fA-F]/;
    default:
      throw new Exception("Invalid Base.");
  }
}
function getRadix(prefix, style) {
  if (style & NumberStyles.AllowHexSpecifier) {
    return 16;
  } else {
    switch (prefix) {
      case "0b":
      case "0B":
        return 2;
      case "0o":
      case "0O":
        return 8;
      case "0x":
      case "0X":
        return 16;
      default:
        return 10;
    }
  }
}
function isValid(str, style, radix) {
  const integerRegex = /^\s*([\+\-])?(0[xXoObB])?([0-9a-fA-F]+)\s*$/;
  const res = integerRegex.exec(str.replace(/_/g, ""));
  if (res != null) {
    const [
      /*all*/
      ,
      /*sign*/
      ,
      prefix,
      digits
    ] = res;
    radix = radix || getRadix(prefix, style);
    const invalidDigits = getInvalidDigits(radix);
    if (!invalidDigits.test(digits)) {
      return validResponse(res, radix);
    }
  }
  return null;
}
function parse(str, style, unsigned, bitsize, radix) {
  const res = isValid(str, style, radix);
  if (res != null) {
    let v = Number.parseInt(res.sign + res.digits, res.radix);
    if (!Number.isNaN(v)) {
      const [umin, umax] = getRange(true, bitsize);
      if (!unsigned && res.radix !== 10 && v >= umin && v <= umax) {
        v = v << 32 - bitsize >> 32 - bitsize;
      }
      const [min2, max3] = getRange(unsigned, bitsize);
      if (v >= min2 && v <= max3) {
        return v;
      }
    }
  }
  throw new Exception(`The input string ${str} was not in a correct format.`);
}

// src/core/Parser.js
function parseAny(text) {
  return parseSentence(text);
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
    return forAll((c) => {
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
function tryRef(s) {
  const s_1 = s.trimStart();
  if (s_1.startsWith('"')) {
    const matchValue = s_1.indexOf('"', 1) | 0;
    if (matchValue === -1) {
      return void 0;
    } else {
      const close = matchValue | 0;
      return [new RelRef(1, [substring(s_1, 1, close - 1)]), substring(s_1, close + 1)];
    }
  } else {
    const len = length2(takeWhile((c) => {
      if (isLetterOrDigit(c) ? true : c === "_") {
        return true;
      } else {
        return c === "-";
      }
    }, s_1.split(""))) | 0;
    if (len === 0 ? true : !isLetter(s_1[0])) {
      return void 0;
    } else {
      return [new RelRef(0, [substring(s_1, 0, len)]), substring(s_1, len)];
    }
  }
}
var relationVerbs = ofArray([["is equivalent to", new RelationKind(4, [])], ["is-equivalent-to", new RelationKind(4, [])], ["equivalent-to", new RelationKind(4, [])], ["supports", new RelationKind(0, [])], ["presupposes", new RelationKind(1, [])], ["contradicts", new RelationKind(2, [])], ["entails", new RelationKind(3, [])]]);
function tryParseRelation(line) {
  return bind((tupledArg) => {
    const rest_1 = tupledArg[1].trimStart();
    return tryPick((tupledArg_1) => {
      const verb = tupledArg_1[0];
      if (rest_1.startsWith(verb + " ")) {
        return bind((tupledArg_2) => {
          if (tupledArg_2[1].trim() === "") {
            return new Statement(11, [tupledArg[0], tupledArg_1[1], tupledArg_2[0]]);
          } else {
            return void 0;
          }
        }, tryRef(substring(rest_1, verb.length + 1)));
      } else {
        return void 0;
      }
    }, relationVerbs);
  }, tryRef(line));
}
function parseLine(raw) {
  let s;
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
      return Result_Map((f) => new Statement(3, [name_1, f]), parseAny(substring(rest_1, idx_1 + 1).trim()));
    }
  } else if (line.startsWith("table ")) {
    const target = substring(line, 6).trim();
    if (isSingleIdentifier(target)) {
      return new FSharpResult$2(0, [new Statement(4, [new TableTarget(0, [target])])]);
    } else {
      return Result_Map((f_1) => new Statement(4, [new TableTarget(1, [f_1])]), parseAny(target));
    }
  } else if (line.startsWith("check ")) {
    const rest_2 = substring(line, 6).trim();
    const matchValue_2 = splitOnKeyword(rest_2, "equivalent");
    if (matchValue_2 == null) {
      return Result_Map((f_2) => new Statement(5, [new CheckKind(0, [f_2])]), parseAny(rest_2));
    } else {
      const r = matchValue_2[1];
      return Result_Bind((lf) => Result_Map((rf) => new Statement(5, [new CheckKind(1, [lf, rf])]), parseAny(r)), parseAny(matchValue_2[0]));
    }
  } else {
    switch (line) {
      case "analyze":
        return new FSharpResult$2(0, [new Statement(10, [])]);
      case "map":
        return new FSharpResult$2(0, [new Statement(12, [])]);
      default:
        if (line.startsWith("argument")) {
          return new FSharpResult$2(1, ["an `argument` needs `{` at the end of its first line \u2014 e.g.  argument my-point {"]);
        } else if (line.startsWith("proof")) {
          return new FSharpResult$2(1, ["a `proof` needs `{` at the end of its first line \u2014 e.g.  proof my-derivation {"]);
        } else if (line.startsWith("venn ")) {
          const target_1 = substring(line, 5).trim();
          if (s = target_1, s.length > 0 && isLetter(s[0]) && forAll((c) => {
            if (isLetterOrDigit(c) ? true : c === "_") {
              return true;
            } else {
              return c === "-";
            }
          }, s.split(""))) {
            return new FSharpResult$2(0, [new Statement(9, [target_1])]);
          } else {
            return new FSharpResult$2(1, ["write `venn <argument-name>` to draw an argument, or `venn name { \u2026 }` for a fresh diagram"]);
          }
        } else if (line === "venn") {
          return new FSharpResult$2(1, ["`venn` needs an argument name (venn my-argument) or a block (venn name { \u2026 })"]);
        } else {
          const matchValue_3 = tryParseRelation(line);
          if (matchValue_3 == null) {
            const matchValue_4 = tryParseArgument(line);
            if (matchValue_4 == null) {
              return new FSharpResult$2(0, [new Statement(1, [line])]);
            } else {
              return new FSharpResult$2(0, [new Statement(6, [matchValue_4[0], matchValue_4[1], matchValue_4[2]])]);
            }
          } else {
            return new FSharpResult$2(0, [matchValue_3]);
          }
        }
    }
  }
}
function parseArgumentBlock(name, headerLine, body) {
  let premises = empty2();
  let conclusion = void 0;
  let errors = empty2();
  const enumerator = getEnumerator(body);
  try {
    while (enumerator["System.Collections.IEnumerator.MoveNext"]()) {
      const forLoopVar = enumerator["System.Collections.Generic.IEnumerator`1.get_Current"]();
      const no = forLoopVar[0] | 0;
      const line = stripComment(forLoopVar[1]).trim();
      if (line === "") {
      } else if (line.length >= 3 && forAll((c) => c === "-", line.split(""))) {
      } else if (line.startsWith("premise ")) {
        const matchValue = parseAny(substring(line, 8));
        if (matchValue.tag === 1) {
          errors = append(errors, singleton3([no, matchValue.fields[0]]));
        } else {
          premises = append(premises, singleton3(matchValue.fields[0]));
        }
      } else if (line.startsWith("conclude ")) {
        const matchValue_1 = parseAny(substring(line, 9));
        const conclusion_1 = conclusion;
        const copyOfStruct = matchValue_1;
        if (copyOfStruct.tag === 1) {
          errors = append(errors, singleton3([no, copyOfStruct.fields[0]]));
        } else if (conclusion_1 != null) {
          errors = append(errors, singleton3([no, "an argument can only have one `conclude`"]));
        } else {
          conclusion = copyOfStruct.fields[0];
        }
      } else {
        errors = append(errors, singleton3([no, "expected `premise`, `---`, or `conclude` inside an argument"]));
      }
    }
  } finally {
    disposeSafe(enumerator);
  }
  const errors_1 = errors;
  const conclusion_2 = conclusion;
  if (isEmpty(errors_1)) {
    if (conclusion_2 != null) {
      const c_1 = conclusion_2;
      return new FSharpResult$2(0, [new Statement(6, [name, premises, c_1])]);
    } else {
      return new FSharpResult$2(1, [singleton3([headerLine, "an argument needs a `conclude` line"])]);
    }
  } else {
    return new FSharpResult$2(1, [errors_1]);
  }
}
function parseProofBlock(name, headerLine, body) {
  let steps = empty2();
  let errors = empty2();
  const enumerator = getEnumerator(body);
  try {
    while (enumerator["System.Collections.IEnumerator.MoveNext"]()) {
      let array_1, arg;
      const forLoopVar = enumerator["System.Collections.Generic.IEnumerator`1.get_Current"]();
      const no = forLoopVar[0] | 0;
      const line_1 = stripComment(forLoopVar[1]).trim();
      if (line_1 === "") {
      } else {
        let matchValue;
        const line = line_1;
        const digits = length2(takeWhile(isDigit, line.split(""))) | 0;
        matchValue = digits > 0 && digits < line.length && line[digits] === "." ? [parse(substring(line, 0, digits), 511, false, 32), substring(line, digits + 1).trim()] : void 0;
        if (matchValue != null) {
          const rest = matchValue[1];
          const number = matchValue[0] | 0;
          if (rest.startsWith("premise ")) {
            const matchValue_1 = parseAny(substring(rest, 8));
            if (matchValue_1.tag === 1) {
              errors = append(errors, singleton3([no, matchValue_1.fields[0]]));
            } else {
              steps = append(steps, singleton3(new ProofLine(0, [number, matchValue_1.fields[0]])));
            }
          } else {
            const matchValue_2 = rest.lastIndexOf(" by ") | 0;
            if (matchValue_2 === -1) {
              errors = append(errors, singleton3([no, "a derived line needs a justification \u2014 e.g.  wet by modus-ponens from 1, 2"]));
            } else {
              const idx = matchValue_2 | 0;
              const formulaText = substring(rest, 0, idx);
              const justification = substring(rest, idx + 4).trim();
              let patternInput;
              const matchValue_3 = justification.indexOf(" from ") | 0;
              if (matchValue_3 === -1) {
                patternInput = [justification, ""];
              } else {
                const j = matchValue_3 | 0;
                patternInput = [substring(justification, 0, j).trim(), substring(justification, j + 6)];
              }
              const rule = patternInput[0];
              const refs = ofArray((array_1 = map2((s) => s.trim(), split(replace(replace(patternInput[1], " and ", ","), " And ", ","), [","], void 0, 0)), array_1.filter((s_1) => s_1 !== "")));
              const badRefs = filter2((r) => !forAll(isDigit, r.split("")), refs);
              if (rule === "") {
                errors = append(errors, singleton3([no, "missing rule name after `by`"]));
              } else if (!isEmpty(badRefs)) {
                errors = append(errors, singleton3([no, (arg = head(badRefs), toText(printf("citations after `from` must be line numbers, not %A"))(arg))]));
              } else {
                const matchValue_4 = parseAny(formulaText);
                if (matchValue_4.tag === 1) {
                  errors = append(errors, singleton3([no, matchValue_4.fields[0]]));
                } else {
                  steps = append(steps, singleton3(new ProofLine(1, [number, matchValue_4.fields[0], rule, map4((value2) => parse(value2, 511, false, 32) | 0, refs)])));
                }
              }
            }
          }
        } else {
          errors = append(errors, singleton3([no, "every proof line starts with its number \u2014 e.g.  3. wet by modus-ponens from 1, 2"]));
        }
      }
    }
  } finally {
    disposeSafe(enumerator);
  }
  const errors_1 = errors;
  const steps_1 = steps;
  if (isEmpty(errors_1)) {
    if (isEmpty(steps_1)) {
      return new FSharpResult$2(1, [singleton3([headerLine, "a proof needs at least one line"])]);
    } else {
      return new FSharpResult$2(0, [new Statement(7, [name, steps])]);
    }
  } else {
    return new FSharpResult$2(1, [errors_1]);
  }
}
function parseVennBlock(name, headerLine, body) {
  let premises = empty2();
  let conclusion = void 0;
  let errors = empty2();
  const enumerator = getEnumerator(body);
  try {
    while (enumerator["System.Collections.IEnumerator.MoveNext"]()) {
      const forLoopVar = enumerator["System.Collections.Generic.IEnumerator`1.get_Current"]();
      const no = forLoopVar[0] | 0;
      const line = stripComment(forLoopVar[1]).trim();
      if (line === "") {
      } else if (line.length >= 3 && forAll((c) => c === "-", line.split(""))) {
      } else if (line.startsWith("premise ")) {
        const matchValue = parseAny(substring(line, 8));
        if (matchValue.tag === 1) {
          errors = append(errors, singleton3([no, matchValue.fields[0]]));
        } else {
          premises = append(premises, singleton3(matchValue.fields[0]));
        }
      } else if (line.startsWith("conclude ")) {
        const matchValue_1 = parseAny(substring(line, 9));
        const conclusion_1 = conclusion;
        const copyOfStruct = matchValue_1;
        if (copyOfStruct.tag === 1) {
          errors = append(errors, singleton3([no, copyOfStruct.fields[0]]));
        } else if (conclusion_1 != null) {
          errors = append(errors, singleton3([no, "a venn block can only have one `conclude`"]));
        } else {
          conclusion = copyOfStruct.fields[0];
        }
      } else {
        errors = append(errors, singleton3([no, "expected `premise` or `conclude` inside a venn block"]));
      }
    }
  } finally {
    disposeSafe(enumerator);
  }
  const errors_1 = errors;
  const premises_1 = premises;
  if (isEmpty(errors_1)) {
    if (isEmpty(premises_1)) {
      return new FSharpResult$2(1, [singleton3([headerLine, "a venn block needs at least one `premise`"])]);
    } else {
      return new FSharpResult$2(0, [new Statement(8, [name, premises, conclusion])]);
    }
  } else {
    return new FSharpResult$2(1, [errors_1]);
  }
}
function parseLines(source) {
  const lines = split(replace(source, "\r\n", "\n"), ["\n"], void 0, 0);
  const results = [];
  let i = 0;
  while (i < lines.length) {
    const no = i + 1 | 0;
    const line_1 = stripComment(item(i, lines)).trim();
    let matchValue;
    const line = line_1;
    matchValue = line.startsWith("argument ") && line.endsWith("{") ? ["argument", (name) => (headerLine) => (body) => parseArgumentBlock(name, headerLine, body)] : line.startsWith("proof ") && line.endsWith("{") ? ["proof", (name_1) => (headerLine_1) => (body_1) => parseProofBlock(name_1, headerLine_1, body_1)] : line.startsWith("venn ") && line.endsWith("{") ? ["venn", (name_2) => (headerLine_2) => (body_2) => parseVennBlock(name_2, headerLine_2, body_2)] : void 0;
    if (matchValue == null) {
      void results.push([no, parseLine(item(i, lines))]);
      i = i + 1 | 0;
    } else {
      const parseBlock = matchValue[1];
      const keyword = matchValue[0];
      const name_3 = substring(line_1, keyword.length, line_1.length - keyword.length - 1).trim();
      const body_3 = [];
      let j = i + 1;
      let closed = false;
      while (!closed && j < lines.length) {
        if (stripComment(item(j, lines)).trim() === "}") {
          closed = true;
        } else {
          void body_3.push([j + 1, item(j, lines)]);
          j = j + 1 | 0;
        }
      }
      if (!closed) {
        void results.push([no, new FSharpResult$2(1, [toText(printf("this `%s {` is never closed with `}`"))(keyword)])]);
        i = lines.length | 0;
      } else {
        const matchValue_1 = parseBlock(name_3)(no)(ofSeq(body_3));
        if (matchValue_1.tag === 1) {
          const enumerator = getEnumerator(matchValue_1.fields[0]);
          try {
            while (enumerator["System.Collections.IEnumerator.MoveNext"]()) {
              const forLoopVar = enumerator["System.Collections.Generic.IEnumerator`1.get_Current"]();
              void results.push([forLoopVar[0], new FSharpResult$2(1, [forLoopVar[1]])]);
            }
          } finally {
            disposeSafe(enumerator);
          }
        } else {
          void results.push([no, new FSharpResult$2(0, [matchValue_1.fields[0]])]);
        }
        i = j + 1 | 0;
      }
    }
  }
  return ofSeq(results);
}

// src/core/Api.js
var BlockView = class extends Record {
  constructor(kind, level, title, name, gloss, formula, verdict, atoms2, rows, results, actual, line, premises, conclusion, form, fallacy, note, suggestion, proof, relations, model, vennCircles, vennCells, vennPoints) {
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
    this.actual = actual | 0;
    this.line = line | 0;
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
};
var empty5 = new BlockView("", 0, "", "", "", "", "", [], [], [], -1, 0, [], "", "", "", "", [], [], [], [], [], [], []);
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
  const trues = length(filter2((tuple) => tuple[1], t.Rows)) | 0;
  const matchValue = t.Verdict;
  switch (matchValue.tag) {
    case 1:
      return toText(printf("False in every one of the %d possible situations \u2014 it cannot hold, whatever the facts."))(total);
    case 2:
      return toText(printf("True in %d of %d possible situations \u2014 whether it holds depends on the facts."))(trues)(total);
    default:
      return toText(printf("True in every one of the %d possible situations \u2014 it cannot fail, whatever the facts."))(total);
  }
}
function tableBlock(f) {
  const t = truthTable(f);
  const formula = toUnicode(f);
  const atoms2 = toArray2(t.Atoms);
  const rows = toArray2(map4((tupledArg) => toArray2(map4((a) => FSharpMap__get_Item(tupledArg[0], a), t.Atoms)), t.Rows));
  const results = toArray2(map4((tuple) => tuple[1], t.Rows));
  return new BlockView("table", empty5.level, empty5.title, empty5.name, empty5.gloss, formula, verdictName(t.Verdict), atoms2, rows, results, empty5.actual, empty5.line, empty5.premises, empty5.conclusion, empty5.form, empty5.fallacy, verdictNote(t), empty5.suggestion, empty5.proof, empty5.relations, empty5.model, empty5.vennCircles, empty5.vennCells, empty5.vennPoints);
}
var tooLargeNote = "Too many atoms and modal operators to check exhaustively \u2014 the engine won't guess.";
function modalBlock(kindName, f) {
  const base$0027 = new BlockView(kindName, empty5.level, empty5.title, empty5.name, empty5.gloss, toUnicode(f), empty5.verdict, empty5.atoms, empty5.rows, empty5.results, empty5.actual, empty5.line, empty5.premises, empty5.conclusion, empty5.form, empty5.fallacy, empty5.note, empty5.suggestion, empty5.proof, empty5.relations, empty5.model, empty5.vennCircles, empty5.vennCells, empty5.vennPoints);
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
      return new BlockView(base$0027.kind, base$0027.level, base$0027.title, base$0027.name, base$0027.gloss, base$0027.formula, "tautology", base$0027.atoms, base$0027.rows, base$0027.results, base$0027.actual, base$0027.line, base$0027.premises, base$0027.conclusion, base$0027.form, base$0027.fallacy, "Necessarily true: it holds at every world of every possible arrangement of worlds.", base$0027.suggestion, base$0027.proof, base$0027.relations, base$0027.model, base$0027.vennCircles, base$0027.vennCells, base$0027.vennPoints);
    case 1:
      return new BlockView(base$0027.kind, base$0027.level, base$0027.title, base$0027.name, base$0027.gloss, base$0027.formula, "contradiction", base$0027.atoms, base$0027.rows, base$0027.results, base$0027.actual, base$0027.line, base$0027.premises, base$0027.conclusion, base$0027.form, base$0027.fallacy, "Impossible: it fails at every world of every possible arrangement of worlds.", base$0027.suggestion, base$0027.proof, base$0027.relations, base$0027.model, base$0027.vennCircles, base$0027.vennCells, base$0027.vennPoints);
    case 2:
      return new BlockView(base$0027.kind, base$0027.level, base$0027.title, base$0027.name, base$0027.gloss, base$0027.formula, "unknown", base$0027.atoms, base$0027.rows, base$0027.results, base$0027.actual, base$0027.line, base$0027.premises, base$0027.conclusion, base$0027.form, base$0027.fallacy, tooLargeNote, base$0027.suggestion, base$0027.proof, base$0027.relations, base$0027.model, base$0027.vennCircles, base$0027.vennCells, base$0027.vennPoints);
    default: {
      const names = atoms(f);
      const note_2 = "Contingent: its truth depends on the facts and on how the possibilities are arranged \u2014 here is an arrangement where it fails at the actual world.";
      return new BlockView(base$0027.kind, base$0027.level, base$0027.title, base$0027.name, base$0027.gloss, base$0027.formula, "contingent", toArray2(names), toArray2(map4((w) => toArray2(map4((a) => defaultArg(tryFind2(a, w), false), names)), worlds)), toArray2(map4((w_1) => evalS5(worlds, w_1, f), worlds)), actual, base$0027.line, base$0027.premises, base$0027.conclusion, base$0027.form, base$0027.fallacy, note_2, base$0027.suggestion, base$0027.proof, base$0027.relations, base$0027.model, base$0027.vennCircles, base$0027.vennCells, base$0027.vennPoints);
    }
  }
}
function vennBlock(defs, name, premises, conclusion) {
  let c_2, matchValue, arg_2, arg_1;
  const rp = map4((formula) => resolve(defs, formula), premises);
  const rc = map((formula_1) => resolve(defs, formula_1), conclusion);
  const premiseConj = isEmpty(rp) ? new Formula(2, [true]) : reduce((a, b) => new Formula(4, [a, b]), rp);
  const scope = rc == null ? premiseConj : new Formula(4, [premiseConj, rc]);
  const arities = predicateArities(scope);
  const preds = map4((tuple) => tuple[0], arities);
  const notDrawable = (why) => new BlockView("venn", empty5.level, empty5.title, name, empty5.gloss, empty5.formula, "not-drawable", empty5.atoms, empty5.rows, empty5.results, empty5.actual, empty5.line, empty5.premises, empty5.conclusion, empty5.form, empty5.fallacy, why, empty5.suggestion, empty5.proof, empty5.relations, empty5.model, empty5.vennCircles, empty5.vennCells, empty5.vennPoints);
  const unaryCount = length(filter2((tupledArg) => tupledArg[1] === 1, arities)) | 0;
  if (exists2((tupledArg_1) => tupledArg_1[1] >= 2, arities)) {
    return notDrawable("A Venn diagram needs one-place predicates (properties like Man(x)); this argument uses a relation (a two-or-more-place predicate), which a Venn diagram can't picture.");
  } else if (exists2((tupledArg_2) => tupledArg_2[1] === 0, arities)) {
    return notDrawable("A Venn diagram pictures categorical statements about one-place predicates like Man(x). This argument is propositional (or modal) \u2014 try a truth table or a proof instead.");
  } else if (unaryCount === 0) {
    return notDrawable("A Venn diagram needs at least one one-place predicate, e.g. Man(x).");
  } else if (unaryCount > 3) {
    return notDrawable(toText(printf("Venn diagrams are drawn for up to 3 one-place predicates; this uses %d."))(unaryCount));
  } else {
    const consts = individuals(scope);
    const a_1 = analyzeMonadic(preds, consts, premiseConj);
    const bits = (cell) => initialize(length(preds), (j) => (cell >> j & 1) === 1 ? "1" : "0").join("");
    const cells = map4((tupledArg_3) => {
      let _arg_3;
      return [bits(tupledArg_3[0]), (_arg_3 = tupledArg_3[1], _arg_3.tag === 1 ? "occupied" : _arg_3.tag === 2 ? "free" : "empty")];
    }, toList3(a_1.Cells));
    const points = map4((c_1) => [c_1, join("|", map4(bits, toList2(defaultArg(tryFind2(c_1, a_1.Placement), empty3({
      Compare: (x, y) => comparePrimitives(x, y) | 0
    })))))], consts);
    return new BlockView("venn", empty5.level, empty5.title, name, empty5.gloss, empty5.formula, a_1.Consistent ? "consistent" : "contradiction", empty5.atoms, empty5.rows, empty5.results, empty5.actual, empty5.line, empty5.premises, empty5.conclusion, empty5.form, empty5.fallacy, (!a_1.Consistent ? "These premises can't all hold at once \u2014 no diagram satisfies them." : "Shaded regions are empty; a dot marks a region the premises guarantee is occupied.") + (rc != null ? (c_2 = rc, matchValue = checkArgumentFO(rp, c_2), matchValue.tag === 1 ? (arg_2 = toUnicode(c_2), toText(printf("  The conclusion (%s) is NOT forced \u2014 there is a model of the premises where it fails."))(arg_2)) : matchValue.tag === 2 ? "" : (arg_1 = toUnicode(c_2), toText(printf("  The conclusion (%s) is already forced by the premises \u2014 the argument is valid."))(arg_1))) : ""), empty5.suggestion, empty5.proof, empty5.relations, empty5.model, toArray2(preds), toArray2(cells), toArray2(points));
  }
}
function foFormulaBlock(kindName, f) {
  const base$0027 = new BlockView(kindName, empty5.level, empty5.title, empty5.name, empty5.gloss, toUnicode(f), empty5.verdict, empty5.atoms, empty5.rows, empty5.results, empty5.actual, empty5.line, empty5.premises, empty5.conclusion, empty5.form, empty5.fallacy, empty5.note, empty5.suggestion, empty5.proof, empty5.relations, empty5.model, empty5.vennCircles, empty5.vennCells, empty5.vennPoints);
  const card = (search) => {
    if (search.tag === 1) {
      return toArray2(describeModel(search.fields[0], f));
    } else {
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
      const note = "A quantified statement has no truth table. It is valid \u2014 true in every model checked (a bounded check, domains up to size 4). Here is one such model, where it holds as it does everywhere:";
      return new BlockView(base$0027.kind, base$0027.level, base$0027.title, base$0027.name, base$0027.gloss, base$0027.formula, "tautology", base$0027.atoms, base$0027.rows, base$0027.results, base$0027.actual, base$0027.line, base$0027.premises, base$0027.conclusion, base$0027.form, base$0027.fallacy, note, base$0027.suggestion, base$0027.proof, base$0027.relations, card(witness), base$0027.vennCircles, base$0027.vennCells, base$0027.vennPoints);
    }
    case 1: {
      const note_1 = "A quantified statement has no truth table. It is unsatisfiable: false in every model checked (domains up to size 4).";
      return new BlockView(base$0027.kind, base$0027.level, base$0027.title, base$0027.name, base$0027.gloss, base$0027.formula, "contradiction", base$0027.atoms, base$0027.rows, base$0027.results, base$0027.actual, base$0027.line, base$0027.premises, base$0027.conclusion, base$0027.form, base$0027.fallacy, note_1, base$0027.suggestion, base$0027.proof, base$0027.relations, base$0027.model, base$0027.vennCircles, base$0027.vennCells, base$0027.vennPoints);
    }
    case 2:
      return new BlockView(base$0027.kind, base$0027.level, base$0027.title, base$0027.name, base$0027.gloss, base$0027.formula, "unknown", base$0027.atoms, base$0027.rows, base$0027.results, base$0027.actual, base$0027.line, base$0027.premises, base$0027.conclusion, base$0027.form, base$0027.fallacy, tooLargeNote, base$0027.suggestion, base$0027.proof, base$0027.relations, base$0027.model, base$0027.vennCircles, base$0027.vennCells, base$0027.vennPoints);
    default: {
      const note_2 = "A quantified statement has no truth table. Its truth depends on the domain and interpretation \u2014 here is a model where it is false:";
      return new BlockView(base$0027.kind, base$0027.level, base$0027.title, base$0027.name, base$0027.gloss, base$0027.formula, "contingent", base$0027.atoms, base$0027.rows, base$0027.results, base$0027.actual, base$0027.line, base$0027.premises, base$0027.conclusion, base$0027.form, base$0027.fallacy, note_2, base$0027.suggestion, base$0027.proof, base$0027.relations, card(new FOSearch(1, [falsifying])), base$0027.vennCircles, base$0027.vennCells, base$0027.vennPoints);
    }
  }
}
function describeSituation(env) {
  return join(" and ", map4((tupledArg) => {
    const arg_1 = tupledArg[1] ? "true" : "false";
    return toText(printf("%s is %s"))(tupledArg[0])(arg_1);
  }, toList3(env)));
}
function proofRow(index, step) {
  const justification = isEmpty(step.Refs) ? step.Rule : step.Rule + " (" + join(", ", map4(int32ToString, step.Refs)) + ")";
  return [int32ToString(index + 1), toUnicode(step.Formula), justification];
}
function argumentBlock(defs, name, premises, conclusion) {
  const rp = map4((formula) => resolve(defs, formula), premises);
  const rc = resolve(defs, conclusion);
  const fo = exists2(containsFO, cons(rc, rp));
  const modal = !fo && exists2(containsModal, cons(rc, rp));
  let patternInput;
  if (fo) {
    const matchValue = checkArgumentFO(rp, rc);
    patternInput = matchValue.tag === 2 ? [false, true, empty2(), empty2(), -1, empty2()] : matchValue.tag === 1 ? [false, false, empty2(), empty2(), -1, describeModel(matchValue.fields[0], fold3((acc, p) => new Formula(4, [acc, p]), new Formula(3, [rc]), rp))] : [true, false, empty2(), empty2(), -1, empty2()];
  } else if (modal) {
    const matchValue_1 = checkArgumentS5(rp, rc);
    patternInput = matchValue_1.tag === 2 ? [false, true, empty2(), empty2(), -1, empty2()] : matchValue_1.tag === 1 ? [false, false, List_distinct(collect2(atoms, append(rp, singleton3(rc))), {
      Equals: (x, y) => x === y,
      GetHashCode: (x) => stringHash(x) | 0
    }), matchValue_1.fields[0], matchValue_1.fields[1], empty2()] : [true, false, empty2(), empty2(), -1, empty2()];
  } else {
    const check = checkArgument(rp, rc);
    patternInput = [check.IsValid, false, check.Atoms, check.Counterexamples, -1, empty2()];
  }
  const unknown = patternInput[1];
  const isValid2 = patternInput[0];
  const cxRows = patternInput[3];
  const cxAtoms = patternInput[2];
  const cxActual = patternInput[4] | 0;
  const recognized = unknown ? void 0 : recognize(isValid2 ? validForms : fallacies, rp, rc);
  const displayTitle = (form) => {
    if (form.Aka === "") {
      return form.Title;
    } else {
      return form.Title + " (" + form.Aka + ")";
    }
  };
  const proofSteps = isValid2 && !modal && !fo ? defaultArg(prove(rp, rc), empty2()) : empty2();
  const repairs = (((isValid2 ? true : unknown) ? true : modal) ? true : fo) ? empty2() : suggestRepairs(rp, rc);
  let premisesConsistent;
  if (isEmpty(rp)) {
    premisesConsistent = true;
  } else {
    const together_1 = reduce((a, b) => new Formula(4, [a, b]), rp);
    premisesConsistent = fo ? !equals(foSatisfy(together_1), new FOSearch(0, [])) : modal ? !equals(s5Satisfy(together_1), new ModalSearch(0, [])) : !equals(truthTable(together_1).Verdict, new Verdict(1, []));
  }
  let explanation;
  if (unknown) {
    explanation = tooLargeNote;
  } else if (isEmpty(rp)) {
    if (isValid2) {
      explanation = recognized == null ? fo ? "A theorem: the conclusion holds in every model checked (domains up to size 4) \u2014 provable from no premises at all." : modal ? "A theorem of S5: the conclusion holds at every world of every arrangement \u2014 provable from no premises at all." : "A theorem: the conclusion holds in every possible situation \u2014 a tautology, provable from no premises at all." : recognized.Note;
    } else if (fo) {
      explanation = "Not a theorem: there is a model where the conclusion fails.";
    } else if (modal) {
      explanation = "Not a theorem: there is an arrangement of possible worlds where the conclusion fails.";
    } else {
      const arg = length(cxRows) | 0;
      explanation = toText(printf("Not a theorem: the conclusion fails in %d situation(s), so it is no tautology."))(arg);
    }
  } else if (isValid2 && !premisesConsistent) {
    explanation = "Valid, but vacuously so: the premises contradict one another and can never all hold \u2014 and from a contradiction, anything follows (ex falso quodlibet).";
  } else if (recognized == null) {
    if (isValid2 && fo) {
      explanation = "Valid: no model (over domains up to size 4) makes every premise true and the conclusion false. First-order validity is undecidable, so this is a bounded check.";
    } else if (isValid2 && modal) {
      explanation = "Valid in S5: no arrangement of possible worlds makes every premise true at the actual world while the conclusion fails there.";
    } else if (isValid2) {
      explanation = "Valid: no possible situation makes every premise true and the conclusion false.";
    } else if (fo) {
      explanation = "Invalid: here is a model where every premise holds but the conclusion fails.";
    } else if (modal) {
      explanation = "Invalid in S5: there is an arrangement of possible worlds where every premise holds at the actual world while the conclusion fails there.";
    } else {
      const arg_1 = length(cxRows) | 0;
      explanation = toText(printf("Invalid: %d situation(s) make every premise true while the conclusion fails."))(arg_1);
    }
  } else {
    explanation = recognized.Note;
  }
  const formLabel = !isValid2 ? "" : recognized == null ? isEmpty(rp) ? "tautology" : "" : displayTitle(recognized);
  const premises_1 = toArray2(map4(toUnicode, rp));
  const conclusion_1 = toUnicode(rc);
  const verdict = unknown ? "unknown" : isValid2 ? "valid" : "invalid";
  const fallacy = defaultArg((isValid2 ? true : unknown) ? void 0 : map(displayTitle, recognized), "");
  const suggestion = toArray2(map4(toUnicode, repairs));
  const proof = toArray2(mapIndexed(proofRow, proofSteps));
  return new BlockView("argument", empty5.level, empty5.title, name, empty5.gloss, empty5.formula, verdict, toArray2(cxAtoms), toArray2(map4((env) => toArray2(map4((a_1) => defaultArg(tryFind2(a_1, env), false), cxAtoms)), cxRows)), cxActual >= 0 ? toArray2(map4((w) => evalS5(cxRows, w, rc), cxRows)) : toArray2(map4((_arg) => false, cxRows)), cxActual, empty5.line, premises_1, conclusion_1, formLabel, fallacy, explanation, suggestion, proof, empty5.relations, toArray2(patternInput[5]), empty5.vennCircles, empty5.vennCells, empty5.vennPoints);
}
function proofBlock(defs, name, lines) {
  let known = empty4({
    Compare: (x, y) => comparePrimitives(x, y) | 0
  });
  let allOk = true;
  const rows = [];
  const enumerator = getEnumerator(lines);
  try {
    while (enumerator["System.Collections.IEnumerator.MoveNext"]()) {
      let arg_2, arg_6, arg_7, arg_13, title, refs;
      const line = enumerator["System.Collections.Generic.IEnumerator`1.get_Current"]();
      if (line.tag === 1) {
        const ruleName = line.fields[2];
        const refs_1 = line.fields[3];
        const n_1 = line.fields[0] | 0;
        const rf_1 = resolve(defs, line.fields[1]);
        const duplicate = containsKey(n_1, known);
        const missing = filter2((r) => !containsKey(r, known), refs_1);
        const normalizeRule = (s) => join("-", split(replace(replace(s.trim().toLowerCase(), "(", ""), ")", ""), [" ", "-"], void 0, 1));
        const wanted = normalizeRule(ruleName);
        const form = tryFind((fm) => {
          if (fm.Name === wanted ? true : normalizeRule(fm.Title) === wanted) {
            return true;
          } else if (fm.Aka !== "") {
            return normalizeRule(fm.Aka) === wanted;
          } else {
            return false;
          }
        }, forms);
        let patternInput;
        if (duplicate) {
          patternInput = ["bad", toText(printf("line number %d is used twice"))(n_1), ruleName];
        } else if (!isEmpty(missing)) {
          patternInput = ["bad", (arg_2 = head(missing) | 0, toText(printf("cites line %d, which doesn't exist earlier in the proof"))(arg_2)), ruleName];
        } else if (form != null) {
          if (equals(form.Kind, new FormKind(1, []))) {
            const fm_2 = form;
            patternInput = ["bad", toText(printf("'%s' is a fallacy, not a rule \u2014 it cannot justify a step"))(fm_2.Title), fm_2.Title];
          } else {
            const fm_3 = form;
            const cited = map4((r_1) => FSharpMap__get_Item(known, r_1), refs_1);
            if (length(fm_3.Premises) !== length(cited)) {
              patternInput = ["bad", (arg_6 = length(fm_3.Premises) | 0, arg_7 = length(cited) | 0, toText(printf("%s needs %d cited line(s) after `from`, got %d"))(fm_3.Title)(arg_6)(arg_7)), fm_3.Title];
            } else if (checkStep(fm_3, cited, rf_1)) {
              patternInput = ["ok", "", fm_3.Title];
            } else {
              const matchValue = recognize(validForms, cited, rf_1);
              if (matchValue == null) {
                if (exists2(containsModal, cons(rf_1, cited))) {
                  const matchValue_1 = checkArgumentS5(cited, rf_1);
                  patternInput = matchValue_1.tag === 1 ? ["bad", "it does not follow from the cited lines at all \u2014 some arrangement of possible worlds makes them true and this false", fm_3.Title] : matchValue_1.tag === 2 ? ["bad", tooLargeNote, fm_3.Title] : ["bad", toText(printf("it does follow from the cited lines (S5), but not by %s \u2014 and no single catalog rule derives it in one step"))(fm_3.Title), fm_3.Title];
                } else {
                  const semantic = checkArgument(cited, rf_1);
                  patternInput = semantic.IsValid ? ["bad", toText(printf("it does follow from the cited lines, but not by %s \u2014 and no single catalog rule derives it in one step"))(fm_3.Title), fm_3.Title] : ["bad", (arg_13 = describeSituation(head(semantic.Counterexamples)), toText(printf("it does not follow from the cited lines at all \u2014 counterexample: %s"))(arg_13)), fm_3.Title];
                }
              } else {
                const actual = matchValue;
                patternInput = ["bad", toText(printf("this step doesn't match %s \u2014 it is actually %s (%s)"))(fm_3.Title)(actual.Title)(actual.Note), fm_3.Title];
              }
            }
          }
        } else {
          patternInput = ["bad", toText(printf("unknown rule '%s' \u2014 write it naturally (by modus ponens) or kebab-case (by modus-ponens); Latin aliases work too"))(ruleName), ruleName];
        }
        const status = patternInput[0];
        if (status === "bad") {
          allOk = false;
        }
        if (!duplicate) {
          known = add2(n_1, rf_1, known);
        }
        void rows.push([int32ToString(n_1), toUnicode(rf_1), (title = patternInput[2], refs = refs_1, isEmpty(refs) ? title : title + " (" + join(", ", map4(toString, refs)) + ")"), status, patternInput[1]]);
      } else {
        const n = line.fields[0] | 0;
        const rf = resolve(defs, line.fields[1]);
        if (containsKey(n, known)) {
          allOk = false;
          void rows.push([int32ToString(n), toUnicode(rf), "premise", "bad", toText(printf("line number %d is used twice"))(n)]);
        } else {
          known = add2(n, rf, known);
          void rows.push([int32ToString(n), toUnicode(rf), "premise", "premise", ""]);
        }
      }
    }
  } finally {
    disposeSafe(enumerator);
  }
  const verdict = allOk ? "valid" : "invalid";
  const note = allOk ? "Every step checks out \u2014 the conclusion follows from the premises. \u220E" : "The first \u2717 step is where the chain breaks \u2014 repair it and the proof may go through.";
  return new BlockView("proof", empty5.level, empty5.title, name, empty5.gloss, empty5.formula, verdict, empty5.atoms, empty5.rows, empty5.results, empty5.actual, empty5.line, empty5.premises, defaultArg(map((l) => toUnicode(resolve(defs, l.tag === 1 ? l.fields[1] : l.fields[1])), tryLast(lines)), ""), empty5.form, empty5.fallacy, note, empty5.suggestion, rows.slice(), empty5.relations, empty5.model, empty5.vennCircles, empty5.vennCells, empty5.vennPoints);
}
function relationInfo(defs, glosses, left, kind, right) {
  const display = (_arg) => {
    if (_arg.tag === 1) {
      return "\u201C" + _arg.fields[0] + "\u201D";
    } else {
      return _arg.fields[0];
    }
  };
  const formulaOf = (ref) => {
    let n_1;
    let matchResult, n_2;
    if (ref.tag === 0) {
      if (n_1 = ref.fields[0], containsKey(n_1, defs) ? true : containsKey(n_1, glosses)) {
        matchResult = 0;
        n_2 = ref.fields[0];
      } else {
        matchResult = 1;
      }
    } else {
      matchResult = 1;
    }
    switch (matchResult) {
      case 0:
        return resolve(defs, new Formula(0, [n_2]));
      default:
        return void 0;
    }
  };
  const verb = kind.tag === 1 ? "presupposes" : kind.tag === 2 ? "contradicts" : kind.tag === 3 ? "entails" : kind.tag === 4 ? "equivalent-to" : "supports";
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
        } else {
          matchResult_1 = 2;
        }
      } else {
        matchResult_1 = 2;
      }
  }
  switch (matchResult_1) {
    case 0: {
      patternInput = ["asserted", "an informal relation \u2014 asserted by you, recorded but not checked by the engine"];
      break;
    }
    case 1: {
      const classical = !(((containsModal(a) ? true : containsModal(b)) ? true : containsFO(a)) ? true : containsFO(b));
      const checkFormal = (f, holdsNote, failsNote) => {
        const matchValue_3 = valid(f);
        if (matchValue_3 == null) {
          return ["asserted", tooLargeNote];
        } else if (matchValue_3) {
          return ["holds", holdsNote];
        } else {
          return ["fails", failsNote()];
        }
      };
      patternInput = kind.tag === 3 ? checkFormal(new Formula(7, [a, b]), "verified: whenever the first holds, so does the second", () => {
        if (classical) {
          const arg = describeSituation(head(checkArgument(singleton3(a), b).Counterexamples));
          return toText(printf("does not hold \u2014 counterexample: %s"))(arg);
        } else {
          return "does not hold \u2014 it fails in some situation the engine found";
        }
      }) : kind.tag === 2 ? checkFormal(new Formula(3, [new Formula(4, [a, b])]), "verified: they can never both be true", () => {
        if (classical) {
          const arg_1 = describeSituation(find((tuple) => tuple[1], truthTable(new Formula(4, [a, b])).Rows)[0]);
          return toText(printf("they CAN both be true \u2014 for instance when %s"))(arg_1);
        } else {
          return "they CAN both be true \u2014 in some situation the engine found";
        }
      }) : checkFormal(new Formula(8, [a, b]), "verified: always the same truth value \u2014 two phrasings of one claim", () => {
        if (classical) {
          const matchValue_4 = distinguishing(a, b);
          if (matchValue_4 == null) {
            return "not equivalent";
          } else {
            const arg_2 = describeSituation(matchValue_4);
            return toText(printf("not equivalent \u2014 they come apart when %s"))(arg_2);
          }
        } else {
          return "not equivalent \u2014 they come apart in some situation the engine found";
        }
      });
      break;
    }
    default:
      patternInput = ["asserted", "cannot be checked \u2014 one side is not a declared claim or prop"];
  }
  return [display(left), verb, display(right), patternInput[0], patternInput[1]];
}
function relationWhy(_arg) {
  switch (_arg.tag) {
    case 1:
      return "always opposite \u2014 exactly one of the two holds";
    case 2:
      return "never both true, though both can fail";
    case 3:
      return "never both false, though both can hold";
    case 4:
      return "whenever the first holds, so does the second";
    case 5:
      return "whenever the first holds, so does the second";
    case 6:
      return "neither settles the other \u2014 all four combinations are possible";
    default:
      return "always the same truth value \u2014 two phrasings of one claim";
  }
}
function relationsBlock(claims) {
  return new BlockView("relations", empty5.level, empty5.title, empty5.name, empty5.gloss, empty5.formula, empty5.verdict, empty5.atoms, empty5.rows, empty5.results, empty5.actual, empty5.line, empty5.premises, empty5.conclusion, empty5.form, empty5.fallacy, empty5.note, empty5.suggestion, empty5.proof, Array.from(delay(() => collect((i) => map3((j) => {
    const patternInput = item2(i, claims);
    const nameA = patternInput[0];
    const patternInput_1 = item2(j, claims);
    const nameB = patternInput_1[0];
    const matchValue = relate(patternInput[1], patternInput_1[1]);
    if (matchValue.tag === 5) {
      return [nameB, "entails", nameA, relationWhy(new Relation(4, []))];
    } else {
      const r = matchValue;
      return [nameA, relationName(r), nameB, relationWhy(r)];
    }
  }, rangeDouble(i + 1, 1, length(claims) - 1)), rangeDouble(0, 1, length(claims) - 1)))), empty5.model, empty5.vennCircles, empty5.vennCells, empty5.vennPoints);
}
function toBlock(defs, glosses, claims, relationRows, arguments$, st) {
  let matchValue_3, arg;
  switch (st.tag) {
    case 1:
      return new BlockView("prose", empty5.level, st.fields[0], empty5.name, empty5.gloss, empty5.formula, empty5.verdict, empty5.atoms, empty5.rows, empty5.results, empty5.actual, empty5.line, empty5.premises, empty5.conclusion, empty5.form, empty5.fallacy, empty5.note, empty5.suggestion, empty5.proof, empty5.relations, empty5.model, empty5.vennCircles, empty5.vennCells, empty5.vennPoints);
    case 2:
      return new BlockView("prop", empty5.level, empty5.title, st.fields[0], st.fields[1], empty5.formula, empty5.verdict, empty5.atoms, empty5.rows, empty5.results, empty5.actual, empty5.line, empty5.premises, empty5.conclusion, empty5.form, empty5.fallacy, empty5.note, empty5.suggestion, empty5.proof, empty5.relations, empty5.model, empty5.vennCircles, empty5.vennCells, empty5.vennPoints);
    case 3:
      return new BlockView("claim", empty5.level, empty5.title, st.fields[0], empty5.gloss, toUnicode(st.fields[1]), empty5.verdict, empty5.atoms, empty5.rows, empty5.results, empty5.actual, empty5.line, empty5.premises, empty5.conclusion, empty5.form, empty5.fallacy, toEnglish((name) => tryFind2(name, glosses), resolve(defs, st.fields[1])), empty5.suggestion, empty5.proof, empty5.relations, empty5.model, empty5.vennCircles, empty5.vennCells, empty5.vennPoints);
    case 4: {
      const f_2 = st.fields[0].tag === 0 ? resolve(defs, new Formula(0, [st.fields[0].fields[0]])) : resolve(defs, st.fields[0].fields[0]);
      if (containsFO(f_2)) {
        return foFormulaBlock("table", f_2);
      } else if (containsModal(f_2)) {
        return modalBlock("table", f_2);
      } else {
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
        patternInput_1 = matchValue_2 == null ? ["unknown", tooLargeNote] : matchValue_2 ? modal ? ["equivalent", "At every world of every arrangement the two sides carry the same truth value \u2014 two phrasings of one claim."] : ["equivalent", "In every possible situation the two sides carry the same truth value \u2014 two phrasings of one claim."] : modal ? ["not-equivalent", "They come apart in some arrangement of possible worlds: there, one holds and the other doesn't."] : ["not-equivalent", (matchValue_3 = distinguishing(ra, rb), matchValue_3 == null ? "" : (arg = describeSituation(matchValue_3), toText(printf("They come apart when %s: then one holds and the other doesn't."))(arg)))];
        return new BlockView("check", empty5.level, empty5.title, empty5.name, empty5.gloss, toUnicode(ra) + " \u2261 " + toUnicode(rb), patternInput_1[0], empty5.atoms, empty5.rows, empty5.results, empty5.actual, empty5.line, empty5.premises, empty5.conclusion, empty5.form, empty5.fallacy, patternInput_1[1], empty5.suggestion, empty5.proof, empty5.relations, empty5.model, empty5.vennCircles, empty5.vennCells, empty5.vennPoints);
      } else {
        const rf = resolve(defs, st.fields[0].fields[0]);
        if (containsFO(rf)) {
          return foFormulaBlock("check", rf);
        } else if (containsModal(rf)) {
          return modalBlock("check", rf);
        } else {
          const bind$0040 = tableBlock(rf);
          return new BlockView("check", bind$0040.level, bind$0040.title, bind$0040.name, bind$0040.gloss, bind$0040.formula, bind$0040.verdict, bind$0040.atoms, bind$0040.rows, bind$0040.results, bind$0040.actual, bind$0040.line, bind$0040.premises, bind$0040.conclusion, bind$0040.form, bind$0040.fallacy, bind$0040.note, bind$0040.suggestion, bind$0040.proof, bind$0040.relations, bind$0040.model, bind$0040.vennCircles, bind$0040.vennCells, bind$0040.vennPoints);
        }
      }
    case 6:
      return argumentBlock(defs, st.fields[0], st.fields[1], st.fields[2]);
    case 7:
      return proofBlock(defs, st.fields[0], st.fields[1]);
    case 8:
      return vennBlock(defs, st.fields[0], st.fields[1], st.fields[2]);
    case 9: {
      const matchValue_4 = tryFind2(st.fields[0], arguments$);
      if (matchValue_4 == null) {
        return new BlockView("venn", empty5.level, empty5.title, st.fields[0], empty5.gloss, empty5.formula, "not-drawable", empty5.atoms, empty5.rows, empty5.results, empty5.actual, empty5.line, empty5.premises, empty5.conclusion, empty5.form, empty5.fallacy, toText(printf("No argument named '%s' to draw \u2014 `venn` needs the name of an `argument` defined in this document."))(st.fields[0]), empty5.suggestion, empty5.proof, empty5.relations, empty5.model, empty5.vennCircles, empty5.vennCells, empty5.vennPoints);
      } else {
        return vennBlock(defs, st.fields[0], matchValue_4[0], matchValue_4[1]);
      }
    }
    case 10:
      return relationsBlock(claims);
    case 11: {
      const patternInput_2 = relationInfo(defs, glosses, st.fields[0], st.fields[1], st.fields[2]);
      return new BlockView("relation", empty5.level, patternInput_2[1], empty5.name, empty5.gloss, patternInput_2[0], patternInput_2[3], empty5.atoms, empty5.rows, empty5.results, empty5.actual, empty5.line, empty5.premises, patternInput_2[2], empty5.form, empty5.fallacy, patternInput_2[4], empty5.suggestion, empty5.proof, empty5.relations, empty5.model, empty5.vennCircles, empty5.vennCells, empty5.vennPoints);
    }
    case 12:
      return new BlockView("map", empty5.level, empty5.title, empty5.name, empty5.gloss, empty5.formula, empty5.verdict, empty5.atoms, empty5.rows, empty5.results, empty5.actual, empty5.line, empty5.premises, empty5.conclusion, empty5.form, empty5.fallacy, empty5.note, empty5.suggestion, empty5.proof, relationRows, empty5.model, empty5.vennCircles, empty5.vennCells, empty5.vennPoints);
    default:
      return new BlockView("heading", st.fields[0], st.fields[1], empty5.name, empty5.gloss, empty5.formula, empty5.verdict, empty5.atoms, empty5.rows, empty5.results, empty5.actual, empty5.line, empty5.premises, empty5.conclusion, empty5.form, empty5.fallacy, empty5.note, empty5.suggestion, empty5.proof, empty5.relations, empty5.model, empty5.vennCircles, empty5.vennCells, empty5.vennPoints);
  }
}
function analyze(source) {
  const parsed = parseLines(source);
  const statements = choose2((tupledArg) => {
    const r = tupledArg[1];
    if (r.tag === 1) {
      return void 0;
    } else {
      return r.fields[0];
    }
  }, parsed);
  const defs = ofList2(choose2((_arg_1) => {
    if (_arg_1.tag === 3) {
      return [_arg_1.fields[0], _arg_1.fields[1]];
    } else {
      return void 0;
    }
  }, statements), {
    Compare: (x, y) => comparePrimitives(x, y) | 0
  });
  const glosses = ofList2(choose2((_arg_2) => {
    if (_arg_2.tag === 2) {
      return [_arg_2.fields[0], _arg_2.fields[1]];
    } else {
      return void 0;
    }
  }, statements), {
    Compare: (x_1, y_1) => comparePrimitives(x_1, y_1) | 0
  });
  const claims = choose2((_arg_3) => {
    if (_arg_3.tag === 3) {
      return [_arg_3.fields[0], resolve(defs, _arg_3.fields[1])];
    } else {
      return void 0;
    }
  }, statements);
  const arguments$ = ofList2(choose2((_arg_4) => {
    if (_arg_4.tag === 6) {
      return [_arg_4.fields[0], [_arg_4.fields[1], _arg_4.fields[2]]];
    } else {
      return void 0;
    }
  }, statements), {
    Compare: (x_2, y_2) => comparePrimitives(x_2, y_2) | 0
  });
  const relationRows = toArray2(choose2((_arg_5) => {
    if (_arg_5.tag === 11) {
      const patternInput = relationInfo(defs, glosses, _arg_5.fields[0], _arg_5.fields[1], _arg_5.fields[2]);
      return [patternInput[0], patternInput[1], patternInput[2], patternInput[3]];
    } else {
      return void 0;
    }
  }, statements));
  const entries = [];
  const proseBuffer = [];
  const flushProse = () => {
    if (proseBuffer.length > 0) {
      void entries.push(new FSharpChoice$2(0, [new Statement(1, [join(" ", ofSeq(proseBuffer))])]));
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
        void entries.push(new FSharpChoice$2(1, [[forLoopVar[0], r_2.fields[0]]]));
      } else if (r_2.fields[0] == null) {
        flushProse();
      } else if (r_2.fields[0].tag === 1) {
        const text = r_2.fields[0].fields[0];
        void proseBuffer.push(text);
      } else {
        const st_1 = r_2.fields[0];
        flushProse();
        void entries.push(new FSharpChoice$2(0, [st_1]));
      }
    }
  } finally {
    disposeSafe(enumerator);
  }
  flushProse();
  return map2((_arg_6) => {
    if (_arg_6.tag === 1) {
      return new BlockView("error", empty5.level, _arg_6.fields[0][1], empty5.name, empty5.gloss, empty5.formula, empty5.verdict, empty5.atoms, empty5.rows, empty5.results, empty5.actual, _arg_6.fields[0][0], empty5.premises, empty5.conclusion, empty5.form, empty5.fallacy, empty5.note, empty5.suggestion, empty5.proof, empty5.relations, empty5.model, empty5.vennCircles, empty5.vennCells, empty5.vennPoints);
    } else {
      return toBlock(defs, glosses, claims, relationRows, arguments$, _arg_6.fields[0]);
    }
  }, entries.slice());
}
var FormView = class extends Record {
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
};
function catalog() {
  return toArray2(map4((f) => new FormView(f.Name, f.Title, f.Aka, f.Note, toArray2(map4(toUnicode, f.Premises)), toUnicode(f.Conclusion), equals(f.Kind, new FormKind(1, []))), forms));
}
var LintView = class extends Record {
  constructor(line, message) {
    super();
    this.line = line | 0;
    this.message = message;
  }
};
function lint(source) {
  const statements = choose2((tupledArg) => {
    const r = tupledArg[1];
    let matchResult;
    if (r.tag === 0) {
      if (r.fields[0] != null) {
        matchResult = 0;
      } else {
        matchResult = 1;
      }
    } else {
      matchResult = 1;
    }
    switch (matchResult) {
      case 0:
        return [tupledArg[0], r.fields[0]];
      default:
        return void 0;
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
            return singleton3(f_4.fields[0]);
          case 1:
            return cons(f_4.fields[0], f_4.fields[1]);
          case 2:
            return empty2();
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
  const usedNames = ofList(collect2(mentioned, collect2((tupledArg_1) => {
    const st_1 = tupledArg_1[1];
    switch (st_1.tag) {
      case 3:
        return singleton3(st_1.fields[1]);
      case 4:
        if (st_1.fields[0].tag === 0) {
          return singleton3(new Formula(0, [st_1.fields[0].fields[0]]));
        } else {
          return singleton3(st_1.fields[0].fields[0]);
        }
      case 5:
        if (st_1.fields[0].tag === 1) {
          return ofArray([st_1.fields[0].fields[0], st_1.fields[0].fields[1]]);
        } else {
          return singleton3(st_1.fields[0].fields[0]);
        }
      case 6:
        return append(st_1.fields[1], singleton3(st_1.fields[2]));
      case 7:
        return map4((_arg) => {
          let f_3;
          if (_arg.tag === 1) {
            f_3 = _arg.fields[1];
          } else {
            f_3 = _arg.fields[1];
          }
          return f_3;
        }, st_1.fields[1]);
      case 8:
        return append(st_1.fields[1], ofArray(toArray(st_1.fields[2])));
      case 9:
        return empty2();
      case 11:
        return choose2((_arg_1) => {
          if (_arg_1.tag === 1) {
            return void 0;
          } else {
            return new Formula(0, [_arg_1.fields[0]]);
          }
        }, ofArray([st_1.fields[0], st_1.fields[2]]));
      default:
        return empty2();
    }
  }, statements)), {
    Compare: (x, y) => comparePrimitives(x, y) | 0
  });
  const declaredNames = ofList(choose2((tupledArg_2) => {
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
        return void 0;
    }
  }, statements), {
    Compare: (x_1, y_1) => comparePrimitives(x_1, y_1) | 0
  });
  return toArray2(collect2((tupledArg_3) => {
    const lineNo = tupledArg_3[0] | 0;
    const st_4 = tupledArg_3[1];
    let matchResult_4, name_1, l_1, r_2;
    switch (st_4.tag) {
      case 2: {
        if (!contains2(st_4.fields[0], usedNames)) {
          matchResult_4 = 0;
          name_1 = st_4.fields[0];
        } else {
          matchResult_4 = 2;
        }
        break;
      }
      case 11: {
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
        return singleton3(new LintView(lineNo, toText(printf("prop '%s' is declared but never used in a formula"))(name_1)));
      case 1:
        return choose2((_arg_4) => {
          let matchResult_5, n_6;
          if (_arg_4.tag === 0) {
            if (!contains2(_arg_4.fields[0], declaredNames)) {
              matchResult_5 = 0;
              n_6 = _arg_4.fields[0];
            } else {
              matchResult_5 = 1;
            }
          } else {
            matchResult_5 = 1;
          }
          switch (matchResult_5) {
            case 0:
              return new LintView(lineNo, toText(printf("relation references '%s', which is not a declared prop or claim \u2014 it will appear as an ad-hoc node (quote it to make that intentional)"))(n_6));
            default:
              return void 0;
          }
        }, ofArray([l_1, r_2]));
      default:
        return empty2();
    }
  }, statements));
}

// src/core-bridge.ts
var analyze2 = analyze;
var catalog2 = catalog;
var lint2 = lint;

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
    "not-equivalent": "not equivalent",
    valid: "valid",
    invalid: "invalid",
    unknown: "unknown"
  };
  const text = label[verdict] ?? verdict;
  return `<span class="badge badge-${verdict}">${escapeHtml(text)}</span>`;
}
function tf(value2) {
  return `<td class="${value2 ? "t" : "f"}">${value2 ? "T" : "F"}</td>`;
}
function renderTruthTable(atoms2, rows, results, resultHeader, actual = -1) {
  const worldly = actual >= 0;
  const head2 = (worldly ? `<th class="world-name">world</th>` : "") + atoms2.map((a) => `<th>${escapeHtml(a)}</th>`).join("") + `<th class="result">${escapeHtml(resultHeader)}</th>`;
  const body = rows.map((row, i) => {
    const name = worldly ? `<td class="world-name${i === actual ? " actual" : ""}">${i === actual ? "\u2192 " : ""}w${i + 1}</td>` : "";
    const cells = name + row.map((v) => tf(v)).join("") + tf(results[i]);
    return `<tr>${cells}</tr>`;
  }).join("");
  return `<table class="truth"><thead><tr>${head2}</tr></thead><tbody>${body}</tbody></table>`;
}
function renderTable(block) {
  return renderTruthTable(block.atoms, block.rows, block.results, block.formula, block.actual);
}
function renderModelCard(lines) {
  const rows = lines.map((line) => {
    const eq = line.indexOf("=");
    if (eq === -1) return `<div class="model-line">${escapeHtml(line)}</div>`;
    const lhs = line.slice(0, eq).trim();
    const rhs = line.slice(eq + 1).trim();
    return `<div class="model-line"><span class="model-lhs">${escapeHtml(lhs)}</span><span class="model-eq">=</span><span class="model-rhs">${escapeHtml(rhs)}</span></div>`;
  }).join("");
  return `<div class="model-card">${rows}</div>`;
}
function renderArgument(block) {
  const chips = [verdictBadge(block.verdict)];
  if (block.form) chips.push(`<span class="chip chip-form">${escapeHtml(block.form)}</span>`);
  if (block.fallacy) chips.push(`<span class="chip chip-fallacy">${escapeHtml(block.fallacy)}</span>`);
  const parts = [];
  parts.push(
    `<figcaption><span class="arg-name">${escapeHtml(block.name)}</span>${chips.join(" ")}</figcaption>`
  );
  const premises = block.premises.map((p) => `<div class="premise">${escapeHtml(p)}</div>`).join("");
  parts.push(
    `<div class="derivation">${premises}<div class="conclusion">\u2234 ${escapeHtml(block.conclusion)}</div></div>`
  );
  if (block.note) {
    parts.push(`<p class="note">${escapeHtml(block.note)}</p>`);
  }
  if (block.verdict === "invalid" && block.rows.length > 0) {
    const label = block.actual >= 0 ? "countermodel \u2014 premises true at the actual world (\u2192), conclusion false there:" : "counterexample \u2014 premises true, conclusion false:";
    parts.push(
      `<div class="counterexample"><span class="cx-label">${label}</span>` + renderTruthTable(block.atoms, block.rows, block.results, block.conclusion, block.actual) + `</div>`
    );
  }
  if (block.verdict === "invalid" && block.model.length > 0) {
    parts.push(
      `<div class="counterexample"><span class="cx-label">countermodel \u2014 premises true, conclusion false:</span>` + renderModelCard(block.model) + `</div>`
    );
  }
  if (block.suggestion.length > 0) {
    const options = block.suggestion.map((s) => `<span class="formula">${escapeHtml(s)}</span>`).join(`<span class="or"> or </span>`);
    parts.push(
      `<div class="repair">Becomes valid if you add the premise ${options} \u2014 is that what's silently being assumed?</div>`
    );
  }
  if (block.proof.length > 0) {
    const steps = block.proof.map(
      ([n, formula, why]) => `<tr><td class="step-no">${escapeHtml(n)}.</td><td class="step-formula">${escapeHtml(formula)}</td><td class="step-why">${escapeHtml(why)}</td></tr>`
    ).join("");
    parts.push(`<table class="proof"><tbody>${steps}</tbody></table>`);
  }
  return `<figure class="argument">${parts.join("")}</figure>`;
}
function renderProof(block) {
  const rows = block.proof.map(([n, formula, why, status, message]) => {
    const mark = status === "ok" ? `<td class="step-status ok">\u2713</td>` : status === "bad" ? `<td class="step-status bad">\u2717</td>` : `<td class="step-status"></td>`;
    const main = `<tr class="step-${status}"><td class="step-no">${escapeHtml(n)}.</td><td class="step-formula">${escapeHtml(formula)}</td><td class="step-why">${escapeHtml(why)}</td>${mark}</tr>`;
    const detail = message ? `<tr class="step-msg"><td></td><td colspan="3">${escapeHtml(message)}</td></tr>` : "";
    return main + detail;
  }).join("");
  const note = block.note ? `<p class="note">${escapeHtml(block.note)}</p>` : "";
  return `<figure class="argument proof-figure"><figcaption><span class="arg-name">${escapeHtml(block.name)}</span>${verdictBadge(block.verdict)}<span class="check-label">proof</span></figcaption><table class="proof">${rows}</table>${note}</figure>`;
}
function renderRelation(block) {
  const mark = block.verdict === "holds" ? "\u2713 holds" : block.verdict === "fails" ? "\u2717 fails" : "asserted";
  const note = block.note ? `<div class="note">${escapeHtml(block.note)}</div>` : "";
  return `<div class="relation-stmt"><span class="rel-claim">${escapeHtml(block.formula)}</span><span class="rel-verb rel-${escapeHtml(block.title)}">${escapeHtml(block.title)}</span><span class="rel-claim">${escapeHtml(block.conclusion)}</span><span class="chip chip-${escapeHtml(block.verdict)}">${mark}</span>` + note + `</div>`;
}
var nodeWidthOf = (label) => Math.min(label.length, 26) * 7.2 + 20;
function layeredLayout(labels, links) {
  const index = new Map(labels.map((label, i) => [label, i]));
  const out = labels.map(() => /* @__PURE__ */ new Set());
  for (const { from, to } of links) {
    const a = index.get(from), b = index.get(to);
    if (a !== b) out[a].add(b);
  }
  const state = labels.map(() => 0);
  const backEdges = /* @__PURE__ */ new Set();
  const dfs = (v) => {
    state[v] = 1;
    for (const w of out[v]) {
      if (state[w] === 1) backEdges.add(`${v}>${w}`);
      else if (state[w] === 0) dfs(w);
    }
    state[v] = 2;
  };
  labels.forEach((_, v) => state[v] === 0 && dfs(v));
  const vLayer = labels.map(() => 0);
  for (let pass = 0; pass < labels.length; pass++)
    labels.forEach((_, v) => {
      for (const w of out[v])
        if (!backEdges.has(`${v}>${w}`)) vLayer[w] = Math.max(vLayer[w], vLayer[v] + 1);
    });
  const vWidth = labels.map(nodeWidthOf);
  const chains = links.map(({ from, to }) => {
    const a = index.get(from), b = index.get(to);
    const span = vLayer[b] - vLayer[a];
    if (a === b || Math.abs(span) <= 1) return [a, b];
    const step = Math.sign(span);
    const chain = [a];
    for (let k = 1; k < Math.abs(span); k++) {
      chain.push(vLayer.length);
      vLayer.push(vLayer[a] + step * k);
      vWidth.push(10);
    }
    chain.push(b);
    return chain;
  });
  const segments = [];
  for (const chain of chains)
    for (let i = 0; i + 1 < chain.length; i++) segments.push([chain[i], chain[i + 1]]);
  const depth = Math.max(0, ...vLayer);
  const rows = Array.from({ length: depth + 1 }, () => []);
  vLayer.forEach((l, v) => rows[l].push(v));
  const orderOf = new Array(vLayer.length).fill(0);
  rows.forEach((row) => row.forEach((v, i) => orderOf[v] = i));
  const neighborsIn = (v, targetLayer) => {
    const result = [];
    for (const [a, b] of segments) {
      if (a === v && vLayer[b] === targetLayer) result.push(b);
      if (b === v && vLayer[a] === targetLayer) result.push(a);
    }
    return result;
  };
  for (let sweep = 0; sweep < 6; sweep++) {
    const dir = sweep % 2 === 0 ? -1 : 1;
    for (const row of rows) {
      const barycenter = (v) => {
        const ns = neighborsIn(v, vLayer[v] + dir);
        return ns.length ? ns.reduce((s, w) => s + orderOf[w], 0) / ns.length : orderOf[v];
      };
      row.sort((u, v) => barycenter(u) - barycenter(v));
      row.forEach((v, i) => orderOf[v] = i);
    }
  }
  const GAP = 42, ROW_H = 118, MARGIN = 56;
  const coord = new Array(vLayer.length);
  rows.forEach((row, li) => {
    let x = 0;
    for (const v of row) {
      coord[v] = { x: x + vWidth[v] / 2, y: MARGIN + li * ROW_H };
      x += vWidth[v] + GAP;
    }
  });
  const realCount = labels.length;
  const segWeight = (a, b) => a >= realCount || b >= realCount ? 4 : 1;
  const weightedNeighbors = (v) => segments.filter(([a, b]) => a === v || b === v).map(([a, b]) => {
    const w = a === v ? b : a;
    return { w, weight: segWeight(a, b) };
  });
  const settleRow = (row) => {
    const sorted = [...row].sort((u, v) => coord[u].x - coord[v].x);
    for (let k = 1; k < sorted.length; k++) {
      const gap = coord[sorted[k - 1]].x + vWidth[sorted[k - 1]] / 2 + GAP + vWidth[sorted[k]] / 2;
      if (coord[sorted[k]].x < gap) coord[sorted[k]].x = gap;
    }
    for (let k = sorted.length - 2; k >= 0; k--) {
      const cap = coord[sorted[k + 1]].x - vWidth[sorted[k + 1]] / 2 - GAP - vWidth[sorted[k]] / 2;
      if (coord[sorted[k]].x > cap) coord[sorted[k]].x = cap;
    }
    for (let k = 1; k < sorted.length; k++) {
      const gap = coord[sorted[k - 1]].x + vWidth[sorted[k - 1]] / 2 + GAP + vWidth[sorted[k]] / 2;
      if (coord[sorted[k]].x < gap) coord[sorted[k]].x = gap;
    }
  };
  const relaxPasses = (count) => {
    for (let pass = 0; pass < count; pass++) {
      const rowSequence = pass % 2 === 0 ? rows : [...rows].reverse();
      for (const row of rowSequence) {
        for (const v of row) {
          const ns = weightedNeighbors(v);
          const total = ns.reduce((s, n) => s + n.weight, 0);
          if (total) coord[v].x = ns.reduce((s, n) => s + coord[n.w].x * n.weight, 0) / total;
        }
        settleRow(row);
      }
    }
  };
  relaxPasses(16);
  const wireCostOf = (v) => segments.reduce(
    (s, [a, b]) => a === v || b === v ? s + segWeight(a, b) * Math.abs(coord[a].x - coord[b].x) : s,
    0
  );
  for (let round = 0; round < 2; round++) {
    for (const row of rows) {
      const sorted = [...row].sort((u, v) => coord[u].x - coord[v].x);
      for (let k = 0; k + 1 < sorted.length; k++) {
        const u = sorted[k], v = sorted[k + 1];
        const before = wireCostOf(u) + wireCostOf(v);
        const ux = coord[u].x, vx = coord[v].x;
        coord[u].x = vx;
        coord[v].x = ux;
        if (wireCostOf(u) + wireCostOf(v) >= before) {
          coord[u].x = ux;
          coord[v].x = vx;
        } else {
          sorted[k] = v;
          sorted[k + 1] = u;
        }
      }
    }
    relaxPasses(8);
  }
  relaxPasses(20);
  for (const row of rows) {
    for (const v of row) {
      const ns = weightedNeighbors(v);
      if (ns.length === 1) coord[v].x = coord[ns[0].w].x;
    }
    settleRow(row);
  }
  const allV = coord.map((_, v) => v);
  const shift = MARGIN - Math.min(...allV.map((v) => coord[v].x - vWidth[v] / 2));
  allV.forEach((v) => coord[v].x += shift);
  const W = Math.max(480, ...allV.map((v) => coord[v].x + vWidth[v] / 2 + MARGIN));
  const H = MARGIN * 2 + depth * ROW_H + 28;
  const pos = new Map(labels.map((label, i) => [label, coord[i]]));
  const layerOf = new Map(labels.map((label, i) => [label, vLayer[i]]));
  const routes = chains.map(
    (chain) => chain.slice(1, -1).map((d) => ({ x: coord[d].x, layer: vLayer[d] }))
  );
  const channelMid = (c) => MARGIN + c * ROW_H + ROW_H / 2;
  return { pos, layerOf, routes, channelMid, W, H };
}
function renderMap(block) {
  if (block.relations.length === 0) {
    return `<figure class="relmap-figure"><p class="empty">map needs at least one relation \u2014 e.g. <code>C1 supports C2</code>.</p></figure>`;
  }
  const labels = [...new Set(block.relations.flatMap(([l, , r]) => [l, r]))];
  const { pos, layerOf, routes, channelMid, W, H } = layeredLayout(
    labels,
    block.relations.map(([from, , to]) => ({ from, to }))
  );
  const widthOf = nodeWidthOf;
  const shown = (label) => label.length > 26 ? label.slice(0, 25) + "\u2026" : label;
  const HALF_NODE = 14;
  const ports = /* @__PURE__ */ new Map();
  const portKey = (label, side) => `${label}|${side}`;
  block.relations.forEach(([l, , r], i) => {
    const la = layerOf.get(l), lb = layerOf.get(r);
    if (la === lb) return;
    const down = lb > la;
    const wps = routes[i];
    const firstX = wps.length ? wps[0].x : pos.get(r).x;
    const lastX = wps.length ? wps[wps.length - 1].x : pos.get(l).x;
    const srcSide = portKey(l, down ? "bottom" : "top");
    const dstSide = portKey(r, down ? "top" : "bottom");
    (ports.get(srcSide) ?? ports.set(srcSide, []).get(srcSide)).push({ edge: i, towardX: firstX });
    (ports.get(dstSide) ?? ports.set(dstSide, []).get(dstSide)).push({ edge: i, towardX: lastX });
  });
  const portX = /* @__PURE__ */ new Map();
  for (const [key, list] of ports) {
    const label = key.slice(0, key.lastIndexOf("|"));
    const { x } = pos.get(label);
    const usable = Math.max(widthOf(label) - 28, 0);
    const spread = list.length > 1 ? Math.min(24, usable / (list.length - 1)) : 0;
    list.sort((p, q) => p.towardX - q.towardX);
    list.forEach((p, j) => {
      const isSrc = block.relations[p.edge][0] === label;
      portX.set(`${p.edge}|${isSrc ? "src" : "dst"}`, x + (j - (list.length - 1) / 2) * spread);
    });
  }
  const channelRuns = /* @__PURE__ */ new Map();
  const runTrackY = /* @__PURE__ */ new Map();
  const edgeColumns = (i) => {
    const [l, , r] = block.relations[i];
    const la = layerOf.get(l), lb = layerOf.get(r);
    if (la === lb) return null;
    return [
      portX.get(`${i}|src`) ?? pos.get(l).x,
      ...routes[i].map((w) => w.x),
      portX.get(`${i}|dst`) ?? pos.get(r).x
    ];
  };
  block.relations.forEach(([l, , r], i) => {
    const cols = edgeColumns(i);
    if (!cols) return;
    const la = layerOf.get(l), lb = layerOf.get(r);
    const step = Math.sign(lb - la);
    for (let hop = 0; hop + 1 < cols.length; hop++) {
      const channel = Math.min(la + hop * step, la + (hop + 1) * step);
      (channelRuns.get(channel) ?? channelRuns.set(channel, []).get(channel)).push({ edge: i, hop, x1: cols[hop], x2: cols[hop + 1] });
    }
  });
  const lastHopOf = (edge) => routes[edge].length;
  for (const [channel, runs] of channelRuns) {
    const srcCount = /* @__PURE__ */ new Map();
    const dstCount = /* @__PURE__ */ new Map();
    for (const run of runs) {
      if (run.hop === 0) {
        const s = block.relations[run.edge][0];
        srcCount.set(s, (srcCount.get(s) ?? 0) + 1);
      }
      if (run.hop === lastHopOf(run.edge)) {
        const d = block.relations[run.edge][2];
        dstCount.set(d, (dstCount.get(d) ?? 0) + 1);
      }
    }
    const keyOf = (run) => {
      const src = block.relations[run.edge][0], dst = block.relations[run.edge][2];
      const s = run.hop === 0 ? srcCount.get(src) ?? 0 : 0;
      const d = run.hop === lastHopOf(run.edge) ? dstCount.get(dst) ?? 0 : 0;
      if (s === 0 && d === 0) return `edge:${run.edge}:${run.hop}`;
      return d > s ? `dst:${dst}` : `src:${src}`;
    };
    const groups = /* @__PURE__ */ new Map();
    for (const run of runs) {
      const key = keyOf(run);
      const lo = Math.min(run.x1, run.x2), hi = Math.max(run.x1, run.x2);
      const g = groups.get(key);
      if (g) {
        g.runs.push(run);
        g.lo = Math.min(g.lo, lo);
        g.hi = Math.max(g.hi, hi);
      } else groups.set(key, { runs: [run], lo, hi });
    }
    const ordered = [...groups.values()].sort((a, b) => a.lo - b.lo);
    const trackEnds = [];
    for (const group of ordered) {
      let t = trackEnds.findIndex((end) => group.lo > end + 18);
      if (t === -1) {
        t = trackEnds.length;
        trackEnds.push(group.hi);
      } else trackEnds[t] = Math.max(trackEnds[t], group.hi);
      for (const run of group.runs) {
        runTrackY.set(`${run.edge}|${run.hop}`, t);
      }
    }
    for (const run of runs) {
      const t = runTrackY.get(`${run.edge}|${run.hop}`);
      runTrackY.set(`${run.edge}|${run.hop}`, channelMid(channel) + (t - (trackEnds.length - 1) / 2) * 13);
    }
  }
  const labelSpecs = [];
  const edgePaths = block.relations.map(([l, verb, r, status], i) => {
    const a = pos.get(l), b = pos.get(r);
    const failed = status === "fails" ? " failed" : "";
    const both = verb === "equivalent-to" ? ` marker-start="url(#dot-${verb})"` : "";
    const labelText = status === "fails" ? `${verb} \u2717` : verb;
    const cls = `${verb}${failed}`;
    if (layerOf.get(l) === layerOf.get(r)) {
      const x1 = a.x + Math.sign(b.x - a.x) * (widthOf(l) / 2 + 8);
      const x2 = b.x - Math.sign(b.x - a.x) * (widthOf(r) / 2 + 8);
      const y = a.y - 12;
      const mx = (x1 + x2) / 2;
      const bow = 34 + Math.abs(x2 - x1) / 12;
      const top = y - bow / 2 - 8;
      labelSpecs.push({ text: labelText, cls, x: mx, anchor: "middle", candidates: [top, top - 14, top - 28] });
      return `<path class="edge ${cls}" d="M ${x1.toFixed(1)} ${y} Q ${mx.toFixed(1)} ${(y - bow).toFixed(1)} ${x2.toFixed(1)} ${y}" marker-end="url(#arrow-${verb})"${both}/>`;
    }
    const cols = edgeColumns(i);
    const down = layerOf.get(r) > layerOf.get(l);
    const yStart = a.y + (down ? 1 : -1) * (HALF_NODE + 2);
    const yEnd = b.y - (down ? 1 : -1) * (HALF_NODE + 8);
    const points = [{ x: cols[0], y: yStart }];
    for (let hop = 0; hop + 1 < cols.length; hop++) {
      if (Math.abs(cols[hop + 1] - cols[hop]) >= 1) {
        const ty = runTrackY.get(`${i}|${hop}`);
        points.push({ x: cols[hop], y: ty }, { x: cols[hop + 1], y: ty });
      }
    }
    points.push({ x: cols[cols.length - 1], y: yEnd });
    const path2 = "M " + points.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ");
    let best = -1, bx = 0, by = 0;
    for (let k = 0; k + 1 < points.length; k++) {
      const w = Math.abs(points[k + 1].x - points[k].x);
      if (points[k].y === points[k + 1].y && w > best) {
        best = w;
        bx = (points[k].x + points[k + 1].x) / 2;
        by = points[k].y;
      }
    }
    if (best >= 24) {
      labelSpecs.push({ text: labelText, cls, x: bx, anchor: "middle", candidates: [by - 6, by + 13, by - 21, by + 28] });
    } else {
      const midY = (yStart + yEnd) / 2;
      labelSpecs.push({ text: labelText, cls, x: cols[0] + 8, anchor: "start", candidates: [midY, midY + 16, midY - 16, midY + 32, midY - 32] });
    }
    return `<path class="edge ${cls}" d="${path2}" marker-end="url(#arrow-${verb})"${both}/>`;
  }).join("");
  const occupied = labels.map((label) => {
    const { x, y } = pos.get(label);
    const w = widthOf(label);
    return { x1: x - w / 2, x2: x + w / 2, y1: y - HALF_NODE, y2: y + HALF_NODE };
  });
  const collides = (box) => occupied.some((b) => b.x1 < box.x2 && box.x1 < b.x2 && b.y1 < box.y2 && box.y1 < b.y2);
  const edgeLabels = labelSpecs.map((spec) => {
    const w = spec.text.length * 6.3;
    const x1 = spec.anchor === "middle" ? spec.x - w / 2 : spec.x;
    const boxAt = (y2) => ({ x1, x2: x1 + w, y1: y2 - 10, y2: y2 + 3 });
    let y = spec.candidates[spec.candidates.length - 1];
    for (const candidate of spec.candidates) {
      if (!collides(boxAt(candidate))) {
        y = candidate;
        break;
      }
    }
    occupied.push(boxAt(y));
    const anchor = spec.anchor === "middle" ? ` text-anchor="middle"` : ` text-anchor="start"`;
    return `<text class="edge-label ${spec.cls}" x="${spec.x.toFixed(1)}" y="${y.toFixed(1)}"${anchor}>${escapeHtml(spec.text)}</text>`;
  }).join("");
  const edges = edgePaths + edgeLabels;
  const nodes = labels.map((label) => {
    const { x, y } = pos.get(label);
    const w = widthOf(label);
    const adHoc = label.startsWith("\u201C") ? " ad-hoc" : "";
    return `<g class="node${adHoc}"><rect x="${(x - w / 2).toFixed(1)}" y="${(y - 14).toFixed(1)}" width="${w.toFixed(1)}" height="28" rx="7"/><text x="${x.toFixed(1)}" y="${(y + 4.5).toFixed(1)}" text-anchor="middle">${escapeHtml(shown(label))}</text></g>`;
  }).join("");
  const marker = (verb) => `<marker id="arrow-${verb}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow ${verb}" d="M 0 0 L 10 5 L 0 10 z"/></marker><marker id="dot-${verb}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow ${verb}" d="M 0 0 L 10 5 L 0 10 z"/></marker>`;
  const verbs = [...new Set(block.relations.map(([, v]) => v))];
  return `<figure class="relmap-figure"><figcaption>argument map</figcaption><svg class="relmap" viewBox="0 0 ${W} ${H}" role="img"><defs>${verbs.map(marker).join("")}</defs>${edges}${nodes}</svg></figure>`;
}
var VENN_W = 380;
var VENN_H = 300;
var VENN_R = 82;
var VENN_LAYOUT = {
  1: [{ cx: 190, cy: 155 }],
  2: [
    { cx: 150, cy: 155 },
    { cx: 230, cy: 155 }
  ],
  3: [
    { cx: 150, cy: 138 },
    { cx: 240, cy: 138 },
    { cx: 195, cy: 214 }
  ]
};
var VENN_CENTROIDS = {
  1: { "0": [190, 40], "1": [190, 155] },
  2: {
    "00": [190, 32],
    "10": [112, 155],
    "01": [268, 155],
    "11": [190, 155]
  },
  3: {
    "000": [195, 28],
    "100": [108, 112],
    "010": [282, 112],
    "001": [195, 258],
    "110": [195, 100],
    "101": [138, 188],
    "011": [252, 188],
    "111": [195, 158]
  }
};
var vennCounter = 0;
function renderVenn(block) {
  if (block.verdict === "not-drawable") {
    return `<figure class="venn-figure"><figcaption>${escapeHtml(block.name)} \u2014 Venn diagram</figcaption><p class="empty">${escapeHtml(block.note)}</p></figure>`;
  }
  const n = block.vennCircles.length;
  const layout = VENN_LAYOUT[n];
  const centroids = VENN_CENTROIDS[n];
  const id = `v${vennCounter++}`;
  const circlePath = (cx, cy) => `M ${cx - VENN_R} ${cy} a ${VENN_R} ${VENN_R} 0 1 0 ${2 * VENN_R} 0 a ${VENN_R} ${VENN_R} 0 1 0 ${-2 * VENN_R} 0 z`;
  const defs = `<pattern id="hatch-${id}" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="7" class="venn-hatch"/></pattern>` + layout.map(
    (c, j) => `<clipPath id="in-${id}-${j}"><circle cx="${c.cx}" cy="${c.cy}" r="${VENN_R}"/></clipPath><clipPath id="out-${id}-${j}" clip-rule="evenodd"><path clip-rule="evenodd" d="M0 0 H${VENN_W} V${VENN_H} H0 Z ${circlePath(c.cx, c.cy)}"/></clipPath>`
  ).join("");
  const shaded = block.vennCells.filter((c) => c[1] === "empty").map(([bits]) => {
    let open = "";
    let close = "";
    for (let j = 0; j < n; j++) {
      const which = bits[j] === "1" ? "in" : "out";
      open += `<g clip-path="url(#${which}-${id}-${j})">`;
      close += `</g>`;
    }
    return `${open}<rect x="0" y="0" width="${VENN_W}" height="${VENN_H}" fill="url(#hatch-${id})"/>${close}`;
  }).join("");
  const circles = layout.map((c) => `<circle class="venn-circle" cx="${c.cx}" cy="${c.cy}" r="${VENN_R}"/>`).join("");
  const labels = layout.map((c, j) => {
    const dx = n === 2 ? j === 0 ? -VENN_R * 0.5 : VENN_R * 0.5 : 0;
    return `<text class="venn-label" x="${c.cx + dx}" y="${c.cy - VENN_R - 6}" text-anchor="middle">${escapeHtml(block.vennCircles[j])}</text>`;
  }).join("");
  const dots = block.vennCells.filter((c) => c[1] === "occupied").map(([bits]) => {
    const [x, y] = centroids[bits] ?? [VENN_W / 2, VENN_H / 2];
    return `<circle class="venn-dot" cx="${x}" cy="${y}" r="4.5"/>`;
  }).join("");
  const points = block.vennPoints.map(([name, cellSpec]) => {
    const cells = cellSpec ? cellSpec.split("|") : [];
    if (cells.length === 0) return "";
    const pts = cells.map((b) => centroids[b] ?? [VENN_W / 2, VENN_H / 2]);
    const x = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const y = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const ambiguous = cells.length > 1 ? "?" : "";
    return `<g class="venn-point"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5"/><text x="${(x + 7).toFixed(1)}" y="${(y + 4).toFixed(1)}">${escapeHtml(name)}${ambiguous}</text></g>`;
  }).join("");
  return `<figure class="venn-figure"><figcaption>${escapeHtml(block.name)} \u2014 Venn diagram</figcaption><svg class="venn" viewBox="0 0 ${VENN_W} ${VENN_H}" role="img"><defs>${defs}</defs>${shaded}${circles}${labels}${dots}${points}</svg><p class="note">${escapeHtml(block.note)}</p></figure>`;
}
function renderRelations(block) {
  if (block.relations.length === 0) {
    return `<div class="relations"><p class="empty">analyze needs at least two <code>claim</code>s to compare.</p></div>`;
  }
  const rows = block.relations.map(([left, rel, right, why]) => {
    const detail = why ? ` <span class="rel-detail">\u2014 ${escapeHtml(why)}</span>` : "";
    const cls = rel === "independent" ? "rel-row rel-independent" : "rel-row";
    return `<tr class="${cls}"><td class="rel-claim">${escapeHtml(left)}</td><td class="rel-kind">${escapeHtml(rel)}${detail}</td><td class="rel-claim">${escapeHtml(right)}</td></tr>`;
  }).join("");
  return `<figure class="relations"><figcaption>claim relations</figcaption><table><tbody>${rows}</tbody></table></figure>`;
}
function renderBlock(block) {
  switch (block.kind) {
    case "heading": {
      const level = Math.min(Math.max(block.level, 1), 6);
      return `<h${level}>${escapeHtml(block.title)}</h${level}>`;
    }
    case "prose": {
      const text = escapeHtml(block.title).replace(/\*([^*]+)\*/g, "<em>$1</em>");
      return `<p class="prose">${text}</p>`;
    }
    case "prop":
      return `<div class="prop"><span class="atom">${escapeHtml(block.name)}</span><span class="colon">:</span><span class="gloss">${escapeHtml(block.gloss)}</span></div>`;
    case "claim": {
      const reading = block.note ? `<div class="reading">${escapeHtml(block.note)}</div>` : "";
      return `<div class="claim"><span class="name">${escapeHtml(block.name)}</span><span class="formula">${escapeHtml(block.formula)}</span>${reading}</div>`;
    }
    case "table": {
      const note = block.note ? `<span class="note-inline">${escapeHtml(block.note)}</span>` : "";
      const card = block.model.length > 0 ? renderModelCard(block.model) : "";
      const body = block.atoms.length > 0 ? renderTable(block) : card;
      const head2 = block.atoms.length > 0 ? "" : `<div class="fo-formula">${escapeHtml(block.formula)}</div>`;
      return `<figure class="statement"><figcaption>${verdictBadge(block.verdict)}${note}</figcaption>${head2}${body}</figure>`;
    }
    case "check": {
      const note = block.note ? `<span class="note-inline">${escapeHtml(block.note)}</span>` : "";
      const card = block.model.length > 0 ? renderModelCard(block.model) : "";
      if (block.atoms.length === 0) {
        return `<div class="check"><div><span class="formula">${escapeHtml(block.formula)}</span>${verdictBadge(block.verdict)}</div>${note}${card}</div>`;
      }
      return `<figure class="statement"><figcaption><span class="check-label">check</span> ${verdictBadge(block.verdict)}${note}</figcaption>${renderTable(block)}</figure>`;
    }
    case "argument":
      return renderArgument(block);
    case "proof":
      return renderProof(block);
    case "venn":
      return renderVenn(block);
    case "relations":
      return renderRelations(block);
    case "relation":
      return renderRelation(block);
    case "map":
      return renderMap(block);
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

// src/completion.ts
var vscode = __toESM(require("vscode"));
var PROSE_FORMS = [
  { name: "modus-ponens", title: "modus ponens", body: "If ${1:P}, then ${2:Q}. ${1:P}. Therefore, ${2:Q}." },
  { name: "modus-tollens", title: "modus tollens", body: "If ${1:P}, then ${2:Q}. Not ${2:Q}. Therefore, not ${1:P}." },
  { name: "hypothetical-syllogism", title: "hypothetical syllogism", body: "If ${1:P}, then ${2:Q}. If ${2:Q}, then ${3:R}. Therefore, if ${1:P}, then ${3:R}." },
  { name: "disjunctive-syllogism", title: "disjunctive syllogism", body: "Either ${1:P} or ${2:Q}. Not ${1:P}. Therefore, ${2:Q}." },
  { name: "constructive-dilemma", title: "constructive dilemma", body: "Either ${1:P} or ${2:R}. If ${1:P}, then ${3:Q}. If ${2:R}, then ${4:S}. Therefore, either ${3:Q} or ${4:S}." },
  { name: "syllogism", title: "categorical syllogism", body: "All ${1:men} are ${2:mortal}. ${3:Socrates} is a ${1:men}. Therefore, ${3:Socrates} is ${2:mortal}." }
];
var KEYWORD_SNIPPETS = [
  { label: "prop", detail: "name an atomic proposition", body: "prop ${1:p} : ${2:its meaning in plain language}" },
  { label: "claim", detail: "name a claim, in prose", body: "claim ${1:C1} : ${2:if p then q}" },
  { label: "table", detail: "truth table + verdict", body: "table ${1:C1}" },
  { label: "check", detail: "verdict for a claim", body: "check ${1:if p then q}" },
  { label: "check equivalent", detail: "are two claims the same?", body: "check ${1:A} equivalent ${2:B}" },
  { label: "argument", detail: "premises + conclusion, validity checked", body: "argument ${1:name} {\n  premise ${2:if p then q}\n  premise ${3:p}\n  ---\n  conclude ${4:q}\n}" },
  { label: "proof", detail: "your own derivation, graded step by step", body: "proof ${1:name} {\n  1. premise ${2:if p then q}\n  2. premise ${3:p}\n  3. ${4:q} by ${5:modus-ponens} from ${6:1, 2}\n}" },
  { label: "venn", detail: "a categorical Venn diagram", body: "venn ${1:name} {\n  premise All ${2:men} are ${3:mortal}\n  premise ${4:Socrates} is a ${2:men}\n}" },
  { label: "analyze", detail: "relate every claim to every other", body: "analyze" },
  { label: "map", detail: "draw all asserted relations as a graph", body: "map" },
  { label: "relation", detail: "assert a relation between two claims", body: "${1:C1} ${2|supports,presupposes,contradicts,entails,equivalent-to|} ${3:C2}" },
  { label: "premise", detail: "a premise inside an argument", body: "premise ${1:p}" },
  { label: "conclude", detail: "the conclusion of an argument", body: "conclude ${1:q}" },
  { label: "necessarily", detail: "modal \u2014 true in every possible world", body: "necessarily ${1:p}" },
  { label: "possibly", detail: "modal \u2014 true in some possible world", body: "possibly ${1:p}" }
];
function registerCompletions(context) {
  const forms2 = catalog2();
  const provider = {
    provideCompletionItems(document, position) {
      const prefix = document.lineAt(position).text.slice(0, position.character);
      const items = [];
      if (/\bby\s+[\w-]*$/.test(prefix)) {
        for (const form of forms2.filter((f) => !f.isFallacy)) {
          const item3 = new vscode.CompletionItem(form.name, vscode.CompletionItemKind.Function);
          item3.detail = form.aka ? `${form.title} (${form.aka})` : form.title;
          item3.documentation = `${form.premises.join(";  ")}  \u22A2  ${form.conclusion}
${form.note}`;
          items.push(item3);
        }
        return items;
      }
      const slash = prefix.match(/\/[\w-]*$/);
      const slashRange = slash ? new vscode.Range(position.line, position.character - slash[0].length, position.line, position.character) : void 0;
      for (const form of PROSE_FORMS) {
        const item3 = new vscode.CompletionItem(`/${form.name}`, vscode.CompletionItemKind.Snippet);
        item3.detail = form.title;
        item3.documentation = new vscode.MarkdownString(form.body.replace(/\$\{\d+:(\w+)\}/g, "$1"));
        item3.insertText = new vscode.SnippetString(form.body);
        item3.filterText = `/${form.name} ${form.name}`;
        if (slashRange) item3.range = slashRange;
        items.push(item3);
      }
      if (slash) return items;
      for (const kw of KEYWORD_SNIPPETS) {
        const item3 = new vscode.CompletionItem(kw.label, vscode.CompletionItemKind.Keyword);
        item3.detail = kw.detail;
        item3.insertText = new vscode.SnippetString(kw.body);
        items.push(item3);
      }
      for (const match of document.getText().matchAll(/^\s*(prop|claim)\s+([A-Za-z_]\w*)\s*:/gm)) {
        const item3 = new vscode.CompletionItem(
          match[2],
          match[1] === "prop" ? vscode.CompletionItemKind.Variable : vscode.CompletionItemKind.Constant
        );
        item3.detail = match[1];
        items.push(item3);
      }
      return items;
    }
  };
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { language: "meticulous" },
      provider,
      "/"
      // typing a slash pops the form catalog; Ctrl+Space works everywhere
    )
  );
}

// src/diagnostics.ts
var vscode2 = __toESM(require("vscode"));
function refresh(document, collection) {
  if (document.languageId !== "meticulous") return;
  const diagnostics = [];
  const fullLineRange = (line1based) => {
    const line = Math.max(0, Math.min(line1based - 1, document.lineCount - 1));
    return document.lineAt(line).range;
  };
  try {
    for (const block of analyze2(document.getText())) {
      if (block.kind === "error") {
        diagnostics.push(
          new vscode2.Diagnostic(fullLineRange(block.line), block.title, vscode2.DiagnosticSeverity.Error)
        );
      }
    }
    for (const warning of lint2(document.getText())) {
      const d = new vscode2.Diagnostic(
        fullLineRange(warning.line),
        warning.message,
        vscode2.DiagnosticSeverity.Warning
      );
      d.tags = [vscode2.DiagnosticTag.Unnecessary];
      diagnostics.push(d);
    }
  } catch {
  }
  collection.set(document.uri, diagnostics);
}
function registerDiagnostics(context) {
  const collection = vscode2.languages.createDiagnosticCollection("meticulous");
  let debounce;
  const scheduleRefresh = (document) => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => refresh(document, collection), 300);
  };
  for (const document of vscode2.workspace.textDocuments) refresh(document, collection);
  context.subscriptions.push(
    collection,
    vscode2.workspace.onDidOpenTextDocument((d) => refresh(d, collection)),
    vscode2.workspace.onDidChangeTextDocument((e) => scheduleRefresh(e.document)),
    vscode2.workspace.onDidCloseTextDocument((d) => collection.delete(d.uri))
  );
}

// src/hover.ts
var vscode3 = __toESM(require("vscode"));
var KEYWORDS = {
  prop: "**prop** declares an *atomic proposition* \u2014 a smallest statement that is simply true or false \u2014 and glosses it in plain language:\n\n```\nprop rain : It is raining\n```",
  claim: "**claim** names a compound statement so it can be reused, tabled, and compared:\n\n```\nclaim C1 : if rain then wet\n```",
  table: "**table** computes a truth table and a verdict \u2014 *tautology* (always true), *contradiction* (never true), or *contingent* (depends on the facts).",
  check: "**check** asks for a verdict, or compares two claims:\n\n```\ncheck C1 equivalent (not rain or wet)\n```",
  argument: "**argument** lists premises and a conclusion. The engine checks validity, names the inference form (or the fallacy), shows counterexamples, suggests missing premises, and derives a proof.",
  premise: "A **premise** \u2014 something granted for the sake of the argument.",
  conclude: "**conclude** states what is supposed to follow from the premises. Valid means: no possible situation makes every premise true and this false.",
  proof: "**proof** is a derivation *you* write, one numbered step per line \u2014 the engine grades every step:\n\n```\n3. q by modus-ponens from 1, 2\n```",
  by: "**by** names the inference rule that justifies this step (hover the rule name for its pattern).",
  from: "**from** cites the earlier line numbers this step builds on.",
  venn: "**venn** draws a categorical argument as a Venn diagram \u2014 shaded regions are provably empty, a dot marks a region that must be occupied.",
  analyze: "**analyze** compares every claim with every other: equivalent, contradictory, contrary, subcontrary, entails, or independent.",
  map: "**map** draws all asserted relations (supports, contradicts, \u2026) as an argument map."
};
var LOGIC = {
  if: "**if \u2026 then \u2026** builds a *material implication*, rendered **\u2192**. It is false only when the *if* part holds and the *then* part fails \u2014 so a false *if* makes the whole thing true (vacuously).",
  then: "**if \u2026 then \u2026** builds a *material implication*, rendered **\u2192**. It is false only when the *if* part holds and the *then* part fails.",
  and: "**and** is *conjunction*, rendered **\u2227**: true exactly when both sides are true.",
  or: "**or** is *inclusive disjunction*, rendered **\u2228**: true when at least one side is true \u2014 possibly both.",
  not: "**not** is *negation*, rendered **\xAC**: flips true and false.",
  either: "**either \u2026 or \u2026** is the same inclusive **\u2228** \u2014 the *either* just marks where the choice starts.",
  neither: "**neither \u2026 nor \u2026** means both fail: \xACA \u2227 \xACB.",
  nor: "**neither \u2026 nor \u2026** means both fail: \xACA \u2227 \xACB.",
  iff: "**iff** \u2014 *if and only if*, rendered **\u2194**: the two sides always share a truth value.",
  implies: "**implies** is the material conditional, rendered **\u2192**.",
  necessarily: "**necessarily** is the modal operator **\u25A1**: true in *every* possible world (S5). What is necessary is actual \u2014 but not vice versa.",
  possibly: "**possibly** is the modal operator **\u25C7**: true in *some* possible world (S5). Possible does not mean actual.",
  all: "**All S are P** becomes **\u2200x. S(x) \u2192 P(x)**: being S guarantees being P. It says nothing about whether any S exists.",
  no: "**No S are P** becomes **\u2200x. S(x) \u2192 \xACP(x)**: nothing is both.",
  some: "**Some S are P** becomes **\u2203x. S(x) \u2227 P(x)**: at least one thing is both. *Some S are not P* is its negative twin, \u2203x. S(x) \u2227 \xACP(x).",
  every: "**Every S is a P** \u2014 same as *All S are P*: **\u2200x. S(x) \u2192 P(x)**.",
  is: "**X is a P** predicates P of the individual X: **P(x)**. Plurals are matched up, so *man*/*men* name the same class.",
  are: "The copula of a categorical sentence \u2014 *All/No/Some S **are** P*. The words around it decide the quantifier.",
  therefore: "**Therefore** marks the conclusion of a one-line argument:\n\n```\nIf P, then Q. P. Therefore, Q.\n```\n\nThe engine checks it, names the form, and derives a proof.",
  thus: "**Thus** marks a conclusion \u2014 same as *Therefore*.",
  hence: "**Hence** marks a conclusion \u2014 same as *Therefore*.",
  supports: "**supports** asserts an *informal* relation \u2014 recorded on the map, but not checked by the engine.",
  presupposes: "**presupposes** asserts an *informal* reliance \u2014 recorded on the map, but not checked.",
  contradicts: "**contradicts** is *checked*: the engine verifies the two claims can never both be true (or shows a situation where they can).",
  entails: "**entails** is *checked*: whenever the first claim holds, the second must \u2014 or the engine shows a counterexample.",
  "equivalent-to": "**equivalent-to** is *checked*: the two claims carry the same truth value in every situation \u2014 or the engine shows where they come apart.",
  equivalent: "**equivalent** asks whether two claims always share a truth value \u2014 two phrasings of one claim."
};
function registerHover(context) {
  const forms2 = catalog2();
  const byName = new Map(forms2.map((f) => [f.name, f]));
  const cache = { key: "", blocks: [] };
  const blocksFor = (document) => {
    const key = `${document.uri.toString()}@${document.version}`;
    if (cache.key !== key) {
      try {
        cache.blocks = analyze2(document.getText());
        cache.key = key;
      } catch {
        return cache.blocks;
      }
    }
    return cache.blocks;
  };
  const provider = {
    provideHover(document, position) {
      const range = document.getWordRangeAtPosition(position, /[A-Za-z][\w-]*/);
      if (!range) return void 0;
      const word = document.getText(range);
      const lower2 = word.toLowerCase();
      const md = (s) => new vscode3.Hover(new vscode3.MarkdownString(s), range);
      const form = byName.get(lower2);
      if (form) {
        const aka = form.aka ? ` *(${form.aka})*` : "";
        const pattern = form.premises.length > 0 ? `\`${form.premises.join("`,  `")}\`  \u22A2  \`${form.conclusion}\`` : `\u22A2  \`${form.conclusion}\``;
        const kind = form.isFallacy ? "\u26A0 a **fallacy**, not a rule" : "an inference rule";
        return md(`**${form.title}**${aka} \u2014 ${kind}

${pattern}

${form.note}`);
      }
      for (const block of blocksFor(document)) {
        if (block.kind === "prop" && block.name === word) {
          return md(`**prop ${block.name}** \u2014 \u201C${block.gloss}\u201D

An atomic proposition: simply true or false.`);
        }
        if (block.kind === "claim" && block.name === word) {
          const reading = block.note ? `

*${block.note}*` : "";
          return md(`**claim ${block.name}**  =  \`${block.formula}\`${reading}`);
        }
        if (block.kind === "argument" && block.name === word) {
          const label = block.form || block.fallacy;
          const named = label ? ` \u2014 recognized as **${label}**` : "";
          return md(`**argument ${block.name}** \u2014 ${block.verdict.toUpperCase()}${named}

${block.note}`);
        }
      }
      if (KEYWORDS[lower2]) return md(KEYWORDS[lower2]);
      if (LOGIC[lower2]) return md(LOGIC[lower2]);
      return void 0;
    }
  };
  context.subscriptions.push(
    vscode3.languages.registerHoverProvider({ language: "meticulous" }, provider)
  );
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
  .check { font-family: var(--vscode-editor-font-family); margin: .5rem 0; }
  .check > div { display: flex; align-items: center; gap: .75em; }
  .reading { font-family: var(--vscode-font-family); font-style: italic; opacity: .7; margin: .1rem 0 .1rem 1.5rem; }
  .note-inline { font-style: italic; opacity: .65; font-size: .85em; margin-left: .6em; }
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
  .badge-valid { background: var(--vscode-testing-iconPassed, #3fb950); color: #041006; }
  .badge-invalid { background: var(--vscode-testing-iconFailed, #f85149); color: #100404; }
  .badge-unknown { background: var(--vscode-descriptionForeground, #8d96a0); color: #101214; }
  table.truth td.world-name, table.truth th.world-name { font-style: italic; opacity: .75; text-align: right; }
  table.truth td.world-name.actual { font-weight: 700; opacity: 1; }
  .fo-formula { font-family: var(--vscode-editor-font-family); margin: .2rem 0 .4rem; }
  .model-card { font-family: var(--vscode-editor-font-family); border: 1px solid var(--vscode-widget-border, #8884); border-radius: 6px; padding: .4rem .7rem; display: inline-block; margin: .2rem 0; }
  .model-line { padding: .08rem 0; }
  .model-lhs { color: var(--vscode-symbolIcon-variableForeground, #4ec9b0); font-weight: 600; }
  .model-eq { opacity: .5; margin: 0 .5em; }
  figure.venn-figure { margin: 1rem 0; }
  figure.venn-figure figcaption { text-transform: uppercase; font-size: .7rem; letter-spacing: .08em; opacity: .6; margin-bottom: .3rem; }
  svg.venn { max-width: 400px; width: 100%; height: auto; }
  svg.venn .venn-circle { fill: none; stroke: var(--vscode-foreground); stroke-width: 1.5; opacity: .8; }
  svg.venn .venn-hatch { stroke: var(--vscode-descriptionForeground, #8d96a0); stroke-width: 1.2; }
  svg.venn .venn-label { fill: var(--vscode-foreground); font-family: var(--vscode-editor-font-family); font-size: 13px; font-weight: 600; }
  svg.venn .venn-dot { fill: var(--vscode-foreground); }
  svg.venn .venn-point circle { fill: var(--vscode-symbolIcon-variableForeground, #4ec9b0); stroke: var(--vscode-editor-background, #000); stroke-width: 1; }
  svg.venn .venn-point text { fill: var(--vscode-foreground); font-family: var(--vscode-editor-font-family); font-size: 12px; }
  .error { color: var(--vscode-errorForeground, #f85149); font-family: var(--vscode-editor-font-family); margin: .3rem 0; }
  .error-line { opacity: .6; margin-right: .5em; }
  .empty { opacity: .6; }
  code { background: var(--vscode-textCodeBlock-background, #8882); padding: 0 .3em; border-radius: 3px; }

  /* arguments */
  figure.argument { margin: 1rem 0; padding: .6rem .9rem; border: 1px solid var(--vscode-widget-border, #8884); border-radius: 6px; }
  figure.argument figcaption { display: flex; align-items: center; gap: .5em; margin-bottom: .5rem; }
  .arg-name { font-weight: 600; font-family: var(--vscode-editor-font-family); }
  .chip { font-size: .72rem; padding: .1em .6em; border-radius: 999px; border: 1px solid var(--vscode-widget-border, #8884); }
  .chip-form { border-color: var(--vscode-testing-iconPassed, #3fb950); }
  .chip-fallacy { border-color: var(--vscode-testing-iconFailed, #f85149); color: var(--vscode-testing-iconFailed, #f85149); }
  .derivation { font-family: var(--vscode-editor-font-family); margin: .3rem 0 .3rem .5rem; }
  .derivation .premise { padding: .1rem 0; }
  .derivation .conclusion { border-top: 1px solid var(--vscode-foreground); margin-top: .25rem; padding-top: .25rem; width: fit-content; min-width: 12em; }
  .note { opacity: .75; font-style: italic; margin: .35rem 0; }
  .counterexample { margin: .5rem 0; }
  .cx-label { display: block; font-size: .78rem; opacity: .7; margin-bottom: .3rem; }
  .repair { margin: .5rem 0; padding: .45rem .7rem; border-left: 3px solid var(--vscode-editorWarning-foreground, #cca700); background: var(--vscode-textCodeBlock-background, #8881); }
  .repair .formula { font-family: var(--vscode-editor-font-family); font-weight: 600; }
  .repair .or { opacity: .6; }
  table.proof { font-family: var(--vscode-editor-font-family); border-collapse: collapse; margin: .5rem 0 .2rem; }
  table.proof td { padding: .12em .6em .12em 0; }
  .step-no { opacity: .55; }
  .step-why { opacity: .7; font-size: .85em; }
  .step-status.ok { color: var(--vscode-testing-iconPassed, #3fb950); font-weight: 700; }
  .step-status.bad { color: var(--vscode-testing-iconFailed, #f85149); font-weight: 700; }
  tr.step-msg td { color: var(--vscode-testing-iconFailed, #f85149); font-size: .85em; font-family: var(--vscode-font-family); padding-bottom: .4em; }

  /* asserted relations + argument map */
  .relation-stmt { font-family: var(--vscode-editor-font-family); margin: .45rem 0; display: flex; align-items: center; gap: .6em; flex-wrap: wrap; }
  .relation-stmt .note { flex-basis: 100%; margin: 0 0 0 1rem; font-size: .95em; }
  .rel-verb { font-size: .8rem; padding: .05em .55em; border-radius: 999px; border: 1px solid var(--vscode-widget-border, #8884); opacity: .9; }
  .chip-holds { border-color: var(--vscode-testing-iconPassed, #3fb950); color: var(--vscode-testing-iconPassed, #3fb950); }
  .chip-fails { border-color: var(--vscode-testing-iconFailed, #f85149); color: var(--vscode-testing-iconFailed, #f85149); }
  .chip-asserted { opacity: .6; }
  figure.relmap-figure { margin: 1rem 0; padding: .6rem .9rem; border: 1px solid var(--vscode-widget-border, #8884); border-radius: 6px; }
  figure.relmap-figure figcaption { text-transform: uppercase; font-size: .7rem; letter-spacing: .08em; opacity: .6; margin-bottom: .4rem; }
  svg.relmap { width: 100%; height: auto; }
  svg.relmap .edge { stroke-width: 1.6; fill: none; stroke-linejoin: round; }
  svg.relmap .edge.failed { stroke-dasharray: 5 4; }
  /* edges are stroked lines only; fill belongs solely to the arrowheads \u2014
     a filled multi-point path would render as a solid polygon */
  svg.relmap .edge.supports { stroke: var(--vscode-testing-iconPassed, #3fb950); }
  svg.relmap .edge.contradicts { stroke: var(--vscode-testing-iconFailed, #f85149); }
  svg.relmap .edge.entails { stroke: var(--vscode-textLink-foreground, #58a6ff); }
  svg.relmap .edge.presupposes { stroke: var(--vscode-editorWarning-foreground, #cca700); }
  svg.relmap .edge.equivalent-to { stroke: var(--vscode-descriptionForeground, #8d96a0); }
  svg.relmap .arrow.supports { fill: var(--vscode-testing-iconPassed, #3fb950); }
  svg.relmap .arrow.contradicts { fill: var(--vscode-testing-iconFailed, #f85149); }
  svg.relmap .arrow.entails { fill: var(--vscode-textLink-foreground, #58a6ff); }
  svg.relmap .arrow.presupposes { fill: var(--vscode-editorWarning-foreground, #cca700); }
  svg.relmap .arrow.equivalent-to { fill: var(--vscode-descriptionForeground, #8d96a0); }
  svg.relmap .edge-label { fill: var(--vscode-descriptionForeground, #8d96a0); font-size: 10.5px; font-family: var(--vscode-font-family); }
  svg.relmap .edge-label.supports { fill: var(--vscode-testing-iconPassed, #3fb950); }
  svg.relmap .edge-label.contradicts { fill: var(--vscode-testing-iconFailed, #f85149); }
  svg.relmap .edge-label.entails { fill: var(--vscode-textLink-foreground, #58a6ff); }
  svg.relmap .edge-label.presupposes { fill: var(--vscode-editorWarning-foreground, #cca700); }
  svg.relmap .edge-label.equivalent-to { fill: var(--vscode-descriptionForeground, #8d96a0); }
  svg.relmap .edge-label.failed { fill: var(--vscode-testing-iconFailed, #f85149); }
  svg.relmap .node rect { fill: var(--vscode-editor-inactiveSelectionBackground, #8882); stroke: var(--vscode-widget-border, #8884); }
  svg.relmap .node.ad-hoc rect { stroke-dasharray: 4 3; }
  svg.relmap .node text { fill: var(--vscode-foreground); font-size: 12px; font-family: var(--vscode-editor-font-family); }

  /* relations (analyze) */
  figure.relations { margin: 1rem 0; padding: .6rem .9rem; border: 1px solid var(--vscode-widget-border, #8884); border-radius: 6px; }
  figure.relations figcaption { text-transform: uppercase; font-size: .7rem; letter-spacing: .08em; opacity: .6; margin-bottom: .4rem; }
  figure.relations table { border-collapse: collapse; }
  figure.relations td { padding: .15em .8em .15em 0; }
  .rel-claim { font-family: var(--vscode-editor-font-family); font-weight: 600; }
  .rel-kind { opacity: .9; }
  .rel-detail { opacity: .6; font-size: .85em; }
  .rel-independent { opacity: .45; }
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
  registerCompletions(context);
  registerDiagnostics(context);
  registerHover(context);
  let panel;
  let trackedUri;
  let debounce;
  const render = () => {
    if (!panel || !trackedUri) return;
    const doc = vscode4.workspace.textDocuments.find(
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
    const editor = vscode4.window.activeTextEditor;
    if (!editor || editor.document.languageId !== "meticulous") {
      vscode4.window.showInformationMessage("Open a .met file to preview it.");
      return;
    }
    trackedUri = editor.document.uri;
    if (!panel) {
      panel = vscode4.window.createWebviewPanel(
        "meticulousPreview",
        "meticulous preview",
        { viewColumn: vscode4.ViewColumn.Beside, preserveFocus: true },
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
    vscode4.commands.registerCommand("meticulous.showPreview", openPreview),
    // Live update: re-render (debounced) whenever the tracked document changes.
    vscode4.workspace.onDidChangeTextDocument((e) => {
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
