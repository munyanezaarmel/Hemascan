"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, AlertTriangle } from "lucide-react";
import { SimpleCamera } from "./simple-camera";
import { Button } from "@/components/ui/button";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onError?: (error: string) => void;
}

export function CameraCapture({ onCapture, onError }: CameraCaptureProps) {
  const [showFallback, setShowFallback] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);

  useEffect(() => {
    // Check if camera is available
    const checkCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );

        if (videoDevices.length === 0) {
          throw new Error("No camera detected");
        }

        // Try to get camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        stream.getTracks().forEach((track) => track.stop()); // Clean up

        setHasCamera(true);
      } catch (error) {
        console.error("Camera access error:", error);
        handleError(
          "Camera initialization failed: " + (error as Error).message
        );
      }
    };

    checkCamera();
  }, []);

  const handleError = (error: string) => {
    onError?.(error);
    setShowFallback(true);
  };

  // If no camera is detected, show fallback immediately
  useEffect(() => {
    if (!hasCamera) {
      setShowFallback(true);
    }
  }, [hasCamera]);

  if (showFallback) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Camera access failed. Using simplified camera interface.
          </AlertDescription>
        </Alert>
        <SimpleCamera onCapture={onCapture} onError={onError} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Camera className="mr-2 h-5 w-5" />
              Camera Interface
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFallback(true)}
            >
              Use Simple Camera
            </Button>
          </CardTitle>
          <CardDescription>
            Advanced camera with quality checks and voice guidance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
            <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Camera Not Available
            </p>
            <p className="text-sm text-gray-600 mb-4">
              The advanced camera interface is currently unavailable. Please use
              the simple camera or upload an image instead.
            </p>
            <div className="flex space-x-2 justify-center">
              <Button onClick={() => setShowFallback(true)} variant="outline">
                <Camera className="mr-2 h-4 w-4" />
                Simple Camera
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
