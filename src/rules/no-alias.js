const DEFAULT_ALIASES = new Map([
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

export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "disallow common PowerShell aliases in scripts",
      recommended: true,
    },
    messages: {
      noAlias: "Use '{{replacement}}' instead of alias '{{alias}}'.",
    },
    schema: [],
  },
  create(context) {
    return {
      PowerShellCommand(node) {
        const replacement = DEFAULT_ALIASES.get(node.name.toLowerCase());
        if (!replacement) {
          return;
        }

        context.report({
          node,
          message: `Use '${replacement}' instead of alias '${node.name}'.`,
        });
      },
    };
  },
};
