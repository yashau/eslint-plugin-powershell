# eslint-plugin-powershell

[![CI](https://img.shields.io/github/actions/workflow/status/yashau/eslint-plugin-powershell/ci.yml?branch=main&style=for-the-badge&logo=github)](https://github.com/yashau/eslint-plugin-powershell/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-13%20passing-brightgreen?style=for-the-badge)
![pnpm](https://img.shields.io/badge/pnpm-11.3.0-F69220?style=for-the-badge&logo=pnpm&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-%3E%3D8.57%20%7C%7C%20%3E%3D9-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)

PowerShell linting for projects that are not PowerShell projects.

This package provides:

- an ESLint parser for `.ps1`, `.psm1`, and `.psd1` files
- PSScriptAnalyzer-inspired rules implemented in JavaScript
- a standalone CLI for runners that do not support custom ESLint parsers
- a parser backend boundary designed so tree-sitter WASM can be added without changing rule APIs

It does not shell out to `pwsh`, Windows PowerShell, PowerShellEditorServices, or PSScriptAnalyzer.

## Install

```sh
pnpm add -D eslint-plugin-powershell
```

## ESLint flat config

```js
import powershell from "eslint-plugin-powershell";

export default [...powershell.configs.recommended];
```

Or configure it manually:

```js
import powershell from "eslint-plugin-powershell";
import parser from "eslint-plugin-powershell/parser";

const recommendedRules = powershell.configs.recommended[0].rules;

export default [
  {
    files: ["**/*.{ps1,psm1,psd1}"],
    languageOptions: {
      parser,
    },
    plugins: {
      powershell,
    },
    rules: recommendedRules,
  },
];
```

## CLI

Run without installing:

```sh
npx -y eslint-plugin-powershell@latest "**/*.{ps1,psm1,psd1}"
pnpm dlx eslint-plugin-powershell@latest "**/*.{ps1,psm1,psd1}"
```

Run from a project install:

```sh
pnpm exec powershell-eslint "scripts/**/*.ps1"
```

JSON output:

```sh
pnpm exec powershell-eslint "scripts/**/*.ps1" --format json
```

## Oxlint and other runners

Oxlint supports many ESLint-compatible JavaScript plugins, but its current documentation says custom file formats and parsers are not supported yet. That means this package cannot make oxlint parse PowerShell files directly today.

Use the standalone CLI beside oxlint in CI:

```sh
oxlint .
pnpm exec powershell-eslint "**/*.{ps1,psm1,psd1}"
```

The rule metadata and standalone linter are intentionally runner-neutral so other tools can call `lintText` from `eslint-plugin-powershell/linter`.

## Native-free parser strategy

PowerShell's canonical AST is produced by `System.Management.Automation.Language.Parser`, which is what PSScriptAnalyzer builds on. This package avoids that dependency. The default ESLint parser is a synchronous JavaScript lexer and AST adapter because ESLint parsers are synchronous.

The parser and rules are intentionally separated so a future async tree-sitter WASM backend can feed the same rule layer for tools that can await parsing. ESLint itself still needs the synchronous parser exported from `eslint-plugin-powershell/parser`.

## Rule Coverage

The PSScriptAnalyzer-compatible rule names are the primary supported surface. See [docs/rule-coverage.md](docs/rule-coverage.md) for implemented native-free checks, formatter-delegated rules, and unsupported rules that require PowerShell AST/runtime metadata, byte-level input, or module layout analysis.

## References

This project follows the same broad separation used by the PowerShell tooling ecosystem:

- [PowerShell/vscode-powershell](https://github.com/PowerShell/vscode-powershell) delegates script analysis to language-service/analyzer components.
- [PowerShell/PSScriptAnalyzer](https://github.com/PowerShell/PSScriptAnalyzer) implements rules over PowerShell syntax and semantics.

This package mirrors that shape in JavaScript: parser adapter, rule metadata, and runner integrations are separate pieces.
