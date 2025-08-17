Write-Host "🔄 Creating initial migration for SQL Server..." -ForegroundColor Cyan

# Check if we're in the correct directory
if (-not (Test-Path "B2BBackend.csproj")) {
    Write-Host "❌ Error: Please run this script from the B2BBackend directory" -ForegroundColor Red
    Write-Host "Usage: cd B2BBackend && .\create-migration.ps1" -ForegroundColor Yellow
    exit 1
}

# Check if dotnet-ef is installed
$efInstalled = Get-Command dotnet-ef -ErrorAction SilentlyContinue
if (-not $efInstalled) {
    Write-Host "📦 Installing Entity Framework Core tools..." -ForegroundColor Yellow
    dotnet tool install --global dotnet-ef
}

# Remove existing migrations if any
if (Test-Path "Migrations") {
    Write-Host "🗑️  Removing existing migrations..." -ForegroundColor Yellow
    Remove-Item -Path "Migrations" -Recurse -Force
}

# Create initial migration
Write-Host "📝 Creating initial migration..." -ForegroundColor Yellow
dotnet ef migrations add InitialCreate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migration created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Now run the application:" -ForegroundColor Cyan
    Write-Host "   dotnet run" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 The database and tables will be created automatically!" -ForegroundColor Green
    Write-Host "👤 Admin user (admin@company.com / admin123) will be created automatically!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "❌ Failed to create migration." -ForegroundColor Red
    Write-Host "🔍 Common issues:" -ForegroundColor Yellow
    Write-Host "   - Make sure you're in the B2BBackend directory" -ForegroundColor White
    Write-Host "   - Check your connection string in appsettings.Development.json" -ForegroundColor White
    Write-Host "   - Ensure SQL Server/LocalDB is accessible" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Test your connection:" -ForegroundColor Yellow
    Write-Host "   sqlcmd -S `"(localdb)\MSSQLLocalDB`" -E" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 See SQL_CONNECTION_TROUBLESHOOTING.md for detailed help" -ForegroundColor Blue
}