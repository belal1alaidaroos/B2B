#!/bin/bash

# Migrate B2B Backend from SQLite to SQL Server
echo "🔄 Migrating B2B Backend from SQLite to SQL Server..."

# Check if dotnet-ef is installed
if ! command -v dotnet-ef &> /dev/null; then
    echo "📦 Installing Entity Framework Core tools..."
    dotnet tool install --global dotnet-ef
fi

# Remove old SQLite database files
echo "🗑️  Removing old SQLite database files..."
rm -f b2b_database.db b2b_database.db-shm b2b_database.db-wal

# Remove existing migrations (if any)
echo "🔄 Removing existing migrations..."
rm -rf Migrations/

# Create initial migration for SQL Server
echo "📝 Creating initial migration for SQL Server..."
dotnet ef migrations add InitialCreate

if [ $? -eq 0 ]; then
    echo "✅ Migration created successfully!"
    echo ""
    echo "🚀 Next steps:"
    echo "1. Make sure SQL Server is running"
    echo "2. Update connection string in appsettings.Development.json if needed"
    echo "3. Run: dotnet run (migrations will apply automatically)"
    echo ""
    echo "📖 For detailed setup instructions, see: SQL_SERVER_SETUP_GUIDE.md"
else
    echo "❌ Failed to create migration. Please check your SQL Server connection."
    echo "📖 See SQL_SERVER_SETUP_GUIDE.md for troubleshooting."
fi