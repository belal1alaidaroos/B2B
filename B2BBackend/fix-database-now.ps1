Write-Host "🚨 EMERGENCY DATABASE FIX - Resolving 'Invalid object name Users' error" -ForegroundColor Red
Write-Host ""

# Check if we're in the correct directory
if (-not (Test-Path "B2BBackend.csproj")) {
    Write-Host "❌ Error: Please run this script from the B2BBackend directory" -ForegroundColor Red
    Write-Host "Usage: cd B2BBackend && .\fix-database-now.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "🔄 Step 1: Dropping existing database to start fresh..." -ForegroundColor Yellow
try {
    sqlcmd -S "(localdb)\MSSQLLocalDB" -E -Q "DROP DATABASE IF EXISTS B2BDatabase_Dev" 2>$null
    Write-Host "✅ Database dropped (if it existed)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Database drop failed (might not exist)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔄 Step 2: Removing any existing migrations..." -ForegroundColor Yellow
if (Test-Path "Migrations") {
    Remove-Item -Path "Migrations" -Recurse -Force
}
Write-Host "✅ Migrations cleared" -ForegroundColor Green

Write-Host ""
Write-Host "🔄 Step 3: Installing/updating EF Core tools..." -ForegroundColor Yellow
try {
    dotnet tool install --global dotnet-ef 2>$null
} catch {
    dotnet tool update --global dotnet-ef 2>$null
}

Write-Host ""
Write-Host "🔄 Step 4: Creating fresh migration..." -ForegroundColor Yellow
dotnet ef migrations add InitialCreate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migration created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔄 Step 5: Running application (will create database and tables)..." -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop the application after you see the success message" -ForegroundColor Yellow
    Write-Host ""
    dotnet run
} else {
    Write-Host "❌ Migration creation failed." -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 ALTERNATIVE: Let's try without migrations (using EnsureCreated)" -ForegroundColor Yellow
    Write-Host "The updated code should automatically use EnsureCreated when no migrations exist." -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 Running application with EnsureCreated fallback..." -ForegroundColor Cyan
    dotnet run
}