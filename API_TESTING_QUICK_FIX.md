# API Testing Quick Fix Guide

## 🎯 **ISSUES RESOLVED**

### **✅ Database Creation - Automatic**
**You don't need to create the database manually!**
- Database creates automatically when you run `dotnet run`
- Migrations apply automatically
- Admin user and sample data are seeded automatically

### **✅ CORS/HTTPS Issues - Fixed**
- Added permissive CORS for development
- Disabled HTTPS redirection in development
- Supports Swagger, Postman, and other testing tools

---

## 🚀 **QUICK START GUIDE**

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
Now listening on: http://localhost:5097
```

**✅ Database is created automatically!**
**✅ Admin user is created automatically!**

### **Step 2: Test with Different URLs**

#### **Option A: HTTPS (Recommended)**
```bash
curl -X POST "https://localhost:7160/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@company.com", "password": "admin123"}' \
  -k
```

#### **Option B: HTTP (If HTTPS Issues)**
```bash
curl -X POST "http://localhost:5097/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@company.com", "password": "admin123"}'
```

### **Step 3: Expected Response**
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

---

## 🧪 **TESTING WITH DIFFERENT TOOLS**

### **Swagger UI Testing**

#### **Access Swagger:**
- **HTTPS**: https://localhost:7160/swagger
- **HTTP**: http://localhost:5097/swagger

#### **Test Login in Swagger:**
1. **Expand** "Auth" section
2. **Click** "POST /api/Auth/login"
3. **Click** "Try it out"
4. **Enter request body:**
   ```json
   {
     "email": "admin@company.com",
     "password": "admin123"
   }
   ```
5. **Click** "Execute"

### **Postman Testing**

#### **Create New Request:**
- **Method**: POST
- **URL**: `https://localhost:7160/api/Auth/login` OR `http://localhost:5097/api/Auth/login`
- **Headers**: `Content-Type: application/json`
- **Body (raw JSON)**:
  ```json
  {
    "email": "admin@company.com",
    "password": "admin123"
  }
  ```

#### **Postman HTTPS Settings:**
If using HTTPS, disable SSL verification:
1. **File** → **Settings**
2. **General** tab
3. **Turn off** "SSL certificate verification"

### **cURL Testing**

#### **HTTPS with Certificate Bypass:**
```bash
curl -X POST "https://localhost:7160/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@company.com", "password": "admin123"}' \
  -k
```

#### **HTTP (No Certificate Issues):**
```bash
curl -X POST "http://localhost:5097/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@company.com", "password": "admin123"}'
```

---

## 🔧 **TROUBLESHOOTING**

### **Issue: "Failed to fetch" in Browser/Swagger**

#### **Solution 1: Use HTTP Instead**
- **Try**: http://localhost:5097/swagger
- **Instead of**: https://localhost:7160/swagger

#### **Solution 2: Accept HTTPS Certificate**
1. **Visit**: https://localhost:7160 in your browser
2. **Click**: "Advanced" → "Proceed to localhost (unsafe)"
3. **Then try**: https://localhost:7160/swagger

### **Issue: "Database does not exist"**

#### **Solution: Just run the app!**
```bash
cd B2BBackend
dotnet run
```
**The database creates automatically - no manual creation needed!**

### **Issue: "Cannot connect to SQL Server"**

#### **Solution: Check connection string**
Your `appsettings.Development.json` should have:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=B2BDatabase_Dev;Trusted_Connection=true;"
  }
}
```

#### **Test LocalDB connection:**
```cmd
sqlcmd -S "(localdb)\MSSQLLocalDB" -E
```

### **Issue: CORS Errors**

#### **Already Fixed!** The backend now has permissive CORS for development.

---

## 📋 **COMPLETE TESTING CHECKLIST**

### **✅ Backend Setup:**
- [ ] `cd B2BBackend`
- [ ] `dotnet run`
- [ ] See "Database migrations applied successfully"
- [ ] See "Default admin user created"
- [ ] See "Now listening on: https://localhost:7160"

### **✅ API Testing:**
- [ ] **Swagger**: https://localhost:7160/swagger OR http://localhost:5097/swagger
- [ ] **Login Test**: POST to `/api/Auth/login` with admin credentials
- [ ] **Response**: Should return success with JWT token
- [ ] **Entity Test**: GET `/api/entity/role` (with Bearer token)

### **✅ Credentials:**
- **Email**: `admin@company.com`
- **Password**: `admin123`
- **Created automatically** - no manual setup needed!

---

## 🎯 **QUICK REFERENCE**

| Service | HTTPS URL | HTTP URL |
|---------|-----------|----------|
| **API** | https://localhost:7160 | http://localhost:5097 |
| **Swagger** | https://localhost:7160/swagger | http://localhost:5097/swagger |
| **Health Check** | https://localhost:7160/health | http://localhost:5097/health |

### **Test Commands:**
```bash
# Start backend
cd B2BBackend && dotnet run

# Test login (HTTPS)
curl -X POST "https://localhost:7160/api/Auth/login" -H "Content-Type: application/json" -d '{"email": "admin@company.com", "password": "admin123"}' -k

# Test login (HTTP)
curl -X POST "http://localhost:5097/api/Auth/login" -H "Content-Type: application/json" -d '{"email": "admin@company.com", "password": "admin123"}'

# Test health
curl https://localhost:7160/health -k
curl http://localhost:5097/health
```

---

## 🚨 **KEY POINTS**

1. **Database**: Creates automatically - don't create manually!
2. **Admin User**: Created automatically with password `admin123`
3. **CORS**: Fixed - works with all testing tools
4. **HTTPS**: Use `-k` flag with curl, or use HTTP endpoints
5. **URLs**: Both HTTPS (7160) and HTTP (5097) work

**Everything should work now! Try the HTTP endpoint if HTTPS gives issues.** 🎉