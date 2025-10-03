/* 
  File: member.js
  Location: /gym-management-system/member.js
  Purpose: Member dashboard functionality
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  addDoc,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCnmLjmMCLM3LcW8rMwb8SfInQwINmA_C8",
  authDomain: "gym-management-system-fbe4b.firebaseapp.com",
  projectId: "gym-management-system-fbe4b",
  storageBucket: "gym-management-system-fbe4b.firebasestorage.app",
  messagingSenderId: "415681714573",
  appId: "1:415681714573:web:4c3712b5ae24d8fd1f85c4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global variables
let currentUser = null;
let memberData = null;
let memberBills = [];

// Logger function
function logAction(action, details) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${action}:`, details);

  addDoc(collection(db, "logs"), {
    action: action,
    userId: currentUser?.uid || "unknown",
    timestamp: Timestamp.now(),
    details: details,
  }).catch((err) => console.error("Logging error:", err));
}

// Check authentication
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;

  // Verify member role
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists() || userDoc.data().role !== "member") {
    showToast("Unauthorized access!", "error");
    await signOut(auth);
    window.location.href = "index.html";
    return;
  }

  // Load member data
  await loadMemberData();
  logAction("MEMBER_LOGIN", { email: user.email });
});

// Load member data
async function loadMemberData() {
  try {
    // Find member by email
    const membersQuery = query(collection(db, "members"), where("email", "==", currentUser.email));

    const membersSnapshot = await getDocs(membersQuery);

    if (membersSnapshot.empty) {
      showToast("Member profile not found. Please contact admin.", "error");
      return;
    }

    const memberDoc = membersSnapshot.docs[0];
    memberData = {
      id: memberDoc.id,
      ...memberDoc.data(),
    };

    // Update UI
    updateProfileUI();

    // Load bills
    await loadMemberBills();

    // Load notifications
    await loadNotifications();
  } catch (error) {
    console.error("Error loading member data:", error);
    showToast("Failed to load profile data", "error");
  }
}

// Update profile UI
function updateProfileUI() {
  const photoUrl =
    memberData.photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(memberData.name)}&background=FF6B35&color=fff`;

  // Top bar
  document.getElementById("memberName").textContent = memberData.name;
  document.getElementById("memberEmail").textContent = memberData.email;
  document.getElementById("memberPhoto").src = photoUrl;

  // Stats
  document.getElementById("memberStatus").textContent = memberData.status;
  document.getElementById("memberPackage").textContent = memberData.package;

  // Profile details
  document.getElementById("profilePhotoLarge").src = photoUrl + "&size=150";
  document.getElementById("profileName").textContent = memberData.name;
  document.getElementById("profileEmail").textContent = memberData.email;
  document.getElementById("profilePhone").textContent = memberData.phone;
  document.getElementById("profileDOB").textContent = memberData.dateOfBirth || "Not provided";
  document.getElementById("profileJoinDate").textContent = memberData.joinDate?.toDate
    ? memberData.joinDate.toDate().toLocaleDateString()
    : "N/A";
  document.getElementById("profilePackage").textContent = memberData.package;

  // Package details
  displayPackageInfo();
}

// Display package information
function displayPackageInfo() {
  const packages = {
    Basic: {
      price: "₹1000",
      features: ["Access to gym equipment", "Locker facility", "Basic fitness consultation", "Valid for 1 month"],
    },
    Standard: {
      price: "₹2000",
      features: [
        "All Basic features",
        "Group fitness classes",
        "Nutrition guidance",
        "Personal training (2 sessions)",
        "Valid for 1 month",
      ],
    },
    Premium: {
      price: "₹3000",
      features: [
        "All Standard features",
        "Unlimited personal training",
        "Diet plan customization",
        "Supplement consultation",
        "Priority booking",
        "Valid for 1 month",
      ],
    },
  };

  const currentPackage = packages[memberData.package] || packages["Basic"];

  let html = `
        <div class="package-card">
            <h3>${memberData.package} Package</h3>
            <div class="package-price">${currentPackage.price}<span style="font-size: 16px;">/month</span></div>
            <ul class="package-features">
    `;

  currentPackage.features.forEach((feature) => {
    html += `<li><i class="fas fa-check"></i> ${feature}</li>`;
  });

  html += `
            </ul>
        </div>
    `;

  document.getElementById("packageDetailsContainer").innerHTML = html;
}

// Load member bills
async function loadMemberBills() {
  try {
    const billsQuery = query(
      collection(db, "bills"),
      where("memberId", "==", memberData.id),
      orderBy("createdAt", "desc")
    );

    const billsSnapshot = await getDocs(billsQuery);
    memberBills = billsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Update stats
    const pendingBills = memberBills.filter((b) => b.status === "pending").length;
    document.getElementById("totalBillsCount").textContent = memberBills.length;
    document.getElementById("pendingBillsCount").textContent = pendingBills;

    // Display bills
    displayBills();
  } catch (error) {
    console.error("Error loading bills:", error);
    showToast("Failed to load bills", "error");
  }
}

// Display bills
function displayBills() {
  if (memberBills.length === 0) {
    document.getElementById("billsContainer").innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-invoice"></i>
                <h3>No bills yet</h3>
                <p>Your billing history will appear here</p>
            </div>
        `;
    return;
  }

  let html = '<div class="bills-timeline">';

  memberBills.forEach((bill) => {
    const dueDate = bill.dueDate?.toDate ? bill.dueDate.toDate().toLocaleDateString() : "N/A";
    const createdDate = bill.createdAt?.toDate ? bill.createdAt.toDate().toLocaleDateString() : "N/A";
    const paidDate = bill.paidDate?.toDate ? bill.paidDate.toDate().toLocaleDateString() : null;

    const statusClass = bill.status === "paid" ? "success" : bill.status === "pending" ? "warning" : "danger";

    html += `
            <div class="bill-item">
                <div class="bill-header">
                    <h3>Bill #${bill.id.substring(0, 8)}</h3>
                    <span class="badge badge-${statusClass}">${bill.status}</span>
                </div>
                <div class="bill-details">
                    <div class="bill-detail">
                        <i class="fas fa-box"></i>
                        <span><strong>Package:</strong> ${bill.package}</span>
                    </div>
                    <div class="bill-detail">
                        <i class="fas fa-rupee-sign"></i>
                        <span><strong>Amount:</strong> ₹${bill.amount}</span>
                    </div>
                    <div class="bill-detail">
                        <i class="fas fa-calendar"></i>
                        <span><strong>Due Date:</strong> ${dueDate}</span>
                    </div>
                    <div class="bill-detail">
                        <i class="fas fa-clock"></i>
                        <span><strong>Created:</strong> ${createdDate}</span>
                    </div>
                    ${
                      paidDate
                        ? `
                    <div class="bill-detail">
                        <i class="fas fa-check-circle"></i>
                        <span><strong>Paid On:</strong> ${paidDate}</span>
                    </div>
                    `
                        : ""
                    }
                </div>
                <div class="bill-actions">
                    <button class="btn btn-primary" onclick="downloadReceipt('${bill.id}')">
                        <i class="fas fa-download"></i> Download Receipt
                    </button>
                </div>
            </div>
        `;
  });

  html += "</div>";
  document.getElementById("billsContainer").innerHTML = html;
}

// Download receipt
window.downloadReceipt = function (billId) {
  const bill = memberBills.find((b) => b.id === billId);
  if (!bill) return;

  const receiptText = `
    ===================================
    FITZONE GYM - PAYMENT RECEIPT
    ===================================
    
    Receipt ID: ${billId}
    Date: ${new Date().toLocaleDateString()}
    
    Member Details:
    Name: ${memberData.name}
    Email: ${memberData.email}
    Phone: ${memberData.phone}
    
    Bill Details:
    Package: ${bill.package}
    Amount: ₹${bill.amount}
    Status: ${bill.status}
    Due Date: ${bill.dueDate?.toDate ? bill.dueDate.toDate().toLocaleDateString() : "N/A"}
    ${bill.paidDate ? `Paid Date: ${bill.paidDate.toDate().toLocaleDateString()}` : ""}
    
    Thank you for your payment!
    ===================================
    `;

  const blob = new Blob([receiptText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt_${billId}.txt`;
  a.click();

  showToast("Receipt downloaded successfully!", "success");
  logAction("RECEIPT_DOWNLOADED", { billId });
};

// Load notifications
async function loadNotifications() {
  try {
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("isActive", "==", true),
      orderBy("createdAt", "desc")
    );

    const notificationsSnapshot = await getDocs(notificationsQuery);
    const notifications = notificationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    displayNotifications(notifications);
  } catch (error) {
    console.error("Error loading notifications:", error);
    showToast("Failed to load notifications", "error");
  }
}

// Display notifications
function displayNotifications(notifications) {
  if (notifications.length === 0) {
    document.getElementById("notificationsContainer").innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell"></i>
                <h3>No notifications</h3>
                <p>You're all caught up!</p>
            </div>
        `;
    return;
  }

  let html = '<div class="notification-list">';

  notifications.forEach((notif) => {
    const date = notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleDateString() : "N/A";

    html += `
            <div class="notification-item">
                <div class="notification-header">
                    <h3><i class="fas fa-bell"></i> ${notif.title}</h3>
                    <span class="notification-date">${date}</span>
                </div>
                <p class="notification-message">${notif.message}</p>
            </div>
        `;
  });

  html += "</div>";
  document.getElementById("notificationsContainer").innerHTML = html;
}

// Show/Hide sections
window.showMemberSection = function (section) {
  // Hide all sections
  document.querySelectorAll(".content-section").forEach((sec) => {
    sec.classList.add("hidden");
  });

  // Remove active class from all menu items
  document.querySelectorAll(".sidebar-menu a").forEach((link) => {
    link.classList.remove("active");
  });

  // Show selected section
  document.getElementById(`${section}-section`).classList.remove("hidden");

  // Add active class to clicked menu item
  event.target.closest("a").classList.add("active");

  // Update page title
  const titles = {
    profile: "My Profile",
    bills: "My Bills",
    notifications: "Notifications",
  };
  document.getElementById("pageTitle").textContent = titles[section];
};

// Show toast notification
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

// Logout
window.logout = async function () {
  if (!confirm("Are you sure you want to logout?")) return;

  try {
    logAction("MEMBER_LOGOUT", { email: currentUser.email });
    await signOut(auth);
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error logging out:", error);
    showToast("Failed to logout", "error");
  }
};
