# Migrate B2B Backend from SQLite to SQL Server
Write-Host "🔄 Migrating B2B Backend from SQLite to SQL Server..." -ForegroundColor Cyan

# Check if dotnet-ef is installed
$efInstalled = Get-Command dotnet-ef -ErrorAction SilentlyContinue
if (-not $efInstalled) {
    Write-Host "📦 Installing Entity Framework Core tools..." -ForegroundColor Yellow
    dotnet tool install --global dotnet-ef
}

# Remove old SQLite database files
Write-Host "🗑️  Removing old SQLite database files..." -ForegroundColor Yellow
Remove-Item -Path "b2b_database.db" -ErrorAction SilentlyContinue
Remove-Item -Path "b2b_database.db-shm" -ErrorAction SilentlyContinue
Remove-Item -Path "b2b_database.db-wal" -ErrorAction SilentlyContinue

# Remove existing migrations (if any)
Write-Host "🔄 Removing existing migrations..." -ForegroundColor Yellow
Remove-Item -Path "Migrations" -Recurse -ErrorAction SilentlyContinue

# Create initial migration for SQL Server
Write-Host "📝 Creating initial migration for SQL Server..." -ForegroundColor Yellow
dotnet ef migrations add InitialCreate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migration created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Make sure SQL Server is running"
    Write-Host "2. Update connection string in appsettings.Development.json if needed"
    Write-Host "3. Run: dotnet run (migrations will apply automatically)"
    Write-Host ""
    Write-Host "📖 For detailed setup instructions, see: SQL_SERVER_SETUP_GUIDE.md" -ForegroundColor Blue
} else {
    Write-Host "❌ Failed to create migration. Please check your SQL Server connection." -ForegroundColor Red
    Write-Host "📖 See SQL_SERVER_SETUP_GUIDE.md for troubleshooting." -ForegroundColor Blue
}