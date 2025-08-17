# Migration Error Fix - "Invalid object name 'Users'"

## 🚨 **ERROR ANALYSIS**

### **The Problem:**
```
Microsoft.Data.SqlClient.SqlException: Invalid object name 'Users'.
info: Microsoft.EntityFrameworkCore.Migrations[20406]
No migrations were found in assembly 'B2BBackend'. A migration needs to be added before the database can be updated.
```

### **Root Cause:**
1. **Database exists** (LocalDB connection works)
2. **No tables exist** (no migrations have been applied)
3. **App tries to query Users table** before it's created
4. **Need to create initial migration** to create tables

---

## 🛠️ **IMMEDIATE FIX**

### **Step 1: Create the Migration**

#### **Linux/Mac:**
```bash
cd B2BBackend
./create-migration.sh
```

#### **Windows:**
```powershell
cd B2BBackend
.\create-migration.ps1
```

#### **Manual (If Scripts Don't Work):**
```bash
cd B2BBackend

# Install EF tools if needed
dotnet tool install --global dotnet-ef

# Create initial migration
dotnet ef migrations add InitialCreate
```

### **Step 2: Run the Application**
```bash
cd B2BBackend
dotnet run
```

**Expected Output:**
```
info: Program[0] Database migrations applied successfully
info: Program[0] Creating default admin user...
info: Program[0] Default admin user created: admin@company.com / admin123
Now listening on: https://localhost:7160
Now listening on: http://localhost:5097
```

---

## 🧪 **VERIFICATION STEPS**

### **Step 1: Check Migration Created**
After running the migration script, you should see:
```
B2BBackend/
├── Migrations/
│   ├── 20240101000000_InitialCreate.cs
│   └── ApplicationDbContextModelSnapshot.cs
```

### **Step 2: Test API Endpoints**

#### **Test Login (HTTP - Easier):**
```bash
curl -X POST "http://localhost:5097/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@company.com", "password": "admin123"}'
```

#### **Test Login (HTTPS):**
```bash
curl -X POST "https://localhost:7160/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@company.com", "password": "admin123"}' \
  -k
```

#### **Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "Id": "user_admin",
      "Email": "admin@company.com",
      "FullName": "System Administrator"
    }
  }
}
```

### **Step 3: Test Entity Endpoints**
```bash
# Get token from login response, then test:
curl -X GET "http://localhost:5097/api/entity/role" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Step 4: Test Swagger UI**
- **HTTP**: http://localhost:5097/swagger
- **HTTPS**: https://localhost:7160/swagger

---

## 🔧 **TROUBLESHOOTING**

### **Issue: "dotnet-ef command not found"**

#### **Solution:**
```bash
# Install EF Core tools
dotnet tool install --global dotnet-ef

# Add to PATH (Linux/Mac)
export PATH="$PATH:$HOME/.dotnet/tools"

# Restart terminal and try again
```

### **Issue: "Cannot connect to LocalDB"**

#### **Solution 1: Test LocalDB Connection**
```cmd
sqlcmd -S "(localdb)\MSSQLLocalDB" -E
```

#### **Solution 2: Create LocalDB Instance**
```cmd
sqllocaldb create MSSQLLocalDB
sqllocaldb start MSSQLLocalDB
```

#### **Solution 3: Use Different Connection String**
Update `appsettings.Development.json`:

**For SQL Server Express:**
```json
"DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=B2BDatabase_Dev;Trusted_Connection=true;TrustServerCertificate=true;"
```

**For Docker SQL Server:**
```bash
# Start Docker SQL Server first
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=DevPassword123!" \
   -p 1433:1433 --name b2b-sqlserver -d mcr.microsoft.com/mssql/server:2022-latest

# Then use this connection string:
"DefaultConnection": "Server=localhost,1433;Database=B2BDatabase_Dev;User Id=sa;Password=DevPassword123!;TrustServerCertificate=true;"
```

### **Issue: Migration Creation Fails**

#### **Solution: Check Project Structure**
```bash
# Make sure you're in the right directory
cd B2BBackend
ls -la  # Should see B2BBackend.csproj

# Try creating migration manually
dotnet ef migrations add InitialCreate --verbose
```

---

## 📋 **COMPLETE PROCESS**

### **1. Create Migration:**
```bash
cd B2BBackend
dotnet ef migrations add InitialCreate
```

### **2. Run Application:**
```bash
dotnet run
```

### **3. Test Login:**
```bash
curl -X POST "http://localhost:5097/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@company.com", "password": "admin123"}'
```

### **4. Test Swagger:**
Visit: http://localhost:5097/swagger

---

## 🎯 **KEY POINTS**

1. **Database**: LocalDB connection is working ✅
2. **Tables**: Need to be created via migration ⚠️
3. **Migration**: Create with `dotnet ef migrations add InitialCreate`
4. **Admin User**: Created automatically after tables exist
5. **Testing**: Use HTTP endpoints to avoid HTTPS certificate issues

**The migration creation is the critical missing step!** 🔑

---

## 🚨 **QUICK COMMANDS**

```bash
# Complete setup in 3 commands:
cd B2BBackend
dotnet ef migrations add InitialCreate
dotnet run

# Test it works:
curl -X POST "http://localhost:5097/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@company.com", "password": "admin123"}'
```

**After creating the migration, everything should work perfectly!** 🎉