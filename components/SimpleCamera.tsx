import React, { useRef, useEffect, useState } from 'react';
import { Camera } from 'lucide-react';

interface SimpleCameraFeedProps {
  onCapture: (dataUrl: string) => void;
}

const SimpleCameraFeed: React.FC<SimpleCameraFeedProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('Initializing...');
  const [eyePosition, setEyePosition] = useState({ x: 320, y: 240 });
  const [faceDetected, setFaceDetected] = useState(false);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsLoading(false);
          setStatus('Camera ready');
          initFaceDetection();
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setStatus('Camera access denied');
      }
    };

    initCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const initFaceDetection = async () => {
    try {
      // Use a more reliable CDN for MediaPipe
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js';
      script.onload = () => {
        if (window.FaceMesh) {
          console.log('MediaPipe FaceMesh loaded successfully');
          const faceMesh = new window.FaceMesh({
            locateFile: (file: string) => `https://unpkg.com/@mediapipe/face_mesh@0.4.1633559619/${file}`
          });

          faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          });

          faceMesh.onResults((results: any) => {
            processResults(results);
          });

          const processFrame = async () => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
              try {
                await faceMesh.send({ image: videoRef.current });
              } catch (error) {
                console.log('Frame processing error:', error);
              }
            }
          };

          const interval = setInterval(processFrame, 100);
          return () => clearInterval(interval);
        }
      };
      script.onerror = () => {
        console.log('MediaPipe failed to load, using center position');
        setStatus('Camera ready - Manual positioning');
        setFaceDetected(true);
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('MediaPipe initialization error:', error);
      setStatus('Camera ready - Manual positioning');
      setFaceDetected(true);
    }
  };

  const processResults = (results: any) => {
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      setFaceDetected(true);
      const landmarks = results.multiFaceLandmarks[0];
      
      // Get left eye center (landmark 468 is left eye center)
      const leftEyeCenter = landmarks[468] || landmarks[33]; // fallback to another eye landmark
      if (leftEyeCenter && videoRef.current) {
        const eyeX = leftEyeCenter.x * videoRef.current.videoWidth;
        const eyeY = leftEyeCenter.y * videoRef.current.videoHeight;
        setEyePosition({ x: eyeX, y: eyeY });
        setStatus('Eye detected - Ready to capture');
      }
    } else {
      setFaceDetected(false);
      setStatus('Position your face in the camera');
    }
    
    drawOverlay();
  };

  const drawOverlay = () => {
    if (!overlayCanvasRef.current || !videoRef.current) return;
    
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw eye-shaped guide overlay
    ctx.strokeStyle = '#00BFFF';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 5]);
    
    const guideWidth = 120;
    const guideHeight = 60;
    const centerX = eyePosition.x;
    const centerY = eyePosition.y;
    
    // Draw eye-shaped oval guide
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, guideWidth / 2, guideHeight / 2, 0, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Add corner markers
    ctx.setLineDash([]);
    ctx.fillStyle = '#00BFFF';
    ctx.fillRect(centerX - guideWidth/2 - 5, centerY - 3, 10, 6);
    ctx.fillRect(centerX + guideWidth/2 - 5, centerY - 3, 10, 6);
    
    // Draw status
    ctx.font = '16px Arial';
    ctx.fillStyle = faceDetected ? '#00ff00' : '#ff6600';
    ctx.fillText(
      faceDetected ? 'EYE GUIDE READY' : 'POSITION FACE',
      centerX - 60,
      centerY - guideHeight/2 - 20
    );
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size for the cropped area
    const cropSize = 160; // Size of the square crop around the eye
    canvas.width = cropSize;
    canvas.height = cropSize;

    // Calculate crop area around the eye position
    const cropX = Math.max(0, eyePosition.x - cropSize / 2);
    const cropY = Math.max(0, eyePosition.y - cropSize / 2);
    
    // Ensure we don't crop outside video bounds
    const maxCropX = Math.min(cropX, video.videoWidth - cropSize);
    const maxCropY = Math.min(cropY, video.videoHeight - cropSize);

    // Draw the cropped area
    ctx.drawImage(
      video,
      maxCropX, maxCropY, cropSize, cropSize, // source rectangle
      0, 0, cropSize, cropSize // destination rectangle
    );

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onCapture(dataUrl);
  };

  // Draw overlay continuously
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        drawOverlay();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [eyePosition, faceDetected, isLoading]);

  return (
    <div className="space-y-4">
      <div className="relative bg-gray-900 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-64 object-cover"
        />
        
        <canvas
          ref={overlayCanvasRef}
          className="absolute top-0 left-0 w-full h-64 object-cover pointer-events-none"
          style={{ mixBlendMode: 'screen' }}
        />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p>Initializing camera...</p>
            </div>
          </div>
        )}

        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
          {status}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2">Manual Control:</h4>
        <p className="text-gray-600 text-sm">
          {faceDetected 
            ? "Eye detected! Click capture to take a focused eye image within the blue guide."
            : "Position your face in the camera. The blue guide will track your eye when detected."
          }
        </p>
      </div>

      <button
        onClick={captureFrame}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
      >
        <Camera size={20} />
        <span>{faceDetected ? 'Capture Eye Image' : 'Capture Image'}</span>
      </button>
    </div>
  );
};

declare global {
  interface Window {
    FaceMesh: any;
  }
}

export default SimpleCameraFeed;