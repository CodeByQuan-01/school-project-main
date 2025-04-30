// Set current year in footer
document.getElementById("current-year").textContent = new Date().getFullYear();

// Initialize Firebase services
const firebase = window.firebase; // Access Firebase from the global scope
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const logoutBtn = document.getElementById("logout-btn");
const totalStudentsEl = document.getElementById("total-students");
const verifiedStudentsEl = document.getElementById("verified-students");
const pendingStudentsEl = document.getElementById("pending-students");
const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");
const facultyFilter = document.getElementById("faculty-filter");
const exportBtn = document.getElementById("export-btn");
const loadingStudents = document.getElementById("loading-students");
const noStudents = document.getElementById("no-students");
const studentsTableContainer = document.getElementById(
  "students-table-container"
);
const studentsTableBody = document.getElementById("students-table-body");
const statusModal = document.getElementById("status-modal");
const studentNameModal = document.getElementById("student-name-modal");
const newStatusModal = document.getElementById("new-status-modal");
const cancelStatusBtn = document.getElementById("cancel-status-btn");
const confirmStatusBtn = document.getElementById("confirm-status-btn");

// Variables
let allStudents = [];
let filteredStudents = [];
let currentStudentId = null;
let currentNewStatus = null;

// Check if user is logged in
auth.onAuthStateChanged((user) => {
  if (!user) {
    // User is not signed in, redirect to login
    window.location.href = "index.html";
  } else {
    // User is signed in, fetch students
    fetchStudents();
  }
});

// Logout
logoutBtn.addEventListener("click", () => {
  auth
    .signOut()
    .then(() => {
      window.location.href = "index.html";
    })
    .catch((error) => {
      console.error("Error signing out:", error);
    });
});

// Fetch students
async function fetchStudents() {
  try {
    const snapshot = await db
      .collection("students")
      .orderBy("createdAt", "desc")
      .get();

    allStudents = [];
    snapshot.forEach((doc) => {
      allStudents.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Update counters
    updateCounters();

    // Populate faculty filter
    populateFacultyFilter();

    // Apply initial filters
    applyFilters();

    // Hide loading, show table if we have students
    loadingStudents.classList.add("hidden");
    if (allStudents.length > 0) {
      studentsTableContainer.classList.remove("hidden");
      noStudents.classList.add("hidden");
    } else {
      studentsTableContainer.classList.add("hidden");
      noStudents.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Error fetching students:", error);
    loadingStudents.classList.add("hidden");
    noStudents.classList.remove("hidden");
    noStudents.querySelector("p").textContent =
      "Error loading student records.";
  }
}

// Update counters
function updateCounters() {
  totalStudentsEl.textContent = allStudents.length;
  verifiedStudentsEl.textContent = allStudents.filter(
    (s) => s.status === "Verified"
  ).length;
  pendingStudentsEl.textContent = allStudents.filter(
    (s) => s.status === "Pending"
  ).length;
}

// Populate faculty filter
function populateFacultyFilter() {
  const faculties = [...new Set(allStudents.map((student) => student.faculty))];

  // Clear existing options except the first one
  while (facultyFilter.options.length > 1) {
    facultyFilter.remove(1);
  }

  // Add faculty options
  faculties.forEach((faculty) => {
    if (faculty) {
      const option = document.createElement("option");
      option.value = faculty;
      option.textContent = faculty;
      facultyFilter.appendChild(option);
    }
  });
}

// Apply filters
function applyFilters() {
  const searchTerm = searchInput.value.toLowerCase();
  const statusValue = statusFilter.value;
  const facultyValue = facultyFilter.value;

  filteredStudents = allStudents.filter((student) => {
    // Search filter
    const matchesSearch =
      searchTerm === "" ||
      (student.fullName &&
        student.fullName.toLowerCase().includes(searchTerm)) ||
      (student.matricNumber &&
        student.matricNumber.toLowerCase().includes(searchTerm));

    // Status filter
    const matchesStatus =
      statusValue === "all" || student.status === statusValue;

    // Faculty filter
    const matchesFaculty =
      facultyValue === "all" || student.faculty === facultyValue;

    return matchesSearch && matchesStatus && matchesFaculty;
  });

  renderStudentsTable();
}

// Render students table
function renderStudentsTable() {
  studentsTableBody.innerHTML = "";

  if (filteredStudents.length === 0) {
    studentsTableContainer.classList.add("hidden");
    noStudents.classList.remove("hidden");
    return;
  }

  studentsTableContainer.classList.remove("hidden");
  noStudents.classList.add("hidden");

  filteredStudents.forEach((student) => {
    const row = document.createElement("tr");

    // Format date
    let createdDate = "N/A";
    if (student.createdAt) {
      const date =
        student.createdAt instanceof Date
          ? student.createdAt
          : new Date(student.createdAt.seconds * 1000);
      createdDate = date.toLocaleDateString();
    }

    // Status class
    let statusClass = "bg-yellow-100 text-yellow-800";
    if (student.status === "Verified") {
      statusClass = "bg-green-100 text-green-800";
    } else if (student.status === "Rejected") {
      statusClass = "bg-red-100 text-red-800";
    }

    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <div class="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
            ${
              student.photoURL
                ? `<img src="${student.photoURL}" alt="${student.fullName}" class="h-full w-full object-cover">`
                : `<svg xmlns="http://www.w3.org/2000/svg" class="h-full w-full p-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>`
            }
          </div>
          <div class="ml-4">
            <div class="text-sm font-medium text-gray-900">${
              student.fullName || "N/A"
            }</div>
            <div class="text-xs text-gray-500">Registered: ${createdDate}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${student.matricNumber || "N/A"}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${student.faculty || "N/A"}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${student.department || "N/A"}
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
          ${student.status || "Pending"}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div class="flex space-x-2">
          <a href="scanner.html?verify=${
            student.id
          }" class="text-deep-blue hover:text-deep-blue/80" title="Scan QR Code">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1   d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1v-2a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </a>
          <button class="text-green-600 hover:text-green-800 verify-btn" data-id="${
            student.id
          }" data-name="${student.fullName || "this student"}" title="Verify">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button class="text-red-600 hover:text-red-800 reject-btn" data-id="${
            student.id
          }" data-name="${student.fullName || "this student"}" title="Reject">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button class="text-yellow-600 hover:text-yellow-800 pending-btn" data-id="${
            student.id
          }" data-name="${
      student.fullName || "this student"
    }" title="Mark as Pending">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <a href="student.html?id=${
            student.id
          }" class="text-deep-blue hover:text-deep-blue/80" title="View Details">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </a>
        </div>
      </td>
    `;

    studentsTableBody.appendChild(row);
  });

  // Add event listeners to action buttons
  addActionButtonListeners();
}

// Add event listeners to action buttons
function addActionButtonListeners() {
  // Verify buttons
  document.querySelectorAll(".verify-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const studentId = this.getAttribute("data-id");
      const studentName = this.getAttribute("data-name");
      showStatusModal(studentId, studentName, "Verified");
    });
  });

  // Reject buttons
  document.querySelectorAll(".reject-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const studentId = this.getAttribute("data-id");
      const studentName = this.getAttribute("data-name");
      showStatusModal(studentId, studentName, "Rejected");
    });
  });

  // Pending buttons
  document.querySelectorAll(".pending-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const studentId = this.getAttribute("data-id");
      const studentName = this.getAttribute("data-name");
      showStatusModal(studentId, studentName, "Pending");
    });
  });
}

// Show status update modal
function showStatusModal(studentId, studentName, newStatus) {
  currentStudentId = studentId;
  currentNewStatus = newStatus;

  studentNameModal.textContent = studentName;
  newStatusModal.textContent = newStatus;

  // Set status color
  if (newStatus === "Verified") {
    newStatusModal.className = "font-semibold text-green-600";
  } else if (newStatus === "Rejected") {
    newStatusModal.className = "font-semibold text-red-600";
  } else {
    newStatusModal.className = "font-semibold text-yellow-600";
  }

  statusModal.classList.remove("hidden");
}

// Hide status modal
function hideStatusModal() {
  statusModal.classList.add("hidden");
  currentStudentId = null;
  currentNewStatus = null;
}

// Update student status
async function updateStudentStatus(studentId, newStatus) {
  try {
    // Update in Firestore
    await db.collection("students").doc(studentId).update({
      status: newStatus,
      updatedAt: new Date(),
    });

    // Add verification log
    await db.collection("verificationLogs").add({
      studentId: studentId,
      status: newStatus,
      adminId: auth.currentUser.uid,
      adminEmail: auth.currentUser.email,
      timestamp: new Date(),
    });

    // Update local data
    const studentIndex = allStudents.findIndex((s) => s.id === studentId);
    if (studentIndex !== -1) {
      allStudents[studentIndex].status = newStatus;
      updateCounters();
      applyFilters();
    }

    return true;
  } catch (error) {
    console.error("Error updating status:", error);
    return false;
  }
}

// Export data to CSV
function exportToCSV() {
  const headers = [
    "ID",
    "Full Name",
    "Matric Number",
    "Faculty",
    "Department",
    "Status",
    "Created At",
  ];

  const csvRows = [
    headers.join(","),
    ...filteredStudents.map((student) => {
      const createdAt =
        student.createdAt instanceof Date
          ? student.createdAt.toLocaleString()
          : student.createdAt && student.createdAt.seconds
          ? new Date(student.createdAt.seconds * 1000).toLocaleString()
          : "N/A";

      return [
        student.id,
        `"${student.fullName || ""}"`,
        `"${student.matricNumber || ""}"`,
        `"${student.faculty || ""}"`,
        `"${student.department || ""}"`,
        `"${student.status || ""}"`,
        `"${createdAt}"`,
      ].join(",");
    }),
  ];

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `students_export_${new Date().toISOString()}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Event Listeners
searchInput.addEventListener("input", applyFilters);
statusFilter.addEventListener("change", applyFilters);
facultyFilter.addEventListener("change", applyFilters);
exportBtn.addEventListener("click", exportToCSV);

// Status modal buttons
cancelStatusBtn.addEventListener("click", hideStatusModal);
confirmStatusBtn.addEventListener("click", async () => {
  if (currentStudentId && currentNewStatus) {
    confirmStatusBtn.disabled = true;
    confirmStatusBtn.textContent = "Processing...";

    const success = await updateStudentStatus(
      currentStudentId,
      currentNewStatus
    );

    if (success) {
      hideStatusModal();
    } else {
      alert("Failed to update status. Please try again.");
      confirmStatusBtn.disabled = false;
      confirmStatusBtn.textContent = "Confirm";
    }
  }
});
