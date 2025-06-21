"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Brain, Zap, CheckCircle, Loader2, Eye, ArrowRight, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { supabase } from "@/lib/supabase"

interface AnalysisStep {
  id: string
  name: string
  description: string
  completed: boolean
  progress: number
  error?: string
}

function AnalysisContent() {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [overallProgress, setOverallProgress] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [patientDetails, setPatientDetails] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()

  const analysisSteps: AnalysisStep[] = [
    {
      id: "preprocessing",
      name: "Image Preprocessing",
      description: "Validating and preparing image for analysis",
      completed: false,
      progress: 0,
    },
    {
      id: "roboflow",
      name: " AI Analysis",
      description: "Running computer vision model for anemia detection",
      completed: false,
      progress: 0,
    },
    {
      id: "ai-recommendations",
      name: "AI Recommendations",
      description: "Generating personalized health recommendations",
      completed: false,
      progress: 0,
    },
    {
      id: "database-save",
      name: "Saving Results",
      description: "Storing analysis results securely",
      completed: false,
      progress: 0,
    },
  ]

  const [steps, setSteps] = useState(analysisSteps)

  // Load data from sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const image = sessionStorage.getItem("capturedImage")
      const details = sessionStorage.getItem("patientDetails")

      if (!image) {
        toast({
          title: "No image found",
          description: "Please capture an image first.",
          variant: "destructive",
        })
        router.push("/diagnosis/anemia/camera")
        return
      }

      setCapturedImage(image)
      if (details) {
        setPatientDetails(JSON.parse(details))
      }
    }
  }, [router, toast])

  // Run analysis when component mounts and user is available
  useEffect(() => {
    if (capturedImage && user) {
      runAnalysis()
    }
  }, [capturedImage, user])

  const updateStepProgress = (stepIndex: number, progress: number, error?: string) => {
    setSteps((prev) =>
      prev.map((step, index) =>
        index === stepIndex ? { ...step, progress, error, completed: progress === 100 && !error } : step,
      ),
    )
    setOverallProgress((stepIndex * 100 + progress) / steps.length)
  }

  const runAnalysis = async () => {
    if (!capturedImage || !user) return

    setIsAnalyzing(true)
    setAnalysisError(null)

    try {
      // Step 1: Image Preprocessing
      setCurrentStep(0)
      updateStepProgress(0, 25)

      // Validate image format
      if (!capturedImage.startsWith("data:image/")) {
        throw new Error("Invalid image format")
      }

      updateStepProgress(0, 50)
      await new Promise((resolve) => setTimeout(resolve, 500))
      updateStepProgress(0, 100)

      // Step 2: Roboflow Analysis
      setCurrentStep(1)
      updateStepProgress(1, 10)

      console.log("Starting Roboflow analysis...")
      const roboflowResponse = await fetch("/api/roboflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: capturedImage }),
      })

      updateStepProgress(1, 50)

      if (!roboflowResponse.ok) {
        const errorData = await roboflowResponse.json()
        throw new Error(`Roboflow analysis failed: ${errorData.error || errorData.details || "Unknown error"}`)
      }

      const roboflowResults = await roboflowResponse.json()
      console.log("Roboflow results:", roboflowResults)

      // Store Roboflow results
      if (typeof window !== "undefined") {
        sessionStorage.setItem("roboflowResults", JSON.stringify(roboflowResults))
      }
      updateStepProgress(1, 100)

      // Step 3: AI Recommendations
      setCurrentStep(2)
      updateStepProgress(2, 20)

      console.log("Generating AI recommendations...")
      const aiResponse = await fetch("/api/ai-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosis: roboflowResults.class || "unknown",
          confidence: Math.round((roboflowResults.confidence || 0) * 100),
          patientDetails,
          roboflowResults,
        }),
      })

      updateStepProgress(2, 60)

      let aiRecommendations = {}
      if (!aiResponse.ok) {
        console.warn("AI recommendations failed, using fallback")
        // Continue with fallback recommendations
        aiRecommendations = {
          recommendations: "Please consult with a healthcare professional for proper medical advice.",
          dietary_suggestions: ["Maintain a balanced diet", "Stay hydrated", "Consider iron-rich foods"],
          lifestyle_tips: ["Get adequate rest", "Exercise regularly", "Monitor symptoms"],
        }
      } else {
        aiRecommendations = await aiResponse.json()
      }

      console.log("AI recommendations:", aiRecommendations)

      // Store AI recommendations
      if (typeof window !== "undefined") {
        sessionStorage.setItem("aiRecommendations", JSON.stringify(aiRecommendations))
      }
      updateStepProgress(2, 100)

      // Step 4: Save to Database
      setCurrentStep(3)
      updateStepProgress(3, 25)

      try {
        const { error: saveError } = await supabase.from("diagnosis_results").insert({
          user_id: user.id,
          type: "anemia_detection",
          result: roboflowResults.class || "unknown",
          confidence: Math.round((roboflowResults.confidence || 0) * 100),
          ai_analysis: {
            roboflow: roboflowResults,
            ai_recommendations: aiRecommendations,
            patient_details: patientDetails,
            analysis_timestamp: new Date().toISOString(),
          },
          patient_details: patientDetails,
        })

        if (saveError) {
          console.warn("Failed to save to database:", saveError)
          // Don't fail the entire process if database save fails
        }
      } catch (dbError) {
        console.warn("Database save error:", dbError)
        // Continue without failing
      }

      updateStepProgress(3, 100)

      // Analysis complete
      setIsAnalyzing(false)
      toast({
        title: "Analysis complete!",
        description: "Your results are ready.",
      })

      // Navigate to results after a short delay
      setTimeout(() => {
        router.push("/diagnosis/anemia/results")
      }, 2000)
    } catch (error) {
      console.error("Analysis error:", error)
      const errorMessage = error instanceof Error ? error.message : "Analysis failed"

      setAnalysisError(errorMessage)
      updateStepProgress(currentStep, 0, errorMessage)
      setIsAnalyzing(false)

      toast({
        title: "Analysis failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const retryAnalysis = () => {
    // Reset all steps
    setSteps(analysisSteps.map((step) => ({ ...step, completed: false, progress: 0, error: undefined })))
    setCurrentStep(0)
    setOverallProgress(0)
    setAnalysisError(null)

    // Restart analysis
    runAnalysis()
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we authenticate you.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/diagnosis/anemia/details">
              <Button variant="ghost" size="sm" disabled={isAnalyzing}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Details
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">AI Analysis</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Overall Progress */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="mr-2 h-5 w-5" />
                {isAnalyzing ? "Analysis in Progress" : analysisError ? "Analysis Failed" : "Analysis Complete"}
              </CardTitle>
              <CardDescription>
                {isAnalyzing
                  ? "Our AI is analyzing your image and generating personalized recommendations"
                  : analysisError
                    ? "An error occurred during analysis"
                    : "Analysis completed successfully"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-medium">{Math.round(overallProgress)}%</span>
                </div>
                <Progress value={overallProgress} className="h-3" />

                {!isAnalyzing && !analysisError && (
                  <div className="flex items-center justify-center pt-4">
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Analysis Complete!</span>
                    </div>
                  </div>
                )}

                {analysisError && (
                  <div className="flex items-center justify-center pt-4">
                    <div className="flex items-center space-x-2 text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-medium">Analysis Failed</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Analysis Steps */}
          <div className="grid gap-6">
            {steps.map((step, index) => (
              <Card
                key={step.id}
                className={`transition-all duration-300 ${
                  index === currentStep && isAnalyzing ? "ring-2 ring-blue-500 shadow-lg" : ""
                } ${step.error ? "border-red-200 bg-red-50" : ""}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          step.error
                            ? "bg-red-100 text-red-600"
                            : step.completed
                              ? "bg-green-100 text-green-600"
                              : index === currentStep && isAnalyzing
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {step.error ? (
                          <AlertTriangle className="w-5 h-5" />
                        ) : step.completed ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : index === currentStep && isAnalyzing ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{step.name}</h3>
                        <p className="text-sm text-gray-600">{step.description}</p>
                        {step.error && <p className="text-sm text-red-600 mt-1">Error: {step.error}</p>}
                      </div>
                    </div>

                    <Badge
                      variant={
                        step.error
                          ? "destructive"
                          : step.completed
                            ? "default"
                            : index === currentStep && isAnalyzing
                              ? "secondary"
                              : "outline"
                      }
                    >
                      {step.error
                        ? "Failed"
                        : step.completed
                          ? "Complete"
                          : index === currentStep && isAnalyzing
                            ? "Processing"
                            : "Pending"}
                    </Badge>
                  </div>

                  {(index === currentStep || step.completed || step.error) && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{step.progress}%</span>
                      </div>
                      <Progress value={step.progress} className={`h-2 ${step.error ? "bg-red-100" : ""}`} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Error Actions */}
          {analysisError && (
            <Card className="mt-8 border-red-200 bg-red-50">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-900 mb-2">Analysis Failed</h3>
                <p className="text-red-700 mb-4">{analysisError}</p>
                <div className="flex justify-center space-x-4">
                  <Button onClick={retryAnalysis} variant="outline">
                    <Loader2 className="mr-2 h-4 w-4" />
                    Retry Analysis
                  </Button>
                  <Link href="/diagnosis/anemia/camera">
                    <Button variant="outline">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Camera
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Technical Details */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="mr-2 h-5 w-5" />
                Technical Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Roboflow AI Model</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Computer vision for conjunctival analysis</li>
                    <li>• Trained on medical image datasets</li>
                    <li>• Real-time processing capabilities</li>
                    <li>• API endpoint: {process.env.NEXT_PUBLIC_ROBOFLOW_MODEL_ENDPOINT || "anemia_pcm2/2"}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">AI Recommendations</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Powered by Groq AI (Llama 3.1 70B)</li>
                    <li>• Personalized based on patient data</li>
                    <li>• Evidence-based medical guidelines</li>
                    <li>• Dietary and lifestyle suggestions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {!isAnalyzing && !analysisError && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={() => router.push("/diagnosis/anemia/results")}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                View Results
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AnalysisPage() {
  return (
    <ProtectedRoute>
      <AnalysisContent />
    </ProtectedRoute>
  )
}
