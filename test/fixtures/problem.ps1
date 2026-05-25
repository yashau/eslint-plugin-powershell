function Do-Thing {
    ls
    Write-Host 'hello'
    try {
        throw 'x'
    } catch {}
}
