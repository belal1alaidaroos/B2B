#!/bin/bash

echo "🔧 Fixing dynamic DateTime.UtcNow in seeding data..."

# Replace DateTime.UtcNow with static seedDate in ApplicationDbContext.cs
sed -i 's/DateTime\.UtcNow/seedDate/g' Data/ApplicationDbContext.cs

echo "✅ Fixed all DateTime.UtcNow references in seeding data"
echo ""
echo "🔄 Now recreating migration with fixed seeding..."

# Remove the problematic migration
rm -rf Migrations/

# Create new migration with fixed seeding
dotnet ef migrations add InitialCreate

if [ $? -eq 0 ]; then
    echo "✅ Migration recreated successfully!"
    echo ""
    echo "🚀 Running application..."
    dotnet run
else
    echo "❌ Migration creation failed. Check the seeding data."
fi