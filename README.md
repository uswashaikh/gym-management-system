# 🏋️ FitZone Gym Management System

A comprehensive web-based gym management system built with HTML, CSS, JavaScript, and Firebase. This system digitizes gym operations by managing members, billing, notifications, and user accounts.

![Gym Management System](https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=400&fit=crop)

## 📋 Table of Contents

- [Problem Statement](#problem-statement)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [User Roles & Access](#user-roles--access)
- [Usage Guide](#usage-guide)
- [Screenshots](#screenshots)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Problem Statement

Traditional gyms face several challenges:

- **Paper Receipts**: Difficult to maintain and easy to lose
- **Manual Communication**: Time-consuming to notify members about schedule changes
- **Record Management**: Hard to track member information and payment history
- **Accessibility**: Members cannot access their billing information easily

**Solution**: A digital gym management system that provides:
- Digital receipt storage and generation
- Automated notification system
- Centralized member database
- Role-based access for admins, members, and users

---

## ✨ Features

### 👨‍💼 Admin Features
- ✅ **Dashboard** with real-time statistics (total members, active members, bills)
- ✅ **Member Management**: Add, edit, delete members with photo support
- ✅ **Auto-Generated Login**: Members get automatic login credentials (FirstName@123)
- ✅ **Billing System**: Create bills, assign packages, mark as paid/unpaid
- ✅ **Digital Receipts**: Generate and download receipts
- ✅ **Notifications**: Send announcements to all members
- ✅ **Reports Export**: Export members and bills to CSV
- ✅ **User Account Management**: Create user accounts for read-only access
- ✅ **Search Functionality**: Quick search across members
- ✅ **Activity Logging**: All actions are logged for audit trail

### 👤 Member Features
- ✅ **Personal Profile**: View profile with photo and details
- ✅ **Package Information**: See current membership package and benefits
- ✅ **Billing History**: View all bills in timeline format
- ✅ **Receipt Download**: Download payment receipts as text files
- ✅ **Notifications**: View gym announcements and updates
- ✅ **Status Tracking**: Monitor membership status (active/inactive)

### 🔍 User Features
- ✅ **Member Search**: Search members by name, email, or phone
- ✅ **Package Viewing**: Browse all membership packages with pricing
- ✅ **Gym Information**: Access general gym information
- ✅ **Read-Only Access**: Safe browsing without modification rights

---

## 🛠️ Technology Stack

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with gradients, animations, glassmorphism
- **JavaScript (ES6+)**: Vanilla JS with modules

### Backend & Database
- **Firebase Authentication**: User authentication and management
- **Cloud Firestore**: NoSQL database for real-time data
- **Firebase Hosting**: Static web hosting

### Design
- **Google Fonts**: Poppins, Inter
- **Font Awesome**: Icons
- **Responsive Design**: Mobile-first approach

---

## 📁 Project Structure

```
gym-management-system/
├── index.html              # Login page
├── admin.html              # Admin dashboard
├── member.html             # Member dashboard
├── user.html               # User/public view
├── style.css               # Global styles
├── admin.js                # Admin functionality
├── member.js               # Member functionality
├── user.js                 # User functionality
├── PLAN.md                 # Project roadmap
└── README.md               # Documentation (this file)
```

---

## 🚀 Installation & Setup

### Prerequisites
- A Google account for Firebase
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Text editor (VS Code recommended)

### Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/gym-management-system.git
cd gym-management-system
```

### Step 2: Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add Project"
   - Enter project name: `gym-management-system`
   - Disable Google Analytics (optional)
   - Click "Create Project"

2. **Enable Authentication**
   - Navigate to Authentication → Sign-in method
   - Enable "Email/Password"
   - Click "Save"

3. **Create Firestore Database**
   - Navigate to Firestore Database
   - Click "Create database"
   - Select "Start in test mode"
   - Choose your region
   - Click "Enable"

4. **Get Firebase Configuration**
   - Go to Project Settings (⚙️ icon)
   - Scroll to "Your apps"
   - Click web icon (`</>`)
   - Register app name: `gym-app`
   - Copy the configuration object

5. **Update Firebase Config**
   - Open `admin.js`, `member.js`, `user.js`
   - Replace the `firebaseConfig` object with your config:
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_AUTH_DOMAIN",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_STORAGE_BUCKET",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID"
   };
   ```

### Step 3: Create Admin Account

1. Go to Firebase Console → Authentication
2. Click "Add user"
3. Create admin account:
   - Email: `admin@gym.com`
   - Password: `Admin@123`
4. Copy the User UID

5. Go to Firestore Database → Start collection
6. Collection ID: `users`
7. Add document:
   - Document ID: (paste the UID)
   - Fields:
     ```
     email: admin@gym.com
     role: admin
     createdAt: (timestamp)
     ```

### Step 4: Update Firestore Rules (For Testing)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

### Step 5: Run the Project

- Simply open `index.html` in your browser
- Or use a local server:
  ```bash
  # Python
  python -m http.server 8000
  
  # Node.js
  npx http-server
  ```

---

## 👥 User Roles & Access

### 1. Admin
- **Email**: admin@gym.com
- **Password**: Admin@123
- **Access**: Full system control
- **Capabilities**:
  - Manage members
  - Create bills
  - Send notifications
  - Export reports
  - Create user accounts

### 2. Member
- **Email**: Auto-generated when admin adds member
- **Password**: FirstName@123 (e.g., John@123)
- **Access**: Personal portal
- **Capabilities**:
  - View profile
  - View bills
  - Download receipts
  - View notifications

### 3. User
- **Email**: Auto-generated when admin creates user
- **Password**: FirstName@123
- **Access**: Read-only
- **Capabilities**:
  - Search members
  - View packages
  - Browse gym info

---

## 📖 Usage Guide

### For Admin

#### Adding a Member
1. Login as admin
2. Navigate to "Members"
3. Click "Add Member"
4. Fill in the form:
   - Name, Email, Phone, Package
   - Photo URL (optional)
5. Click "Save Member"
6. **Note the auto-generated password** from the alert
7. Share credentials with the member

#### Creating a Bill
1. Navigate to "Billing"
2. Click "Create Bill"
3. Select member from dropdown
4. Choose package (amount auto-fills)
5. Set due date
6. Click "Create Bill"

#### Sending Notifications
1. Navigate to "Notifications"
2. Enter title and message
3. Select target audience
4. Click "Send Notification"

### For Members

#### Viewing Bills
1. Login with provided credentials
2. Navigate to "My Bills"
3. View all bills in timeline format
4. Click "Download Receipt" for any bill

### For Users

#### Searching Members
1. Login with provided credentials
2. Enter name, email, or phone in search box
3. Click "Search" or press Enter
4. View member cards with details

---

## 📸 Screenshots

### Login Page
![Login](https://via.placeholder.com/800x400/FF6B35/FFFFFF?text=Login+Page)

### Admin Dashboard
![Admin Dashboard](https://via.placeholder.com/800x400/004E89/FFFFFF?text=Admin+Dashboard)

### Member Profile
![Member Profile](https://via.placeholder.com/800x400/06D6A0/FFFFFF?text=Member+Profile)

### User Search
![User Search](https://via.placeholder.com/800x400/1BE7FF/000000?text=User+Search)

---

## 🗄️ Database Schema

### Collections

#### users
```javascript
{
  userId: {
    email: string,
    role: 'admin' | 'member' | 'user',
    name: string (optional),
    createdAt: timestamp
  }
}
```

#### members
```javascript
{
  memberId: {
    name: string,
    email: string,
    phone: string,
    dateOfBirth: string,
    package: string,
    photo: string,
    status: 'active' | 'inactive',
    joinDate: timestamp
  }
}
```

#### bills
```javascript
{
  billId: {
    memberId: string,
    package: string,
    amount: number,
    dueDate: timestamp,
    paidDate: timestamp (optional),
    status: 'pending' | 'paid' | 'overdue',
    createdAt: timestamp
  }
}
```

#### notifications
```javascript
{
  notificationId: {
    title: string,
    message: string,
    targetRole: 'all' | 'active',
    isActive: boolean,
    createdAt: timestamp
  }
}
```

#### logs
```javascript
{
  logId: {
    action: string,
    userId: string,
    timestamp: timestamp,
    details: object
  }
}
```

---

## 🌐 Deployment

### Deploy to Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase**
   ```bash
   firebase init
   ```
   - Select "Hosting"
   - Choose your Firebase project
   - Public directory: `.` (current directory)
   - Single-page app: No
   - GitHub deployment: No

4. **Deploy**
   ```bash
   firebase deploy
   ```

5. **Your app is live!**
   ```
   https://your-project-id.web.app
   ```

### Alternative: Netlify

1. Push code to GitHub
2. Go to [Netlify](https://netlify.com)
3. Click "New site from Git"
4. Connect GitHub repository
5. Deploy!

---

## 🔮 Future Enhancements

- [ ] **Supplement Store**: E-commerce for gym supplements
- [ ] **Diet Plans**: Custom nutrition plans for members
- [ ] **Attendance Tracking**: Check-in/out system
- [ ] **Workout Plans**: Personalized exercise routines
- [ ] **Analytics Dashboard**: Advanced reports and charts
- [ ] **Email Notifications**: Automated email alerts
- [ ] **Payment Gateway Integration**: Online payment processing
- [ ] **Mobile App**: React Native mobile version
- [ ] **Biometric Authentication**: Fingerprint/face recognition
- [ ] **QR Code Membership**: Digital membership cards

---

## 🧪 Test Cases

### Authentication Tests
- ✅ Valid admin login
- ✅ Valid member login
- ✅ Valid user login
- ✅ Invalid credentials rejection
- ✅ Role-based redirection
- ✅ Session persistence

### Admin Tests
- ✅ Add member with auto-credentials
- ✅ Edit member details
- ✅ Delete member
- ✅ Create bill
- ✅ Mark bill as paid
- ✅ Send notification
- ✅ Export CSV reports
- ✅ Create user account

### Member Tests
- ✅ View profile
- ✅ View bills
- ✅ Download receipt
- ✅ View notifications

### User Tests
- ✅ Search members
- ✅ View packages
- ✅ Browse gym info

---

## 🎨 Design Features

- **Color Palette**:
  - Primary: #FF6B35 (Orange)
  - Secondary: #004E89 (Blue)
  - Accent: #1BE7FF (Cyan)
  - Success: #06D6A0 (Green)
  
- **UI Effects**:
  - Glassmorphism cards
  - Gradient backgrounds
  - Smooth animations
  - Hover effects
  - Loading spinners
  - Toast notifications
  
- **Responsive Design**:
  - Mobile (320px+)
  - Tablet (768px+)
  - Desktop (1024px+)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---ß

## 🙏 Acknowledgments

- **Unified Mentor** for the internship opportunity
- **Firebase** for backend services
- **Font Awesome** for icons
- **Google Fonts** for typography
- **Unsplash** for images

---

## 📞 Support

For support, email your.email@example.com or create an issue in the GitHub repository.

---

## ⭐ Star the Project

If you found this project helpful, please give it a ⭐ on GitHub!

---

**Built with ❤️ for FitZone Gym Management System**

Repo Linke: https://github.com/uswashaikh/gym-management-system