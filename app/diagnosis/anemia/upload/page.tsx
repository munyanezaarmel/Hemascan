"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Eye, Upload } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { ImageUpload } from "@/components/image-upload"

export default function UploadPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleUpload = (imageData: string) => {
    setUploadedImage(imageData)

    // Store image in sessionStorage for next step
    sessionStorage.setItem("capturedImage", imageData)
    sessionStorage.setItem("imageSource", "upload")

    toast({
      title: "Image uploaded successfully!",
      description: "Proceeding to patient details form.",
    })

    // Navigate to patient details after a short delay
    setTimeout(() => {
      router.push("/diagnosis/anemia/details")
    }, 1500)
  }

  const handleError = (error: string) => {
    toast({
      title: "Upload Error",
      description: error,
      variant: "destructive",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/diagnosis/anemia/camera">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Camera
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Upload Eye Image</span>
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
                Image Upload Instructions
              </CardTitle>
              <CardDescription>Upload a clear image of your eye for AI analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 font-semibold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Clear Image Quality</h4>
                      <p className="text-sm text-gray-600">Ensure the image is sharp and well-lit</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Show Lower Eyelid</h4>
                      <p className="text-sm text-gray-600">The inner surface of the lower eyelid should be visible</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 font-semibold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Close-up View</h4>
                      <p className="text-sm text-gray-600">Eye should fill most of the image frame</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
                  <div className="text-center">
                    <Upload className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Upload your eye image below</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image Upload Component */}
          <ImageUpload onUpload={handleUpload} onError={handleError} />

          {/* Alternative Options */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Alternative Options</CardTitle>
              <CardDescription>Other ways to provide your eye image</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Link href="/diagnosis/anemia/camera" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Eye className="mr-2 h-4 w-4" />
                    Use Camera Instead
                  </Button>
                </Link>
                <Link href="/dashboard" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Image Preview */}
          {uploadedImage && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Image Uploaded</CardTitle>
                <CardDescription>Your image has been uploaded successfully</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden max-w-md mx-auto">
                  <img
                    src={uploadedImage || "/placeholder.svg"}
                    alt="Uploaded eye image"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">Redirecting to patient details...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
