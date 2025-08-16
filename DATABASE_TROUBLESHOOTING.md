# Database Authentication Issue - Troubleshooting Guide

## 🚨 **ISSUE IDENTIFIED**

**Problem**: All authentication fails with "Invalid email or password" even with correct credentials
**Root Cause**: Database seeding and password hashing issues
**Status**: 🔧 **FIXING**

---

## 🔍 **PROBLEM ANALYSIS**

### **Issues Found:**

1. **Missing Configuration**: No database connection string in appsettings.json
2. **Hardcoded Password Hash**: Seeded admin user has hardcoded BCrypt hash that may not match "admin123"
3. **Database State**: Existing database may have corrupted or incorrect seed data
4. **Initialization**: Database seeding in ApplicationDbContext.cs may not work properly with Entity Framework

---

## 🔧 **FIXES IMPLEMENTED**

### **1. Added Proper Configuration**

**appsettings.json** and **appsettings.Development.json** now include:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=b2b_database.db"
  },
  "Jwt": {
    "Key": "your-super-secret-jwt-key-change-this-in-production-123456789",
    "Issuer": "B2BBackend",
    "Audience": "B2BFrontend"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  }
}
```

### **2. Enhanced Database Initialization**

Updated **Program.cs** with proper database initialization:
- Uses `userService.CreateAsync()` which properly hashes passwords with BCrypt
- Checks if admin user exists before creating
- Better error logging
- Async initialization

### **3. Database Reset Scripts**

Created reset scripts for clean database recreation:
- **reset-database.sh** (Linux/Mac)
- **reset-database.ps1** (Windows PowerShell)

---

## 🚀 **SOLUTION STEPS**

### **Step 1: Reset Database (Recommended)**

Choose your platform:

**Linux/Mac:**
```bash
cd B2BBackend
./reset-database.sh
```

**Windows PowerShell:**
```powershell
cd B2BBackend
.\reset-database.ps1
```

**Manual:**
```bash
cd B2BBackend
rm -f b2b_database.db b2b_database.db-shm b2b_database.db-wal
```

### **Step 2: Start Backend with Fresh Database**

```bash
cd B2BBackend
dotnet run
```

**Expected Output:**
```
info: Program[0]
      Database ensured created
info: Program[0]
      Creating default admin user...
info: Program[0]
      Default admin user created: admin@company.com / admin123
```

### **Step 3: Test Authentication**

**Using Swagger (Recommended):**
1. Navigate to `https://localhost:7160` (Swagger UI)
2. Find `/api/Auth/login` endpoint
3. Click "Try it out"
4. Use credentials:
   ```json
   {
     "email": "admin@company.com",
     "password": "admin123"
   }
   ```
5. Should return 200 OK with token

**Using Frontend AuthTest Page:**
1. Navigate to `http://localhost:5173/?page=AuthTest`
2. Click "Use Default Credentials"
3. Click "Login"
4. Should see token and user profile

**Using cURL:**
```bash
curl -X POST "https://localhost:7160/api/Auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@company.com","password":"admin123"}' \
     -k
```

---

## 🔍 **VERIFICATION CHECKLIST**

### **Backend Verification:**
- [ ] ✅ Database file created: `b2b_database.db`
- [ ] ✅ Admin user creation logged in console
- [ ] ✅ Swagger login endpoint returns 200 OK
- [ ] ✅ JWT token generated and returned
- [ ] ✅ `/api/auth/me` works with token

### **Frontend Verification:**
- [ ] ✅ AuthTest page login successful
- [ ] ✅ Token stored in localStorage
- [ ] ✅ User profile loaded
- [ ] ✅ API test call succeeds (not 401)

### **End-to-End Verification:**
- [ ] ✅ Login on frontend
- [ ] ✅ Navigate to `/Users` page
- [ ] ✅ User list loads (no 401 errors)
- [ ] ✅ All pages work without authentication errors

---

## 🐛 **DEBUGGING STEPS**

### **If Database Reset Fails:**

1. **Stop all backend processes:**
   ```bash
   # Find and kill dotnet processes
   ps aux | grep dotnet
   kill <process_id>
   ```

2. **Manual file cleanup:**
   ```bash
   cd B2BBackend
   ls -la *.db*
   rm -f b2b_database.db*
   ```

3. **Check file permissions:**
   ```bash
   ls -la
   # Make sure you have write permissions in the directory
   ```

### **If Admin User Creation Fails:**

1. **Check logs carefully:**
   Look for error messages in the console output when running `dotnet run`

2. **Verify User Service:**
   ```bash
   # Check if UserService is properly registered
   grep -r "AddScoped.*UserService" .
   ```

3. **Manual user verification:**
   ```bash
   # Check if user was created (SQLite command)
   sqlite3 b2b_database.db "SELECT * FROM Users WHERE Email = 'admin@company.com';"
   ```

### **If Password Verification Fails:**

1. **Check BCrypt implementation:**
   - Verify BCrypt.Net package is installed
   - Check VerifyPasswordAsync method

2. **Test password hash manually:**
   ```csharp
   // In a test console app
   var hash = BCrypt.Net.BCrypt.HashPassword("admin123");
   var verify = BCrypt.Net.BCrypt.Verify("admin123", hash);
   Console.WriteLine($"Hash: {hash}");
   Console.WriteLine($"Verify: {verify}");
   ```

---

## 📋 **EXPECTED DATABASE STRUCTURE**

After successful initialization, the database should contain:

### **Users Table:**
```sql
SELECT * FROM Users WHERE Email = 'admin@company.com';
```
**Expected Result:**
- Id: user_admin
- Email: admin@company.com
- FullName: System Administrator
- Status: active
- PasswordHash: (BCrypt hash starting with $2a$)
- Roles: ["role_admin"]

### **Roles Table:**
```sql
SELECT * FROM Roles WHERE Name = 'admin';
```
**Expected Result:**
- Id: role_admin
- Name: admin
- DisplayName: Administrator
- Permissions: ["*"]

---

## 🚨 **COMMON ISSUES**

### **Issue: "Database is locked"**
**Solution:**
```bash
# Stop all processes using the database
fuser b2b_database.db  # Linux
# Kill processes and retry
```

### **Issue: "BCrypt.Net not found"**
**Solution:**
```bash
dotnet add package BCrypt.Net-Next
```

### **Issue: "User already exists but login fails"**
**Solution:**
```bash
# Reset and recreate - password hash is probably wrong
./reset-database.sh
dotnet run
```

### **Issue: "JWT token invalid"**
**Solution:**
- Check JWT configuration in appsettings.json
- Verify all three values: Key, Issuer, Audience
- Ensure frontend and backend use same values

---

## 🎯 **SUCCESS INDICATORS**

**Console Output (Backend):**
```
info: Program[0] Database ensured created
info: Program[0] Creating default admin user...
info: Program[0] Default admin user created: admin@company.com / admin123
info: Microsoft.Hosting.Lifetime[14] Now listening on: https://localhost:7161
info: Microsoft.Hosting.Lifetime[0] Application started.
```

**Swagger Test Result:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "Id": "user_admin",
      "Email": "admin@company.com",
      "FullName": "System Administrator"
    }
  }
}
```

**Frontend AuthTest Result:**
- ✅ "Login successful!" in console
- ✅ Token displayed in UI
- ✅ User profile JSON shown
- ✅ "Test API Call" returns user count

---

## 🚀 **NEXT STEPS AFTER FIX**

1. **Change Default Password:**
   ```bash
   # Use the change password endpoint or update directly
   ```

2. **Create Additional Users:**
   ```bash
   # Use the user management interface
   ```

3. **Configure Production Database:**
   ```bash
   # Update connection string for production environment
   ```

4. **Enable Azure Entra ID:**
   ```bash
   # Integrate with organizational directory
   ```

**This should resolve all authentication issues! The database will be properly initialized with correct password hashing.** 🎉