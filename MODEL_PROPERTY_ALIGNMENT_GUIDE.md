# Model Property Alignment Guide

## 🚨 **ISSUE SUMMARY**

**Problem**: CS0117 compilation errors due to mismatched properties between:
- Database seeding code expecting properties that don't exist
- Frontend code referencing properties that don't exist in backend models
- Inconsistent property naming across the application

**Root Cause**: The codebase references properties that were either renamed, removed, or never existed in the actual model definitions.

---

## ✅ **FIXED COMPILATION ERRORS**

### **Database Seeding Fixes Applied:**

#### **JobProfile Model**
```diff
// BEFORE (causing CS0117 errors)
- Title = "Software Developer"           // ❌ Property doesn't exist
- Department = "IT"                      // ❌ Property doesn't exist  
- Level = "Mid-Level"                    // ❌ Property doesn't exist

// AFTER (using actual properties)
+ Name = "Software Developer"            // ✅ Actual property
+ Category = "IT"                        // ✅ Actual property
+ SkillLevel = "Mid-Level"              // ✅ Actual property
+ BaseRate = 8000                       // ✅ Actual property
+ Currency = "AED"                      // ✅ Actual property
+ RateType = "monthly"                  // ✅ Actual property
```

#### **Job Model**
```diff
// BEFORE (causing CS0117 errors)
- JobProfileId = "jp_software_dev"       // ❌ Property doesn't exist
- Priority = "high"                      // ❌ Property doesn't exist
- Location = "Dubai, UAE"               // ❌ Property doesn't exist

// AFTER (using actual properties)
+ Code = "DEV-001"                      // ✅ Actual property
+ Category = "Software Development"     // ✅ Actual property
+ BaseSalary = 8000                     // ✅ Actual property
+ MinSalary = 7000                      // ✅ Actual property
+ MaxSalary = 10000                     // ✅ Actual property
+ Requirements = "3+ years experience"   // ✅ Actual property
+ ExperienceYears = 3                   // ✅ Actual property
+ Skills = "[\"C#\", \".NET\"]"        // ✅ Actual property
```

---

## 🔍 **REMAINING FRONTEND ISSUES**

### **Frontend Code Still Using Non-Existent Properties:**

#### **1. PricingEngine.jsx Issues**
```javascript
// ❌ PROBLEMATIC CODE:
selectedJob.job_profile_id    // Property doesn't exist
selectedJob.job_id           // Property doesn't exist  
selectedJob.job_title        // Property doesn't exist
selectedJob.base_cost        // Property doesn't exist
selectedJob.skill_level_id   // Property doesn't exist

// ✅ SHOULD BE (based on actual Job model):
selectedJob.Id               // Actual property
selectedJob.Title            // Actual property
selectedJob.Category         // Actual property
selectedJob.BaseSalary       // Actual property
selectedJob.Department       // Actual property
```

#### **2. Tasks.jsx Issues**
```javascript
// ❌ PROBLEMATIC CODE:
task.title                   // Might not exist
task.priority               // Might not exist

// ✅ CHECK: Verify Task model has these properties
```

#### **3. UserDetail.jsx Issues**
```javascript
// ❌ PROBLEMATIC CODE:
userData.department         // Check if User model has this
userData.job_title         // Check if User model has this

// ✅ VERIFY: Against actual User model properties
```

---

## 🛠️ **SYSTEMATIC FIX PROCESS**

### **Step 1: Identify All Entity Models**

**Location**: `B2BBackend/Models/AllModels.cs`

**Command to list all models:**
```bash
grep -n "public class.*: BaseEntity" B2BBackend/Models/AllModels.cs
```

### **Step 2: Document Actual Properties**

For each model, document the actual properties:

#### **Job Model (Verified)**
```csharp
public class Job : BaseEntity
{
    public string Title { get; set; }           // ✅ Available
    public string? Description { get; set; }    // ✅ Available
    public string? Code { get; set; }           // ✅ Available
    public string? Category { get; set; }       // ✅ Available
    public string? Department { get; set; }     // ✅ Available
    public string Status { get; set; }          // ✅ Available
    public decimal? BaseSalary { get; set; }    // ✅ Available
    public decimal? MinSalary { get; set; }     // ✅ Available
    public decimal? MaxSalary { get; set; }     // ✅ Available
    public string? Currency { get; set; }       // ✅ Available
    public string? Requirements { get; set; }   // ✅ Available
    public string? Benefits { get; set; }       // ✅ Available
    public int? ExperienceYears { get; set; }   // ✅ Available
    public string? EducationLevel { get; set; } // ✅ Available
    public string? Skills { get; set; }         // ✅ Available (JSON)
    public bool IsActive { get; set; }          // ✅ Available
    
    // ❌ NOT AVAILABLE:
    // JobProfileId, Priority, Location, job_id, job_title, base_cost
}
```

#### **JobProfile Model (Verified)**
```csharp
public class JobProfile : BaseEntity
{
    public string Name { get; set; }              // ✅ Available
    public string? Description { get; set; }      // ✅ Available
    public string? JobId { get; set; }            // ✅ Available
    public string? Category { get; set; }         // ✅ Available
    public string? SkillLevel { get; set; }       // ✅ Available
    public decimal BaseRate { get; set; }         // ✅ Available
    public string Currency { get; set; }          // ✅ Available
    public string RateType { get; set; }          // ✅ Available
    public decimal? MinRate { get; set; }         // ✅ Available
    public decimal? MaxRate { get; set; }         // ✅ Available
    public string? RequiredSkills { get; set; }   // ✅ Available (JSON)
    public string? OptionalSkills { get; set; }   // ✅ Available (JSON)
    public int? MinExperience { get; set; }       // ✅ Available
    public int? MaxExperience { get; set; }       // ✅ Available
    public string? EducationRequirements { get; set; } // ✅ Available
    public string? Certifications { get; set; }   // ✅ Available (JSON)
    public bool IsActive { get; set; }            // ✅ Available
    public string? Notes { get; set; }            // ✅ Available
    
    // ❌ NOT AVAILABLE:
    // Title, Department, Level
}
```

### **Step 3: Audit Frontend Usage**

**Find all property references:**
```bash
# Search for potentially problematic property usage
grep -r "\.job_profile_id\|\.job_id\|\.job_title\|\.base_cost" src/
grep -r "\.title\|\.department\|\.level\|\.priority\|\.location" src/pages/
grep -r "selectedJob\." src/
grep -r "userData\." src/
```

### **Step 4: Create Property Mapping**

| Frontend Expected | Backend Actual | Action Required |
|------------------|----------------|-----------------|
| `job.job_profile_id` | ❌ Not available | Remove or replace logic |
| `job.job_id` | ❌ Not available | Remove or replace logic |
| `job.job_title` | `job.Title` | Update property name |
| `job.base_cost` | `job.BaseSalary` | Update property name |
| `jobProfile.title` | `jobProfile.Name` | Update property name |
| `jobProfile.department` | `jobProfile.Category` | Update property name |
| `jobProfile.level` | `jobProfile.SkillLevel` | Update property name |

---

## 🔧 **FIXING FRONTEND CODE**

### **Example Fix: PricingEngine.jsx**

#### **Before (Broken):**
```javascript
// ❌ Using non-existent properties
line_item: {
  job_profile_id: selectedJob.id,           // ❌ Wrong property
  job_id: selectedJob.job_id,               // ❌ Doesn't exist
  job_title: selectedJob.job_title,         // ❌ Wrong property  
},
base_cost: selectedJob.base_cost            // ❌ Wrong property
```

#### **After (Fixed):**
```javascript
// ✅ Using actual properties
line_item: {
  job_profile_id: selectedJob.Id,           // ✅ Use actual Id
  job_code: selectedJob.Code,               // ✅ Use Code instead
  job_title: selectedJob.Title,             // ✅ Correct property
},
base_cost: selectedJob.BaseSalary           // ✅ Correct property
```

### **Example Fix: Task/Notification Properties**

**First verify what properties exist:**
```bash
# Check Task model properties
grep -A 20 "public class Task" B2BBackend/Models/AllModels.cs

# Check Notification model properties  
grep -A 20 "public class Notification" B2BBackend/Models/AllModels.cs
```

**Then update frontend accordingly.**

---

## 🧪 **TESTING STRATEGY**

### **1. Backend Compilation Test**
```bash
cd B2BBackend
dotnet build
# Should compile without CS0117 errors
```

### **2. Database Reset & Seeding Test**
```bash
cd B2BBackend
./reset-database.sh
dotnet run
# Should start without seeding errors
```

### **3. Frontend API Test**
```bash
# Test entity endpoints return proper data structure
curl -X GET "https://localhost:7160/api/entity/job" \
  -H "Authorization: Bearer TOKEN" | jq

curl -X GET "https://localhost:7160/api/entity/jobprofile" \
  -H "Authorization: Bearer TOKEN" | jq
```

### **4. Frontend Console Test**
- Start frontend: `npm run dev`
- Open browser console
- Check for property access errors
- Test pages that use Job/JobProfile data

---

## 📋 **COMPLETE AUDIT CHECKLIST**

### **Models to Verify:**
- [ ] Job ✅ (Fixed)
- [ ] JobProfile ✅ (Fixed)  
- [ ] Task ⚠️ (Check frontend usage)
- [ ] User ⚠️ (Check frontend usage)
- [ ] Lead ⚠️ (Check frontend usage)
- [ ] Quote ⚠️ (Check frontend usage)
- [ ] Account ⚠️ (Check frontend usage)
- [ ] Contact ⚠️ (Check frontend usage)
- [ ] Notification ⚠️ (Check frontend usage)
- [ ] Role ✅ (Verified)
- [ ] Country ✅ (Verified)
- [ ] SystemSetting ✅ (Verified)

### **Frontend Files to Review:**
- [ ] `src/pages/PricingEngine.jsx` ⚠️ (Multiple issues found)
- [ ] `src/pages/Tasks.jsx` ⚠️ (Property usage found)
- [ ] `src/pages/UserDetail.jsx` ⚠️ (Property usage found)
- [ ] `src/pages/Jobs.jsx` ⚠️ (Likely issues)
- [ ] `src/pages/Roles.jsx` ✅ (Uses correct Priority)
- [ ] `src/pages/Notifications.jsx` ⚠️ (Uses .title)

---

## 🎯 **IMMEDIATE ACTION PLAN**

1. **✅ COMPLETED**: Fix database seeding CS0117 errors
2. **🔄 IN PROGRESS**: Document all model properties  
3. **📋 TODO**: Audit frontend property usage systematically
4. **📋 TODO**: Create property mapping for each entity
5. **📋 TODO**: Update frontend code to use correct properties
6. **📋 TODO**: Test all entity CRUD operations
7. **📋 TODO**: Verify all pages load without console errors

**Priority Order:**
1. PricingEngine.jsx (most critical - business logic)
2. Jobs.jsx (likely many issues)
3. Tasks.jsx (task management)
4. UserDetail.jsx (user management)
5. Other entity pages

---

## 🚨 **CRITICAL NOTES**

- **Database Reset Required**: New seeding data needs fresh database
- **Backup Strategy**: Test changes on development environment first
- **API Response Format**: Remember frontend expects arrays, backend returns `{ success: true, data: { items: [...] } }`
- **Property Naming**: Backend uses PascalCase, frontend might expect snake_case or camelCase

**This is a systematic issue affecting multiple parts of the application. Fix methodically to avoid breaking existing functionality.**