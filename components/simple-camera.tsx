"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, AlertTriangle, RefreshCw, Eye, X } from "lucide-react";

interface SimpleCameraProps {
  onCapture: (imageData: string) => void;
  onError?: (error: string) => void;
}

export function SimpleCamera({ onCapture, onError }: SimpleCameraProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [videoReady, setVideoReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const addDebugInfo = (info: string) => {
    setDebugInfo((prev) => [
      ...prev.slice(-4),
      `${new Date().toLocaleTimeString()}: ${info}`,
    ]);
    console.log(`Debug: ${info}`);
  };

  const checkCameraSupport = useCallback(async () => {
    addDebugInfo("Checking camera support...");

    if (!navigator.mediaDevices) {
      addDebugInfo("❌ navigator.mediaDevices not supported");
      return false;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      addDebugInfo(`✅ Found ${videoDevices.length} video devices`);

      return videoDevices.length > 0;
    } catch (err: any) {
      addDebugInfo(`⚠️ Device enumeration failed: ${err.message}`);
      return true; // Assume cameras exist if we can't check
    }
  }, []);

  const startCamera = useCallback(async () => {
    setIsStarting(true);
    setError(null);
    setVideoReady(false);
    addDebugInfo("🚀 Starting camera...");

    try {
      const hasSupport = await checkCameraSupport();
      if (!hasSupport) {
        throw new Error("No camera devices found");
      }

      if (stream) {
        addDebugInfo("🔄 Stopping existing stream");
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }

      // Try different camera access strategies
      let mediaStream: MediaStream | null = null;

      try {
        addDebugInfo("📹 Attempting camera access...");
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        addDebugInfo("✅ Camera access successful");
      } catch (err: any) {
        addDebugInfo(`❌ Initial camera access failed: ${err.message}`);

        // Fallback to basic constraints
        addDebugInfo("📹 Trying basic video constraints...");
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setStream(mediaStream);
      addDebugInfo("🎥 Stream obtained");

      if (videoRef.current && mediaStream) {
        const video = videoRef.current;
        
        // Clear any existing source
        video.srcObject = null;
        
        // Set up event handlers before setting srcObject
        const handleLoadedMetadata = () => {
          addDebugInfo(
            `📺 Video loaded - dimensions: ${video.videoWidth}x${video.videoHeight}`
          );
          addDebugInfo(`📺 Video readyState: ${video.readyState}`);
          setVideoReady(true);
        };

        const handleCanPlay = () => {
          addDebugInfo("🎬 Video can play");
          video.play().catch((err) => {
            addDebugInfo(`⚠️ Play failed: ${err.message}`);
          });
        };

        const handlePlay = () => {
          addDebugInfo("▶️ Video playing");
        };

        const handleError = (e: any) => {
          addDebugInfo(`💥 Video error: ${e.message || 'Unknown error'}`);
          console.error("Video error:", e);
        };

        // Add event listeners
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('play', handlePlay);
        video.addEventListener('error', handleError);

        // Set video properties
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        
        // Set the stream
        video.srcObject = mediaStream;
        
        addDebugInfo("⌛ Video srcObject set, waiting for events...");

        // Wait for video to be ready with timeout
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            addDebugInfo("⏰ Video load timeout");
            reject(new Error("Video load timeout"));
          }, 10000);

          const checkReady = () => {
            if (video.readyState >= 2) { // HAVE_CURRENT_DATA
              clearTimeout(timeout);
              addDebugInfo(`✅ Video ready (readyState: ${video.readyState})`);
              resolve(void 0);
            } else {
              setTimeout(checkReady, 100);
            }
          };

          checkReady();
        });

        // Force play if not already playing
        if (video.paused) {
          try {
            await video.play();
            addDebugInfo("▶️ Video playback forced");
          } catch (err: any) {
            addDebugInfo(`⚠️ Force play failed: ${err.message}`);
          }
        }
      }
    } catch (err: any) {
      addDebugInfo(`💥 Camera error: ${err.message}`);
      const errorMsg = `Camera access failed: ${err.message}`;
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsStarting(false);
    }
  }, [stream, onError, checkCameraSupport]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setError(null);
    setVideoReady(false);
  }, [stream]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !stream) {
      setError("Cannot capture - Camera not ready. Please start the camera first.");
      return;
    }

    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Set canvas size to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw the video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64 image
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedImage(imageData);

        addDebugInfo("📸 Image captured successfully");
      }
    } catch (err) {
      console.error("Capture error:", err);
      setError("Failed to capture image. Please try again.");
    } finally {
      setIsCapturing(false);
    }
  }, [stream]);

  const confirmCapture = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
      stopCamera();
    }
  }, [capturedImage, onCapture, stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Camera className="mr-2 h-5 w-5" />
            Camera Capture
          </CardTitle>
          <CardDescription>
            Use your device camera to take a photo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera Display */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {capturedImage ? (
              // Show captured image
              <div className="relative w-full h-full">
                <img
                  src={capturedImage}
                  alt="Captured image"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="bg-white/90 rounded-lg p-4 text-center">
                    <Eye className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                    <p className="text-sm font-medium text-gray-900">
                      Image Captured
                    </p>
                    <p className="text-xs text-gray-600">
                      Review and confirm below
                    </p>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full text-white p-4">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-400" />
                  <p className="text-sm mb-3">{error}</p>
                  <Button onClick={startCamera} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </div>
            ) : stream ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ 
                    backgroundColor: '#000',
                    transform: 'scaleX(-1)' // Mirror the video
                  }}
                />
                {videoReady && (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-40 h-28 border-2 border-white/50 rounded-lg flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white/70" />
                      </div>
                    </div>
                    <div className="absolute top-4 left-4">
                      <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                        Camera Active
                      </div>
                    </div>
                  </>
                )}
                {!videoReady && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-center">
                      <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                      <p className="text-sm">Loading video...</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm mb-3">Camera not started</p>
                  <Button
                    onClick={startCamera}
                    disabled={isStarting}
                    className="bg-white text-black hover:bg-gray-100"
                  >
                    {isStarting ? "Starting..." : "Start Camera"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/* Controls */}
          <div className="flex space-x-2">
            {capturedImage ? (
              <>
                <Button
                  onClick={confirmCapture}
                  className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Use This Image
                </Button>
                <Button onClick={retakePhoto} variant="outline">
                  <X className="mr-2 h-4 w-4" />
                  Retake
                </Button>
              </>
            ) : stream && videoReady ? (
              <>
                <Button
                  onClick={captureImage}
                  disabled={isCapturing}
                  className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {isCapturing ? "Capturing..." : "Capture Photo"}
                </Button>
                <Button onClick={stopCamera} variant="outline">
                  Stop
                </Button>
              </>
            ) : (
              <Button
                onClick={startCamera}
                disabled={isStarting}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
              >
                <Camera className="mr-2 h-4 w-4" />
                {isStarting ? "Starting Camera..." : "Start Camera"}
              </Button>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
                {error.includes("permission") && (
                  <div className="mt-2 text-xs">
                    <p>To enable camera:</p>
                    <ol className="list-decimal list-inside mt-1">
                      <li>
                        Click the camera icon in your browser's address bar
                      </li>
                      <li>Select "Allow" for camera permissions</li>
                      <li>Refresh the page and try again</li>
                    </ol>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Debug Panel */}
          {debugInfo.length > 0 && (
            <Card className="mt-4 bg-gray-50">
              <CardHeader className="py-2">
                <CardTitle className="text-sm">Debug Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-xs font-mono">
                  {debugInfo.map((info, index) => (
                    <div key={index} className="text-gray-600">
                      {info}
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => setDebugInfo([])}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Clear Debug
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}