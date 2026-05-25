# Agent Instructions

This repository is a native-PowerShell-free ESLint plugin, parser, and standalone CLI for linting PowerShell source. Treat it as a JavaScript implementation of a useful PSScriptAnalyzer-compatible surface, not as a wrapper around PowerShell or PSScriptAnalyzer.

## Project Rules

- Use `pnpm` only. The pinned package manager is in `package.json`.
- Do not add `npm` or `yarn` lockfiles.
- Do not add a dependency on `pwsh`, Windows PowerShell, `System.Management.Automation`, PowerShellEditorServices, or PSScriptAnalyzer.
- Keep runtime code native-free. Avoid `.node` native parser bindings and subprocess-based analysis.
- Use LF line endings. `.gitattributes` enforces this.
- Keep generated or installed artifacts out of Git. `node_modules/` and package tarballs are ignored.
- The project itself is checked by Oxlint and Oxfmt. Do not reintroduce Prettier as a project check dependency unless there is a clear repo-level reason.

## Common Commands

Use these before committing:

```sh
pnpm check
```

CI uses:

```sh
pnpm check:ci
```

`check:ci` deliberately limits Oxc tools to one thread. Preserve that behavior for CI stability:

```sh
pnpm run lint:ci
pnpm run format:check:ci
```

Useful focused commands:

```sh
pnpm lint
pnpm format:check
pnpm test
pnpm run lint:fixtures
pnpm pack --dry-run --json
```

## Repository Layout

- `src/parser.js`: ESLint parser entry point.
- `src/parse.js`: lightweight PowerShell AST adapter.
- `src/tokenize.js`: native-free PowerShell tokenizer.
- `src/linter.js`: standalone runner-neutral rule executor.
- `src/index.js`: ESLint plugin export and recommended config.
- `src/rules/psscriptanalyzer.js`: PSScriptAnalyzer-compatible rule implementations.
- `src/rules/shared/approved-verbs.js`: approved PowerShell verb list.
- `test/psscriptanalyzer-ported.test.js`: tests that read ported PSScriptAnalyzer fixtures.
- `test/fixtures/psscriptanalyzer/`: fixture files ported from upstream PSScriptAnalyzer tests.
- `docs/rule-coverage.md`: implemented, externally covered, and unsupported rule matrix.

## Adding Or Updating Rules

Prefer PSScriptAnalyzer-compatible rule names, such as `PSAvoidUsingWriteHost`, over friendly aliases. The older friendly rules still exist for compatibility, but the primary supported surface is PSScriptAnalyzer-style naming.

When adding a rule:

1. Add the implementation to `src/rules/psscriptanalyzer.js`.
2. Add it to `defaultEnabledRules` only if the native-free implementation is reliable enough for recommended use.
3. Add or update fixture files under `test/fixtures/psscriptanalyzer/`.
4. Add a test case to `test/psscriptanalyzer-ported.test.js`.
5. Update `docs/rule-coverage.md`.
6. Run `pnpm check`.

Rules should report useful diagnostics from source text, tokens, or lightweight function blocks. Avoid pretending to have PowerShell semantic knowledge that this project does not have.

## Porting PSScriptAnalyzer Tests

Use upstream fixtures from `PowerShell/PSScriptAnalyzer` as the starting point.

Suggested workflow:

```sh
git clone --depth 1 https://github.com/PowerShell/PSScriptAnalyzer.git ../PSScriptAnalyzer
```

Then inspect:

```text
../PSScriptAnalyzer/Tests/Rules/
../PSScriptAnalyzer/docs/Rules/
../PSScriptAnalyzer/Rules/
```

Port only the cases that are meaningful for this native-free implementation. If an upstream fixture mixes supported and unsupported behavior, create a narrowed fixture with an explicit name such as `AvoidGlobalVarsOnly.ps1`.

When porting:

- Preserve upstream spelling and structure when practical.
- Keep unsupported runtime, module, DSC, byte-encoding, formatter, or command-metadata behavior out of fixture expectations.
- Use fixture files, not large inline snippets.
- Test the expected number of diagnostics for a single rule at a time.
- If behavior intentionally differs from PSScriptAnalyzer, document the limitation in `docs/rule-coverage.md`.

## Reconciling New PSScriptAnalyzer Rules

Periodically compare this project with upstream PSScriptAnalyzer.

1. Check the current Microsoft Learn rule list for additions, removals, or renamed rules.
2. Check upstream `PowerShell/PSScriptAnalyzer/Rules/` for implementation changes.
3. Check upstream `PowerShell/PSScriptAnalyzer/Tests/Rules/` for new or changed fixtures.
4. Classify each rule in `docs/rule-coverage.md`:
   - `Implemented`: native-free static analysis can reasonably detect it.
   - `Covered Externally`: formatter-style behavior that belongs to an external PowerShell formatter.
   - `Not Covered`: needs PowerShell AST/runtime metadata, command metadata, module layout, DSC semantics, byte-level file input, or other unsupported context.
5. Port supported tests into `test/fixtures/psscriptanalyzer/`.
6. Update counts or expectations in `test/psscriptanalyzer-ported.test.js`.
7. Run `pnpm check`.

Do not mark a rule implemented just because a regex can catch one example. It should be useful across normal scripts and should not create obvious noisy false positives.

## Formatter-Style Rules

Formatter-style PSScriptAnalyzer rules should not be reimplemented in ESLint rules unless there is a strong reason. Keep them classified as externally covered when a formatter can handle them.

Examples:

- `PSAvoidLongLines`
- `PSAvoidSemicolonsAsLineTerminators`
- `PSAvoidTrailingWhitespace`
- `PSAvoidUsingDoubleQuotesForConstantString`
- `PSPlaceCloseBrace`
- `PSPlaceOpenBrace`
- `PSUseConsistentIndentation`
- `PSUseConsistentWhitespace`

The project itself uses Oxfmt for repository JS/JSON/Markdown/YAML formatting. PowerShell fixture files under `test/fixtures/psscriptanalyzer/` are test data and should stay close to upstream.

## Oxlint, Oxfmt, Biome, And Other Runners

Oxlint/Oxfmt are used to check this repository. They do not parse PowerShell for this plugin's rule logic.

The standalone CLI exists for runners that cannot use custom ESLint parsers for PowerShell files. Keep `src/linter.js` runner-neutral so other tools can call `lintText`.

Biome does not currently parse, format, or lint PowerShell files. Do not add Biome-specific PowerShell claims unless that changes upstream.

## Publishing

Before publishing:

```sh
pnpm check
pnpm pack --dry-run
```

For a normal release:

```sh
pnpm version patch
git push --follow-tags
npm publish
```

Never publish without checking the package contents. The `files` list intentionally excludes tests and fixtures from the npm package.
