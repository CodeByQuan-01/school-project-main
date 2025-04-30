// Import Firebase and QRCode libraries (assuming they are available globally or via a module bundler)
// If using a module bundler like Webpack or Parcel, use import statements:
// import firebase from 'firebase/app';
// import 'firebase/auth';
// import 'firebase/firestore';
// import QRCode from 'qrcode';

// If Firebase and QRCode are included via CDN, ensure they are initialized:
// For example:
// const firebase = window.firebase;
// const QRCode = window.QRCode;

// Set current year in footer
document.getElementById("current-year").textContent = new Date().getFullYear();

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const loadingContainer = document.getElementById("loading-container");
const errorContainer = document.getElementById("error-container");
const errorMessage = document.getElementById("error-message");
const backBtn = document.getElementById("back-btn");
const studentContainer = document.getElementById("student-container");
const studentPhotoContainer = document.getElementById(
  "student-photo-container"
);
const studentStatusBadge = document.getElementById("student-status-badge");
const studentName = document.getElementById("student-name");
const studentMatric = document.getElementById("student-matric");
const studentFaculty = document.getElementById("student-faculty");
const studentDepartment = document.getElementById("student-department");
const studentCreatedAt = document.getElementById("student-created-at");
const studentId = document.getElementById("student-id");
const rejectBtn = document.getElementById("reject-btn");
const pendingBtn = document.getElementById("pending-btn");
const verifyBtn = document.getElementById("verify-btn");
const logsContainer = document.getElementById("logs-container");
const noLogsMessage = document.getElementById("no-logs-message");
const studentQrCode = document.getElementById("student-qr-code");
const downloadQrBtn = document.getElementById("download-qr-btn");
const loadingOverlay = document.getElementById("loading-overlay");

// Variables
let currentStudentId = null;
let currentStudentData = null;

// Check if user is logged in
auth.onAuthStateChanged((user) => {
  if (!user) {
    // User is not signed in, redirect to login
    window.location.href = "index.html";
  } else {
    // Get student ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get("id");

    if (studentId) {
      // Fetch student data
      fetchStudentData(studentId);
    } else {
      // No student ID provided
      showError("No student ID provided");
    }
  }
});

// Fetch student data
async function fetchStudentData(studentId) {
  try {
    // Fetch student data
    const docRef = db.collection("students").doc(studentId);
    const doc = await docRef.get();

    if (doc.exists) {
      currentStudentId = doc.id;
      currentStudentData = {
        id: doc.id,
        ...doc.data(),
      };

      // Display student data
      displayStudentData(currentStudentData);

      // Fetch verification logs
      fetchVerificationLogs(studentId);

      // Generate QR code
      generateQRCode(studentId, currentStudentData.matricNumber);
    } else {
      showError("Student record not found");
    }
  } catch (error) {
    console.error("Error fetching student data:", error);
    showError("Failed to fetch student data");
  }
}

// Fetch verification logs
async function fetchVerificationLogs(studentId) {
  try {
    const snapshot = await db
      .collection("verificationLogs")
      .where("studentId", "==", studentId)
      .orderBy("timestamp", "desc")
      .get();

    if (!snapshot.empty) {
      noLogsMessage.classList.add("hidden");
      logsContainer.innerHTML = "";

      snapshot.forEach((doc) => {
        const log = doc.data();
        const timestamp = formatDate(log.timestamp);

        let statusClass = "bg-yellow-100 text-yellow-800";
        if (log.status === "Verified") {
          statusClass = "bg-green-100 text-green-800";
        } else if (log.status === "Rejected") {
          statusClass = "bg-red-100 text-red-800";
        }

        const logElement = document.createElement("div");
        logElement.className =
          "border-b border-gray-100 pb-4 last:border-0 last:pb-0";
        logElement.innerHTML = `
          <div class="flex items-start justify-between">
            <div>
              <span class="px-2 py-1 rounded text-xs font-medium ${statusClass}">
                ${log.status}
              </span>
              <p class="mt-1 text-sm text-gray-600">By ${
                log.adminEmail || "Unknown Admin"
              }</p>
            </div>
            <p class="text-sm text-gray-500">${timestamp}</p>
          </div>
        `;

        logsContainer.appendChild(logElement);
      });
    } else {
      noLogsMessage.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Error fetching verification logs:", error);
    noLogsMessage.textContent = "Failed to load verification logs";
    noLogsMessage.classList.remove("hidden");
  }
}

// Display student data
function displayStudentData(student) {
  // Set student details
  studentName.textContent = student.fullName || "N/A";
  studentMatric.textContent = student.matricNumber || "N/A";
  studentFaculty.textContent = student.faculty || "N/A";
  studentDepartment.textContent = student.department || "N/A";
  studentCreatedAt.textContent = formatDate(student.createdAt);
  studentId.textContent = student.id;

  // Set photo
  if (student.photoURL) {
    studentPhotoContainer.innerHTML = `<img src="${student.photoURL}" alt="${student.fullName}" class="w-full h-full object-cover">`;
  } else {
    studentPhotoContainer.innerHTML = `
      <div class="w-full h-full flex items-center justify-center bg-gray-200">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    `;
  }

  // Set status badge
  if (student.status === "Verified") {
    studentStatusBadge.className =
      "px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800";
    studentStatusBadge.textContent = "Verified";
  } else if (student.status === "Rejected") {
    studentStatusBadge.className =
      "px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800";
    studentStatusBadge.textContent = "Rejected";
  } else {
    studentStatusBadge.className =
      "px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800";
    studentStatusBadge.textContent = "Pending";
  }

  // Show student container
  loadingContainer.classList.add("hidden");
  studentContainer.classList.remove("hidden");
}

// Generate QR Code
function generateQRCode(studentId, matricNumber) {
  const qrData = JSON.stringify({
    id: studentId,
    matricNumber: matricNumber,
  });

  QRCode.toCanvas(
    studentQrCode,
    qrData,
    {
      width: 256,
      margin: 2,
      color: {
        dark: "#213B94",
        light: "#FFFFFF",
      },
    },
    (error) => {
      if (error) {
        console.error("Error generating QR code:", error);
      }
    }
  );
}

// Update student status
async function updateStudentStatus(newStatus) {
  if (!currentStudentId) return;

  loadingOverlay.classList.remove("hidden");

  try {
    // Update in Firestore
    await db.collection("students").doc(currentStudentId).update({
      status: newStatus,
      updatedAt: new Date(),
    });

    // Add verification log
    await db.collection("verificationLogs").add({
      studentId: currentStudentId,
      matricNumber: currentStudentData.matricNumber,
      status: newStatus,
      adminId: auth.currentUser.uid,
      adminEmail: auth.currentUser.email,
      timestamp: new Date(),
    });

    // Update local data
    currentStudentData.status = newStatus;

    // Update UI
    if (newStatus === "Verified") {
      studentStatusBadge.className =
        "px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800";
      studentStatusBadge.textContent = "Verified";
    } else if (newStatus === "Rejected") {
      studentStatusBadge.className =
        "px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800";
      studentStatusBadge.textContent = "Rejected";
    } else {
      studentStatusBadge.className =
        "px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800";
      studentStatusBadge.textContent = "Pending";
    }

    // Refresh verification logs
    fetchVerificationLogs(currentStudentId);

    // Show success message
    alert(`Student status updated to ${newStatus}`);
  } catch (error) {
    console.error("Error updating status:", error);
    alert("Failed to update student status");
  } finally {
    loadingOverlay.classList.add("hidden");
  }
}

// Format date
function formatDate(timestamp) {
  if (!timestamp) return "N/A";

  try {
    const date =
      timestamp instanceof Date
        ? timestamp
        : timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);

    return date.toLocaleString();
  } catch (error) {
    return "Invalid date";
  }
}

// Show error
function showError(message) {
  loadingContainer.classList.add("hidden");
  studentContainer.classList.add("hidden");

  errorMessage.textContent = message;
  errorContainer.classList.remove("hidden");
}

// Event Listeners
verifyBtn.addEventListener("click", () => {
  updateStudentStatus("Verified");
});

rejectBtn.addEventListener("click", () => {
  updateStudentStatus("Rejected");
});

pendingBtn.addEventListener("click", () => {
  updateStudentStatus("Pending");
});

backBtn.addEventListener("click", () => {
  window.location.href = "dashboard.html";
});

downloadQrBtn.addEventListener("click", () => {
  if (!currentStudentData) return;

  const link = document.createElement("a");
  link.download = `qr-code-${currentStudentData.matricNumber || "student"}.png`;
  link.href = studentQrCode.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
