# eslint-plugin-powershell

Native-PowerShell-free linting for PowerShell scripts.

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

export default [
  {
    files: ["**/*.{ps1,psm1,psd1}"],
    languageOptions: {
      parser,
    },
    plugins: {
      powershell,
    },
    rules: {
      "powershell/no-alias": "warn",
      "powershell/no-write-host": "warn",
      "powershell/use-approved-verb": "warn",
      "powershell/no-empty-catch": "error",
    },
  },
];
```

## CLI

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

Biome can also run beside this package for the web languages it supports, but it does not currently parse, format, or lint PowerShell files. Biome's plugin support is not a replacement path for these rules because its GritQL plugins currently target JavaScript and CSS only.

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
