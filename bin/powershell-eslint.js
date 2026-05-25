#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { lintText } from "../src/linter.js";
import { glob } from "../src/utils/glob.js";

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

const formatIndex = args.findIndex((arg) => arg === "--format" || arg === "-f");
const format = formatIndex === -1 ? "stylish" : (args[formatIndex + 1] ?? "stylish");
const patterns = args.filter((arg, index) => {
  if (index === formatIndex || index === formatIndex + 1) {
    return false;
  }
  return !arg.startsWith("-");
});

if (patterns.length === 0) {
  printHelp();
  process.exit(2);
}

const files = [];
for (const pattern of patterns) {
  files.push(...(await glob(pattern, process.cwd())));
}

const results = [];
for (const filePath of [...new Set(files)].sort()) {
  const text = await readFile(filePath, "utf8");
  results.push(lintText(text, { filePath }));
}

if (format === "json") {
  console.log(JSON.stringify(results, null, 2));
} else {
  printStylish(results);
}

const errorCount = results.reduce((sum, result) => {
  return sum + result.messages.filter((message) => message.severity === 2).length;
}, 0);

process.exitCode = errorCount > 0 ? 1 : 0;

function printHelp() {
  const executable = path.basename(process.argv[1] ?? "powershell-eslint");
  console.log(`Usage: ${executable} <patterns...> [--format stylish|json]`);
}

function printStylish(lintResults) {
  let total = 0;

  for (const result of lintResults) {
    if (result.messages.length === 0) {
      continue;
    }

    total += result.messages.length;
    console.log(pathToFileURL(result.filePath).href);
    for (const message of result.messages) {
      const label = message.severity === 2 ? "error" : "warn";
      console.log(`  ${message.line}:${message.column}  ${label}  ${message.message}  ${message.ruleId}`);
    }
    console.log("");
  }

  if (total === 0) {
    console.log("No PowerShell lint problems found.");
  } else {
    console.log(`${total} PowerShell lint problem${total === 1 ? "" : "s"} found.`);
  }
}
