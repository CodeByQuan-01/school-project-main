// Set current year in footer
document.getElementById("current-year").textContent = new Date().getFullYear();

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const scannerContainer = document.getElementById("scanner-container");
const loadingContainer = document.getElementById("loading-container");
const errorContainer = document.getElementById("error-container");
const errorMessage = document.getElementById("error-message");
const tryAgainBtn = document.getElementById("try-again-btn");
const studentContainer = document.getElementById("student-container");
const studentPhotoContainer = document.getElementById(
  "student-photo-container"
);
const studentStatusBadge = document.getElementById("student-status-badge");
const studentName = document.getElementById("student-name");
const studentMatric = document.getElementById("student-matric");
const studentFaculty = document.getElementById("student-faculty");
const studentDepartment = document.getElementById("student-department");
const rejectBtn = document.getElementById("reject-btn");
const verifyBtn = document.getElementById("verify-btn");

// Variables
let html5QrCode;
let currentStudentId = null;
let scannerInitialized = false;

// Show loading function
function showLoading() {
  loadingContainer.style.display = "flex";
  scannerContainer.style.display = "none";
  errorContainer.style.display = "none";
  studentContainer.style.display = "none";
}

// Show error function
function showError(message) {
  loadingContainer.style.display = "none";
  scannerContainer.style.display = "none";
  errorContainer.style.display = "flex";
  studentContainer.style.display = "none";
  errorMessage.textContent = message;
}

// Check if user is logged in
auth.onAuthStateChanged((user) => {
  if (!user) {
    // User is not signed in, redirect to login
    window.location.href = "index.html";
  } else {
    // Check if we have a verify parameter
    const urlParams = new URLSearchParams(window.location.search);
    const verifyId = urlParams.get("verify");

    if (verifyId) {
      // Fetch student by ID
      fetchStudentById(verifyId);
    } else {
      // Initialize scanner
      initializeScanner();
    }
  }
});

// Initialize QR Scanner
function initializeScanner() {
  if (scannerInitialized) return;

  html5QrCode = new Html5Qrcode("qr-reader");
  const config = { fps: 10, qrbox: { width: 250, height: 250 } };

  html5QrCode
    .start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
    .catch((err) => {
      console.error(`Unable to start scanning: ${err}`);
      showError(
        "Failed to start camera. Please ensure you have granted camera permissions."
      );
    });

  scannerInitialized = true;
}

// QR Code scan success
function onScanSuccess(decodedText) {
  // Stop scanner
  if (html5QrCode && html5QrCode.isScanning) {
    html5QrCode
      .stop()
      .then(() => {
        console.log("Scanner stopped");
      })
      .catch((err) => {
        console.error("Failed to stop scanner:", err);
      });
  }

  try {
    // Parse QR code data
    const qrData = JSON.parse(decodedText);

    // Show loading
    showLoading();

    // Fetch student data
    if (qrData.id) {
      fetchStudentById(qrData.id);
    } else if (qrData.matricNumber) {
      fetchStudentByMatric(qrData.matricNumber);
    } else {
      showError("Invalid QR code data");
    }
  } catch (error) {
    console.error("Error processing QR code:", error);
    showError("Invalid QR code format");
  }
}

// QR Code scan failure
function onScanFailure(error) {
  // We don't need to show scan failures to the user
  console.log("QR scan error:", error);
}

// Fetch student by ID
async function fetchStudentById(studentId) {
  showLoading();

  try {
    const docRef = db.collection("students").doc(studentId);
    const doc = await docRef.get();

    if (doc.exists) {
      const studentData = {
        id: doc.id,
        ...doc.data(),
      };

      displayStudentData(studentData);
    } else {
      showError("Student record not found");
    }
  } catch (error) {
    console.error("Error fetching student:", error);
    showError("Failed to fetch student data");
  }
}

// Fetch student by matric number
async function fetchStudentByMatric(matricNumber) {
  showLoading();

  try {
    const snapshot = await db
      .collection("students")
      .where("matricNumber", "==", matricNumber)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const studentData = {
        id: doc.id,
        ...doc.data(),
      };

      displayStudentData(studentData);
    } else {
      showError("Student record not found");
    }
  } catch (error) {
    console.error("Error fetching student by matric:", error);
    showError("Failed to fetch student data");
  }
}

// Display student data
function displayStudentData(student) {
  currentStudentId = student.id;

  // Set student details
  studentName.textContent = student.fullName || "N/A";
  studentMatric.textContent = student.matricNumber || "N/A";
  studentFaculty.textContent = student.faculty || "N/A";
  studentDepartment.textContent = student.department || "N/A";

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
  hideLoading();
  scannerContainer.classList.add("hidden");
  studentContainer.classList.remove("hidden");
}

// Update student status
async function updateStudentStatus(newStatus) {
  if (!currentStudentId) return;

  showLoading();

  try {
    // Update in Firestore
    await db.collection("students").doc(currentStudentId).update({
      status: newStatus,
      updatedAt: new Date(),
    });

    // Add verification log
    await db.collection("verificationLogs").add({
      studentId: currentStudentId,
      status: newStatus,
      adminId: auth.currentUser.uid,
      adminEmail: auth.currentUser.email,
      timestamp: new Date(),
    });

    // Show success message
    alert(
      `Student ${
        newStatus === "Verified" ? "verified" : "rejected"
      } successfully`
    );

    // Reset scanner
    resetScanner();
  } catch (error) {
    console.error("Error updating status:", error);
    showError("Failed to update student status");
  }
}

// Reset scanner
function resetScanner() {
  currentStudentId = null;

  // Hide all containers
  hideLoading();
  studentContainer.classList.add("hidden");
  errorContainer.classList.add("hidden");

  // Show scanner container
  scannerContainer.classList.remove("hidden");

  // Reinitialize scanner
  if (html5QrCode) {
    html5QrCode.clear();
  }

  scannerInitialized = false;
  setTimeout(() => {
    initializeScanner();
  }, 1000);
}

// Show loading
function showLoading() {
  scannerContainer.classList.add("hidden");
  studentContainer.classList.add("hidden");
  errorContainer.classList.add("hidden");
  loadingContainer.classList.remove("hidden");
}

// Hide loading
function hideLoading() {
  loadingContainer.classList.add("hidden");
}

// Show error
function showError(message) {
  hideLoading();
  scannerContainer.classList.add("hidden");
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

tryAgainBtn.addEventListener("click", resetScanner);
