"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Eye, Camera, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { CameraCapture } from "@/components/camera-capture";
import { ImageUpload } from "@/components/image-upload";
import CameraApp from "@/components/CameraApp";

export default function CameraCapturePage() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("camera");
  const router = useRouter();
  const { toast } = useToast();

  const handleImageReady = (imageData: string, source: "camera" | "upload") => {
    setCapturedImage(imageData);

    // Store image in sessionStorage for next step
    sessionStorage.setItem("capturedImage", imageData);
    sessionStorage.setItem("imageSource", source);

    toast({
      title: "Image ready!",
      description: `Image ${
        source === "camera" ? "captured" : "uploaded"
      } successfully. Proceeding to patient details.`,
    });

    // Navigate to patient details after a short delay
    setTimeout(() => {
      router.push("/diagnosis/anemia/details");
    }, 1500);
  };

  const handleError = (error: string) => {
    toast({
      title: "Error",
      description: error,
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Hemascan AI Detection</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Instructions */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="mr-2 h-5 w-5" />
                AI-Guided Eye Analysis
              </CardTitle>
              <CardDescription>
                Choose your preferred method to provide an eye image for
                analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 font-semibold text-sm">
                        1
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">Position Your Face</h4>
                      <p className="text-sm text-gray-600">
                        Center your face in the frame or image
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 font-semibold text-sm">
                        2
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">Good Lighting</h4>
                      <p className="text-sm text-gray-600">
                        Ensure adequate lighting on your face
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 font-semibold text-sm">
                        3
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">Expose Lower Eyelid</h4>
                      <p className="text-sm text-gray-600">
                        Gently pull down your lower eyelid to show the inner
                        surface
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
                  <div className="text-center">
                    <Eye className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Choose camera or upload option below
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image Capture Options */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Image Source</CardTitle>
              <CardDescription>
                Select how you'd like to provide your eye image
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="camera" className="flex items-center">
                    <Camera className="w-4 h-4 mr-2" />
                    Live Camera
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="flex items-center">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="camera" className="mt-6">
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Camera className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <h3 className="font-medium text-blue-900">
                        Live Camera Capture
                      </h3>
                      <p className="text-sm text-blue-700">
                        Use your device's camera to take a real-time photo of
                        your eye
                      </p>
                    </div>
                    <CameraApp onUpload={handleImageReady} />
                  </div>
                </TabsContent>

                <TabsContent value="upload" className="mt-6">
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Upload className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <h3 className="font-medium text-green-900">
                        Upload Existing Image
                      </h3>
                      <p className="text-sm text-green-700">
                        Select a photo from your device that shows your lower
                        eyelid clearly
                      </p>
                    </div>
                    <ImageUpload
                      onUpload={handleImageReady}
                      onError={handleError}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Captured/Uploaded Image Preview */}
          {capturedImage && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Image Ready</CardTitle>
                <CardDescription>
                  Your image has been processed successfully
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden max-w-md mx-auto">
                  <img
                    src={capturedImage || "/placeholder.svg"}
                    alt="Eye image for analysis"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    Redirecting to patient details...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
