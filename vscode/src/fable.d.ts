// The Fable-compiled core ships no type declarations. This ambient wildcard
// declaration lets `tsc` type-check the extension without seeing the generated
// JavaScript; core-bridge.ts gives `analyze` its real, precise type.
declare module "*/Api.js" {
  export const analyze: (source: string) => unknown;
}
