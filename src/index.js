import parser from "./parser.js";
import noAlias from "./rules/no-alias.js";
import noEmptyCatch from "./rules/no-empty-catch.js";
import noWriteHost from "./rules/no-write-host.js";
import pssaRules, { defaultRuleLevels } from "./rules/psscriptanalyzer.js";
import useApprovedVerb from "./rules/use-approved-verb.js";

const rules = {
  ...pssaRules,
  "no-alias": noAlias,
  "no-empty-catch": noEmptyCatch,
  "no-write-host": noWriteHost,
  "use-approved-verb": useApprovedVerb,
};

const plugin = {
  meta: {
    name: "eslint-plugin-powershell",
    version: "0.1.0",
  },
  rules,
  configs: {},
};

plugin.configs.recommended = [
  {
    files: ["**/*.{ps1,psm1,psd1}"],
    languageOptions: {
      parser,
    },
    plugins: {
      powershell: plugin,
    },
    rules: {
      ...Object.fromEntries(
        Object.entries(defaultRuleLevels).map(([ruleName, level]) => [`powershell/${ruleName}`, level]),
      ),
    },
  },
];

export { rules };
export default plugin;
