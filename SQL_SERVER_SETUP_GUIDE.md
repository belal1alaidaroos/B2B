# SQL Server Setup Guide for B2B Backend

## 🎯 **OVERVIEW**

The B2B backend has been configured to use **SQL Server** instead of SQLite for better performance, scalability, and production readiness.

### **✅ What's Been Updated:**
- **Entity Framework provider**: SQLite → SQL Server
- **Connection strings**: Updated for local SQL Server
- **Database initialization**: EnsureCreated → Migrations
- **Package references**: Added EF Tools for migrations

---

## 🛠️ **SQL SERVER INSTALLATION OPTIONS**

### **Option 1: SQL Server Express (Recommended for Development)**

#### **Download & Install:**
1. **Download SQL Server Express**: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
2. **Choose**: "Express" (free edition)
3. **Installation Type**: "Basic" or "Custom"
4. **Instance**: Default instance (recommended)

#### **Install SQL Server Management Studio (SSMS):**
1. **Download SSMS**: https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms
2. **Install**: Follow the installer
3. **Connect**: Server name = `localhost` or `(localdb)\MSSQLLocalDB`

### **Option 2: SQL Server LocalDB (Lightweight)**

#### **Already Included with Visual Studio:**
- **Connection String**: `Server=(localdb)\\MSSQLLocalDB;Database=B2BDatabase;Trusted_Connection=true;`
- **No installation required** if you have Visual Studio
- **Automatic startup** when accessed

### **Option 3: SQL Server Developer Edition (Full Features)**

#### **For Advanced Development:**
1. **Download**: SQL Server Developer Edition (free)
2. **Full SQL Server features** for development
3. **Connection String**: `Server=localhost;Database=B2BDatabase;Trusted_Connection=true;TrustServerCertificate=true;`

### **Option 4: Docker SQL Server (Cross-Platform)**

#### **Run SQL Server in Docker:**
```bash
# Pull and run SQL Server 2022 in Docker
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourStrong@Passw0rd" \
   -p 1433:1433 --name sqlserver --hostname sqlserver \
   -d mcr.microsoft.com/mssql/server:2022-latest

# Connection string for Docker:
# Server=localhost,1433;Database=B2BDatabase;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=true;
```

---

## ⚙️ **CONFIGURATION DETAILS**

### **Current Connection Strings:**

#### **Production (appsettings.json):**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=B2BDatabase;Trusted_Connection=true;TrustServerCertificate=true;"
  }
}
```

#### **Development (appsettings.Development.json):**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=B2BDatabase_Dev;Trusted_Connection=true;TrustServerCertificate=true;"
  }
}
```

### **Alternative Connection String Options:**

#### **SQL Server Express:**
```json
"Server=localhost\\SQLEXPRESS;Database=B2BDatabase;Trusted_Connection=true;TrustServerCertificate=true;"
```

#### **LocalDB:**
```json
"Server=(localdb)\\MSSQLLocalDB;Database=B2BDatabase;Trusted_Connection=true;"
```

#### **SQL Authentication:**
```json
"Server=localhost;Database=B2BDatabase;User Id=your_username;Password=your_password;TrustServerCertificate=true;"
```

#### **Docker SQL Server:**
```json
"Server=localhost,1433;Database=B2BDatabase;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=true;"
```

---

## 🚀 **SETUP INSTRUCTIONS**

### **Step 1: Install SQL Server (Choose One Option Above)**

### **Step 2: Update Connection String (If Needed)**

Edit `appsettings.Development.json` if your SQL Server setup differs:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "YOUR_CONNECTION_STRING_HERE"
  }
}
```

### **Step 3: Install EF Core Tools (If Not Already Installed)**

```bash
# Install globally
dotnet tool install --global dotnet-ef

# Or update if already installed
dotnet tool update --global dotnet-ef
```

### **Step 4: Create Initial Migration**

```bash
cd B2BBackend

# Create the initial migration
dotnet ef migrations add InitialCreate

# This creates the migration files in Migrations/ folder
```

### **Step 5: Apply Migration to Database**

```bash
# Apply migrations to create database and tables
dotnet ef database update

# Or run the application (migrations apply automatically on startup)
dotnet run
```

### **Step 6: Verify Database Creation**

#### **Using SSMS:**
1. **Connect** to your SQL Server instance
2. **Check** for `B2BDatabase_Dev` database
3. **Verify** tables are created (Users, Roles, Jobs, etc.)
4. **Check** seeded data (admin user, roles, sample jobs)

#### **Using Command Line:**
```bash
# Check if database exists
sqlcmd -S localhost -E -Q "SELECT name FROM sys.databases WHERE name = 'B2BDatabase_Dev'"
```

---

## 🧪 **TESTING THE SETUP**

### **Step 1: Start the Backend**
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
```

### **Step 2: Test Authentication**
```bash
curl -X POST "https://localhost:7160/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@company.com", "password": "admin123"}' \
  -k
```

### **Step 3: Test Entity Endpoints**
```bash
# Get authentication token first, then test:
curl -X GET "https://localhost:7160/api/entity/role" \
  -H "Authorization: Bearer YOUR_TOKEN" -k
```

---

## 🔧 **TROUBLESHOOTING**

### **Issue: "Cannot connect to SQL Server"**

#### **Solutions:**
```bash
# 1. Check if SQL Server is running
services.msc  # Look for "SQL Server" services

# 2. Enable TCP/IP protocol
# SQL Server Configuration Manager > SQL Server Network Configuration > Protocols > TCP/IP > Enable

# 3. Check firewall (allow port 1433)
# Windows Firewall > Advanced Settings > Inbound Rules > New Rule > Port 1433

# 4. Test connection
sqlcmd -S localhost -E
```

### **Issue: "Login failed for user"**

#### **Solutions:**
```bash
# 1. Use Windows Authentication (Trusted_Connection=true)
# 2. Create SQL Server user:
sqlcmd -S localhost -E -Q "CREATE LOGIN [your_user] WITH PASSWORD='your_password'"

# 3. Use LocalDB if available:
"Server=(localdb)\\MSSQLLocalDB;Database=B2BDatabase;Trusted_Connection=true;"
```

### **Issue: "Database does not exist"**

#### **Solutions:**
```bash
# 1. Run migrations
dotnet ef database update

# 2. Or let the application create it on startup
dotnet run

# 3. Manually create database
sqlcmd -S localhost -E -Q "CREATE DATABASE B2BDatabase_Dev"
```

### **Issue: "Migration failed"**

#### **Solutions:**
```bash
# 1. Remove migrations and recreate
rm -rf Migrations/
dotnet ef migrations add InitialCreate
dotnet ef database update

# 2. Drop and recreate database
dotnet ef database drop
dotnet ef database update
```

---

## 📊 **DATABASE MANAGEMENT**

### **Common EF Core Commands:**

```bash
# Create new migration
dotnet ef migrations add MigrationName

# Apply migrations
dotnet ef database update

# Rollback to specific migration
dotnet ef database update PreviousMigrationName

# Generate SQL script
dotnet ef migrations script

# Drop database
dotnet ef database drop

# List migrations
dotnet ef migrations list
```

### **Backup & Restore:**

```sql
-- Backup database
BACKUP DATABASE B2BDatabase_Dev 
TO DISK = 'C:\Backup\B2BDatabase_Dev.bak'

-- Restore database
RESTORE DATABASE B2BDatabase_Dev 
FROM DISK = 'C:\Backup\B2BDatabase_Dev.bak'
```

---

## 🎯 **ADVANTAGES OF SQL SERVER**

### **Over SQLite:**
- ✅ **Better Performance** for concurrent users
- ✅ **Advanced Features** (stored procedures, functions, triggers)
- ✅ **Better Security** (user management, encryption)
- ✅ **Scalability** for production workloads
- ✅ **Management Tools** (SSMS, Azure Data Studio)
- ✅ **Backup/Recovery** options
- ✅ **Integration** with other Microsoft tools

### **Production Ready:**
- ✅ **High Availability** options
- ✅ **Clustering** support
- ✅ **Replication** capabilities
- ✅ **Monitoring** and diagnostics
- ✅ **Enterprise features**

---

## 📋 **QUICK REFERENCE**

### **Connection String Templates:**

| Scenario | Connection String |
|----------|-------------------|
| **Local SQL Express** | `Server=localhost\\SQLEXPRESS;Database=B2BDatabase;Trusted_Connection=true;TrustServerCertificate=true;` |
| **LocalDB** | `Server=(localdb)\\MSSQLLocalDB;Database=B2BDatabase;Trusted_Connection=true;` |
| **SQL Authentication** | `Server=localhost;Database=B2BDatabase;User Id=username;Password=password;TrustServerCertificate=true;` |
| **Docker** | `Server=localhost,1433;Database=B2BDatabase;User Id=sa;Password=YourPassword;TrustServerCertificate=true;` |

### **Essential Commands:**
```bash
# Setup
dotnet ef migrations add InitialCreate
dotnet ef database update

# Development
dotnet run

# Management
dotnet ef migrations list
dotnet ef database drop
```

---

## 🚨 **IMPORTANT NOTES**

1. **Migration Files**: Keep `Migrations/` folder in source control
2. **Connection Strings**: Don't commit passwords to source control
3. **Development vs Production**: Use different databases for each environment
4. **Backup Strategy**: Implement regular backups for production
5. **Security**: Use least privilege principles for database users

**Your B2B application is now configured for SQL Server and ready for production-scale deployment!** 🎉