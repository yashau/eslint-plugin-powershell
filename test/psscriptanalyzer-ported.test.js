import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { lintText } from "../src/linter.js";

const fixturesDirectory = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "psscriptanalyzer",
);

const cases = [
  {
    name: "AvoidUsingAlias.ps1",
    ruleId: "PSAvoidUsingCmdletAliases",
    expected: 2,
  },
  {
    name: "AvoidUsingWriteHost.ps1",
    ruleId: "PSAvoidUsingWriteHost",
    expected: 2,
  },
  {
    name: "AvoidEmptyCatchBlock.ps1",
    ruleId: "PSAvoidUsingEmptyCatchBlock",
    expected: 2,
  },
  {
    name: "AvoidUsingInvokeExpression.ps1",
    ruleId: "PSAvoidUsingInvokeExpression",
    expected: 2,
  },
  {
    name: "PossibleIncorrectComparisonWithNull.ps1",
    ruleId: "PSPossibleIncorrectComparisonWithNull",
    expected: 3,
  },
  {
    name: "AvoidDefaultTrueValueSwitchParameter.ps1",
    ruleId: "PSAvoidDefaultValueSwitchParameter",
    expected: 2,
  },
  {
    name: "AvoidConvertToSecureStringWithPlainText.ps1",
    ruleId: "PSAvoidUsingConvertToSecureStringWithPlainText",
    expected: 3,
  },
  {
    name: "AvoidUsingWMICmdlet.ps1",
    ruleId: "PSAvoidUsingWMICmdlet",
    expected: 5,
  },
  {
    name: "AvoidGlobalVarsOnly.ps1",
    ruleId: "PSAvoidGlobalVars",
    expected: 2,
    source: "AvoidGlobalOrUnitializedVars.ps1",
  },
  {
    name: "AvoidInvokingEmptyMembers.ps1",
    ruleId: "PSAvoidInvokingEmptyMembers",
    expected: 1,
  },
];

for (const fixtureCase of cases) {
  const sourceName = fixtureCase.source ?? fixtureCase.name;

  test(`ported from PSScriptAnalyzer ${sourceName}`, async () => {
    const source = await readFile(path.join(fixturesDirectory, fixtureCase.name), "utf8");
    const messages = lintText(source, {
      rules: {
        [`powershell/${fixtureCase.ruleId}`]: "warn",
      },
    }).messages;

    assert.equal(messages.length, fixtureCase.expected);
  });
}
