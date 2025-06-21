import React, { useRef, useEffect, useState } from 'react';
import { Camera } from 'lucide-react';

interface AICameraFeedProps {
  onCapture: (dataUrl: string) => void;
  onQualityUpdate: (check: string, value: boolean) => void;
}

const AICameraFeed: React.FC<AICameraFeedProps> = ({ onCapture, onQualityUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('Initializing...');
  const [lastInstruction, setLastInstruction] = useState<string>('');
  const [isAligned, setIsAligned] = useState(false);
  const [landmarks, setLandmarks] = useState<any>(null);
  const [eyeGuidePosition, setEyeGuidePosition] = useState({ x: 320, y: 240 });
  const [faceMeshInstance, setFaceMeshInstance] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Speech synthesis
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.volume = 0.7;
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
      setLastInstruction(text);
      console.log('Speaking:', text);
    }
  };

  // Calculate image brightness using histogram
  const calculateBrightness = (imageData: ImageData): number => {
    const { data } = imageData;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      sum += (r + g + b) / 3;
    }
    return sum / (data.length / 4);
  };

  // Calculate image sharpness using Laplacian variance
  const calculateSharpness = (imageData: ImageData): number => {
    const { data, width, height } = imageData;
    const gray = new Array(width * height);
    
    // Convert to grayscale
    for (let i = 0; i < data.length; i += 4) {
      const idx = i / 4;
      gray[idx] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    
    // Apply Laplacian filter
    let variance = 0;
    let count = 0;
    const laplacian = [0, -1, 0, -1, 4, -1, 0, -1, 0];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        for (let ky = 0; ky < 3; ky++) {
          for (let kx = 0; kx < 3; kx++) {
            const py = y + ky - 1;
            const px = x + kx - 1;
            sum += gray[py * width + px] * laplacian[ky * 3 + kx];
          }
        }
        variance += sum * sum;
        count++;
      }
    }
    
    return variance / count;
  };

  // Calculate white balance
  const calculateWhiteBalance = (imageData: ImageData): boolean => {
    const { data } = imageData;
    let rSum = 0, gSum = 0, bSum = 0;
    const pixelCount = data.length / 4;
    
    for (let i = 0; i < data.length; i += 4) {
      rSum += data[i];
      gSum += data[i + 1];
      bSum += data[i + 2];
    }
    
    const rAvg = rSum / pixelCount;
    const gAvg = gSum / pixelCount;
    const bAvg = bSum / pixelCount;
    
    // Check if color channels are reasonably balanced
    const maxDiff = Math.max(
      Math.abs(rAvg - gAvg),
      Math.abs(gAvg - bAvg),
      Math.abs(rAvg - bAvg)
    );
    
    return maxDiff < 30; // Threshold for acceptable white balance
  };

  // Calculate Eye Aspect Ratio (EAR)
  const calculateEAR = (eyeLandmarks: any[]): number => {
    if (eyeLandmarks.length < 6) return 0;
    
    const p1 = eyeLandmarks[1];
    const p2 = eyeLandmarks[5];
    const p3 = eyeLandmarks[2];
    const p4 = eyeLandmarks[4];
    const p5 = eyeLandmarks[0];
    const p6 = eyeLandmarks[3];
    
    const A = Math.sqrt((p2.x - p6.x) ** 2 + (p2.y - p6.y) ** 2);
    const B = Math.sqrt((p3.x - p5.x) ** 2 + (p3.y - p5.y) ** 2);
    const C = Math.sqrt((p1.x - p4.x) ** 2 + (p1.y - p4.y) ** 2);
    
    return (A + B) / (2.0 * C);
  };

  // Perform quality analysis
  const analyzeQuality = (landmarks: any) => {
    if (!videoRef.current || !analysisCanvasRef.current) return;
    
    const canvas = analysisCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Check lighting
    const brightness = calculateBrightness(imageData);
    const goodLighting = brightness > 80 && brightness < 180;
    onQualityUpdate('goodLighting', goodLighting);
    
    // Check sharpness/focus
    const sharpness = calculateSharpness(imageData);
    const inFocus = sharpness > 100; // Threshold for acceptable sharpness
    onQualityUpdate('inFocus', inFocus);
    
    // Check white balance
    const whiteBalance = calculateWhiteBalance(imageData);
    onQualityUpdate('whiteBalance', whiteBalance);
    
    if (landmarks && landmarks.multiFaceLandmarks && landmarks.multiFaceLandmarks.length > 0) {
      const faceLandmarks = landmarks.multiFaceLandmarks[0];
      
      // Check face distance
      const leftEye = faceLandmarks[33];
      const rightEye = faceLandmarks[263];
      const faceWidth = Math.abs(rightEye.x - leftEye.x);
      const properDistance = faceWidth > 0.15 && faceWidth < 0.4;
      onQualityUpdate('properDistance', properDistance);
      
      // Check eyelid openness using EAR
      const leftEyeLandmarks = [33, 159, 158, 133, 153, 144].map(i => faceLandmarks[i]);
      const rightEyeLandmarks = [362, 386, 387, 263, 373, 374].map(i => faceLandmarks[i]);
      
      const leftEAR = calculateEAR(leftEyeLandmarks);
      const rightEAR = calculateEAR(rightEyeLandmarks);
      const avgEAR = (leftEAR + rightEAR) / 2;
      
      const eyelidOpen = avgEAR > 0.25; // Threshold for open eyes
      onQualityUpdate('eyelidOpen', eyelidOpen);
    }
  };

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        console.log('Initializing camera...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            console.log('Camera loaded, video ready');
            setIsLoading(false);
            setStatus('Camera ready - Initializing AI...');
            speak('Camera is ready. Position your face in the camera.');
          };
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setStatus('Camera access denied - Please allow camera access');
        speak('Camera access denied. Please allow camera access and refresh the page.');
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

  // Initialize MediaPipe with improved error handling
  useEffect(() => {
    if (isLoading) return;

    let cleanup: (() => void) | undefined;

    const initMediaPipe = async () => {
      try {
        console.log('Loading MediaPipe FaceMesh...');
        setStatus('Loading AI face detection...');

        // Try to load MediaPipe with a single, reliable CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js';
        
        const loadPromise = new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          setTimeout(() => reject(new Error('MediaPipe load timeout')), 10000);
        });

        document.head.appendChild(script);
        await loadPromise;

        console.log('MediaPipe script loaded');

        if (!window.FaceMesh) {
          throw new Error('FaceMesh not available');
        }

        const faceMesh = new window.FaceMesh({
          locateFile: (file: string) => {
            console.log('Loading MediaPipe file:', file);
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`;
          }
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        faceMesh.onResults((results: any) => {
          console.log('Face detection results received:', results.multiFaceLandmarks?.length || 0, 'faces');
          processResults(results);
        });

        setFaceMeshInstance(faceMesh);
        setStatus('AI detection ready');
        speak('AI face detection is ready. Position your face in the camera.');

        // Start processing frames
        const processFrames = () => {
          if (videoRef.current && videoRef.current.readyState >= 2 && !isProcessing) {
            setIsProcessing(true);
            faceMesh.send({ image: videoRef.current })
              .catch((error: any) => {
                console.log('Frame processing error (ignoring):', error.message);
              })
              .finally(() => {
                setIsProcessing(false);
              });
          }
        };

        const interval = setInterval(processFrames, 100);
        cleanup = () => {
          clearInterval(interval);
          document.head.removeChild(script);
        };

      } catch (error) {
        console.error('MediaPipe initialization failed:', error);
        setStatus('AI detection failed - Manual mode available');
        speak('AI detection is not available. You can use manual capture mode.');
        
        // Fallback: show basic guide at center
        drawBasicGuide();
      }
    };

    initMediaPipe();

    return () => {
      if (cleanup) cleanup();
    };
  }, [isLoading, isProcessing]);

  // Draw basic guide when AI fails
  const drawBasicGuide = () => {
    if (!overlayCanvasRef.current || !videoRef.current) return;
    
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw basic eye guide at center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const guideWidth = 120;
    const guideHeight = 60;

    ctx.strokeStyle = '#00BFFF';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 5]);
    
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, guideWidth / 2, guideHeight / 2, 0, 0, 2 * Math.PI);
    ctx.stroke();
    
    ctx.setLineDash([]);
    ctx.fillStyle = '#00BFFF';
    ctx.fillRect(centerX - guideWidth/2 - 5, centerY - 3, 10, 6);
    ctx.fillRect(centerX + guideWidth/2 - 5, centerY - 3, 10, 6);
    
    ctx.font = '16px Arial';
    ctx.fillStyle = '#ff6600';
    ctx.fillText('MANUAL MODE - POSITION EYE', centerX - 100, centerY - guideHeight/2 - 20);
  };

  // Draw eye guide overlay and landmarks
  const drawOverlay = (results: any) => {
    if (!overlayCanvasRef.current || !videoRef.current) return;
    
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      
      // Get left eye center
      const leftEyeCenter = landmarks[468] || landmarks[33]; // Fallback to another eye landmark
      const eyeX = leftEyeCenter.x * canvas.width;
      const eyeY = leftEyeCenter.y * canvas.height;
      
      // Update eye guide position to follow the eye
      setEyeGuidePosition({ x: eyeX, y: eyeY });

      // Draw eye landmarks
      ctx.fillStyle = '#00ff00';
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;

      const leftEyeIndices = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
      const rightEyeIndices = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];

      // Draw left eye
      ctx.beginPath();
      leftEyeIndices.forEach((index, i) => {
        if (landmarks[index]) {
          const x = landmarks[index].x * canvas.width;
          const y = landmarks[index].y * canvas.height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          ctx.fillRect(x - 2, y - 2, 4, 4);
        }
      });
      ctx.stroke();

      // Draw right eye
      ctx.beginPath();
      rightEyeIndices.forEach((index, i) => {
        if (landmarks[index]) {
          const x = landmarks[index].x * canvas.width;
          const y = landmarks[index].y * canvas.height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          ctx.fillRect(x - 2, y - 2, 4, 4);
        }
      });
      ctx.stroke();

      // Draw lower eyelid
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      const leftLowerEyelid = [145, 153, 154, 155];
      const rightLowerEyelid = [374, 373, 390, 249];

      ctx.beginPath();
      leftLowerEyelid.forEach((index, i) => {
        if (landmarks[index]) {
          const x = landmarks[index].x * canvas.width;
          const y = landmarks[index].y * canvas.height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      ctx.beginPath();
      rightLowerEyelid.forEach((index, i) => {
        if (landmarks[index]) {
          const x = landmarks[index].x * canvas.width;
          const y = landmarks[index].y * canvas.height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // Draw eye-shaped guide overlay
    ctx.strokeStyle = '#00BFFF';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 5]);
    
    const guideWidth = 120;
    const guideHeight = 60;
    const centerX = eyeGuidePosition.x;
    const centerY = eyeGuidePosition.y;
    
    // Draw eye-shaped oval guide
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, guideWidth / 2, guideHeight / 2, 0, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Add corner markers
    ctx.setLineDash([]);
    ctx.fillStyle = '#00BFFF';
    ctx.fillRect(centerX - guideWidth/2 - 5, centerY - 3, 10, 6);
    ctx.fillRect(centerX + guideWidth/2 - 5, centerY - 3, 10, 6);
    
    // Draw alignment status
    ctx.font = '16px Arial';
    ctx.fillStyle = isAligned ? '#00ff00' : '#ff6600';
    ctx.fillText(
      isAligned ? 'ALIGNED ✓' : 'ALIGN YOUR EYE',
      centerX - 50,
      centerY - guideHeight/2 - 20
    );
  };

  // Process face detection results
  const processResults = (results: any) => {
    setLandmarks(results);
    drawOverlay(results);
    analyzeQuality(results);

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      setStatus('No face detected - Please position your face in the camera');
      setIsAligned(false);
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    
    // Check alignment within the eye guide
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    
    if (!leftEye || !rightEye) return;
    
    const faceWidth = Math.abs(rightEye.x - leftEye.x);
    
    const isProperDistance = faceWidth > 0.15 && faceWidth < 0.4;
    const leftEyeTop = landmarks[159];
    const leftEyeBottom = landmarks[145];
    const rightEyeTop = landmarks[386];
    const rightEyeBottom = landmarks[374];
    
    if (!leftEyeTop || !leftEyeBottom || !rightEyeTop || !rightEyeBottom) return;
    
    const leftEyeOpenness = Math.abs(leftEyeTop.y - leftEyeBottom.y);
    const rightEyeOpenness = Math.abs(rightEyeTop.y - rightEyeBottom.y);
    const eyesOpen = leftEyeOpenness > 0.008 && rightEyeOpenness > 0.008;

    // Check if eye is within the guide area
    const leftEyeCenter = landmarks[468] || landmarks[33];
    if (!leftEyeCenter) return;
    
    const eyeX = leftEyeCenter.x * (videoRef.current?.videoWidth || 640);
    const eyeY = leftEyeCenter.y * (videoRef.current?.videoHeight || 480);
    
    const distanceFromGuide = Math.sqrt(
      (eyeX - eyeGuidePosition.x) ** 2 + (eyeY - eyeGuidePosition.y) ** 2
    );
    const withinGuide = distanceFromGuide < 30;

    // Give voice instructions
    if (!isProperDistance) {
      if (faceWidth < 0.15) {
        speak('Move closer to the camera');
        setStatus('Move closer to the camera');
      } else {
        speak('Move back from the camera');
        setStatus('Move back from the camera');
      }
      setIsAligned(false);
    } else if (!eyesOpen) {
      speak('Please open your eyes wide');
      setStatus('Please open your eyes wide');
      setIsAligned(false);
    } else if (!withinGuide) {
      speak('Align your eye with the blue guide');
      setStatus('Align your eye with the blue guide');
      setIsAligned(false);
    } else {
      setStatus('Perfect alignment detected!');
      if (!isAligned) {
        speak('Perfect alignment! Capturing in 3 seconds');
        setIsAligned(true);
        
        setTimeout(() => {
          captureFrame();
          speak('Eye image captured successfully');
        }, 3000);
      }
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Capture cropped area around the eye
    const cropSize = 160;
    canvas.width = cropSize;
    canvas.height = cropSize;

    const cropX = Math.max(0, eyeGuidePosition.x - cropSize / 2);
    const cropY = Math.max(0, eyeGuidePosition.y - cropSize / 2);
    
    const maxCropX = Math.min(cropX, video.videoWidth - cropSize);
    const maxCropY = Math.min(cropY, video.videoHeight - cropSize);

    ctx.drawImage(
      video,
      maxCropX, maxCropY, cropSize, cropSize,
      0, 0, cropSize, cropSize
    );

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onCapture(dataUrl);
    
    console.log('Eye image captured and cropped');
  };

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

        {isAligned && (
          <div className="absolute inset-0 border-4 border-green-500 animate-pulse rounded-lg"></div>
        )}

        <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-xs">
          {landmarks ? 'AI tracking active' : 'Loading AI detection...'}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={analysisCanvasRef} className="hidden" />

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2">AI Instructions:</h4>
        <p className="text-gray-600 text-sm">
          {lastInstruction || 'Position your face in the camera and align your eye with the blue guide overlay.'}
        </p>
      </div>

      <button
        onClick={captureFrame}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
      >
        <Camera size={20} />
        <span>Manual Capture</span>
      </button>
    </div>
  );
};

declare global {
  interface Window {
    FaceMesh: any;
  }
}

export default AICameraFeed;