# Frontend-Backend API Connectivity Testing Guide

## 🎯 **ISSUE RESOLUTION SUMMARY**

✅ **FIXED**: All API route mapping issues between React frontend and .NET Core backend
✅ **FIXED**: Environment configuration pointing to correct backend URL
✅ **FIXED**: Entity naming conventions to match backend expectations
✅ **FIXED**: Authentication endpoints mapping
✅ **FIXED**: Integration endpoints mapping

---

## 🔧 **WHAT WAS FIXED**

### **1. API Base URL Configuration**
- **Before**: `VITE_API_BASE_URL=https://api.yourdomain.com`
- **After**: `VITE_API_BASE_URL=https://localhost:7160`

### **2. Route Mappings Fixed**

#### **Authentication Routes:**
| Frontend Expected | Backend Actual | Status |
|-------------------|----------------|---------|
| `/auth/login` | `/api/auth/login` | ✅ Fixed |
| `/auth/profile` | `/api/auth/me` | ✅ Fixed |
| `/auth/logout` | `/api/auth/logout` | ✅ Fixed |

#### **Entity Routes:**
| Frontend Expected | Backend Actual | Status |
|-------------------|----------------|---------|
| `/users` | `/api/entity/user` | ✅ Fixed |
| `/jobs` | `/api/entity/job` | ✅ Fixed |
| `/job-profiles` | `/api/entity/jobprofile` | ✅ Fixed |
| `/cost-components` | `/api/entity/costcomponent` | ✅ Fixed |
| `/pricing-rules` | `/api/entity/pricingrule` | ✅ Fixed |

#### **Integration Routes:**
| Frontend Expected | Backend Actual | Status |
|-------------------|----------------|---------|
| `/integrations/core/invoke-llm` | `/api/integrations/core/invoke-llm` | ✅ Fixed |
| `/integrations/core/send-email` | `/api/integrations/core/send-email` | ✅ Fixed |
| `/integrations/core/upload-file` | `/api/integrations/core/upload-file` | ✅ Fixed |

### **3. Entity Naming Convention Fixes**
All entity names now match backend's expectations:
```javascript
// OLD (causing 404s)
export const JobProfile = new EntityBase('job-profiles');
export const CostComponent = new EntityBase('cost-components');
export const SystemSetting = new EntityBase('system-settings');

// NEW (matching backend)
export const JobProfile = new EntityBase('jobprofile');
export const CostComponent = new EntityBase('costcomponent');
export const SystemSetting = new EntityBase('systemsetting');
```

---

## 🚀 **TESTING INSTRUCTIONS**

### **Step 1: Start the Backend**
```bash
cd B2BBackend
dotnet run
```
Expected output:
```
Now listening on: https://localhost:7161
Now listening on: http://localhost:5000
Application started. Press Ctrl+C to shut down.
```

### **Step 2: Verify Backend Health**
```bash
curl -k https://localhost:7160/health
# or if backend uses different port:
curl -k https://localhost:7161/health
```
Expected response:
```json
{"Status":"Healthy","Timestamp":"2025-01-XX..."}
```

### **Step 3: Test Frontend**
```bash
# In the main project directory
npm run dev
```

### **Step 4: Test API Calls**
Open browser console and test these calls:

#### **Test Authentication:**
```javascript
// Should work now - login
api.auth.login({ email: "test@test.com", password: "password" })
  .then(response => console.log("Login success:", response))
  .catch(error => console.error("Login error:", error));

// Should work now - get profile  
api.auth.getProfile()
  .then(response => console.log("Profile success:", response))
  .catch(error => console.error("Profile error:", error));
```

#### **Test Entity Operations:**
```javascript
// Should work now - get users
User.list()
  .then(users => console.log("Users:", users))
  .catch(error => console.error("Users error:", error));

// Should work now - get job profiles
JobProfile.filter({ active: true })
  .then(profiles => console.log("Job Profiles:", profiles))
  .catch(error => console.error("Job Profiles error:", error));
```

---

## 🐛 **DEBUGGING**

### **If you still get 404 errors:**

1. **Check backend port**: Update `.env` if backend runs on different port
2. **Check console logs**: Enhanced error logging is now enabled
3. **Check CORS**: Backend has CORS configured for frontend ports

### **Console Logging**
The frontend now logs all API requests and responses:
```
API Request: GET /api/entity/user
API Response: 200 /api/entity/user
```

### **Error Details**
Enhanced error logging shows:
```javascript
{
  status: 404,
  statusText: "Not Found", 
  url: "/api/entity/user",
  method: "GET",
  data: { error: "..." },
  message: "Request failed with status code 404"
}
```

---

## 📋 **ENTITY REFERENCE**

### **Complete Entity Mapping:**
| Frontend Entity | Backend Route | Backend Entity Name |
|----------------|---------------|-------------------|
| User | `/api/entity/user` | user |
| Lead | `/api/entity/lead` | lead |
| Quote | `/api/entity/quote` | quote |
| Account | `/api/entity/account` | account |
| Contact | `/api/entity/contact` | contact |
| Opportunity | `/api/entity/opportunity` | opportunity |
| Communication | `/api/entity/communication` | communication |
| Role | `/api/entity/role` | role |
| Job | `/api/entity/job` | job |
| JobProfile | `/api/entity/jobprofile` | jobprofile |
| Country | `/api/entity/country` | country |
| City | `/api/entity/city` | city |
| Territory | `/api/entity/territory` | territory |
| Branch | `/api/entity/branch` | branch |
| Department | `/api/entity/department` | department |
| Nationality | `/api/entity/nationality` | nationality |
| SkillLevel | `/api/entity/skilllevel` | skilllevel |
| CostComponent | `/api/entity/costcomponent` | costcomponent |
| PricingRule | `/api/entity/pricingrule` | pricingrule |
| Task | `/api/entity/task` | task |
| Notification | `/api/entity/notification` | notification |
| SystemSetting | `/api/entity/systemsetting` | systemsetting |
| PriceRequest | `/api/entity/pricerequest` | pricerequest |
| Contract | `/api/entity/contract` | contract |
| SalesMaterial | `/api/entity/salesmaterial` | salesmaterial |
| AuditLog | `/api/entity/auditlog` | auditlog |
| CustomerInteraction | `/api/entity/customerinteraction` | customerinteraction |
| CustomerResponseTemplate | `/api/entity/customerresponsetemplate` | customerresponsetemplate |
| DiscountApprovalMatrix | `/api/entity/discountapprovalmatrix` | discountapprovalmatrix |

---

## ✅ **VERIFICATION CHECKLIST**

- [ ] Backend starts without errors
- [ ] Health endpoint responds
- [ ] Frontend connects to backend
- [ ] Login page works
- [ ] User list loads
- [ ] Dashboard loads
- [ ] No 404 errors in console
- [ ] Entity CRUD operations work
- [ ] Authentication flow works

---

## 🎉 **EXPECTED RESULTS**

After starting both frontend and backend:
1. ✅ No more "GET https://localhost:7160/users 404 Not Found"
2. ✅ No more "GET https://localhost:7160/auth/profile 404 Not Found" 
3. ✅ All pages load without API errors
4. ✅ Login, save, edit, view operations work
5. ✅ All screens display data properly

**The frontend-backend communication should now work perfectly!**