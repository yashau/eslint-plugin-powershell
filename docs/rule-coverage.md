# PSScriptAnalyzer rule coverage

Source list: Microsoft Learn, "PSScriptAnalyzer Rules", last updated 2026-03-20.

This project does not invoke PowerShell, PowerShellEditorServices, or PSScriptAnalyzer. Rules marked implemented are native-free approximations over source text, tokens, and lightweight function blocks. They should be useful for editor and CI feedback, but they are not byte-for-byte PSScriptAnalyzer parity.

Supported rules should have tests ported from the upstream `PowerShell/PSScriptAnalyzer` test fixtures when the upstream fixture does not depend on unsupported runtime, module, DSC, byte-encoding, or formatter behavior. Unsupported features are intentionally removed from this project's ported test cases.

## Implemented

- `PSAvoidAssignmentToAutomaticVariable`
- `PSAvoidDefaultValueForMandatoryParameter`
- `PSAvoidDefaultValueSwitchParameter`
- `PSAvoidExclaimOperator`
- `PSAvoidGlobalAliases`
- `PSAvoidGlobalFunctions`
- `PSAvoidGlobalVars`
- `PSAvoidInvokingEmptyMembers`
- `PSAvoidNullOrEmptyHelpMessageAttribute`
- `PSAvoidOverwritingBuiltInCmdlets`
- `PSAvoidReservedWordsAsFunctionNames`
- `PSAvoidUsingAllowUnencryptedAuthentication`
- `PSAvoidUsingBrokenHashAlgorithms`
- `PSAvoidUsingCmdletAliases`
- `PSAvoidUsingComputerNameHardcoded`
- `PSAvoidUsingConvertToSecureStringWithPlainText`
- `PSAvoidUsingDeprecatedManifestFields`
- `PSAvoidUsingEmptyCatchBlock`
- `PSAvoidUsingInvokeExpression`
- `PSAvoidUsingPlainTextForPassword`
- `PSAvoidUsingPositionalParameters`
- `PSAvoidUsingUsernameAndPasswordParams`
- `PSAvoidUsingWMICmdlet`
- `PSAvoidUsingWriteHost`
- `PSMisleadingBacktick`
- `PSPossibleIncorrectComparisonWithNull`
- `PSPossibleIncorrectUsageOfAssignmentOperator`
- `PSProvideCommentHelp`
- `PSReviewUnusedParameter`
- `PSShouldProcess`
- `PSUseApprovedVerbs`
- `PSUseDeclaredVarsMoreThanAssignments`
- `PSUseLiteralInitializerForHashtable`
- `PSUseProcessBlockForPipelineCommand`
- `PSUsePSCredentialType`
- `PSUseShouldProcessForStateChangingFunctions`
- `PSUseSingularNouns`
- `PSUseSupportsShouldProcess`
- `PSUseToExportFieldsInManifest`

## Covered Externally

These are formatting-style checks covered by external PowerShell formatters instead of duplicated inside ESLint rules.

- `PSAvoidLongLines`
- `PSAvoidSemicolonsAsLineTerminators`
- `PSAvoidTrailingWhitespace`
- `PSAvoidUsingDoubleQuotesForConstantString`
- `PSPlaceCloseBrace`
- `PSPlaceOpenBrace`
- `PSUseConsistentIndentation`
- `PSUseConsistentWhitespace`

## Not Covered

- `PSAlignAssignmentStatement`: formatter rule not currently covered by `prettier-plugin-powershell`; use PowerShell's `Invoke-Formatter`/PSScriptAnalyzer if exact alignment behavior is required.
- `PSAvoidMultipleTypeAttributes`: needs a richer typed AST than the current native-free parser.
- `PSAvoidShouldContinueWithoutForce`: needs command/member semantics around `ShouldContinue`.
- `PSDSCDscExamplesPresent`: requires module/resource layout analysis.
- `PSDSCDscTestsPresent`: requires module/resource layout analysis.
- `PSDSCReturnCorrectTypesForDSCFunctions`: requires DSC resource semantic analysis.
- `PSDSCStandardDSCFunctionsInResource`: requires DSC resource semantic analysis.
- `PSDSCUseIdenticalMandatoryParametersForDSC`: requires DSC resource semantic analysis.
- `PSDSCUseIdenticalParametersForDSC`: requires DSC resource semantic analysis.
- `PSDSCUseVerboseMessageInDSCResource`: requires DSC resource semantic analysis.
- `PSMissingModuleManifestField`: requires manifest-specific parsing and module metadata.
- `PSPossibleIncorrectUsageOfRedirectionOperator`: needs more precise parsing of command/file redirection.
- `PSReservedCmdletChar`: needs exact function and command-name parsing.
- `PSReservedParams`: needs exact parameter declaration parsing.
- `PSUseBOMForUnicodeEncodedFile`: requires raw byte input rather than the text passed to ESLint parsers.
- `PSUseCmdletCorrectly`: needs PowerShell command metadata and parameter binding.
- `PSUseCompatibleCmdlets`: needs compatibility profiles and command metadata.
- `PSUseCompatibleCommands`: needs compatibility profiles and command metadata.
- `PSUseCompatibleSyntax`: needs version-aware PowerShell parser semantics.
- `PSUseCompatibleTypes`: needs compatibility profiles and type metadata.
- `PSUseConsistentParameterSetName`: needs exact parameter attribute parsing.
- `PSUseConsistentParametersKind`: needs exact parameter attribute parsing.
- `PSUseConstrainedLanguageMode`: needs semantic analysis of type/member access.
- `PSUseCorrectCasing`: needs command metadata for canonical cmdlet and parameter casing.
- `PSUseOutputTypeCorrectly`: needs control-flow and output type analysis.
- `PSUseSingleValueFromPipelineParameter`: needs exact parameter attribute parsing.
- `PSUseUsingScopeModifierInNewRunspaces`: needs scriptblock/runspace semantic analysis.
- `PSUseUTF8EncodingForHelpFile`: requires raw file bytes and help-file discovery.
