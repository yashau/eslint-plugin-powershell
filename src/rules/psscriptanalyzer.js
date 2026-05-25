import { approvedVerbs } from "./shared/approved-verbs.js";

const automaticVariables = new Set([
  "$$",
  "$?",
  "$^",
  "$_",
  "$args",
  "$consolefilename",
  "$error",
  "$event",
  "$eventargs",
  "$eventsubscriber",
  "$executioncontext",
  "$false",
  "$foreach",
  "$home",
  "$host",
  "$input",
  "$iscoreclr",
  "$isedition",
  "$lastexitcode",
  "$matches",
  "$myinvocation",
  "$nestedpromptlevel",
  "$null",
  "$pid",
  "$profile",
  "$psboundparameters",
  "$pscmdlet",
  "$pscommandpath",
  "$psculture",
  "$psdebugcontext",
  "$pshome",
  "$psitem",
  "$psscriptroot",
  "$psstyle",
  "$psuiculture",
  "$psversiontable",
  "$pwd",
  "$sender",
  "$shellid",
  "$stacktrace",
  "$switch",
  "$this",
  "$true",
]);

const builtInCmdlets = new Set([
  "Add-Content",
  "Clear-Content",
  "Clear-Host",
  "Copy-Item",
  "ConvertFrom-Json",
  "ConvertTo-Json",
  "ConvertTo-SecureString",
  "ForEach-Object",
  "Format-List",
  "Format-Table",
  "Get-ChildItem",
  "Get-Command",
  "Get-Content",
  "Get-Help",
  "Get-Item",
  "Get-Location",
  "Get-Process",
  "Get-Service",
  "Get-WmiObject",
  "Import-Csv",
  "Invoke-Command",
  "Invoke-Expression",
  "Invoke-RestMethod",
  "Invoke-WebRequest",
  "Move-Item",
  "New-Item",
  "Out-File",
  "Read-Host",
  "Remove-Item",
  "Rename-Item",
  "Restart-Service",
  "Select-Object",
  "Set-Content",
  "Set-Item",
  "Set-Location",
  "Sort-Object",
  "Start-Job",
  "Start-Process",
  "Start-Service",
  "Stop-Process",
  "Stop-Service",
  "Tee-Object",
  "Test-Path",
  "Where-Object",
  "Write-Error",
  "Write-Host",
  "Write-Information",
  "Write-Output",
  "Write-Verbose",
  "Write-Warning",
]);

const stateChangingVerbs = new Set([
  "Add",
  "Clear",
  "Copy",
  "Disable",
  "Enable",
  "Install",
  "Move",
  "New",
  "Register",
  "Remove",
  "Rename",
  "Reset",
  "Restart",
  "Set",
  "Start",
  "Stop",
  "Uninstall",
  "Unregister",
  "Update",
]);

const aliases = new Map([
  ["%", "ForEach-Object"],
  ["?", "Where-Object"],
  ["cat", "Get-Content"],
  ["cd", "Set-Location"],
  ["chdir", "Set-Location"],
  ["clear", "Clear-Host"],
  ["cls", "Clear-Host"],
  ["copy", "Copy-Item"],
  ["cp", "Copy-Item"],
  ["curl", "Invoke-WebRequest"],
  ["ctss", "ConvertTo-SecureString"],
  ["del", "Remove-Item"],
  ["dir", "Get-ChildItem"],
  ["echo", "Write-Output"],
  ["erase", "Remove-Item"],
  ["foreach", "ForEach-Object"],
  ["ft", "Format-Table"],
  ["fw", "Format-Wide"],
  ["gc", "Get-Content"],
  ["gci", "Get-ChildItem"],
  ["gi", "Get-Item"],
  ["gl", "Get-Location"],
  ["gps", "Get-Process"],
  ["group", "Group-Object"],
  ["gwmi", "Get-WmiObject"],
  ["iex", "Invoke-Expression"],
  ["ii", "Invoke-Item"],
  ["ls", "Get-ChildItem"],
  ["md", "New-Item"],
  ["measure", "Measure-Object"],
  ["mi", "Move-Item"],
  ["move", "Move-Item"],
  ["mv", "Move-Item"],
  ["ni", "New-Item"],
  ["ps", "Get-Process"],
  ["pwd", "Get-Location"],
  ["rm", "Remove-Item"],
  ["rmdir", "Remove-Item"],
  ["sc", "Set-Content"],
  ["select", "Select-Object"],
  ["sleep", "Start-Sleep"],
  ["sort", "Sort-Object"],
  ["tee", "Tee-Object"],
  ["type", "Get-Content"],
  ["where", "Where-Object"],
  ["wget", "Invoke-WebRequest"],
  ["write", "Write-Output"],
]);

const implementedRules = {
  PSAvoidAssignmentToAutomaticVariable: {
    severity: "warn",
    description: "flags assignments to PowerShell automatic variables",
    check(context, ast) {
      for (const token of ast.tokens) {
        if (
          token.type !== "PowerShellVariable" ||
          !automaticVariables.has(token.value.toLowerCase())
        ) {
          continue;
        }
        const next = nextToken(ast.tokens, token);
        if (next?.type === "Operator" && next.value.includes("=")) {
          report(context, token, `Avoid assigning to automatic variable '${token.value}'.`);
        }
      }
    },
  },
  PSAvoidDefaultValueForMandatoryParameter: {
    severity: "warn",
    description: "flags mandatory parameters with default values",
    check(context) {
      scan(
        context,
        /\[Parameter\s*\([^)]*Mandatory\s*=\s*\$true[^)]*\)\]\s*(?:\[[^\]]+\]\s*)?\$(\w+)\s*=/giu,
        "Mandatory parameter '$1' should not define a default value.",
      );
    },
  },
  PSAvoidDefaultValueSwitchParameter: {
    severity: "warn",
    description: "flags switch parameters with default values",
    check(context) {
      scan(
        context,
        /\[switch\]\s*\$(\w+)\s*=/giu,
        "Switch parameter '$1' should not define a default value.",
      );
      scan(
        context,
        /\[System\.Management\.Automation\.SwitchParameter\]\s*\$(\w+)\s*=/giu,
        "Switch parameter '$1' should not define a default value.",
      );
    },
  },
  PSAvoidExclaimOperator: {
    severity: "warn",
    description: "flags the ! operator",
    check(context, ast) {
      for (const token of ast.tokens) {
        if (token.type === "Operator" && token.value.includes("!")) {
          report(context, token, "Use '-not' instead of '!'.");
        }
      }
    },
  },
  PSAvoidGlobalAliases: {
    severity: "warn",
    description: "flags global aliases",
    check(context) {
      scan(
        context,
        /\b(?:New-Alias|Set-Alias)\b[^\r\n;|]*\s-(?:Scope\s+Global|Option\s+AllScope)\b/giu,
        "Avoid creating global aliases.",
      );
    },
  },
  PSAvoidGlobalFunctions: {
    severity: "warn",
    description: "flags global function definitions",
    check(context) {
      scan(
        context,
        /\bfunction\s+(?:global:|function:global:)[\w-]+/giu,
        "Avoid declaring global functions.",
      );
    },
  },
  PSAvoidGlobalVars: {
    severity: "warn",
    description: "flags global variable usage",
    check(context) {
      scan(context, /\$global:[\w?]+/giu, "Avoid global variables.");
    },
  },
  PSAvoidInvokingEmptyMembers: {
    severity: "warn",
    description: "flags empty member invocation",
    check(context) {
      scan(context, /\.\s*\(\s*\)/gu, "Avoid invoking an empty member expression.");
      scan(
        context,
        /\.\s*\([^)]*[+][^)]*\)/gu,
        "Avoid invoking dynamically composed member names.",
      );
    },
  },
  PSAvoidNullOrEmptyHelpMessageAttribute: {
    severity: "warn",
    description: "flags empty HelpMessage attributes",
    check(context) {
      scan(
        context,
        /\bHelpMessage\s*=\s*(["'])\s*\1/giu,
        "HelpMessage should not be null or empty.",
      );
    },
  },
  PSAvoidOverwritingBuiltInCmdlets: {
    severity: "warn",
    description: "flags functions that shadow known built-in cmdlets",
    check(context, ast) {
      for (const fn of ast.body[0].functions) {
        if (builtInCmdlets.has(fn.name)) {
          report(context, fn, `Function '${fn.name}' overwrites a built-in cmdlet name.`);
        }
      }
    },
  },
  PSAvoidReservedWordsAsFunctionNames: {
    severity: "warn",
    description: "flags functions named with reserved words",
    check(context, ast) {
      for (const fn of ast.body[0].functions) {
        if (!fn.name.includes("-")) {
          report(
            context,
            fn,
            `Function '${fn.name}' should not use a reserved or non cmdlet-style name.`,
          );
        }
      }
    },
  },
  PSAvoidUsingAllowUnencryptedAuthentication: {
    severity: "warn",
    description: "flags AllowUnencryptedAuthentication usage",
    check(context) {
      scan(
        context,
        /-AllowUnencryptedAuthentication(?:\s+\$true)?\b/giu,
        "Avoid AllowUnencryptedAuthentication.",
      );
    },
  },
  PSAvoidUsingBrokenHashAlgorithms: {
    severity: "warn",
    description: "flags MD5 and SHA1 hash algorithms",
    check(context) {
      scan(context, /\b(?:MD5|SHA1)\b/giu, "Avoid broken hash algorithm '$0'.");
    },
  },
  PSAvoidUsingCmdletAliases: {
    severity: "warn",
    description: "flags common PowerShell aliases",
    check(context, ast) {
      for (const command of ast.body[0].commands) {
        const replacement = aliases.get(command.name.toLowerCase());
        if (replacement) {
          report(context, command, `Use '${replacement}' instead of alias '${command.name}'.`);
        }
      }
    },
  },
  PSAvoidUsingComputerNameHardcoded: {
    severity: "error",
    description: "flags hardcoded ComputerName string arguments",
    check(context) {
      scan(
        context,
        /-ComputerName\s+(['"])(?!localhost\b|\.)([^'"]+)\1/giu,
        "Avoid hardcoded ComputerName value '$2'.",
      );
    },
  },
  PSAvoidUsingConvertToSecureStringWithPlainText: {
    severity: "error",
    description: "flags ConvertTo-SecureString -AsPlainText",
    check(context) {
      scan(
        context,
        /\b(?:ConvertTo-SecureString|ctss)\b[^\r\n;|]*-AsPlainText\b/giu,
        "Avoid ConvertTo-SecureString with -AsPlainText.",
      );
    },
  },
  PSAvoidUsingDeprecatedManifestFields: {
    severity: "warn",
    description: "flags deprecated module manifest fields",
    check(context) {
      scan(
        context,
        /\b(?:ModuleToProcess|NestedModulesToProcess|RequiredAssembliesToLoad)\b\s*=/giu,
        "Avoid deprecated module manifest field '$0'.",
      );
    },
  },
  PSAvoidUsingEmptyCatchBlock: {
    severity: "warn",
    description: "flags empty catch blocks",
    check(context, ast) {
      for (const catchClause of ast.body[0].catchClauses) {
        if (catchClause.bodyText.length === 0) {
          report(
            context,
            catchClause,
            "Catch block is empty; handle the error or document why it is intentionally ignored.",
          );
        }
      }
    },
  },
  PSAvoidUsingInvokeExpression: {
    severity: "warn",
    description: "flags Invoke-Expression",
    check(context, ast) {
      for (const command of ast.body[0].commands) {
        if (["invoke-expression", "iex"].includes(command.name.toLowerCase())) {
          report(context, command, "Avoid Invoke-Expression.");
        }
      }
    },
  },
  PSAvoidUsingPlainTextForPassword: {
    severity: "warn",
    description: "flags likely plain-text password parameters",
    check(context) {
      scan(
        context,
        /\[(?:string|securestring)\]\s*\$(?:password|pass|pwd)\w*/giu,
        "Avoid plain-text password parameters; use PSCredential or SecureString patterns carefully.",
      );
    },
  },
  PSAvoidUsingPositionalParameters: {
    severity: "warn",
    description: "flags likely positional command arguments",
    check(context) {
      scanText(
        context,
        stripCommentsPreserveLines(context.sourceCode.text),
        /^\s*(?!(?:if|for|foreach|while|switch|function|param|try|catch|finally|else|elseif)\b)[A-Za-z][\w-]*[ \t]+(?![-|}\])])\S+/gimu,
        "Avoid positional parameters; name the parameter explicitly.",
      );
    },
  },
  PSAvoidUsingUsernameAndPasswordParams: {
    severity: "error",
    description: "flags username and password parameter pairs",
    check(context) {
      scan(
        context,
        /param\s*\([^)]*\$(?:user(?:name)?)[\w]*[^)]*\$(?:password|pass|pwd)[\w]*[^)]*\)/giu,
        "Avoid username and password parameter pairs; use PSCredential.",
      );
    },
  },
  PSAvoidUsingWMICmdlet: {
    severity: "warn",
    description: "flags WMI cmdlets",
    check(context, ast) {
      for (const command of ast.body[0].commands) {
        if (/^(?:Get|Invoke|Register|Remove|Set)-Wmi/iu.test(command.name)) {
          report(context, command, "Avoid WMI cmdlets; prefer CIM cmdlets.");
        }
      }
    },
  },
  PSAvoidUsingWriteHost: {
    severity: "warn",
    description: "flags Write-Host",
    check(context, ast) {
      for (const command of ast.body[0].commands) {
        if (command.name.toLowerCase() === "write-host") {
          report(
            context,
            command,
            "Avoid Write-Host; prefer Write-Output, Write-Verbose, Write-Information, or streams appropriate to the caller.",
          );
        }
      }
    },
  },
  PSMisleadingBacktick: {
    severity: "warn",
    description: "flags backticks followed by whitespace at line end",
    check(context) {
      scan(context, /`[ \t]+$/gmu, "Backtick line continuation is followed by whitespace.");
    },
  },
  PSPossibleIncorrectComparisonWithNull: {
    severity: "warn",
    description: "flags null comparisons where null is on the right",
    check(context) {
      scan(
        context,
        /\$[\w:]+\s+-c?(?:eq|ne)\s+\$null\b/giu,
        "Put $null on the left side of equality comparisons.",
      );
    },
  },
  PSPossibleIncorrectUsageOfAssignmentOperator: {
    severity: "warn",
    description: "flags assignment in condition expressions",
    check(context) {
      scan(
        context,
        /\b(?:if|elseif|while)\s*\([^)]*\$[\w:]+\s=(?!=)[^)]*\)/giu,
        "Possible assignment in condition; use a comparison operator if this is intentional.",
      );
    },
  },
  PSProvideCommentHelp: {
    severity: "info",
    description: "flags functions without nearby comment-based help",
    check(context, ast) {
      const text = context.sourceCode.text;
      for (const fn of ast.body[0].functions) {
        const prefix = text.slice(Math.max(0, fn.range[0] - 300), fn.range[0]);
        if (!/\.(?:SYNOPSIS|DESCRIPTION)\b/iu.test(prefix)) {
          report(context, fn, `Function '${fn.name}' should provide comment-based help.`);
        }
      }
    },
  },
  PSReviewUnusedParameter: {
    severity: "warn",
    description: "flags likely unused function parameters",
    check(context) {
      for (const fn of findFunctionBlocks(context.sourceCode.text)) {
        const params = [...fn.header.matchAll(/\$(\w+)/gu)].map((match) => match[1]);
        for (const name of params) {
          if (!new RegExp(`\\$${escapeRegExp(name)}\\b`, "iu").test(fn.body)) {
            reportIndex(context, fn.index, `Parameter '$${name}' appears to be unused.`);
          }
        }
      }
    },
  },
  PSShouldProcess: {
    severity: "warn",
    description: "flags ShouldProcess usage without ShouldProcess support",
    check(context) {
      scan(
        context,
        /\$PSCmdlet\.ShouldProcess\s*\(/giu,
        "Ensure the function declares SupportsShouldProcess when using ShouldProcess.",
      );
    },
  },
  PSUseApprovedVerbs: {
    severity: "warn",
    description: "flags functions using unapproved verbs",
    check(context, ast) {
      for (const fn of ast.body[0].functions) {
        const [verb] = fn.name.split("-");
        if (verb && !approvedVerbs.has(verb)) {
          report(context, fn, `Function '${fn.name}' uses unapproved verb '${verb}'.`);
        }
      }
    },
  },
  PSUseDeclaredVarsMoreThanAssignments: {
    severity: "warn",
    description: "flags assigned variables not used later",
    check(context) {
      const text = context.sourceCode.text;
      const assignments = matchAll(text, /(\$[A-Za-z_][\w:]*)\s*=(?!=)/gu);
      for (const match of assignments) {
        const variable = match[1];
        const rest = text.slice(match.index + match[0].length);
        if (!new RegExp(escapeRegExp(variable) + "\\b", "iu").test(rest)) {
          reportIndex(context, match.index, `Variable '${variable}' is assigned but not used.`);
        }
      }
    },
  },
  PSUseLiteralInitializerForHashtable: {
    severity: "warn",
    description: "flags New-Object hashtable",
    check(context) {
      scan(
        context,
        /\bNew-Object\s+(?:-TypeName\s+)?(?:hashtable|System\.Collections\.Hashtable)\b/giu,
        "Use a literal hashtable initializer '@{}' instead of New-Object.",
      );
    },
  },
  PSUseProcessBlockForPipelineCommand: {
    severity: "warn",
    description: "flags pipeline parameters without process block",
    check(context) {
      for (const fn of findFunctionBlocks(context.sourceCode.text)) {
        if (
          /ValueFromPipeline\s*=\s*\$true/iu.test(fn.header) &&
          !/\bprocess\s*\{/iu.test(fn.body)
        ) {
          reportIndex(
            context,
            fn.index,
            "Function with ValueFromPipeline should define a process block.",
          );
        }
      }
    },
  },
  PSUsePSCredentialType: {
    severity: "warn",
    description: "flags credential-like parameters not typed as PSCredential",
    check(context) {
      scan(
        context,
        /\[(?!pscredential\])(?:string|securestring)\]\s*\$(?:credential|cred)\w*/giu,
        "Use PSCredential for credential parameters.",
      );
    },
  },
  PSUseShouldProcessForStateChangingFunctions: {
    severity: "warn",
    description: "flags state-changing function names without SupportsShouldProcess",
    check(context) {
      for (const fn of findFunctionBlocks(context.sourceCode.text)) {
        const [verb] = fn.name.split("-");
        if (
          stateChangingVerbs.has(verb) &&
          !/SupportsShouldProcess\s*=\s*\$true/iu.test(fn.header + fn.body)
        ) {
          reportIndex(context, fn.index, `Function '${fn.name}' should support ShouldProcess.`);
        }
      }
    },
  },
  PSUseSingularNouns: {
    severity: "warn",
    description: "flags plural nouns in function names",
    check(context, ast) {
      for (const fn of ast.body[0].functions) {
        const [, noun] = fn.name.split("-");
        if (noun && /s$/iu.test(noun) && !/(ss|us)$/iu.test(noun)) {
          report(context, fn, `Function '${fn.name}' should use a singular noun.`);
        }
      }
    },
  },
  PSUseSupportsShouldProcess: {
    severity: "warn",
    description: "flags ShouldProcess calls without SupportsShouldProcess",
    check(context) {
      for (const fn of findFunctionBlocks(context.sourceCode.text)) {
        if (
          /\$PSCmdlet\.ShouldProcess\s*\(/iu.test(fn.body) &&
          !/SupportsShouldProcess\s*=\s*\$true/iu.test(fn.header)
        ) {
          reportIndex(
            context,
            fn.index,
            `Function '${fn.name}' calls ShouldProcess but does not declare SupportsShouldProcess.`,
          );
        }
      }
    },
  },
  PSUseToExportFieldsInManifest: {
    severity: "warn",
    description: "flags wildcard export fields in manifests",
    check(context) {
      scan(
        context,
        /\b(?:FunctionsToExport|CmdletsToExport|AliasesToExport|VariablesToExport)\s*=\s*(["'])\*\1/giu,
        "Use explicit export fields in module manifests instead of '*'.",
      );
    },
  },
};

const defaultEnabledRules = new Set([
  "PSAvoidAssignmentToAutomaticVariable",
  "PSAvoidDefaultValueForMandatoryParameter",
  "PSAvoidDefaultValueSwitchParameter",
  "PSAvoidGlobalAliases",
  "PSAvoidGlobalFunctions",
  "PSAvoidGlobalVars",
  "PSAvoidInvokingEmptyMembers",
  "PSAvoidNullOrEmptyHelpMessageAttribute",
  "PSAvoidOverwritingBuiltInCmdlets",
  "PSAvoidReservedWordsAsFunctionNames",
  "PSAvoidUsingAllowUnencryptedAuthentication",
  "PSAvoidUsingBrokenHashAlgorithms",
  "PSAvoidUsingCmdletAliases",
  "PSAvoidUsingComputerNameHardcoded",
  "PSAvoidUsingConvertToSecureStringWithPlainText",
  "PSAvoidUsingDeprecatedManifestFields",
  "PSAvoidUsingEmptyCatchBlock",
  "PSAvoidUsingInvokeExpression",
  "PSAvoidUsingPlainTextForPassword",
  "PSAvoidUsingPositionalParameters",
  "PSAvoidUsingUsernameAndPasswordParams",
  "PSAvoidUsingWMICmdlet",
  "PSAvoidUsingWriteHost",
  "PSMisleadingBacktick",
  "PSPossibleIncorrectComparisonWithNull",
  "PSPossibleIncorrectUsageOfAssignmentOperator",
  "PSProvideCommentHelp",
  "PSReviewUnusedParameter",
  "PSShouldProcess",
  "PSUseApprovedVerbs",
  "PSUseDeclaredVarsMoreThanAssignments",
  "PSUseLiteralInitializerForHashtable",
  "PSUseProcessBlockForPipelineCommand",
  "PSUsePSCredentialType",
  "PSUseShouldProcessForStateChangingFunctions",
  "PSUseSingularNouns",
  "PSUseSupportsShouldProcess",
  "PSUseToExportFieldsInManifest",
]);

export const defaultRuleLevels = Object.fromEntries(
  Object.entries(implementedRules)
    .filter(([name]) => defaultEnabledRules.has(name))
    .map(([name, rule]) => [name, rule.severity === "error" ? "error" : "warn"]),
);

const rules = Object.fromEntries(
  Object.entries(implementedRules).map(([name, rule]) => [
    name,
    {
      meta: {
        type: rule.severity === "error" ? "problem" : "suggestion",
        docs: {
          description: rule.description,
          recommended: defaultEnabledRules.has(name),
        },
        defaultSeverity: rule.severity,
        schema: [],
      },
      create(context) {
        return {
          Program(ast) {
            rule.check(context, ast);
          },
        };
      },
    },
  ]),
);

export default rules;

function nextToken(tokens, token) {
  const index = tokens.indexOf(token);
  return index === -1 ? null : tokens[index + 1];
}

function report(context, node, message) {
  context.report({ node, message });
}

function reportIndex(context, index, message) {
  context.report({ loc: locFromIndex(context.sourceCode.text, index), message });
}

function scan(context, regex, messageTemplate) {
  scanText(context, context.sourceCode.text, regex, messageTemplate);
}

function scanText(context, text, regex, messageTemplate) {
  for (const match of matchAll(text, regex)) {
    const message = messageTemplate.replace(/\$(\d)/gu, (_, index) => match[Number(index)] ?? "");
    reportIndex(context, match.index, message);
  }
}

function matchAll(text, regex) {
  return [...text.matchAll(regex)];
}

function locFromIndex(text, index) {
  const lines = text.slice(0, index).split(/\r?\n/u);
  return {
    line: lines.length,
    column: lines[lines.length - 1].length,
  };
}

function findFunctionBlocks(text) {
  const blocks = [];
  const regex = /\bfunction\s+([\w-]+)\s*(?:\(([^)]*)\))?\s*\{/giu;
  for (const match of text.matchAll(regex)) {
    const openBrace = match.index + match[0].length - 1;
    const closeBrace = findMatchingBrace(text, openBrace);
    if (closeBrace === -1) {
      continue;
    }
    blocks.push({
      name: match[1],
      header: text.slice(match.index, openBrace),
      body: text.slice(openBrace + 1, closeBrace),
      index: match.index,
    });
  }
  return blocks;
}

function findMatchingBrace(text, openBrace) {
  let depth = 0;
  let quote = null;
  for (let index = openBrace; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (char === "`") {
        index += 1;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return -1;
}

function escapeRegExp(value) {
  return value.replace(/[|\\{}()[\]^$+*?.]/gu, "\\$&");
}

function stripCommentsPreserveLines(text) {
  return text
    .replace(/<#(?:.|\r?\n)*?#>/gu, (match) => match.replace(/[^\r\n]/gu, " "))
    .replace(/#.*/gu, (match) => " ".repeat(match.length));
}
