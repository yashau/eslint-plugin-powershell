import { parsePowerShell, visitorKeys } from "./parse.js";

export function parseForESLint(sourceText, options = {}) {
  const ast = parsePowerShell(sourceText, {
    filePath: options.filePath,
  });

  return {
    ast,
    services: {
      powershell: {
        ast,
        parsePowerShell,
      },
    },
    visitorKeys,
  };
}

export function parse(sourceText, options = {}) {
  return parseForESLint(sourceText, options).ast;
}

export default {
  meta: {
    name: "eslint-plugin-powershell/parser",
    version: "0.1.0",
  },
  parse,
  parseForESLint,
};
