"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Camera,
  CameraOff,
  RefreshCw,
  AlertCircle,
  FlipHorizontal,
} from "lucide-react";

interface QrScannerProps {
  onScan: (result: string) => void;
}

export function QrScanner({ onScan }: QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<any>(null);

  // Initialize component
  useEffect(() => {
    // Get available cameras
    const getCameras = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true }); // Request initial permission
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );

        console.log("Available cameras:", videoDevices);
        setCameras(videoDevices);

        // Default to back camera if available (for mobile)
        const backCameraIndex = videoDevices.findIndex(
          (device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("environment")
        );

        if (backCameraIndex >= 0) {
          setCurrentCameraIndex(backCameraIndex);
        }
      } catch (err) {
        console.error("Error getting cameras:", err);
        setError("Camera access denied or no cameras found");
      }
    };

    getCameras();

    // Import QrCode scanner library dynamically
    const importQrScanner = async () => {
      try {
        const QrScannerLib = (await import("qr-scanner")).default;
        window.QrScanner = QrScannerLib;
        console.log("QR Scanner library loaded successfully");
      } catch (err) {
        console.error("Failed to import QR Scanner:", err);
        setError("Failed to load QR scanner library");
      }
    };

    importQrScanner();

    // Cleanup on unmount
    return () => {
      stopScanner();
    };
  }, []);

  // Start the scanner with selected camera
  const startScanner = async () => {
    if (!window.QrScanner || !videoRef.current) {
      setError("QR scanner not ready. Please try again.");
      return;
    }

    // Stop any existing scanner
    stopScanner();
    setError(null);

    try {
      const selectedCamera = cameras[currentCameraIndex];
      console.log("Starting scanner with camera:", selectedCamera);

      // Create new scanner instance
      scannerRef.current = new window.QrScanner(
        videoRef.current,
        (result) => {
          console.log("QR code detected:", result);
          if (result && result.data) {
            onScan(result.data);
          }
        },
        {
          returnDetailedScanResult: true,
          preferredCamera: selectedCamera?.deviceId,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5,
        }
      );

      await scannerRef.current.start();
      setIsScanning(true);
      console.log("Scanner started successfully");
    } catch (err) {
      console.error("Error starting scanner:", err);
      setError(`Failed to start camera: ${err.message || "Unknown error"}`);
    }
  };

  // Stop the scanner
  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
        console.log("Scanner stopped");
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setIsScanning(false);
  };

  // Switch to next camera
  const switchCamera = () => {
    if (cameras.length <= 1) return;

    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);

    if (isScanning) {
      stopScanner();
      setTimeout(() => startScanner(), 300);
    }
  };

  // Reset the scanner
  const resetScanner = () => {
    stopScanner();
    setTimeout(() => startScanner(), 300);
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b">
        <h3 className="font-medium">QR Code Scanner</h3>
        <div className="flex gap-2">
          {cameras.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={switchCamera}
              className="flex items-center gap-1"
              disabled={!isScanning}
            >
              <FlipHorizontal className="h-4 w-4" />
              Switch Camera
            </Button>
          )}

          {isScanning ? (
            <Button
              variant="outline"
              size="sm"
              onClick={stopScanner}
              className="flex items-center gap-1"
            >
              <CameraOff className="h-4 w-4" />
              Stop
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={startScanner}
              disabled={cameras.length === 0 || !window.QrScanner}
              className="flex items-center gap-1"
            >
              <Camera className="h-4 w-4" />
              Start
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        <div className="w-full aspect-square bg-black flex items-center justify-center">
          {/* Video element is always in the DOM for better camera handling */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            style={{ display: isScanning ? "block" : "none" }}
          ></video>

          {/* Placeholder when not scanning */}
          {!isScanning && (
            <div className="text-center p-4 text-white">
              {cameras.length > 0 ? (
                <>
                  <Camera className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-300">Click Start to begin scanning</p>
                  {cameras.length > 0 && (
                    <p className="text-gray-400 text-xs mt-2">
                      Camera:{" "}
                      {cameras[currentCameraIndex]?.label ||
                        `Camera ${currentCameraIndex + 1}`}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <CameraOff className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-300">No camera available</p>
                </>
              )}

              {error && (
                <div className="mt-2 text-red-400 text-sm flex items-center justify-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scanner frame overlay */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-[#66DE16] rounded-lg"></div>
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <p className="text-sm text-gray-500 text-center">
          Position the QR code within the scanner frame
        </p>

        {isScanning && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-[#213B94]"
            onClick={resetScanner}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Scanner
          </Button>
        )}
      </div>
    </Card>
  );
}

// Add type definitions
declare global {
  interface Window {
    QrScanner: any;
  }
}
