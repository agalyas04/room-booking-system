why tjo# Clear TypeScript cache script
Write-Host "Clearing TypeScript cache..."

# Remove any TypeScript cache directories
$cacheDirs = @(
    "$env:TEMP\typescript",
    "$env:LOCALAPPDATA\Microsoft\TypeScript",
    "$env:APPDATA\Code\User\workspaceStorage"
)

foreach ($dir in $cacheDirs) {
    if (Test-Path $dir) {
        Write-Host "Removing cache directory: $dir"
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
    }
}

Write-Host "TypeScript cache cleared. Please restart VS Code."
