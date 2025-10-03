/* 
  File: user.js
  Location: /gym-management-system/user.js
  Purpose: Public user view functionality
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
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
let allMembers = [];

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

  // Verify user role
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists() || userDoc.data().role !== "user") {
    showToast("Unauthorized access!", "error");
    await signOut(auth);
    window.location.href = "index.html";
    return;
  }

  // Load all members
  await loadAllMembers();
  logAction("USER_LOGIN", { email: user.email });
});

// Load all members
async function loadAllMembers() {
  try {
    const membersSnapshot = await getDocs(collection(db, "members"));
    allMembers = membersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    showToast("Welcome! Search for gym members below.", "success");
  } catch (error) {
    console.error("Error loading members:", error);
    showToast("Failed to load member data", "error");
  }
}

// Search members
window.searchMembers = function () {
  const searchTerm = document.getElementById("searchInput").value.trim().toLowerCase();

  if (searchTerm === "") {
    document.getElementById("searchResults").innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Enter search term</h3>
                <p>Search for members by name, email, or phone number</p>
            </div>
        `;
    return;
  }

  const filteredMembers = allMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm) ||
      member.email.toLowerCase().includes(searchTerm) ||
      member.phone.includes(searchTerm)
  );

  displaySearchResults(filteredMembers);
  logAction("MEMBER_SEARCH", { searchTerm, resultsCount: filteredMembers.length });
};

// Handle search on Enter key
window.handleSearch = function (event) {
  if (event.key === "Enter") {
    searchMembers();
  }
};

// Display search results
function displaySearchResults(members) {
  if (members.length === 0) {
    document.getElementById("searchResults").innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-slash"></i>
                <h3>No members found</h3>
                <p>Try searching with a different term</p>
            </div>
        `;
    return;
  }

  let html = '<div class="member-grid">';

  members.forEach((member) => {
    const photoUrl =
      member.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=FF6B35&color=fff`;
    const statusClass = member.status === "active" ? "badge-success" : "badge-danger";

    html += `
            <div class="member-card-user">
                <img src="${photoUrl}" alt="${member.name}">
                <h3>${member.name}</h3>
                <p><i class="fas fa-envelope"></i> ${member.email}</p>
                <p><i class="fas fa-phone"></i> ${member.phone}</p>
                <p><i class="fas fa-box"></i> Package: <strong>${member.package}</strong></p>
                <span class="member-status badge ${statusClass}">${member.status}</span>
            </div>
        `;
  });

  html += "</div>";

  // Add result count
  const resultCountHtml = `
        <div style="text-align: center; margin-bottom: 30px; color: var(--gray);">
            <p><i class="fas fa-info-circle"></i> Found ${members.length} member(s)</p>
        </div>
    `;

  document.getElementById("searchResults").innerHTML = resultCountHtml + html;
}

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
    logAction("USER_LOGOUT", { email: currentUser.email });
    await signOut(auth);
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error logging out:", error);
    showToast("Failed to logout", "error");
  }
};
