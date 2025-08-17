#!/bin/bash

echo "🚨 EMERGENCY DATABASE FIX - Resolving 'Invalid object name Users' error"
echo ""

# Check if we're in the correct directory
if [ ! -f "B2BBackend.csproj" ]; then
    echo "❌ Error: Please run this script from the B2BBackend directory"
    echo "Usage: cd B2BBackend && ./fix-database-now.sh"
    exit 1
fi

echo "🔄 Step 1: Dropping existing database to start fresh..."
sqlcmd -S "(localdb)\MSSQLLocalDB" -E -Q "DROP DATABASE IF EXISTS B2BDatabase_Dev" 2>/dev/null
echo "✅ Database dropped (if it existed)"

echo ""
echo "🔄 Step 2: Removing any existing migrations..."
rm -rf Migrations/ 2>/dev/null
echo "✅ Migrations cleared"

echo ""
echo "🔄 Step 3: Installing/updating EF Core tools..."
dotnet tool install --global dotnet-ef 2>/dev/null || dotnet tool update --global dotnet-ef
export PATH="$PATH:$HOME/.dotnet/tools"

echo ""
echo "🔄 Step 4: Creating fresh migration..."
dotnet ef migrations add InitialCreate

if [ $? -eq 0 ]; then
    echo "✅ Migration created successfully!"
    echo ""
    echo "🔄 Step 5: Running application (will create database and tables)..."
    echo "Press Ctrl+C to stop the application after you see the success message"
    echo ""
    dotnet run
else
    echo "❌ Migration creation failed."
    echo ""
    echo "🔧 ALTERNATIVE: Let's try without migrations (using EnsureCreated)"
    echo "The updated code should automatically use EnsureCreated when no migrations exist."
    echo ""
    echo "🚀 Running application with EnsureCreated fallback..."
    dotnet run
fi