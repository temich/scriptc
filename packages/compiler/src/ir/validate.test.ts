import { expect, test } from "vitest";
import { BOOL, F64, STRING, VOID, arrayOf, type IrExpr, type IrModule } from "./ir.js";
import { deserializeModule, serializeModule } from "./serialize.js";
import { validateModule } from "./validate.js";

const loc = { file: "numeric-read.ts", start: 0, end: 0 };

function numericReadModule(overrides: Partial<IrExpr & { kind: "arrIntrinsic" }> = {}): IrModule {
  const read: IrExpr = {
    kind: "arrIntrinsic", method: "getNumber",
    receiver: { kind: "arrayLit", elems: [], type: arrayOf(F64), loc },
    args: [{ kind: "numLit", value: 0, type: F64, loc }],
    type: F64, loc, ...overrides,
  };
  return {
    irVersion: 11, sourceFile: loc.file, entry: "main",
    functions: [{ name: "main", params: [], locals: [], returnType: VOID, body: [{ kind: "exprStmt", expr: read, loc }], loc }],
  };
}

test("numeric array-read intrinsic validates and round-trips", () => {
  const mod = numericReadModule();
  expect(validateModule(mod)).toEqual([]);
  expect(deserializeModule(serializeModule(mod))).toEqual(mod);
});

test.each([
  [{ receiver: { kind: "arrayLit", elems: [], type: arrayOf(STRING), loc } }, "requires f64 elements"],
  [{ args: [] }, "0 args, expected 1"],
  [{ args: [{ kind: "strLit", value: "0", type: STRING, loc }] }, "arg 0: expected f64"],
  [{ type: BOOL }, "must be f64"],
] satisfies [Partial<IrExpr & { kind: "arrIntrinsic" }>, string][])("numeric array-read intrinsic rejects malformed IR %#", (overrides, message) => {
  expect(validateModule(numericReadModule(overrides)).some((error) => error.message.includes(message))).toBe(true);
});
