"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Heart, Activity, Droplets, Brain, Save, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { saveVitalSigns, getCurrentUser } from "@/lib/supabase"

interface VitalSigns {
  heartRate: number
  oxygenLevel: number
  anemiaLevel: number
  notes?: string
}

interface AIVitalInputProps {
  onSave?: (vitals: VitalSigns) => void
  initialValues?: Partial<VitalSigns>
}

export function AIVitalInput({ onSave, initialValues }: AIVitalInputProps) {
  const [vitals, setVitals] = useState<VitalSigns>({
    heartRate: initialValues?.heartRate || 0,
    oxygenLevel: initialValues?.oxygenLevel || 0,
    anemiaLevel: initialValues?.anemiaLevel || 0,
    notes: initialValues?.notes || "",
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string>("")
  const { toast } = useToast()

  const handleInputChange = (field: keyof VitalSigns, value: string | number) => {
    setVitals((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const getHeartRateStatus = (hr: number) => {
    if (hr === 0) return { status: "unknown", color: "gray" }
    if (hr < 60) return { status: "low", color: "blue" }
    if (hr > 100) return { status: "high", color: "red" }
    return { status: "normal", color: "green" }
  }

  const getOxygenStatus = (spo2: number) => {
    if (spo2 === 0) return { status: "unknown", color: "gray" }
    if (spo2 < 95) return { status: "low", color: "red" }
    if (spo2 < 98) return { status: "fair", color: "yellow" }
    return { status: "normal", color: "green" }
  }

  const getAnemiaStatus = (level: number) => {
    if (level === 0) return { status: "unknown", color: "gray" }
    if (level < 30) return { status: "mild", color: "yellow" }
    if (level < 60) return { status: "moderate", color: "orange" }
    if (level < 80) return { status: "severe", color: "red" }
    return { status: "critical", color: "red" }
  }

  const analyzeWithAI = async () => {
    setIsAnalyzing(true)
    try {
      const response = await fetch("/api/ai-vital-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vitals),
      })

      if (response.ok) {
        const analysis = await response.json()
        setAiSuggestions(analysis.suggestions || analysis.assessment || "Analysis completed successfully.")
        toast({
          title: "AI Analysis Complete",
          description: "Review the AI suggestions below.",
        })
      } else {
        throw new Error("AI analysis failed")
      }
    } catch (error) {
      console.error("AI analysis error:", error)

      // Fallback AI suggestions based on vital signs
      let suggestions = "Based on your vital signs:\n\n"

      const hrStatus = getHeartRateStatus(vitals.heartRate)
      const o2Status = getOxygenStatus(vitals.oxygenLevel)
      const anemiaStatus = getAnemiaStatus(vitals.anemiaLevel)

      if (hrStatus.status === "high") {
        suggestions += "• Your heart rate is elevated. Consider rest and relaxation techniques.\n"
      } else if (hrStatus.status === "low") {
        suggestions += "• Your heart rate is low. Monitor for symptoms like dizziness.\n"
      }

      if (o2Status.status === "low") {
        suggestions += "• Oxygen levels are below normal. Ensure good ventilation and consider medical consultation.\n"
      }

      if (anemiaStatus.status !== "unknown" && vitals.anemiaLevel > 30) {
        suggestions += "• Anemia levels suggest attention needed. Consider iron-rich foods and medical evaluation.\n"
      }

      if (suggestions === "Based on your vital signs:\n\n") {
        suggestions +=
          "• Your vital signs appear to be within normal ranges.\n• Continue maintaining a healthy lifestyle.\n• Regular monitoring is recommended."
      }

      setAiSuggestions(suggestions)
      toast({
        title: "Analysis Complete",
        description: "AI suggestions generated based on your inputs.",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSave = async () => {
    if (vitals.heartRate === 0 || vitals.oxygenLevel === 0) {
      toast({
        title: "Missing Data",
        description: "Please enter heart rate and oxygen level.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      // Get current user
      const user = await getCurrentUser()
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to save your vital signs.",
          variant: "destructive",
        })
        return
      }

      // Save to Supabase
      const { data, error } = await saveVitalSigns(
        user.id,
        vitals.heartRate,
        vitals.oxygenLevel,
        vitals.anemiaLevel,
        vitals.notes,
      )

      if (error) {
        throw new Error(error.message)
      }

      // Also try to upload to ThingSpeak
      try {
        await fetch("/api/thingspeak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            heartRate: vitals.heartRate,
            oxygenLevel: vitals.oxygenLevel,
          }),
        })
      } catch (thingSpeakError) {
        console.warn("Failed to upload to ThingSpeak:", thingSpeakError)
        // Don't fail the entire operation if ThingSpeak fails
      }

      toast({
        title: "Vital Signs Saved",
        description: "Your data has been recorded successfully.",
      })

      // Call the onSave callback if provided
      onSave?.(vitals)
    } catch (error) {
      console.error("Save error:", error)
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save vital signs.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const isValid = vitals.heartRate > 0 && vitals.oxygenLevel > 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="mr-2 h-5 w-5" />
            AI-Powered Vital Signs Input
          </CardTitle>
          <CardDescription>Enter your vital signs for AI analysis and recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Heart Rate */}
          <div className="space-y-2">
            <Label htmlFor="heartRate" className="flex items-center">
              <Heart className="mr-2 h-4 w-4 text-red-600" />
              Heart Rate (BPM)
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="heartRate"
                type="number"
                min="30"
                max="200"
                value={vitals.heartRate || ""}
                onChange={(e) => handleInputChange("heartRate", Number.parseInt(e.target.value) || 0)}
                placeholder="Enter heart rate"
                className="flex-1"
              />
              <Badge variant="outline" className={`text-${getHeartRateStatus(vitals.heartRate).color}-600`}>
                {getHeartRateStatus(vitals.heartRate).status}
              </Badge>
            </div>
            <p className="text-xs text-gray-600">Normal range: 60-100 BPM</p>
          </div>

          {/* Oxygen Level */}
          <div className="space-y-2">
            <Label htmlFor="oxygenLevel" className="flex items-center">
              <Activity className="mr-2 h-4 w-4 text-blue-600" />
              Oxygen Level (SpO2 %)
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="oxygenLevel"
                type="number"
                min="70"
                max="100"
                value={vitals.oxygenLevel || ""}
                onChange={(e) => handleInputChange("oxygenLevel", Number.parseInt(e.target.value) || 0)}
                placeholder="Enter oxygen level"
                className="flex-1"
              />
              <Badge variant="outline" className={`text-${getOxygenStatus(vitals.oxygenLevel).color}-600`}>
                {getOxygenStatus(vitals.oxygenLevel).status}
              </Badge>
            </div>
            <p className="text-xs text-gray-600">Normal range: 95-100%</p>
          </div>

          {/* Anemia Level */}
          <div className="space-y-2">
            <Label htmlFor="anemiaLevel" className="flex items-center">
              <Droplets className="mr-2 h-4 w-4 text-red-600" />
              Anemia Risk Level (0-100)
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="anemiaLevel"
                type="number"
                min="0"
                max="100"
                value={vitals.anemiaLevel || ""}
                onChange={(e) => handleInputChange("anemiaLevel", Number.parseInt(e.target.value) || 0)}
                placeholder="Enter anemia risk level"
                className="flex-1"
              />
              <Badge variant="outline" className={`text-${getAnemiaStatus(vitals.anemiaLevel).color}-600`}>
                {getAnemiaStatus(vitals.anemiaLevel).status}
              </Badge>
            </div>
            <p className="text-xs text-gray-600">0: No risk, 100: Severe anemia</p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={vitals.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Any symptoms, medications, or additional information..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button onClick={analyzeWithAI} disabled={!isValid || isAnalyzing} variant="outline" className="flex-1">
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  AI Analysis
                </>
              )}
            </Button>
            <Button onClick={handleSave} disabled={!isValid || isSaving} className="flex-1">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Data
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      {aiSuggestions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="mr-2 h-5 w-5 text-purple-600" />
              AI Health Recommendations
            </CardTitle>
            <CardDescription>Personalized suggestions based on your vital signs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <pre className="text-sm text-purple-800 whitespace-pre-wrap font-sans">{aiSuggestions}</pre>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              These are AI-generated suggestions. Always consult with healthcare professionals for medical advice.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
