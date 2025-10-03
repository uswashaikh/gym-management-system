/* 
  File: admin.js
  Location: /gym-management-system/admin.js
  Purpose: Admin dashboard functionality
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
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
let allMembers = [];
let allBills = [];
let allUsers = [];

// Logger function
function logAction(action, details) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${action}:`, details);

  // Save to Firestore logs collection
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

  // Verify admin role
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists() || userDoc.data().role !== "admin") {
    showToast("Unauthorized access!", "error");
    await signOut(auth);
    window.location.href = "index.html";
    return;
  }

  // Set admin name
  document.getElementById("adminName").textContent = user.email.split("@")[0];

  // Load data
  loadDashboardData();
  logAction("ADMIN_LOGIN", { email: user.email });
});

// Show/Hide sections
window.showSection = function (section) {
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
    dashboard: "Dashboard",
    members: "Member Management",
    billing: "Billing Management",
    notifications: "Notifications",
    reports: "Reports",
    users: "User Account Management",
  };
  document.getElementById("pageTitle").textContent = titles[section];

  // Load section data
  if (section === "members") {
    loadMembers();
  } else if (section === "billing") {
    loadBills();
    loadMembersForBilling();
  } else if (section === "notifications") {
    loadNotificationHistory();
  } else if (section === "users") {
    loadUsers();
  }
};

// Load dashboard data
async function loadDashboardData() {
  try {
    // Load members
    const membersSnapshot = await getDocs(collection(db, "members"));
    allMembers = membersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Load bills
    const billsSnapshot = await getDocs(collection(db, "bills"));
    allBills = billsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Update stats
    const activeMembers = allMembers.filter((m) => m.status === "active").length;
    const pendingBills = allBills.filter((b) => b.status === "pending").length;

    document.getElementById("totalMembers").textContent = allMembers.length;
    document.getElementById("activeMembers").textContent = activeMembers;
    document.getElementById("totalBills").textContent = allBills.length;
    document.getElementById("pendingBills").textContent = pendingBills;

    // Show recent members
    displayRecentMembers();
  } catch (error) {
    console.error("Error loading dashboard:", error);
    showToast("Failed to load dashboard data", "error");
  }
}

// Display recent members
function displayRecentMembers() {
  const recentMembers = allMembers.slice(0, 5);

  if (recentMembers.length === 0) {
    document.getElementById("recentMembersTable").innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No members yet</h3>
                <p>Start by adding your first member</p>
            </div>
        `;
    return;
  }

  let html =
    '<table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Package</th><th>Status</th></tr></thead><tbody>';

  recentMembers.forEach((member) => {
    html += `
            <tr>
                <td>${member.name}</td>
                <td>${member.email}</td>
                <td>${member.package}</td>
                <td><span class="badge badge-${member.status === "active" ? "success" : "danger"}">${
      member.status
    }</span></td>
            </tr>
        `;
  });

  html += "</tbody></table>";
  document.getElementById("recentMembersTable").innerHTML = html;
}

// Load all members
async function loadMembers() {
  try {
    const membersSnapshot = await getDocs(collection(db, "members"));
    allMembers = membersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    displayMembers(allMembers);
  } catch (error) {
    console.error("Error loading members:", error);
    showToast("Failed to load members", "error");
  }
}

// Display members table
function displayMembers(members) {
  if (members.length === 0) {
    document.getElementById("membersTableContainer").innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No members found</h3>
                <p>Add your first member to get started</p>
            </div>
        `;
    return;
  }

  let html =
    '<table class="data-table"><thead><tr><th>Photo</th><th>Name</th><th>Email</th><th>Phone</th><th>Package</th><th>Status</th><th>Actions</th></tr></thead><tbody>';

  members.forEach((member) => {
    const photoUrl =
      member.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=FF6B35&color=fff`;
    html += `
            <tr>
                <td><img src="${photoUrl}" alt="${
      member.name
    }" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"></td>
                <td>${member.name}</td>
                <td>${member.email}</td>
                <td>${member.phone}</td>
                <td>${member.package}</td>
                <td><span class="badge badge-${member.status === "active" ? "success" : "danger"}">${
      member.status
    }</span></td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon btn-edit" onclick="editMember('${member.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="deleteMember('${member.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
  });

  html += "</tbody></table>";
  document.getElementById("membersTableContainer").innerHTML = html;
}

// Search members
window.searchMembers = function () {
  const searchTerm = document.getElementById("searchMember").value.toLowerCase();
  const filteredMembers = allMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm) ||
      member.email.toLowerCase().includes(searchTerm) ||
      member.phone.includes(searchTerm)
  );
  displayMembers(filteredMembers);
};

// Show add member modal
window.showAddMemberModal = function () {
  document.getElementById("addMemberModal").classList.remove("hidden");
  document.getElementById("addMemberForm").reset();
};

// Add member
window.addMember = async function (event) {
  event.preventDefault();

  const name = document.getElementById("memberName").value;
  const email = document.getElementById("memberEmail").value;

  // Generate default password: FirstName@123 (e.g., John@123)
  const firstName = name.split(" ")[0];
  const defaultPassword = `${firstName}@123`;

  const memberData = {
    name: name,
    email: email,
    phone: document.getElementById("memberPhone").value,
    dateOfBirth: document.getElementById("memberDOB").value,
    package: document.getElementById("memberPackage").value,
    photo: document.getElementById("memberPhoto").value || null,
    status: "active",
    joinDate: Timestamp.now(),
  };

  try {
    // Step 1: Create Firebase Authentication account
    const createAuthResponse = await fetch(
      "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyCnmLjmMCLM3LcW8rMwb8SfInQwINmA_C8",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          password: defaultPassword,
          returnSecureToken: true,
        }),
      }
    );

    const authData = await createAuthResponse.json();

    if (authData.error) {
      throw new Error(authData.error.message || "Failed to create authentication account");
    }

    const userId = authData.localId;

    // Step 2: Create user role document
    await addDoc(collection(db, "users"), {
      email: email,
      role: "member",
      createdAt: Timestamp.now(),
    });

    // Note: We need to manually set the document ID to match userId
    // Since addDoc generates random IDs, we'll use a workaround
    // by storing the userId reference in the users collection
    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, {
      email: email,
      role: "member",
      createdAt: Timestamp.now(),
    });

    // Step 3: Add member to members collection
    await addDoc(collection(db, "members"), memberData);

    showToast(`Member added! Login: ${email} | Password: ${defaultPassword}`, "success");
    closeModal("addMemberModal");
    loadMembers();
    loadDashboardData();
    logAction("MEMBER_ADDED", { ...memberData, defaultPassword });

    // Show password alert
    alert(
      `✅ Member Created Successfully!\n\nLogin Credentials:\nEmail: ${email}\nPassword: ${defaultPassword}\n\nPlease share these credentials with the member.`
    );
  } catch (error) {
    console.error("Error adding member:", error);

    let errorMessage = "Failed to add member";
    if (error.message.includes("EMAIL_EXISTS")) {
      errorMessage = "This email is already registered";
    } else if (error.message) {
      errorMessage = error.message;
    }

    showToast(errorMessage, "error");
  }
};

// Edit member
window.editMember = async function (memberId) {
  const member = allMembers.find((m) => m.id === memberId);
  if (!member) return;

  document.getElementById("editMemberId").value = memberId;
  document.getElementById("editMemberName").value = member.name;
  document.getElementById("editMemberEmail").value = member.email;
  document.getElementById("editMemberPhone").value = member.phone;
  document.getElementById("editMemberDOB").value = member.dateOfBirth || "";
  document.getElementById("editMemberPackage").value = member.package;
  document.getElementById("editMemberStatus").value = member.status;
  document.getElementById("editMemberPhoto").value = member.photo || "";

  document.getElementById("editMemberModal").classList.remove("hidden");
};

// Update member
window.updateMember = async function (event) {
  event.preventDefault();

  const memberId = document.getElementById("editMemberId").value;
  const memberData = {
    name: document.getElementById("editMemberName").value,
    email: document.getElementById("editMemberEmail").value,
    phone: document.getElementById("editMemberPhone").value,
    dateOfBirth: document.getElementById("editMemberDOB").value,
    package: document.getElementById("editMemberPackage").value,
    status: document.getElementById("editMemberStatus").value,
    photo: document.getElementById("editMemberPhoto").value || null,
  };

  try {
    await updateDoc(doc(db, "members", memberId), memberData);
    showToast("Member updated successfully!", "success");
    closeModal("editMemberModal");
    loadMembers();
    loadDashboardData();
    logAction("MEMBER_UPDATED", { memberId, ...memberData });
  } catch (error) {
    console.error("Error updating member:", error);
    showToast("Failed to update member", "error");
  }
};

// Delete member
window.deleteMember = async function (memberId) {
  if (!confirm("Are you sure you want to delete this member?")) return;

  try {
    await deleteDoc(doc(db, "members", memberId));
    showToast("Member deleted successfully!", "success");
    loadMembers();
    loadDashboardData();
    logAction("MEMBER_DELETED", { memberId });
  } catch (error) {
    console.error("Error deleting member:", error);
    showToast("Failed to delete member", "error");
  }
};

// Load bills
async function loadBills() {
  try {
    const billsSnapshot = await getDocs(collection(db, "bills"));
    allBills = billsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    displayBills();
  } catch (error) {
    console.error("Error loading bills:", error);
    showToast("Failed to load bills", "error");
  }
}

// Display bills
function displayBills() {
  if (allBills.length === 0) {
    document.getElementById("billsTableContainer").innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-invoice"></i>
                <h3>No bills created yet</h3>
                <p>Create your first bill for a member</p>
            </div>
        `;
    return;
  }

  let html =
    '<table class="data-table"><thead><tr><th>Member</th><th>Package</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>';

  allBills.forEach((bill) => {
    const member = allMembers.find((m) => m.id === bill.memberId);
    const dueDate = bill.dueDate?.toDate ? bill.dueDate.toDate().toLocaleDateString() : "N/A";

    html += `
            <tr>
                <td>${member?.name || "Unknown"}</td>
                <td>${bill.package}</td>
                <td>₹${bill.amount}</td>
                <td>${dueDate}</td>
                <td><span class="badge badge-${
                  bill.status === "paid" ? "success" : bill.status === "pending" ? "warning" : "danger"
                }">${bill.status}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon btn-download" onclick="downloadReceipt('${bill.id}')">
                            <i class="fas fa-download"></i>
                        </button>
                        ${
                          bill.status === "pending"
                            ? `<button class="btn-icon btn-success" onclick="markAsPaid('${bill.id}')"><i class="fas fa-check"></i></button>`
                            : ""
                        }
                    </div>
                </td>
            </tr>
        `;
  });

  html += "</tbody></table>";
  document.getElementById("billsTableContainer").innerHTML = html;
}

// Load members for billing dropdown
async function loadMembersForBilling() {
  const select = document.getElementById("billMemberId");
  select.innerHTML = '<option value="">Choose a member</option>';

  allMembers.forEach((member) => {
    select.innerHTML += `<option value="${member.id}">${member.name} - ${member.email}</option>`;
  });
}

// Show create bill modal
window.showCreateBillModal = function () {
  document.getElementById("createBillModal").classList.remove("hidden");
  document.getElementById("createBillForm").reset();
};

// Update bill amount based on package
window.updateBillAmount = function () {
  const packageSelect = document.getElementById("billPackage");
  const selectedOption = packageSelect.options[packageSelect.selectedIndex];
  const price = selectedOption.getAttribute("data-price");

  if (price) {
    document.getElementById("billAmount").value = price;
  }
};

// Create bill
window.createBill = async function (event) {
  event.preventDefault();

  const billData = {
    memberId: document.getElementById("billMemberId").value,
    package: document.getElementById("billPackage").value,
    amount: parseFloat(document.getElementById("billAmount").value),
    dueDate: Timestamp.fromDate(new Date(document.getElementById("billDueDate").value)),
    status: "pending",
    createdAt: Timestamp.now(),
  };

  try {
    await addDoc(collection(db, "bills"), billData);
    showToast("Bill created successfully!", "success");
    closeModal("createBillModal");
    loadBills();
    loadDashboardData();
    logAction("BILL_CREATED", billData);
  } catch (error) {
    console.error("Error creating bill:", error);
    showToast("Failed to create bill", "error");
  }
};

// Mark bill as paid
window.markAsPaid = async function (billId) {
  try {
    await updateDoc(doc(db, "bills", billId), {
      status: "paid",
      paidDate: Timestamp.now(),
    });
    showToast("Bill marked as paid!", "success");
    loadBills();
    loadDashboardData();
    logAction("BILL_PAID", { billId });
  } catch (error) {
    console.error("Error updating bill:", error);
    showToast("Failed to update bill", "error");
  }
};

// Download receipt
window.downloadReceipt = function (billId) {
  const bill = allBills.find((b) => b.id === billId);
  const member = allMembers.find((m) => m.id === bill.memberId);

  if (!bill || !member) return;

  const receiptText = `
    ===================================
    FITZONE GYM - PAYMENT RECEIPT
    ===================================
    
    Receipt ID: ${billId}
    Date: ${new Date().toLocaleDateString()}
    
    Member Details:
    Name: ${member.name}
    Email: ${member.email}
    Phone: ${member.phone}
    
    Bill Details:
    Package: ${bill.package}
    Amount: ₹${bill.amount}
    Status: ${bill.status}
    Due Date: ${bill.dueDate?.toDate ? bill.dueDate.toDate().toLocaleDateString() : "N/A"}
    
    Thank you for your payment!
    ===================================
    `;

  const blob = new Blob([receiptText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt_${billId}.txt`;
  a.click();

  logAction("RECEIPT_DOWNLOADED", { billId, memberId: member.id });
};

// Send notification
window.sendNotification = async function (event) {
  event.preventDefault();

  const notificationData = {
    title: document.getElementById("notificationTitle").value,
    message: document.getElementById("notificationMessage").value,
    targetRole: document.getElementById("notificationTarget").value,
    createdAt: Timestamp.now(),
    isActive: true,
  };

  try {
    await addDoc(collection(db, "notifications"), notificationData);
    showToast("Notification sent successfully!", "success");
    document.getElementById("notificationForm").reset();
    loadNotificationHistory();
    logAction("NOTIFICATION_SENT", notificationData);
  } catch (error) {
    console.error("Error sending notification:", error);
    showToast("Failed to send notification", "error");
  }
};

// Load notification history
async function loadNotificationHistory() {
  try {
    const notificationsSnapshot = await getDocs(collection(db, "notifications"));
    const notifications = notificationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (notifications.length === 0) {
      document.getElementById("notificationHistoryContainer").innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell"></i>
                    <h3>No notifications yet</h3>
                </div>
            `;
      return;
    }

    let html =
      '<table class="data-table"><thead><tr><th>Title</th><th>Message</th><th>Target</th><th>Date</th></tr></thead><tbody>';

    notifications.forEach((notif) => {
      const date = notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleDateString() : "N/A";
      html += `
                <tr>
                    <td>${notif.title}</td>
                    <td>${notif.message}</td>
                    <td><span class="badge badge-success">${notif.targetRole}</span></td>
                    <td>${date}</td>
                </tr>
            `;
    });

    html += "</tbody></table>";
    document.getElementById("notificationHistoryContainer").innerHTML = html;
  } catch (error) {
    console.error("Error loading notifications:", error);
  }
}

// Export members to CSV
window.exportMembersCSV = function () {
  if (allMembers.length === 0) {
    showToast("No members to export", "warning");
    return;
  }

  let csv = "Name,Email,Phone,Date of Birth,Package,Status,Join Date\n";

  allMembers.forEach((member) => {
    const joinDate = member.joinDate?.toDate ? member.joinDate.toDate().toLocaleDateString() : "N/A";
    csv += `"${member.name}","${member.email}","${member.phone}","${member.dateOfBirth || "N/A"}","${
      member.package
    }","${member.status}","${joinDate}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `members_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();

  showToast("Members exported successfully!", "success");
  logAction("MEMBERS_EXPORTED", { count: allMembers.length });
};

// Export bills to CSV
window.exportBillsCSV = function () {
  if (allBills.length === 0) {
    showToast("No bills to export", "warning");
    return;
  }

  let csv = "Member Name,Package,Amount,Due Date,Status,Created Date\n";

  allBills.forEach((bill) => {
    const member = allMembers.find((m) => m.id === bill.memberId);
    const dueDate = bill.dueDate?.toDate ? bill.dueDate.toDate().toLocaleDateString() : "N/A";
    const createdDate = bill.createdAt?.toDate ? bill.createdAt.toDate().toLocaleDateString() : "N/A";
    csv += `"${member?.name || "Unknown"}","${bill.package}","${bill.amount}","${dueDate}","${
      bill.status
    }","${createdDate}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bills_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();

  showToast("Bills exported successfully!", "success");
  logAction("BILLS_EXPORTED", { count: allBills.length });
};

// Close modal
window.closeModal = function (modalId) {
  document.getElementById(modalId).classList.add("hidden");
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
    logAction("ADMIN_LOGOUT", { email: currentUser.email });
    await signOut(auth);
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error logging out:", error);
    showToast("Failed to logout", "error");
  }
};

// ==================== USER ACCOUNT MANAGEMENT ====================

// Load all users
async function loadUsers() {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    allUsers = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    displayUsers();
  } catch (error) {
    console.error("Error loading users:", error);
    showToast("Failed to load users", "error");
  }
}

// Display users table
function displayUsers() {
  const userAccounts = allUsers.filter((u) => u.role === "user");

  if (userAccounts.length === 0) {
    document.getElementById("usersTableContainer").innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-shield"></i>
                <h3>No user accounts yet</h3>
                <p>Create your first user account to give read-only access</p>
            </div>
        `;
    return;
  }

  let html =
    '<table class="data-table"><thead><tr><th>Email</th><th>Role</th><th>Created Date</th><th>Actions</th></tr></thead><tbody>';

  userAccounts.forEach((user) => {
    const createdDate = user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : "N/A";

    html += `
            <tr>
                <td>${user.email}</td>
                <td><span class="badge badge-success">${user.role}</span></td>
                <td>${createdDate}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon btn-delete" onclick="deleteUser('${user.id}', '${user.email}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
  });

  html += "</tbody></table>";
  document.getElementById("usersTableContainer").innerHTML = html;
}

// Show add user modal
window.showAddUserModal = function () {
  document.getElementById("addUserModal").classList.remove("hidden");
  document.getElementById("addUserForm").reset();
};

// Add user
window.addUser = async function (event) {
  event.preventDefault();

  const name = document.getElementById("userName").value;
  const email = document.getElementById("userEmail").value;
  const phone = document.getElementById("userPhone").value;

  // Generate default password: FirstName@123
  const firstName = name.split(" ")[0];
  const defaultPassword = `${firstName}@123`;

  try {
    // Step 1: Create Firebase Authentication account
    const createAuthResponse = await fetch(
      "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyCnmLjmMCLM3LcW8rMwb8SfInQwINmA_C8",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          password: defaultPassword,
          returnSecureToken: true,
        }),
      }
    );

    const authData = await createAuthResponse.json();

    if (authData.error) {
      throw new Error(authData.error.message || "Failed to create authentication account");
    }

    const userId = authData.localId;

    // Step 2: Create user role document with matching UID
    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, {
      email: email,
      name: name,
      phone: phone || null,
      role: "user",
      createdAt: Timestamp.now(),
    });

    showToast(`User account created! Login: ${email} | Password: ${defaultPassword}`, "success");
    closeModal("addUserModal");
    loadUsers();
    logAction("USER_CREATED", { email, name, defaultPassword });

    // Show password alert
    alert(
      `✅ User Account Created Successfully!\n\nLogin Credentials:\nEmail: ${email}\nPassword: ${defaultPassword}\n\nRole: User (Read-only access)\n\nPlease share these credentials with the user.`
    );
  } catch (error) {
    console.error("Error creating user:", error);

    let errorMessage = "Failed to create user account";
    if (error.message.includes("EMAIL_EXISTS")) {
      errorMessage = "This email is already registered";
    } else if (error.message) {
      errorMessage = error.message;
    }

    showToast(errorMessage, "error");
  }
};

// Delete user
window.deleteUser = async function (userId, userEmail) {
  if (!confirm(`Are you sure you want to delete user account: ${userEmail}?`)) return;

  try {
    // Delete from Firestore
    await deleteDoc(doc(db, "users", userId));

    showToast("User account deleted successfully!", "success");
    loadUsers();
    logAction("USER_DELETED", { userId, userEmail });

    alert(
      "Note: The Firebase Authentication account still exists. You may want to delete it manually from Firebase Console → Authentication."
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    showToast("Failed to delete user account", "error");
  }
};
