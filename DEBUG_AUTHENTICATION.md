# Authentication Debugging Guide

## 🚨 **ISSUE: Login Still Failing**

**Your curl request:**
```bash
curl -X 'POST' 'https://localhost:7160/api/Auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email": "admin@company.com", "password": "admin123!"}'
```

**Response:**
```json
{"success": false, "message": "Invalid email or password"}
```

---

## 🔍 **POTENTIAL ISSUES**

### **1. Password Typo (Most Likely)**
**Problem:** You used `admin123!` but the password is `admin123`

**Try this exact command:**
```bash
curl -X 'POST' 'https://localhost:7160/api/Auth/login' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "email": "admin@company.com",
  "password": "admin123"
}'
```

### **2. Admin User Not Created**
**Check backend console when starting:**
Look for these messages:
```
✅ GOOD: "Default admin user created: admin@company.com / admin123"
❌ BAD:  "Admin user already exists" (with wrong password hash)
❌ BAD:  No message about user creation
```

### **3. Old Database with Wrong Password Hash**
If you see "Admin user already exists", the old user has wrong password hash.

---

## 🔧 **DEBUGGING STEPS**

### **Step 1: Check Backend Console Output**

**When you run `dotnet run`, you should see:**
```
info: Program[0] Database ensured created
info: Program[0] Creating default admin user...          ← Should see this
info: Program[0] Default admin user created: admin@company.com / admin123  ← Should see this
info: Microsoft.Hosting.Lifetime[14] Now listening on: https://localhost:7161
```

**If you see:** `"Admin user already exists"` **instead**, then:
1. Stop the backend
2. Reset database: `./reset-database.sh` or `.\reset-database.ps1`
3. Start backend again
4. Should now see "Creating default admin user..."

### **Step 2: Verify Database Reset Worked**

**Check if database files were deleted:**
```bash
cd B2BBackend
ls -la *.db*
# Should show new database with recent timestamp after reset
```

### **Step 3: Test with Correct Password**

**Exact curl command (no exclamation mark):**
```bash
curl -X 'POST' 'https://localhost:7160/api/Auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email": "admin@company.com", "password": "admin123"}' \
  -k
```

### **Step 4: Test with Frontend**

1. Go to: `http://localhost:5173/?page=AuthTest`
2. Click "Use Default Credentials"
3. Click "Login"
4. Check browser console for detailed error messages

---

## 🐛 **ENHANCED DEBUGGING**

If the correct password still doesn't work, let's add debug logging:

### **Add Debug Logging to AuthService**

**Edit `B2BBackend/Services/ServiceImplementations.cs`:**

Find the `AuthenticateAsync` method and add logging:

```csharp
public async Task<string> AuthenticateAsync(string email, string password)
{
    Console.WriteLine($"[DEBUG] Login attempt - Email: {email}, Password length: {password?.Length}");
    
    var user = await _userService.GetByEmailAsync(email);
    Console.WriteLine($"[DEBUG] User found: {user != null}, Status: {user?.Status}");
    
    if (user == null)
    {
        Console.WriteLine("[DEBUG] User not found in database");
        throw new UnauthorizedAccessException("Invalid email or password");
    }
    
    var passwordValid = await _userService.VerifyPasswordAsync(user, password);
    Console.WriteLine($"[DEBUG] Password verification: {passwordValid}");
    Console.WriteLine($"[DEBUG] Stored hash: {user.PasswordHash?.Substring(0, 20)}...");
    
    if (!passwordValid)
    {
        Console.WriteLine("[DEBUG] Password verification failed");
        throw new UnauthorizedAccessException("Invalid email or password");
    }
    
    if (user.Status != "active")
    {
        Console.WriteLine($"[DEBUG] User status not active: {user.Status}");
        throw new UnauthorizedAccessException("Account is not active");
    }

    // Update last login
    user.LastLogin = DateTime.UtcNow;
    user.FailedLoginAttempts = 0;
    await _context.SaveChangesAsync();

    return GenerateJwtToken(user);
}
```

### **Manual Database Check**

**Check if user exists in database:**
```bash
cd B2BBackend
sqlite3 b2b_database.db "SELECT Id, Email, Status, PasswordHash FROM Users WHERE Email = 'admin@company.com';"
```

**Expected output:**
```
user_admin|admin@company.com|active|$2a$11$...
```

---

## 🎯 **MOST LIKELY SOLUTIONS**

### **Solution 1: Use Correct Password**
```bash
# Remove the exclamation mark!
curl -X 'POST' 'https://localhost:7160/api/Auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email": "admin@company.com", "password": "admin123"}'
```

### **Solution 2: Fresh Database Reset**
```bash
cd B2BBackend
./reset-database.sh  # or .\reset-database.ps1 on Windows
dotnet run
# Look for "Creating default admin user..." message
```

### **Solution 3: Verify Database Creation**
```bash
# Check if new database was created
ls -la B2BBackend/*.db
# Should show recent timestamp

# Check if admin user exists
sqlite3 B2BBackend/b2b_database.db "SELECT * FROM Users;"
```

---

## 📋 **VERIFICATION CHECKLIST**

- [ ] ✅ Used `admin123` (not `admin123!`)
- [ ] ✅ Saw "Creating default admin user..." in console
- [ ] ✅ Database files have recent timestamp
- [ ] ✅ Backend shows no errors on startup
- [ ] ✅ Swagger login test works
- [ ] ✅ Frontend AuthTest page works

---

## 🚨 **IF STILL FAILING**

If none of the above work:

1. **Show me the exact backend console output** when starting
2. **Check database contents** with sqlite3 command
3. **Try Swagger UI test** at `https://localhost:7160`
4. **Add debug logging** to see exactly what's happening

**Most likely it's just the password typo (`admin123!` vs `admin123`), but if not, we can debug further!** 🔍