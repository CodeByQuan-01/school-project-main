// Set current year in footer
document.getElementById("current-year").textContent = new Date().getFullYear();

// Wait for Firebase to be ready
document.addEventListener("firebase-ready", () => {
  // DOM Elements
  const facultySelect = document.getElementById("faculty");
  const departmentSelect = document.getElementById("department");
  const photoUploadArea = document.getElementById("photo-upload-area");
  const photoInput = document.getElementById("photo");
  const photoPreviewContainer = document.getElementById(
    "photo-preview-container"
  );
  const studentForm = document.getElementById("student-form");
  const submitBtn = document.getElementById("submit-btn");
  const loadingOverlay = document.getElementById("loading-overlay");
  const qrPreviewContainer = document.getElementById("qr-preview-container");
  const qrPreviewCanvas = document.getElementById("qr-preview");

  // Department data
  const departments = {
    Engineering: [
      "Computer Engineering",
      "Electrical Engineering",
      "Mechanical Engineering",
      "Civil Engineering",
    ],
    Science: [
      "Computer Science",
      "Physics",
      "Chemistry",
      "Biology",
      "Mathematics",
    ],
    Arts: ["English", "History", "Philosophy", "Languages"],
    "Social Sciences": [
      "Economics",
      "Psychology",
      "Sociology",
      "Political Science",
    ],
    Medicine: ["Medicine", "Nursing", "Pharmacy", "Public Health"],
    Law: ["Law"],
    Business: ["Accounting", "Finance", "Marketing", "Management"],
  };

  // Update departments based on selected faculty
  facultySelect.addEventListener("change", function () {
    const selectedFaculty = this.value;
    departmentSelect.innerHTML =
      '<option value="" disabled selected>Select your department</option>';

    if (selectedFaculty && departments[selectedFaculty]) {
      departments[selectedFaculty].forEach((dept) => {
        const option = document.createElement("option");
        option.value = dept;
        option.textContent = dept;
        departmentSelect.appendChild(option);
      });
      departmentSelect.disabled = false;
    } else {
      departmentSelect.disabled = true;
    }

    updateQRPreview();
  });

  // Handle photo upload
  photoUploadArea.addEventListener("click", () => {
    photoInput.click();
  });

  photoInput.addEventListener("change", function (e) {
    if (this.files && this.files[0]) {
      const file = this.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        photoPreviewContainer.innerHTML = `
          <div class="relative w-32 h-32">
            <img src="${e.target.result}" alt="Preview" class="w-full h-full object-cover rounded-md">
          </div>
        `;
      };

      reader.readAsDataURL(file);
      updateQRPreview();
    }
  });

  // Update QR preview as form is filled
  const formInputs = studentForm.querySelectorAll("input, select");
  formInputs.forEach((input) => {
    input.addEventListener("input", updateQRPreview);
    input.addEventListener("change", updateQRPreview);
  });

  function updateQRPreview() {
    const fullName = document.getElementById("fullName").value;
    const matricNumber = document.getElementById("matricNumber").value;

    if (fullName && matricNumber) {
      const previewData = {
        fullName,
        matricNumber,
        preview: true,
      };

      // Assuming QRCode is available globally or imported elsewhere
      if (typeof QRCode !== "undefined") {
        QRCode.toCanvas(
          qrPreviewCanvas,
          JSON.stringify(previewData),
          {
            width: 200,
            margin: 2,
            color: {
              dark: "#213B94",
              light: "#FFFFFF",
            },
          },
          (error) => {
            if (error) console.error(error);
          }
        );
      } else {
        console.error(
          "QRCode is not defined. Ensure it is properly imported or included."
        );
      }

      qrPreviewContainer.classList.remove("hidden");
    }
  }

  // Form submission
  studentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validate form
    if (!photoInput.files || !photoInput.files[0]) {
      alert("Please upload your passport photo");
      return;
    }

    // Show loading overlay
    loadingOverlay.classList.remove("hidden");
    submitBtn.disabled = true;

    try {
      // Upload photo to Cloudinary
      const photoFile = photoInput.files[0];
      const photoURL = await uploadToCloudinary(photoFile);

      // Create student data
      const studentData = {
        fullName: document.getElementById("fullName").value,
        matricNumber: document.getElementById("matricNumber").value,
        faculty: document.getElementById("faculty").value,
        department: document.getElementById("department").value,
        photoURL: photoURL,
        status: "Pending",
        createdAt: new Date(),
      };

      // Save to Firebase
      const docRef = await window.db.collection("students").add(studentData);

      // Store student ID in localStorage for QR code page
      localStorage.setItem("studentId", docRef.id);
      localStorage.setItem("studentData", JSON.stringify(studentData));

      // Redirect to QR code page
      window.location.href = "qr-code.html";
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred. Please try again.");
      loadingOverlay.classList.add("hidden");
      submitBtn.disabled = false;
    }
  });

  // Upload to Cloudinary function
  async function uploadToCloudinary(file) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", window.uploadPreset);

      fetch(
        `https://api.cloudinary.com/v1_1/${window.cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.secure_url) {
            resolve(data.secure_url);
          } else {
            reject(new Error("Failed to upload image"));
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
});
