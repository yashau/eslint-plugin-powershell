<#
.SYNOPSIS
Gets thing.
#>

function Get-Thing {
    Get-ChildItem
    Write-Output -InputObject 'hello'
    try {
        Write-Verbose -Message 'Checking'
    } catch {
        Write-Verbose -Message 'Handled'
    }
}
