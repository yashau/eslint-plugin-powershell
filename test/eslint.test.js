import assert from "node:assert/strict";
import test from "node:test";
import { ESLint } from "eslint";
import powershell from "../src/index.js";

test("runs as an ESLint flat-config plugin", async () => {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: powershell.configs.recommended,
  });

  const [result] = await eslint.lintText("ls\n", {
    filePath: "script.ps1",
  });

  assert.equal(result.messages.length, 1);
  assert.equal(result.messages[0].ruleId, "powershell/PSAvoidUsingCmdletAliases");
});
