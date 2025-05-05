"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, CameraOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface Html5QrScannerProps {
  onScan: (result: string) => void;
}

export function Html5QrScanner({ onScan }: Html5QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );
  const [error, setError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "html5-qr-scanner";

  // Initialize scanner
  useEffect(() => {
    // Create scanner instance
    scannerRef.current = new Html5Qrcode(scannerContainerId);

    // Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setAvailableCameras(devices);
          // Select the back camera by default if available
          const backCamera = devices.find(
            (camera) =>
              camera.label.toLowerCase().includes("back") ||
              camera.label.toLowerCase().includes("rear")
          );
          setSelectedCameraId(backCamera?.id || devices[0].id);
        }
      })
      .catch((err) => {
        console.error("Error getting cameras", err);
        setError("Could not access camera list. Please check permissions.");
      });

    // Cleanup on unmount
    return () => {
      stopScanner();
    };
  }, []);

  // Start the scanner
  const startScanner = async () => {
    if (!scannerRef.current) return;

    setError(null);

    try {
      const cameraId =
        selectedCameraId ||
        (facingMode === "environment"
          ? { facingMode: "environment" }
          : { facingMode: "user" });

      await scannerRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        },
        (decodedText) => {
          // Success callback
          console.log("QR Code detected:", decodedText);
          onScan(decodedText);
          toast.success("QR Code Detected", {
            description: "Successfully scanned QR code",
          });
          stopScanner();
        },
        (errorMessage) => {
          // Error callback - we don't need to show these as they happen constantly during scanning
          // console.error("QR Code error:", errorMessage)
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error("Error starting scanner:", err);
      setError(`Could not start scanner: ${err.message || "Unknown error"}`);
      toast.error("Scanner Error", {
        description: "Could not start the QR scanner. Please try again.",
      });
    }
  };

  // Stop the scanner
  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current
        .stop()
        .then(() => {
          setIsScanning(false);
        })
        .catch((err) => {
          console.error("Error stopping scanner:", err);
        });
    } else {
      setIsScanning(false);
    }
  };

  // Toggle camera between front and back
  const toggleCamera = () => {
    const newFacingMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newFacingMode);

    if (isScanning) {
      stopScanner();
      setTimeout(() => {
        startScanner();
      }, 300);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b">
        <h3 className="font-medium">QR Code Scanner</h3>
        <div className="flex gap-2">
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
              className="flex items-center gap-1"
            >
              <Camera className="h-4 w-4" />
              Start
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={toggleCamera}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Flip
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
          <div id={scannerContainerId} className="w-full h-full"></div>

          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
              <Camera className="h-12 w-12 text-gray-300 mb-2" />
              <p className="text-gray-500">Click Start to begin scanning</p>
              {error && (
                <div className="mt-2 text-red-500 text-sm">{error}</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t">
        <p className="text-sm text-gray-500 text-center">
          Position the QR code within the scanner frame
        </p>
      </div>
    </Card>
  );
}
