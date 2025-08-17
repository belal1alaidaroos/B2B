# API Testing Guide for B2B Backend

## 🚨 **Current Issues Being Debugged**

1. **POST /api/entity/notification/filter** → 400 (Bad Request)
2. **GET /api/entity/role** → 404 (Not Found) 
3. **GET /api/entity/job?sort=-created_date** → 404 (Not Found)

---

## 🧪 **Manual API Testing**

### **Test 1: Check Role Endpoint**
```bash
# Test basic role listing
curl -X GET "https://localhost:7160/api/entity/role" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -k

# Expected: { "success": true, "data": { "items": [...], "totalCount": 3 } }
# Should return admin, user, manager roles from seeding
```

### **Test 2: Check Job Endpoint**
```bash
# Test basic job listing
curl -X GET "https://localhost:7160/api/entity/job" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -k

# Test with sort parameter
curl -X GET "https://localhost:7160/api/entity/job?sort=-created_date" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -k

# Expected: { "success": true, "data": { "items": [], "totalCount": 0 } }
# Empty array if no jobs exist
```

### **Test 3: Check Notification Filter**
```bash
# Test notification filter endpoint
curl -X POST "https://localhost:7160/api/entity/notification/filter" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filters": [],
    "page": 1,
    "pageSize": 50,
    "sortBy": null,
    "sortDirection": "asc"
  }' \
  -k

# Expected: { "success": true, "data": { "items": [], "totalCount": 0 } }
```

---

## 🔍 **Debugging Steps**

### **Step 1: Get Authentication Token**
```bash
# Login first to get token
curl -X POST "https://localhost:7160/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@company.com", "password": "admin123"}' \
  -k

# Copy the token from response.data.data.token
```

### **Step 2: Test Each Problematic Endpoint**

**A. Test Role Endpoint (Should Work - roles are seeded)**
```bash
curl -X GET "https://localhost:7160/api/entity/role" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -k -v

# Look for:
# - HTTP status code (should be 200, not 404)
# - Response body structure
# - Any error messages in backend console
```

**B. Test Job Endpoint (Might be empty but shouldn't 404)**
```bash
curl -X GET "https://localhost:7160/api/entity/job" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -k -v
```

**C. Test Notification Filter (Check request format)**
```bash
curl -X POST "https://localhost:7160/api/entity/notification/filter" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filters":[],"page":1,"pageSize":50}' \
  -k -v
```

### **Step 3: Check Backend Console**

Watch backend console for:
- JWT authentication debug messages
- Entity controller debug output
- Any exception stack traces
- Database query logs

### **Step 4: Verify Database Contents**

```bash
cd B2BBackend
sqlite3 b2b_database.db "SELECT COUNT(*) FROM Roles;"
sqlite3 b2b_database.db "SELECT COUNT(*) FROM Jobs;"
sqlite3 b2b_database.db "SELECT COUNT(*) FROM Notifications;"

# Roles should have 3 entries
# Jobs and Notifications might be 0 (empty)
```

---

## 🔧 **Potential Issues & Solutions**

### **Issue 1: Authentication Problems**
**Symptom:** All requests return 401 Unauthorized
**Solution:** 
- Verify token is correctly formatted: `Bearer eyJhbGci...`
- Check token hasn't expired
- Verify JWT configuration matches between login and validation

### **Issue 2: Entity Type Not Found**
**Symptom:** 404 with "Entity type 'X' not found"
**Solution:**
- Check EntityController.GetDbSet() method
- Verify entity name is lowercase and matches exactly
- Check if entity exists in ApplicationDbContext

### **Issue 3: Empty Tables Causing Issues**
**Symptom:** 404 instead of empty array for empty tables
**Solution:**
- Add sample data seeding
- Fix backend to return empty arrays properly
- Check for null reference exceptions

### **Issue 4: Request Format Issues**
**Symptom:** 400 Bad Request for filter endpoints
**Solution:**
- Verify JSON request format matches FilterRequest model
- Check required fields are present
- Validate content-type header is application/json

---

## 📋 **Expected vs Actual Responses**

### **Successful Role Response (Expected):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "Id": "role_admin",
        "Name": "admin",
        "DisplayName": "Administrator",
        "Description": "Full system access"
      }
    ],
    "totalCount": 3,
    "page": 1,
    "pageSize": 50,
    "totalPages": 1
  }
}
```

### **Empty Job Response (Expected):**
```json
{
  "success": true,
  "data": {
    "items": [],
    "totalCount": 0,
    "page": 1,
    "pageSize": 50,
    "totalPages": 0
  }
}
```

### **Error Response (What we're getting):**
```json
{
  "success": false,
  "message": "Entity type 'job' not found"
}
```

---

## 🎯 **Action Plan**

1. **Test authentication** - Verify token is working
2. **Test individual endpoints** with curl commands above
3. **Check backend console** for detailed error messages  
4. **Verify database contents** - confirm what data exists
5. **Fix any identified issues** in EntityController or seeding

**Start with the role endpoint - it should definitely work since roles are seeded!**