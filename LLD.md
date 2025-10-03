# 📋 Low-Level Design (LLD) Document
## Gym Management System - Internship Project

**Project Name**: FitZone Gym Management System  

## 1. Introduction

This document describes the technical design and implementation details of the Gym Management System built using HTML, CSS, JavaScript, and Firebase.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────┐
│           CLIENT SIDE (Browser)                  │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │index.html│  │admin.html│  │member.   │      │
│  │(Login)   │  │          │  │html      │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
│  ┌─────────────────────────────────────┐        │
│  │        style.css (All Styles)       │        │
│  └─────────────────────────────────────┘        │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │admin.js  │  │member.js │  │user.js   │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
└──────────────────┬──────────────────────────────┘
                   │ Firebase SDK
                   ▼
┌─────────────────────────────────────────────────┐
│           FIREBASE (Backend)                     │
│                                                  │
│  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │  Firebase  │  │  Cloud     │  │ Firebase  │ │
│  │  Auth      │  │  Firestore │  │ Hosting   │ │
│  └────────────┘  └────────────┘  └───────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 3. File Structure

```
gym-management-system/
│
├── index.html          # Login page
├── admin.html          # Admin dashboard
├── member.html         # Member dashboard
├── user.html           # User search page
│
├── style.css           # All CSS styles
│
├── admin.js            # Admin functionality
├── member.js           # Member functionality
├── user.js             # User functionality
│
├── README.md           # Project documentation
└── PLAN.md             # Development plan
```

---

## 4. Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) |
| **Authentication** | Firebase Authentication |
| **Database** | Cloud Firestore (NoSQL) |
| **Hosting** | Firebase Hosting |
| **Version Control** | Git, GitHub |

---

## 5. Database Design

### 5.1 Collections Structure

#### Collection: `users`
```javascript
{
  userId: {
    email: "admin@gym.com",
    role: "admin",  // "admin" | "member" | "user"
    createdAt: Timestamp
  }
}
```

#### Collection: `members`
```javascript
{
  memberId: {
    name: "John Doe",
    email: "john@gym.com",
    phone: "9876543210",
    dateOfBirth: "1995-05-15",
    package: "Standard",  // "Basic" | "Standard" | "Premium"
    photo: "https://...",
    status: "active",  // "active" | "inactive"
    joinDate: Timestamp
  }
}
```

#### Collection: `bills`
```javascript
{
  billId: {
    memberId: "member123",
    package: "Standard",
    amount: 2000,
    dueDate: Timestamp,
    paidDate: Timestamp,  // optional
    status: "pending",  // "pending" | "paid" | "overdue"
    createdAt: Timestamp
  }
}
```

#### Collection: `notifications`
```javascript
{
  notificationId: {
    title: "Gym Closed Tomorrow",
    message: "The gym will be closed...",
    targetRole: "all",  // "all" | "active"
    isActive: true,
    createdAt: Timestamp
  }
}
```

#### Collection: `logs`
```javascript
{
  logId: {
    action: "MEMBER_ADDED",
    userId: "admin123",
    timestamp: Timestamp,
    details: {...}
  }
}
```

---

## 6. Key Functions & Logic

### 6.1 Authentication Flow

```javascript
// Login Process
1. User enters email, password, role
2. Validate credentials with Firebase Auth
3. Check user role in Firestore
4. Redirect to appropriate dashboard
5. Log the action

// Code Structure:
async function login(email, password, role) {
    // Sign in with Firebase
    const user = await signInWithEmailAndPassword(email, password);
    
    // Verify role
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.data().role !== role) {
        throw new Error('Invalid role');
    }
    
    // Redirect based on role
    if (role === 'admin') redirect('admin.html');
    if (role === 'member') redirect('member.html');
    if (role === 'user') redirect('user.html');
}
```

---

### 6.2 Add Member Function

```javascript
// Admin adds a member
async function addMember(memberData) {
    // Step 1: Generate password (FirstName@123)
    const firstName = memberData.name.split(' ')[0];
    const password = `${firstName}@123`;
    
    // Step 2: Create Firebase Auth account
    const authUser = await createAuthAccount(
        memberData.email, 
        password
    );
    
    // Step 3: Add user role document
    await setDoc(doc(db, 'users', authUser.uid), {
        email: memberData.email,
        role: 'member',
        createdAt: Timestamp.now()
    });
    
    // Step 4: Add member profile
    await addDoc(collection(db, 'members'), memberData);
    
    // Step 5: Show credentials to admin
    alert(`Login: ${memberData.email}\nPassword: ${password}`);
}
```

**Password Generation Logic:**
- Input: "John Doe"
- Split by space → ["John", "Doe"]
- Take first name → "John"
- Capitalize → "John"
- Add suffix → "John@123"

---

### 6.3 Search Members Function

```javascript
function searchMembers(allMembers, searchTerm) {
    // Convert search term to lowercase
    const term = searchTerm.toLowerCase().trim();
    
    // Filter members
    return allMembers.filter(member => {
        // Check if search term exists in:
        // - name
        // - email
        // - phone
        return member.name.toLowerCase().includes(term) ||
               member.email.toLowerCase().includes(term) ||
               member.phone.includes(term);
    });
}
```

**Example:**
- Search term: "john"
- Matches: "John Doe", "john@gym.com", "Johnny"

---

### 6.4 Create Bill Function

```javascript
async function createBill(billData) {
    // Create bill document
    const bill = {
        memberId: billData.memberId,
        package: billData.package,
        amount: billData.amount,  // Auto-filled based on package
        dueDate: Timestamp.fromDate(new Date(billData.dueDate)),
        status: 'pending',
        createdAt: Timestamp.now()
    };
    
    // Save to Firestore
    await addDoc(collection(db, 'bills'), bill);
}
```

**Package Pricing:**
- Basic: ₹1000/month
- Standard: ₹2000/month
- Premium: ₹3000/month

---

### 6.5 Download Receipt Function

```javascript
function downloadReceipt(billId) {
    const bill = getBillById(billId);
    const member = getMemberById(bill.memberId);
    
    // Generate receipt text
    const receipt = `
    ===================================
    FITZONE GYM - PAYMENT RECEIPT
    ===================================
    
    Receipt ID: ${billId}
    Date: ${new Date().toLocaleDateString()}
    
    Member: ${member.name}
    Email: ${member.email}
    
    Package: ${bill.package}
    Amount: ₹${bill.amount}
    Status: ${bill.status}
    
    Thank you!
    ===================================
    `;
    
    // Download as .txt file
    const blob = new Blob([receipt], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${billId}.txt`;
    a.click();
}
```

---

### 6.6 Export to CSV Function

```javascript
function exportToCSV(data, filename) {
    // Create CSV header
    let csv = 'Name,Email,Phone,Package,Status\n';
    
    // Add rows
    data.forEach(member => {
        csv += `"${member.name}","${member.email}","${member.phone}","${member.package}","${member.status}"\n`;
    });
    
    // Download file
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
}
```

---

## 7. User Roles & Permissions

| Feature | Admin | Member | User |
|---------|-------|--------|------|
| **Login** | ✅ | ✅ | ✅ |
| **View Dashboard** | ✅ | ✅ | ❌ |
| **Add Members** | ✅ | ❌ | ❌ |
| **Edit Members** | ✅ | ❌ | ❌ |
| **Delete Members** | ✅ | ❌ | ❌ |
| **Create Bills** | ✅ | ❌ | ❌ |
| **View Own Bills** | ✅ | ✅ | ❌ |
| **Download Receipt** | ✅ | ✅ | ❌ |
| **Send Notifications** | ✅ | ❌ | ❌ |
| **View Notifications** | ✅ | ✅ | ❌ |
| **Export Reports** | ✅ | ❌ | ❌ |
| **Search Members** | ✅ | ❌ | ✅ |
| **Create Users** | ✅ | ❌ | ❌ |

---

## 8. Security Implementation

### 8.1 Authentication Security
- Passwords stored securely by Firebase Auth
- Session management handled by Firebase
- Auto-logout on browser close

### 8.2 Role-based Access
```javascript
// Check if user has permission
async function checkPermission(userId, requiredRole) {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.data().role !== requiredRole) {
        // Redirect to login
        window.location.href = 'index.html';
    }
}
```

### 8.3 Input Validation
```javascript
// Validate email
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Validate phone (10 digits)
function validatePhone(phone) {
    const regex = /^\d{10}$/;
    return regex.test(phone);
}
```

### 8.4 Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Only authenticated users can read
    // Only admins can write
    match /members/{memberId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /bills/{billId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## 9. Error Handling

### 9.1 Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| **"Invalid credentials"** | Wrong email/password | Show user-friendly error message |
| **"Email already exists"** | Duplicate email during member creation | Check if email exists before creating |
| **"Permission denied"** | User doesn't have access | Redirect to login page |
| **"Network error"** | No internet connection | Show "Check your connection" message |

### 9.2 Error Handling Pattern
```javascript
try {
    // Attempt operation
    await performOperation();
    showToast('Success!', 'success');
    
} catch (error) {
    // Handle error
    console.error(error);
    showToast('Operation failed', 'error');
}
```

---

## 10. Responsive Design

### 10.1 Breakpoints
```css
/* Mobile: 320px - 767px */
@media (max-width: 767px) {
    .sidebar { width: 70px; }
    .stats-grid { grid-template-columns: 1fr; }
}

/* Tablet: 768px - 1023px */
@media (min-width: 768px) and (max-width: 1023px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
    .stats-grid { grid-template-columns: repeat(4, 1fr); }
}
```

---

## 11. Logging System

```javascript
// Log every action
async function logAction(action, details) {
    await addDoc(collection(db, 'logs'), {
        action: action,  // "LOGIN", "MEMBER_ADDED", etc.
        userId: currentUser.uid,
        timestamp: Timestamp.now(),
        details: details
    });
}

// Example usage:
logAction('MEMBER_ADDED', {
    memberEmail: 'john@gym.com',
    package: 'Standard'
});
```

---

## 12. Deployment Configuration

### 12.1 Firebase Hosting Setup
```bash
# Initialize Firebase
firebase init

# Deploy
firebase deploy
```

### 12.2 Firebase Configuration
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

---

## 13. Testing Approach

### 13.1 Manual Testing Checklist

**Login Testing:**
- [ ] Valid admin login works
- [ ] Valid member login works
- [ ] Valid user login works
- [ ] Invalid credentials show error
- [ ] Wrong role selection shows error

**Admin Testing:**
- [ ] Can add member successfully
- [ ] Member gets correct password (FirstName@123)
- [ ] Can edit member details
- [ ] Can delete member
- [ ] Can create bill for member
- [ ] Can mark bill as paid
- [ ] Can send notification
- [ ] Can export CSV reports

**Member Testing:**
- [ ] Can view profile
- [ ] Can see all bills
- [ ] Can download receipt
- [ ] Can view notifications

**User Testing:**
- [ ] Can search members
- [ ] Search returns correct results
- [ ] Can view packages

---

## 14. Performance Optimization

### 14.1 Optimization Techniques

1. **Lazy Loading**: Load data only when section is viewed
2. **Caching**: Store frequently accessed data in memory
3. **Minimize Firebase Reads**: Fetch data once and reuse
4. **Optimize Images**: Use external CDN URLs
5. **Code Splitting**: Separate JS files for each page

---

## 15. Future Enhancements

Possible improvements for future versions:

1. **Email Notifications**: Automatic email for fee reminders
2. **Payment Gateway**: Online payment integration
3. **Attendance System**: Track member check-ins
4. **Mobile App**: React Native version
5. **Analytics Dashboard**: Charts and graphs
6. **Workout Plans**: Custom exercise routines
7. **Diet Plans**: Nutrition tracking
8. **Supplement Store**: E-commerce integration

---

## 16. Conclusion

This Low-Level Design document provides a simple and clear overview of the Gym Management System implementation. The system uses Firebase as a Backend-as-a-Service (BaaS) solution, which simplifies development while maintaining security and scalability.

### Key Design Decisions:
✅ **Firebase BaaS**: No need to manage servers  
✅ **Role-based Access**: Secure and organized  
✅ **Simple File Structure**: Easy to understand and maintain  
✅ **Auto-generated Passwords**: Simplified onboarding  
✅ **CSV Export**: Easy data backup  

---

**File Name**: `LLD.md` or `Low_Level_Design.md`  
**Place in**: Project root folder  
**Last Updated**: October 2024  
**Author**: [Your Name]