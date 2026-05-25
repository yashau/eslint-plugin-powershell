import assert from "node:assert/strict";
import test from "node:test";
import { parsePowerShell } from "../src/parse.js";
import { lintText } from "../src/linter.js";

test("parses commands, functions, variables, and catch clauses", () => {
  const ast = parsePowerShell(`
function Do-Thing {
  $value = ls
  try { throw "x" } catch {}
}
`);

  const script = ast.body[0];
  assert.equal(script.functions[0].name, "Do-Thing");
  assert.ok(script.commands.some((command) => command.name === "ls"));
  assert.ok(script.variables.some((variable) => variable.name === "$value"));
  assert.equal(script.catchClauses.length, 1);
});

test("lintText reports recommended rules", () => {
  const result = lintText(`
function Do-Thing {
  ls
  Write-Host "hello"
  try { throw "x" } catch {}
}
`);

  assert.deepEqual(
    result.messages.map((message) => message.ruleId),
    [
      "powershell/PSProvideCommentHelp",
      "powershell/PSUseApprovedVerbs",
      "powershell/PSAvoidUsingCmdletAliases",
      "powershell/PSAvoidUsingPositionalParameters",
      "powershell/PSAvoidUsingWriteHost",
      "powershell/PSAvoidUsingEmptyCatchBlock",
    ],
  );
});
