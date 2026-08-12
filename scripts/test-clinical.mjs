import ts from "typescript";
import { readFile, writeFile, rm } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const root = new URL("../artifacts/sme-risk-engine/src/lib/", import.meta.url);
const outCalc = "/tmp/clinicalCalculations.mjs";
const outTest = "/tmp/clinicalCalculations.test.mjs";
const compile = (source) =>
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
await writeFile(
  outCalc,
  compile(await readFile(new URL("clinicalCalculations.ts", root), "utf8")),
);
const testSource = (
  await readFile(new URL("clinicalCalculations.test.ts", root), "utf8")
).replace("./clinicalCalculations", "./clinicalCalculations.mjs");
await writeFile(outTest, compile(testSource));
await import(pathToFileURL(outTest).href);
process.on("exit", () => {
  void rm(outCalc, { force: true });
  void rm(outTest, { force: true });
});
