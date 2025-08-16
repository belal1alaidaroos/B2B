#!/bin/bash

# Reset Database Script
# This script deletes the existing database and recreates it with proper seeding

echo "🔄 Resetting B2B Backend Database..."

# Remove existing database file
if [ -f "b2b_database.db" ]; then
    rm -f "b2b_database.db"
    echo "✅ Removed existing database file"
fi

# Remove related files
rm -f "b2b_database.db-shm"
rm -f "b2b_database.db-wal"

echo "✅ Database files cleaned."
echo "🚀 Run 'dotnet run' to recreate the database with proper seeding."
echo "🔑 Default admin credentials will be: admin@company.com / admin123"