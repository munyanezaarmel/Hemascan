"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ArrowRight, User, Heart } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface PatientDetails {
  gender: string
  ageGroup: string
  isPregnant: string
  medicalHistory: string
}

export default function PatientDetailsPage() {
  const [patientDetails, setPatientDetails] = useState<PatientDetails>({
    gender: "",
    ageGroup: "",
    isPregnant: "",
    medicalHistory: "",
  })
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Load captured image from sessionStorage
  useEffect(() => {
    const image = sessionStorage.getItem("capturedImage")
    if (image) {
      setCapturedImage(image)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!patientDetails.gender || !patientDetails.ageGroup) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    // Store patient details
    sessionStorage.setItem("patientDetails", JSON.stringify(patientDetails))

    toast({
      title: "Details saved!",
      description: "Proceeding to AI analysis...",
    })

    // Navigate to analysis
    router.push("/diagnosis/anemia/analysis")
  }

  const isFormValid = patientDetails.gender && patientDetails.ageGroup

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Patient Details</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Captured Image Preview */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Captured Image</CardTitle>
                  <CardDescription>Your eye image for analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  {capturedImage ? (
                    <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={capturedImage || "/placeholder.svg"}
                        alt="Captured eye image"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <User className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">No image captured</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Patient Details Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Information</CardTitle>
                  <CardDescription>Please provide the following details for accurate analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Gender */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Gender *</Label>
                      <RadioGroup
                        value={patientDetails.gender}
                        onValueChange={(value) => setPatientDetails((prev) => ({ ...prev, gender: value }))}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="male" />
                          <Label htmlFor="male">Male</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="female" />
                          <Label htmlFor="female">Female</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="other" id="other" />
                          <Label htmlFor="other">Other</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Age Group */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Age Group *</Label>
                      <Select
                        value={patientDetails.ageGroup}
                        onValueChange={(value) => setPatientDetails((prev) => ({ ...prev, ageGroup: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select age group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="child">Child (0-12 years)</SelectItem>
                          <SelectItem value="teen">Teenager (13-17 years)</SelectItem>
                          <SelectItem value="young-adult">Young Adult (18-30 years)</SelectItem>
                          <SelectItem value="adult">Adult (31-50 years)</SelectItem>
                          <SelectItem value="middle-aged">Middle-aged (51-65 years)</SelectItem>
                          <SelectItem value="senior">Senior (65+ years)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Pregnancy Status (only for females) */}
                    {patientDetails.gender === "female" && (
                      <div className="space-y-3">
                        <Label className="text-base font-medium flex items-center">
                          <Heart className="w-4 h-4 mr-2" />
                          Pregnancy Status
                        </Label>
                        <RadioGroup
                          value={patientDetails.isPregnant}
                          onValueChange={(value) => setPatientDetails((prev) => ({ ...prev, isPregnant: value }))}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="not-pregnant" />
                            <Label htmlFor="not-pregnant">Not pregnant</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="pregnant" />
                            <Label htmlFor="pregnant">Pregnant</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="unknown" id="unknown-pregnancy" />
                            <Label htmlFor="unknown-pregnancy">Prefer not to say</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}

                    {/* Medical History */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Relevant Medical History</Label>
                      <Select
                        value={patientDetails.medicalHistory}
                        onValueChange={(value) => setPatientDetails((prev) => ({ ...prev, medicalHistory: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select if applicable" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No relevant history</SelectItem>
                          <SelectItem value="anemia-history">Previous anemia diagnosis</SelectItem>
                          <SelectItem value="iron-deficiency">Iron deficiency</SelectItem>
                          <SelectItem value="chronic-disease">Chronic disease</SelectItem>
                          <SelectItem value="blood-disorder">Blood disorder</SelectItem>
                          <SelectItem value="heavy-menstruation">Heavy menstruation</SelectItem>
                          <SelectItem value="vegetarian-diet">Vegetarian/Vegan diet</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end pt-6">
                      <Button
                        type="submit"
                        disabled={!isFormValid}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        Proceed to Analysis
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
