import assert from "node:assert/strict";
import test from "node:test";
import { lintText } from "../src/linter.js";

function ruleMessages(ruleId, source) {
  return lintText(source, {
    rules: {
      [`powershell/${ruleId}`]: "warn",
    },
  }).messages;
}

test("ported from PSScriptAnalyzer AvoidUsingAlias.ps1", () => {
  const source = `
iex "I want to use alias"
cls
`;

  assert.equal(ruleMessages("PSAvoidUsingCmdletAliases", source).length, 2);
});

test("ported from PSScriptAnalyzer AvoidUsingWriteHost.ps1", () => {
  const source = `
Clear-Host
cls
Write-Host "aaa"
clear
[System.Console]::Write("abcdefg");
[System.Console]::WriteLine("No console.writeline plz!");

function Test
{
    Write-Host "aaaa"
}
`;

  assert.equal(ruleMessages("PSAvoidUsingWriteHost", source).length, 2);
});

test("ported from PSScriptAnalyzer AvoidEmptyCatchBlock.ps1", () => {
  const source = `
try
{
    1/0
}
catch [DivideByZeroException]
{
}
catch [System.Net.WebException],[System.Exception]
{
}
finally
{
    Write-Host "cleaning up ..."
}
`;

  assert.equal(ruleMessages("PSAvoidUsingEmptyCatchBlock", source).length, 2);
});

test("ported from PSScriptAnalyzer AvoidUsingInvokeExpression.ps1", () => {
  const source = `
Invoke-Expression "Invoke me"
iex "Invoke me"
`;

  assert.equal(ruleMessages("PSAvoidUsingInvokeExpression", source).length, 2);
});

test("ported from PSScriptAnalyzer PossibleIncorrectComparisonWithNull.ps1", () => {
  const source = `
function CompareWithNull {
    if ($DebugPreference -eq $null) {
    }
}

if (@("dfd", "eee") -eq $null)
{
}

if ($randomUninitializedVariable -eq $null)
{
}

function Test
{
    $b = "dd", "ddfd";
    if ($b -ceq $null)
    {
        if ("dd","ee" -eq $null)
        {
        }
    }
}
`;

  assert.equal(ruleMessages("PSPossibleIncorrectComparisonWithNull", source).length, 3);
});

test("ported from PSScriptAnalyzer AvoidDefaultTrueValueSwitchParameter.ps1", () => {
  const source = `
function Verb-Noun
{
    Param
    (
        [switch]
        $switch=$true,

        [System.Management.Automation.SwitchParameter]
        $switch2 = $true
    )
}
`;

  assert.equal(ruleMessages("PSAvoidDefaultValueSwitchParameter", source).length, 2);
});

test("ported from PSScriptAnalyzer AvoidConvertToSecureStringWithPlainText.ps1", () => {
  const source = `
$supersecure = convertto-securestring "sdfdsfd" -asplaintext -force
New-Object System.Management.Automation.PSCredential -ArgumentList "username", (ConvertTo-SecureString "really secure" -AsPlainText -Force)
$sneaky = ctss "sneaky convert" -asplainText -force
`;

  assert.equal(ruleMessages("PSAvoidUsingConvertToSecureStringWithPlainText", source).length, 3);
});

test("ported from PSScriptAnalyzer AvoidUsingWMICmdlet.ps1", () => {
  const source = `
function TestFunction
{
    Get-WmiObject -Class Win32_ComputerSystem
    Invoke-WMIMethod -Path Win32_Process -Name Create -ArgumentList notepad.exe
    Register-WMIEvent -Class Win32_ProcessStartTrace -SourceIdentifier "ProcessStarted"
    Set-WMIInstance -Class Win32_Environment -Argument @{Name='MyEnvVar';VariableValue='VarValue';UserName='<SYSTEM>'}
}

Remove-WmiObject -Class Win32_OperatingSystem -Verbose
`;

  assert.equal(ruleMessages("PSAvoidUsingWMICmdlet", source).length, 5);
});

test("ported from PSScriptAnalyzer AvoidGlobalOrUnitializedVars.ps1 for globals only", () => {
  const source = `
$Global:1 = "globalVar"
$Global:DebugPreference
`;

  assert.equal(ruleMessages("PSAvoidGlobalVars", source).length, 2);
});

test("ported from PSScriptAnalyzer AvoidInvokingEmptyMembers.ps1", () => {
  const source = `
"abc".('len'+'gth')
"abc".('len')
`;

  assert.equal(ruleMessages("PSAvoidInvokingEmptyMembers", source).length, 1);
});
