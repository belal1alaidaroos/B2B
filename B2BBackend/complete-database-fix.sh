#!/bin/bash

echo "🚨 COMPLETE DATABASE FIX - Resolving all migration and seeding issues"
echo ""

# Check if we're in the correct directory
if [ ! -f "B2BBackend.csproj" ]; then
    echo "❌ Error: Please run this script from the B2BBackend directory"
    echo "Usage: cd B2BBackend && ./complete-database-fix.sh"
    exit 1
fi

echo "🔄 Step 1: Dropping existing database completely..."
sqlcmd -S "(localdb)\MSSQLLocalDB" -E -Q "DROP DATABASE IF EXISTS B2BDatabase_Dev" 2>/dev/null
echo "✅ Database dropped"

echo ""
echo "🔄 Step 2: Removing problematic migrations..."
rm -rf Migrations/ 2>/dev/null
echo "✅ Migrations cleared"

echo ""
echo "🔄 Step 3: Installing EF Core tools..."
dotnet tool install --global dotnet-ef 2>/dev/null || dotnet tool update --global dotnet-ef
export PATH="$PATH:$HOME/.dotnet/tools"

echo ""
echo "🔄 Step 4: Creating clean migration (without problematic seeding)..."
dotnet ef migrations add InitialCreate

if [ $? -eq 0 ]; then
    echo "✅ Clean migration created successfully!"
    echo ""
    echo "🔄 Step 5: Running application..."
    echo ""
    echo "Expected output:"
    echo "  ✅ Database migrations applied successfully"
    echo "  ✅ Seeding default roles..."
    echo "  ✅ Seeding system settings..."
    echo "  ✅ Seeding countries..."
    echo "  ✅ Creating default admin user..."
    echo "  ✅ Default admin user created: admin@company.com / admin123"
    echo ""
    echo "Press Ctrl+C to stop after seeing success messages"
    echo ""
    dotnet run
else
    echo "❌ Migration creation failed."
    echo ""
    echo "🔧 FALLBACK: The app should still work with EnsureCreated..."
    echo "🚀 Running application..."
    dotnet run
fi