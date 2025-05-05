"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, Upload } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";

// Firebase modules - imported dynamically with proper error handling
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// Faculties and departments
const faculties = [
  {
    id: "engineering",
    name: "Engineering",
    departments: [
      "Computer Engineering",
      "Electrical Engineering",
      "Mechanical Engineering",
      "Civil Engineering",
    ],
  },
  {
    id: "science",
    name: "Science",
    departments: [
      "Computer Science",
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
    ],
  },
  {
    id: "arts",
    name: "Arts",
    departments: ["English", "History", "Philosophy", "Languages"],
  },
  {
    id: "business",
    name: "Business",
    departments: ["Accounting", "Finance", "Marketing", "Management"],
  },
  {
    id: "medicine",
    name: "Medicine",
    departments: ["Medicine", "Nursing", "Pharmacy", "Public Health"],
  },
];

export default function StudentPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [db, setDb] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    matricNumber: "",
    faculty: "",
    department: "",
    photo: null,
    photoPreview: "",
  });

  const [availableDepartments, setAvailableDepartments] = useState([]);

  // Initialize Firebase on component mount
  useEffect(() => {
    try {
      // Firebase configuration
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };

      // Check if all required Firebase config values are present
      const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"];
      const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key]);

      if (missingKeys.length > 0) {
        console.error(`Missing Firebase config: ${missingKeys.join(", ")}`);
        toast.error("Firebase Configuration Error", {
          description:
            "Firebase is not properly configured. Please check your environment variables.",
        });
        return;
      }

      // Initialize Firebase
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      setDb(firestore);
      setFirebaseInitialized(true);
      console.log("Firebase initialized successfully");
    } catch (error) {
      console.error("Firebase initialization error:", error);
      toast.error("Firebase Error", {
        description:
          "Could not initialize Firebase. Please check your configuration.",
      });
    }
  }, []);

  const handleFacultyChange = (value) => {
    const faculty = faculties.find((f) => f.id === value);
    setFormData({
      ...formData,
      faculty: value,
      department: "",
    });

    if (faculty) {
      setAvailableDepartments(faculty.departments);
    } else {
      setAvailableDepartments([]);
    }
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target) {
          setFormData({
            ...formData,
            photo: file,
            photoPreview: event.target.result,
          });
        }
      };

      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (
        !formData.fullName ||
        !formData.matricNumber ||
        !formData.faculty ||
        !formData.department ||
        !formData.photo
      ) {
        toast.error("Missing Information", {
          description: "Please fill in all fields and upload a photo",
        });
        setLoading(false);
        return;
      }

      // Check Firebase initialization
      if (!firebaseInitialized || !db) {
        toast.error("System Error", {
          description:
            "Database not initialized. Please refresh and try again.",
        });
        setLoading(false);
        return;
      }

      // For development/testing, skip Cloudinary if not configured
      let photoUrl = "";

      // Check if Cloudinary is configured
      if (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
        try {
          // Upload image to Cloudinary
          const cloudinaryData = new FormData();
          cloudinaryData.append("file", formData.photo);
          cloudinaryData.append("upload_preset", "StudentQr");

          const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;

          console.log("Uploading to Cloudinary...");
          const cloudinaryResponse = await fetch(cloudinaryUrl, {
            method: "POST",
            body: cloudinaryData,
          });

          if (!cloudinaryResponse.ok) {
            const errorText = await cloudinaryResponse.text();
            console.error("Cloudinary upload failed:", errorText);
            throw new Error(
              `Cloudinary upload failed: ${cloudinaryResponse.status}`
            );
          }

          const cloudinaryResult = await cloudinaryResponse.json();
          console.log("Cloudinary upload successful:", cloudinaryResult);

          if (!cloudinaryResult || !cloudinaryResult.secure_url) {
            throw new Error("Invalid response from image upload service");
          }

          photoUrl = cloudinaryResult.secure_url;
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error("Upload Failed", {
            description: "Failed to upload image. Please try again.",
          });
          setLoading(false);
          return;
        }
      } else {
        // For development/testing without Cloudinary
        console.log("Cloudinary not configured, using photo preview as URL");
        photoUrl = formData.photoPreview;
      }

      // Save to Firebase
      console.log("Saving to Firebase...");
      const facultyName =
        faculties.find((f) => f.id === formData.faculty)?.name || "";

      // Create student document
      const studentData = {
        fullName: formData.fullName,
        matricNumber: formData.matricNumber,
        faculty: facultyName,
        department: formData.department,
        photoUrl: photoUrl,
        status: "Pending",
        createdAt: serverTimestamp(),
      };

      console.log("Student data to save:", studentData);

      try {
        // Attempt to add the document to Firestore
        const docRef = await addDoc(collection(db, "students"), studentData);
        console.log("Document written with ID: ", docRef.id);

        setStudentId(docRef.id);
        setStep(2);

        toast.success("Success!", {
          description: "Your QR code has been generated successfully",
        });
      } catch (firestoreError) {
        console.error("Firestore error details:", firestoreError);
        toast.error("Database Error", {
          description: "Could not save your information. Please try again.",
        });
      }
    } catch (error) {
      console.error("General error:", error);
      toast.error("Error", {
        description:
          "There was an error processing your request. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById("qr-code");
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${formData.matricNumber}_qrcode.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <header className="bg-[#213B94] text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold">
            University QR Verification
          </h1>
          <Button
            variant="ghost"
            className="text-white hover:bg-[#213B94]/80"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="max-w-md mx-auto">
          {step === 1 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-[#1B1F3B]">
                  Student Registration
                </CardTitle>
                <CardDescription>
                  Enter your details to generate a QR code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="matricNumber">Matric Number</Label>
                    <Input
                      id="matricNumber"
                      placeholder="UNI/2023/001"
                      value={formData.matricNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          matricNumber: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="faculty">Faculty</Label>
                    <Select
                      value={formData.faculty}
                      onValueChange={handleFacultyChange}
                    >
                      <SelectTrigger id="faculty">
                        <SelectValue placeholder="Select Faculty" />
                      </SelectTrigger>
                      <SelectContent>
                        {faculties.map((faculty) => (
                          <SelectItem key={faculty.id} value={faculty.id}>
                            {faculty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) =>
                        setFormData({ ...formData, department: value })
                      }
                      disabled={!formData.faculty}
                    >
                      <SelectTrigger id="department">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDepartments.map((department) => (
                          <SelectItem key={department} value={department}>
                            {department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photo">Passport Photo</Label>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-center">
                      <div className="flex items-center justify-center">
                        <label
                          htmlFor="photo"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-gray-500" />
                            <p className="text-xs text-gray-500">
                              Click to upload
                            </p>
                          </div>
                          <input
                            id="photo"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoChange}
                            required
                          />
                        </label>
                      </div>

                      {formData.photoPreview && (
                        <div className="relative h-32 w-full overflow-hidden rounded-lg border border-gray-200">
                          <img
                            src={formData.photoPreview || "/placeholder.svg"}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#213B94] hover:bg-[#213B94]/90"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Generate QR Code"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-[#1B1F3B]">Your QR Code</CardTitle>
                <CardDescription>
                  Keep this QR code for verification
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                  <QRCodeCanvas
                    id="qr-code"
                    value={studentId}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="text-center mb-4">
                  <p className="font-medium text-[#1B1F3B]">
                    {formData.fullName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formData.matricNumber}
                  </p>
                  <p className="text-sm text-gray-500">
                    {faculties.find((f) => f.id === formData.faculty)?.name} -{" "}
                    {formData.department}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  onClick={downloadQRCode}
                  className="w-full bg-[#66DE16] hover:bg-[#66DE16]/90 text-[#1B1F3B]"
                >
                  Download QR Code
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="w-full"
                >
                  Return to Home
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </main>

      <footer className="bg-[#213B94] text-white p-6 mt-8">
        <div className="container mx-auto text-center">
          <p>© {new Date().getFullYear()} University QR Verification System</p>
        </div>
      </footer>
    </div>
  );
}
