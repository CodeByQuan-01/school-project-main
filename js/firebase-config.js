// Import Firebase modules
import * as firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import "firebase/storage";

// Wait for environment variables to load before initializing Firebase
async function initializeFirebase() {
  try {
    // Load environment variables
    await window.envConfig.load();

    // Firebase configuration
    const firebaseConfig = {
      apiKey: await window.envConfig.get("FIREBASE_API_KEY"),
      authDomain: await window.envConfig.get("FIREBASE_AUTH_DOMAIN"),
      projectId: await window.envConfig.get("FIREBASE_PROJECT_ID"),
      storageBucket: await window.envConfig.get("FIREBASE_STORAGE_BUCKET"),
      messagingSenderId: await window.envConfig.get(
        "FIREBASE_MESSAGING_SENDER_ID"
      ),
      appId: await window.envConfig.get("FIREBASE_APP_ID"),
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    // Make Firebase services available globally
    window.db = firebase.firestore();
    window.auth = firebase.auth();
    window.storage = firebase.storage();

    // Cloudinary configuration
    window.cloudName = await window.envConfig.get("CLOUDINARY_CLOUD_NAME");
    window.uploadPreset = await window.envConfig.get(
      "CLOUDINARY_UPLOAD_PRESET"
    );

    console.log("Firebase initialized successfully");

    // Dispatch an event when Firebase is ready
    const event = new Event("firebase-ready");
    document.dispatchEvent(event);
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
}

// Initialize Firebase when the document is ready
document.addEventListener("DOMContentLoaded", initializeFirebase);
