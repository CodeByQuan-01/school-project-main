// Set current year in footer
document.getElementById("current-year").textContent = new Date().getFullYear();

// DOM Elements
const loadingElement = document.getElementById("loading");
const errorContainer = document.getElementById("error-container");
const errorMessage = document.getElementById("error-message");
const successContainer = document.getElementById("success-container");
const qrCodeCanvas = document.getElementById("qr-code");
const studentName = document.getElementById("student-name");
const studentMatric = document.getElementById("student-matric");
const studentFaculty = document.getElementById("student-faculty");
const studentDepartment = document.getElementById("student-department");
const downloadBtn = document.getElementById("download-btn");

// Check if we have student data
document.addEventListener("DOMContentLoaded", () => {
  const studentId = localStorage.getItem("studentId");
  const studentDataStr = localStorage.getItem("studentData");

  if (!studentId || !studentDataStr) {
    showError("Student data not found. Please register again.");
    return;
  }

  try {
    const studentData = JSON.parse(studentDataStr);
    generateQRCode(studentId, studentData);
    displayStudentData(studentData);
  } catch (error) {
    console.error("Error parsing student data:", error);
    showError("Failed to process student data. Please register again.");
  }
});

// Generate QR Code
function generateQRCode(studentId, studentData) {
  const qrData = JSON.stringify({
    id: studentId,
    matricNumber: studentData.matricNumber,
  });

  // Assuming QRCode is available globally or imported elsewhere. If not, you'll need to import it.
  // For example:
  // import QRCode from 'qrcode';
  // or include the qrcode library in your HTML.

  QRCode.toCanvas(
    qrCodeCanvas,
    qrData,
    {
      width: 300,
      margin: 2,
      color: {
        dark: "#213B94",
        light: "#FFFFFF",
      },
    },
    (error) => {
      if (error) {
        console.error("Error generating QR code:", error);
        showError("Failed to generate QR code. Please try again.");
        return;
      }

      // Show success container
      loadingElement.classList.add("hidden");
      successContainer.classList.remove("hidden");
    }
  );
}

// Display student data
function displayStudentData(studentData) {
  studentName.textContent = studentData.fullName;
  studentMatric.textContent = studentData.matricNumber;
  studentFaculty.textContent = studentData.faculty;
  studentDepartment.textContent = studentData.department;
}

// Show error message
function showError(message) {
  loadingElement.classList.add("hidden");
  errorContainer.classList.remove("hidden");
  errorMessage.textContent = message;
}

// Download QR Code
downloadBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = `qr-code-${studentMatric.textContent || "student"}.png`;
  link.href = qrCodeCanvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
