"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, RefreshCw } from "lucide-react";

interface QrScannerProps {
  onScan: (result: string) => void;
}

export function QrScanner({ onScan }: QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-scanner";

  useEffect(() => {
    // Initialize scanner
    scannerRef.current = new Html5Qrcode(scannerContainerId);

    // Check if camera is available
    Html5Qrcode.getCameras()
      .then((devices) => {
        setHasCamera(devices.length > 0);
      })
      .catch((err) => {
        console.error("Error getting cameras", err);
        setHasCamera(false);
        setError("Camera access denied or no cameras found");
      });

    // Cleanup on unmount
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current
          .stop()
          .catch((err) => console.error("Error stopping scanner", err));
      }
    };
  }, []);

  const startScanner = async () => {
    if (!scannerRef.current) return;

    setError(null);
    setIsScanning(true);

    try {
      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          onScan(decodedText);
          // Don't stop scanning to allow multiple scans
        },
        (errorMessage) => {
          // Ignore errors during scanning
          console.log(errorMessage);
        }
      );
    } catch (err) {
      console.error("Error starting scanner", err);
      setIsScanning(false);
      setError("Failed to start camera. Please check permissions.");
    }
  };

  const stopScanner = async () => {
    if (!scannerRef.current) return;

    try {
      await scannerRef.current.stop();
      setIsScanning(false);
    } catch (err) {
      console.error("Error stopping scanner", err);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b">
        <h3 className="font-medium">QR Code Scanner</h3>
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
            disabled={!hasCamera}
            className="flex items-center gap-1"
          >
            <Camera className="h-4 w-4" />
            Start
          </Button>
        )}
      </div>

      <div className="relative">
        <div
          id={scannerContainerId}
          className="w-full aspect-square bg-gray-100 flex items-center justify-center"
        >
          {!isScanning && (
            <div className="text-center p-4">
              {hasCamera ? (
                <>
                  <Camera className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Click Start to begin scanning</p>
                </>
              ) : (
                <>
                  <CameraOff className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No camera available</p>
                </>
              )}

              {error && (
                <div className="mt-2 text-red-500 text-sm">{error}</div>
              )}
            </div>
          )}
        </div>

        {isScanning && (
          <div className="absolute inset-0 pointer-events-none border-2 border-[#66DE16] opacity-50">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-[#66DE16] rounded-lg"></div>
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
            onClick={() => {
              stopScanner().then(startScanner);
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Scanner
          </Button>
        )}
      </div>
    </Card>
  );
}
