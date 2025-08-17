#!/bin/bash

echo "🔄 Creating initial migration for SQL Server..."

# Check if we're in the correct directory
if [ ! -f "B2BBackend.csproj" ]; then
    echo "❌ Error: Please run this script from the B2BBackend directory"
    echo "Usage: cd B2BBackend && ./create-migration.sh"
    exit 1
fi

# Check if dotnet-ef is installed
if ! command -v dotnet-ef &> /dev/null; then
    echo "📦 Installing Entity Framework Core tools..."
    dotnet tool install --global dotnet-ef
    
    # Add to PATH if needed
    export PATH="$PATH:$HOME/.dotnet/tools"
fi

# Remove existing migrations if any
if [ -d "Migrations" ]; then
    echo "🗑️  Removing existing migrations..."
    rm -rf Migrations/
fi

# Create initial migration
echo "📝 Creating initial migration..."
dotnet ef migrations add InitialCreate

if [ $? -eq 0 ]; then
    echo "✅ Migration created successfully!"
    echo ""
    echo "🚀 Now run the application:"
    echo "   dotnet run"
    echo ""
    echo "📊 The database and tables will be created automatically!"
    echo "👤 Admin user (admin@company.com / admin123) will be created automatically!"
    echo ""
else
    echo "❌ Failed to create migration."
    echo "🔍 Common issues:"
    echo "   - Make sure you're in the B2BBackend directory"
    echo "   - Check your connection string in appsettings.Development.json"
    echo "   - Ensure SQL Server/LocalDB is accessible"
    echo ""
    echo "🔧 Test your connection:"
    echo "   sqlcmd -S \"(localdb)\\MSSQLLocalDB\" -E"
    echo ""
    echo "📖 See SQL_CONNECTION_TROUBLESHOOTING.md for detailed help"
fi