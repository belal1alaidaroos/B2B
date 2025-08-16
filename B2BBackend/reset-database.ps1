# Reset Database Script
# This script deletes the existing database and recreates it with proper seeding

Write-Host "Resetting B2B Backend Database..." -ForegroundColor Yellow

# Remove existing database file
if (Test-Path "b2b_database.db") {
    Remove-Item "b2b_database.db" -Force
    Write-Host "Removed existing database file" -ForegroundColor Green
}

# Remove related files
if (Test-Path "b2b_database.db-shm") {
    Remove-Item "b2b_database.db-shm" -Force
}

if (Test-Path "b2b_database.db-wal") {
    Remove-Item "b2b_database.db-wal" -Force
}

Write-Host "Database files cleaned. Run 'dotnet run' to recreate the database with proper seeding." -ForegroundColor Green
Write-Host "Default admin credentials will be: admin@company.com / admin123" -ForegroundColor Cyan