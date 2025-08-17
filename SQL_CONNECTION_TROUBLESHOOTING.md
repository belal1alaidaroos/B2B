# SQL Server Connection Error 40 - Quick Fix Guide

## 🚨 **ERROR MESSAGE**
```
Microsoft.Data.SqlClient.SqlException: 
A network-related or instance-specific error occurred while establishing a connection to SQL Server. 
The server was not found or was not accessible. 
(provider: Named Pipes Provider, error: 40 - Could not open a connection to SQL Server)
```

## 🎯 **QUICK SOLUTIONS (Try These First)**

### **Solution 1: Use LocalDB (Easiest)**
Update your `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=B2BDatabase;Trusted_Connection=true;"
  }
}
```

**LocalDB is included with Visual Studio and .NET SDK - no separate installation needed!**

### **Solution 2: Use SQL Server Express with Correct Instance Name**
Update your `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=B2BDatabase;Trusted_Connection=true;TrustServerCertificate=true;"
  }
}
```

### **Solution 3: Use Docker SQL Server**
```bash
# Start SQL Server in Docker
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourStrong@Passw0rd123" \
   -p 1433:1433 --name sqlserver -d mcr.microsoft.com/mssql/server:2022-latest
```

Update your `appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=B2BDatabase;User Id=sa;Password=YourStrong@Passw0rd123;TrustServerCertificate=true;"
  }
}
```

## 🔍 **DIAGNOSTIC STEPS**

### **Step 1: Check What SQL Server Instances You Have**

#### **Windows Command:**
```cmd
# Check running SQL Server services
sqlcmd -L
```

#### **PowerShell:**
```powershell
# Check SQL Server services
Get-Service -Name "*SQL*" | Where-Object {$_.Status -eq "Running"}
```

### **Step 2: Test Connection Manually**

#### **Test LocalDB:**
```cmd
sqlcmd -S "(localdb)\MSSQLLocalDB" -E
```

#### **Test SQL Express:**
```cmd
sqlcmd -S "localhost\SQLEXPRESS" -E
```

#### **Test Default Instance:**
```cmd
sqlcmd -S "localhost" -E
```

If any of these work, use that connection string format!

## 🛠️ **COMMON SCENARIOS & FIXES**

### **Scenario 1: You Have Visual Studio Installed**
**Use LocalDB** - it's already installed:
```json
"Server=(localdb)\\MSSQLLocalDB;Database=B2BDatabase;Trusted_Connection=true;"
```

### **Scenario 2: You Installed SQL Server Express**
**Check the instance name**:
```json
"Server=localhost\\SQLEXPRESS;Database=B2BDatabase;Trusted_Connection=true;TrustServerCertificate=true;"
```

### **Scenario 3: You Have Full SQL Server**
**Use default instance**:
```json
"Server=localhost;Database=B2BDatabase;Trusted_Connection=true;TrustServerCertificate=true;"
```

### **Scenario 4: You Want Docker (Cross-Platform)**
```bash
# Start Docker SQL Server
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=DevPassword123!" \
   -p 1433:1433 --name b2b-sqlserver -d mcr.microsoft.com/mssql/server:2022-latest

# Connection string:
"Server=localhost,1433;Database=B2BDatabase;User Id=sa;Password=DevPassword123!;TrustServerCertificate=true;"
```

## 🚀 **RECOMMENDED QUICK FIX**

### **Option A: LocalDB (Easiest - No Installation)**
1. **Update** `B2BBackend/appsettings.Development.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=B2BDatabase;Trusted_Connection=true;"
     },
     "Jwt": {
       "Key": "your-super-secret-jwt-key-change-this-in-production-123456789",
       "Issuer": "B2BBackend",
       "Audience": "B2BFrontend"
     },
     "Logging": {
       "LogLevel": {
         "Default": "Information",
         "Microsoft.AspNetCore": "Warning",
         "Microsoft.EntityFrameworkCore": "Information"
       }
     }
   }
   ```

2. **Test the connection**:
   ```cmd
   sqlcmd -S "(localdb)\MSSQLLocalDB" -E
   ```

3. **Run the application**:
   ```bash
   cd B2BBackend
   dotnet run
   ```

### **Option B: Docker SQL Server (If Docker Available)**
1. **Start Docker SQL Server**:
   ```bash
   docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=DevPassword123!" \
      -p 1433:1433 --name b2b-sqlserver -d mcr.microsoft.com/mssql/server:2022-latest
   ```

2. **Update** `B2BBackend/appsettings.Development.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost,1433;Database=B2BDatabase;User Id=sa;Password=DevPassword123!;TrustServerCertificate=true;"
     }
   }
   ```

3. **Run the application**:
   ```bash
   cd B2BBackend
   dotnet run
   ```

## 🔧 **ADVANCED TROUBLESHOOTING**

### **If LocalDB Doesn't Work:**
```bash
# Create LocalDB instance manually
sqllocaldb create MSSQLLocalDB
sqllocaldb start MSSQLLocalDB
sqllocaldb info MSSQLLocalDB
```

### **If SQL Express Doesn't Work:**
1. **Enable TCP/IP Protocol**:
   - Open "SQL Server Configuration Manager"
   - Go to "SQL Server Network Configuration" > "Protocols for SQLEXPRESS"
   - Enable "TCP/IP"
   - Restart SQL Server service

2. **Check SQL Server Browser Service**:
   ```cmd
   net start "SQL Server Browser"
   ```

### **If Nothing Works - Use SQLite (Temporary)**
Revert to SQLite temporarily:

1. **Update** `B2BBackend.csproj`:
   ```xml
   <PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="9.0.1" />
   ```

2. **Update** `Program.cs`:
   ```csharp
   options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ?? 
                     "Data Source=b2b_database.db")
   ```

3. **Update** `appsettings.Development.json`:
   ```json
   "DefaultConnection": "Data Source=b2b_database.db"
   ```

## 📋 **CONNECTION STRING REFERENCE**

| Scenario | Connection String |
|----------|-------------------|
| **LocalDB** | `Server=(localdb)\\MSSQLLocalDB;Database=B2BDatabase;Trusted_Connection=true;` |
| **SQL Express** | `Server=localhost\\SQLEXPRESS;Database=B2BDatabase;Trusted_Connection=true;TrustServerCertificate=true;` |
| **Default Instance** | `Server=localhost;Database=B2BDatabase;Trusted_Connection=true;TrustServerCertificate=true;` |
| **Docker** | `Server=localhost,1433;Database=B2BDatabase;User Id=sa;Password=YourPassword;TrustServerCertificate=true;` |
| **Named Instance** | `Server=localhost\\InstanceName;Database=B2BDatabase;Trusted_Connection=true;TrustServerCertificate=true;` |

## ✅ **VERIFICATION STEPS**

After updating the connection string:

1. **Test connection manually**:
   ```cmd
   sqlcmd -S "YOUR_SERVER_NAME" -E
   ```

2. **Run the application**:
   ```bash
   cd B2BBackend
   dotnet run
   ```

3. **Look for success message**:
   ```
   info: Program[0] Database migrations applied successfully
   info: Program[0] Creating default admin user...
   ```

## 🚨 **MOST LIKELY SOLUTION**

**Try LocalDB first** - it's the easiest and most reliable for development:

```json
"DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=B2BDatabase;Trusted_Connection=true;"
```

**This works with Visual Studio, .NET SDK, and most Windows development environments without additional installation.**