// Import Firebase (replace with your actual Firebase config)
import * as firebase from "firebase/app";
import "firebase/auth";

// Initialize Firebase (replace with your actual Firebase config)
const firebaseConfig = {
  // Your Firebase configuration object here
  // Example:
  // apiKey: "YOUR_API_KEY",
  // authDomain: "YOUR_AUTH_DOMAIN",
  // projectId: "YOUR_PROJECT_ID",
  // storageBucket: "YOUR_STORAGE_BUCKET",
  // messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  // appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);

// Set current year in footer
document.getElementById("current-year").textContent = new Date().getFullYear();

// Initialize Firebase Auth
const auth = firebase.auth();

// DOM Elements
const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const errorAlert = document.getElementById("error-alert");
const loadingOverlay = document.getElementById("loading-overlay");

// Check if user is already logged in
auth.onAuthStateChanged((user) => {
  if (user) {
    // User is signed in, redirect to dashboard
    window.location.href = "dashboard.html";
  }
});

// Login form submission
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = emailInput.value;
  const password = passwordInput.value;

  // Show loading overlay
  loadingOverlay.classList.remove("hidden");
  loginBtn.disabled = true;
  errorAlert.classList.add("hidden");

  // Sign in with Firebase
  auth
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      // Handle errors
      loadingOverlay.classList.add("hidden");
      loginBtn.disabled = false;

      let errorMessage = "Failed to login. Please try again.";

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        errorMessage = "Invalid email or password";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage =
          "Too many failed login attempts. Please try again later.";
      }

      errorAlert.textContent = errorMessage;
      errorAlert.classList.remove("hidden");
    });
});
