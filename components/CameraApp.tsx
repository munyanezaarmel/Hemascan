import React, { useState } from "react";
import AICameraFeed from "./AiCameraFeed";
import SimpleCameraFeed from "./SimpleCamera";
import QualityChecklist from "./QualityChecklist";

interface CapturedImage {
  dataUrl: string;
  timestamp: number;
  type: "ai" | "manual";
}

interface CameraAppProps {
  onUpload: (imageData: string) => void;
}

const CameraApp: React.FC<CameraAppProps> = ({ onUpload }) => {
  const [aiCapturedImage, setAiCapturedImage] = useState<CapturedImage | null>(
    null
  );
  const [manualCapturedImage, setManualCapturedImage] =
    useState<CapturedImage | null>(null);
  const [qualityChecks, setQualityChecks] = useState({
    goodLighting: false,
    properDistance: false,
    eyelidOpen: false,
    inFocus: false,
    whiteBalance: false,
  });
  const [activeCamera, setActiveCamera] = useState<"ai" | "manual">("ai");

  const handleAiCapture = (dataUrl: string) => {
    setAiCapturedImage({
      dataUrl,
      timestamp: Date.now(),
      type: "ai",
    });
  };

  const handleManualCapture = (dataUrl: string) => {
    setManualCapturedImage({
      dataUrl,
      timestamp: Date.now(),
      type: "manual",
    });
  };

  const updateQualityCheck = (
    check: keyof typeof qualityChecks,
    value: boolean
  ) => {
    setQualityChecks((prev) => ({
      ...prev,
      [check]: value,
    }));
  };

  // Replicate the upload logic
  const handleUseImage = (imageData: string) => {
    if (imageData) {
      onUpload(imageData);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          AI Eye Capture System
        </h1>
        <p className="text-gray-600 text-lg">
          Professional eye imaging with AI guidance and quality assessment
        </p>
      </div>

      {/* Camera Switch Tabs */}
      <div className="flex justify-center mb-6">
        <button
          className={`px-6 py-2 rounded-l-lg border border-gray-300 ${
            activeCamera === "ai"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-800"
          }`}
          onClick={() => setActiveCamera("ai")}
        >
          AI Guided Camera
        </button>
        <button
          className={`px-6 py-2 rounded-r-lg border border-gray-300 border-l-0 ${
            activeCamera === "manual"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-800"
          }`}
          onClick={() => setActiveCamera("manual")}
        >
          Manual Camera
        </button>
      </div>

      {/* Only show the selected camera */}
      <div className="mb-8 min-h-[400px] flex flex-col justify-center">
        {activeCamera === "ai" ? (
          <AICameraFeed
            onCapture={handleAiCapture}
            onQualityUpdate={updateQualityCheck}
          />
        ) : (
          <SimpleCameraFeed onCapture={handleManualCapture} />
        )}
      </div>

      {/* Quality Checklist */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <QualityChecklist
          checks={qualityChecks}
          onCheckChange={updateQualityCheck}
        />
      </div>

      {/* Captured Images and Use Button */}
      {(aiCapturedImage || manualCapturedImage) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {aiCapturedImage && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                AI Captured Image
              </h3>
              <img
                src={aiCapturedImage.dataUrl}
                alt="AI Captured"
                className="w-full rounded-lg shadow-md"
              />
              <p className="text-sm text-gray-500 mt-2">
                Captured: {new Date(aiCapturedImage.timestamp).toLocaleString()}
              </p>
              <button
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                onClick={() => handleUseImage(aiCapturedImage.dataUrl)}
              >
                Use This Image
              </button>
            </div>
          )}

          {manualCapturedImage && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Manual Captured Image
              </h3>
              <img
                src={manualCapturedImage.dataUrl}
                alt="Manual Captured"
                className="w-full rounded-lg shadow-md"
              />
              <p className="text-sm text-gray-500 mt-2">
                Captured:{" "}
                {new Date(manualCapturedImage.timestamp).toLocaleString()}
              </p>
              <button
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                onClick={() => handleUseImage(manualCapturedImage.dataUrl)}
              >
                Use This Image
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CameraApp;
