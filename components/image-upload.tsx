"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, ImageIcon, X, CheckCircle, AlertTriangle, FileImage, Lightbulb, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ImageUploadProps {
  onUpload: (imageData: string) => void
  onError?: (error: string) => void
}

interface ImageQuality {
  resolution: boolean
  lighting: boolean
  clarity: boolean
  fileSize: boolean
}

export function ImageUpload({ onUpload, onError }: ImageUploadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [imageQuality, setImageQuality] = useState<ImageQuality>({
    resolution: false,
    lighting: false,
    clarity: false,
    fileSize: false,
  })
  const [overallQuality, setOverallQuality] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const analyzeImageQuality = useCallback((file: File, imageData: string) => {
    return new Promise<void>((resolve) => {
      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        try {
          // Create canvas for analysis
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")

          if (!ctx) {
            resolve()
            return
          }

          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)

          // Analyze image quality
          const imageDataArray = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageDataArray.data

          // Check resolution (minimum 640x480)
          const resolution = img.width >= 640 && img.height >= 480

          // Check file size (between 100KB and 10MB)
          const fileSize = file.size >= 100000 && file.size <= 10000000

          // Basic lighting analysis
          let brightness = 0
          for (let i = 0; i < data.length; i += 4) {
            brightness += (data[i] + data[i + 1] + data[i + 2]) / 3
          }
          brightness = brightness / (data.length / 4)
          const lighting = brightness > 50 && brightness < 200

          // Basic clarity check (simplified)
          const clarity = img.width > 320 && img.height > 240

          const quality = {
            resolution,
            lighting,
            clarity,
            fileSize,
          }

          setImageQuality(quality)

          // Calculate overall quality score
          const score = Object.values(quality).filter(Boolean).length * 25
          setOverallQuality(score)

          resolve()
        } catch (error) {
          console.error("Image analysis error:", error)
          resolve()
        }
      }

      img.onerror = () => {
        console.error("Failed to load image for analysis")
        resolve()
      }

      img.src = imageData
    })
  }, [])

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPG, PNG, etc.)",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        })
        return
      }

      setIsProcessing(true)
      setUploadProgress(0)

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + 10
          })
        }, 100)

        // Read file as data URL
        const reader = new FileReader()
        reader.onload = async (e) => {
          const imageData = e.target?.result as string
          setSelectedImage(imageData)
          setImageFile(file)

          // Analyze image quality
          await analyzeImageQuality(file, imageData)

          setUploadProgress(100)
          clearInterval(progressInterval)

          toast({
            title: "Image uploaded successfully",
            description: "Image quality analysis complete",
          })
        }

        reader.onerror = () => {
          clearInterval(progressInterval)
          toast({
            title: "Upload failed",
            description: "Failed to read the selected image",
            variant: "destructive",
          })
          onError?.("Failed to read image file")
        }

        reader.readAsDataURL(file)
      } catch (error) {
        console.error("Upload error:", error)
        toast({
          title: "Upload failed",
          description: "An error occurred while uploading the image",
          variant: "destructive",
        })
        onError?.("Upload failed")
      } finally {
        setIsProcessing(false)
      }
    },
    [analyzeImageQuality, toast, onError],
  )

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const file = event.dataTransfer.files[0]

      if (file) {
        // Create a fake input event
        const fakeEvent = {
          target: { files: [file] },
        } as React.ChangeEvent<HTMLInputElement>

        handleFileSelect(fakeEvent)
      }
    },
    [handleFileSelect],
  )

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  const removeImage = useCallback(() => {
    setSelectedImage(null)
    setImageFile(null)
    setImageQuality({
      resolution: false,
      lighting: false,
      clarity: false,
      fileSize: false,
    })
    setOverallQuality(0)
    setUploadProgress(0)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const confirmUpload = useCallback(() => {
    if (selectedImage) {
      onUpload(selectedImage)
    }
  }, [selectedImage, onUpload])

  const getQualityColor = (score: number) => {
    if (score >= 75) return "text-green-600"
    if (score >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const getQualityText = (score: number) => {
    if (score >= 75) return "Excellent"
    if (score >= 50) return "Good"
    return "Needs Improvement"
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            Upload Eye Image
          </CardTitle>
          <CardDescription>Select a clear image of your eye with the lower eyelid visible</CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedImage ? (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>

                <div>
                  <p className="text-lg font-medium text-gray-900">Drop your image here, or click to browse</p>
                  <p className="text-sm text-gray-500 mt-1">Supports JPG, PNG, WebP up to 10MB</p>
                </div>

                <Button variant="outline" className="mt-4">
                  <FileImage className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative">
                <img
                  src={selectedImage || "/placeholder.svg"}
                  alt="Uploaded eye image"
                  className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                />
                <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={removeImage}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* File Info */}
              {imageFile && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{imageFile.name}</p>
                      <p className="text-sm text-gray-600">{(imageFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Badge variant="outline">{imageFile.type.split("/")[1].toUpperCase()}</Badge>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Progress */}
          {isProcessing && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Quality Analysis */}
      {selectedImage && (
        <Card>
          <CardHeader>
            <CardTitle>Image Quality Analysis</CardTitle>
            <CardDescription>Automated assessment of your uploaded image</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Quality</span>
                <span className={`text-sm font-medium ${getQualityColor(overallQuality)}`}>
                  {overallQuality}% - {getQualityText(overallQuality)}
                </span>
              </div>
              <Progress value={overallQuality} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">Resolution</span>
                </div>
                {imageQuality.resolution ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4" />
                  <span className="text-sm">Lighting</span>
                </div>
                {imageQuality.lighting ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-sm">Clarity</span>
                </div>
                {imageQuality.clarity ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileImage className="w-4 h-4" />
                  <span className="text-sm">File Size</span>
                </div>
                {imageQuality.fileSize ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
              </div>
            </div>

            {overallQuality < 50 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Image quality could be improved. Consider retaking the photo with better lighting and focus.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Tips for Best Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Good lighting</p>
                  <p className="text-xs text-gray-600">Natural light or bright indoor lighting</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Clear focus</p>
                  <p className="text-xs text-gray-600">Sharp image with visible eyelid details</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Close-up view</p>
                  <p className="text-xs text-gray-600">Eye should fill most of the frame</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Stable shot</p>
                  <p className="text-xs text-gray-600">No motion blur or camera shake</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {selectedImage && (
        <div className="flex space-x-4">
          <Button
            onClick={confirmUpload}
            className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Use This Image
          </Button>
          <Button onClick={removeImage} variant="outline">
            <X className="mr-2 h-4 w-4" />
            Remove
          </Button>
        </div>
      )}
    </div>
  )
}
