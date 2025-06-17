"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Download,
  Share2,
  Eye,
  Brain,
  Utensils,
  Pill,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface RoboflowResult {
  predictions?: Array<{
    class: string;
    class_id: number;
    confidence: number;
  }>;
  class?: string;
  confidence?: number;
  inference_time?: number;
  image_dimensions?: {
    width: number;
    height: number;
  };
}

interface AIRecommendations {
  assessment?: string;
  recommendations?: string[];
  foods?: string[];
  lifestyle?: string[];
  medical_attention?: string;
  follow_up?: string;
  ai_model?: string;
  confidence_level?: number;
}

export default function ResultsPage() {
  const [roboflowResults, setRoboflowResults] = useState<RoboflowResult | null>(
    null
  );
  const [aiRecommendations, setAiRecommendations] =
    useState<AIRecommendations | null>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Load results from sessionStorage
  useEffect(() => {
    const roboflowData = sessionStorage.getItem("roboflowResults");
    const aiData = sessionStorage.getItem("aiRecommendations");
    const patientData = sessionStorage.getItem("patientDetails");

    if (!roboflowData) {
      toast({
        title: "No results found",
        description: "Please complete the analysis first.",
        variant: "destructive",
      });
      router.push("/diagnosis/anemia/camera");
      return;
    }

    try {
      if (roboflowData) {
        const parsedRoboflow = JSON.parse(roboflowData);
        setRoboflowResults(parsedRoboflow);
        console.log("Loaded Roboflow results:", parsedRoboflow);
      }

      if (aiData) {
        const parsedAI = JSON.parse(aiData);
        setAiRecommendations(parsedAI);
        console.log("Loaded AI recommendations:", parsedAI);
      }

      if (patientData) {
        const parsedPatient = JSON.parse(patientData);
        setPatientDetails(parsedPatient);
        console.log("Loaded patient details:", parsedPatient);
      }
    } catch (error) {
      console.error("Error parsing stored data:", error);
      toast({
        title: "Data parsing error",
        description: "There was an error loading your results.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [router, toast]);

  // Mock historical data for charts (in a real app, this would come from the database)
  const historicalData = [
    { date: "2024-01-01", confidence: 92, result: "Normal" },
    { date: "2024-01-15", confidence: 87, result: "Mild Anemia" },
    {
      date: "2024-01-30",
      confidence: roboflowResults?.confidence
        ? Math.round(roboflowResults.confidence * 100)
        : 95,
      result: roboflowResults?.class || "Normal",
    },
  ];

  const handleDownloadReport = () => {
    // Create a comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      patient: patientDetails,
      roboflow_analysis: roboflowResults,
      ai_recommendations: aiRecommendations,
      analysis_date: new Date().toLocaleDateString(),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hemascan-report-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report downloaded",
      description: "Your medical report has been saved to your device.",
    });
  };

  const handleShareResults = async () => {
    const shareData = {
      title: "Hemascan Analysis Results",
      text: `My anemia screening results: ${
        roboflowResults?.class || "Unknown"
      } with ${Math.round(
        (roboflowResults?.confidence || 0) * 100
      )}% confidence`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Link copied",
          description: "Results link copied to clipboard.",
        });
      }
    } else {
      await navigator.clipboard.writeText(shareData.url);
      toast({
        title: "Link copied",
        description: "Results link copied to clipboard.",
      });
    }
  };

  const getResultColor = (diagnosis: string) => {
    switch (diagnosis?.toLowerCase()) {
      case "normal":
      case "no_anemia":
        return "text-green-600 bg-green-50 border-green-200";
      case "anemia":
      case "mild_anemia":
      case "moderate_anemia":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getResultIcon = (diagnosis: string) => {
    switch (diagnosis?.toLowerCase()) {
      case "normal":
      case "no_anemia":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "anemia":
      case "mild_anemia":
      case "moderate_anemia":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Eye className="w-5 h-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Results...
          </h2>
          <p className="text-gray-600">
            Please wait while we prepare your analysis.
          </p>
        </div>
      </div>
    );
  }

  if (!roboflowResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Results Found
          </h2>
          <p className="text-gray-600 mb-4">
            Please complete the analysis first.
          </p>
          <Link href="/diagnosis/anemia/camera">
            <Button>Start New Analysis</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Extract diagnosis information
  const diagnosis =
    roboflowResults.class ||
    roboflowResults.predictions?.[0]?.class ||
    "unknown";
  const confidence = roboflowResults.confidence
    ? Math.round(roboflowResults.confidence * 100)
    : roboflowResults.predictions?.[0]?.confidence
    ? Math.round(roboflowResults.predictions[0].confidence * 100)
    : 0;

  const confidenceData = [
    { name: "Confidence", value: confidence },
    { name: "Uncertainty", value: 100 - confidence },
  ];

  const COLORS = ["#3B82F6", "#E5E7EB"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Analysis Results</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleShareResults}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button onClick={handleDownloadReport}>
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Main Result Card */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    Anemia Detection Results
                  </CardTitle>
                  <CardDescription>
                    Analysis completed on {new Date().toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge
                  className={`text-lg px-4 py-2 ${getResultColor(diagnosis)}`}
                >
                  {getResultIcon(diagnosis)}
                  <span className="ml-2 capitalize">
                    {diagnosis.replace("_", " ")}
                  </span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {confidence}%
                  </div>
                  <p className="text-gray-600">AI Confidence</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {diagnosis === "normal" || diagnosis === "no_anemia"
                      ? "Healthy"
                      : "Attention Needed"}
                  </div>
                  <p className="text-gray-600">Status</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {roboflowResults.inference_time
                      ? `${roboflowResults.inference_time}ms`
                      : "AI"}
                  </div>
                  <p className="text-gray-600">Analysis Time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alert for Anemia Detection */}
          {(diagnosis === "anemia" ||
            diagnosis === "mild_anemia" ||
            diagnosis === "moderate_anemia") && (
            <Alert className="mb-8 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Important:</strong> This AI analysis suggests possible
                anemia. Please consult with a healthcare professional for proper
                medical evaluation and blood tests for confirmation.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Confidence Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Analysis Confidence</CardTitle>
                    <CardDescription>
                      Roboflow AI model confidence in the diagnosis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={confidenceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {confidenceData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="text-center mt-4">
                      <p className="text-2xl font-bold text-blue-600">
                        {confidence}%
                      </p>
                      <p className="text-sm text-gray-600">Confidence Score</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Patient Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Patient Summary</CardTitle>
                    <CardDescription>
                      Information used for analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Gender</p>
                        <p className="text-sm text-gray-600 capitalize">
                          {patientDetails?.gender || "Not specified"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Age Group</p>
                        <p className="text-sm text-gray-600">
                          {patientDetails?.ageGroup?.replace("-", " ") ||
                            "Not specified"}
                        </p>
                      </div>
                    </div>
                    {patientDetails?.isPregnant &&
                      patientDetails.isPregnant !== "no" && (
                        <div className="flex items-center space-x-3">
                          <Eye className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium">Pregnancy Status</p>
                            <p className="text-sm text-gray-600 capitalize">
                              {patientDetails.isPregnant}
                            </p>
                          </div>
                        </div>
                      )}
                    {patientDetails?.medicalHistory &&
                      patientDetails.medicalHistory !== "none" && (
                        <div className="flex items-center space-x-3">
                          <Pill className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium">Medical History</p>
                            <p className="text-sm text-gray-600">
                              {patientDetails.medicalHistory.replace("-", " ")}
                            </p>
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* AI Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Brain className="mr-2 h-5 w-5" />
                      AI Recommendations
                    </CardTitle>
                    <CardDescription>
                      Personalized suggestions from{" "}
                      {aiRecommendations?.ai_model || "Groq AI"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {aiRecommendations?.assessment && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          {aiRecommendations.assessment}
                        </p>
                      </div>
                    )}
                    <div className="space-y-3">
                      {Array.isArray(aiRecommendations?.recommendations) &&
                        aiRecommendations.recommendations.map((rec, index) => (
                          <div
                            key={index}
                            className="flex items-start space-x-3"
                          >
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-blue-600 text-xs font-medium">
                                {index + 1}
                              </span>
                            </div>
                            <p className="text-sm">{rec}</p>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Dietary Suggestions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Utensils className="mr-2 h-5 w-5" />
                      Dietary Suggestions
                    </CardTitle>
                    <CardDescription>
                      Foods to support your health
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Array.isArray(aiRecommendations?.foods) &&
                        aiRecommendations.foods.map((food, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3"
                          >
                            <Pill className="w-4 h-4 text-green-600" />
                            <p className="text-sm">{food}</p>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lifestyle and Medical Attention */}
              {(Array.isArray(aiRecommendations?.lifestyle) ||
                aiRecommendations?.medical_attention) && (
                <div className="grid lg:grid-cols-2 gap-6">
                  {Array.isArray(aiRecommendations?.lifestyle) &&
                    aiRecommendations.lifestyle.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Lifestyle Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {aiRecommendations.lifestyle.map((tip, index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-2"
                              >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <p className="text-sm">{tip}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                  {aiRecommendations?.medical_attention && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Medical Attention</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            {aiRecommendations.medical_attention}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Health Trends
                  </CardTitle>
                  <CardDescription>
                    Your anemia screening history over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="confidence"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ fill: "#3B82F6" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Technical Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Technical Analysis</CardTitle>
                    <CardDescription>
                      Detailed information about the AI analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-medium">Model Used</p>
                      <p className="text-sm text-gray-600">
                        Roboflow Anemia Detection Model
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Analysis Method</p>
                      <p className="text-sm text-gray-600">
                        Conjunctival pallor assessment using computer vision
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Confidence Score</p>
                      <p className="text-sm text-gray-600">
                        {confidence}% (
                        {confidence >= 80
                          ? "High"
                          : confidence >= 60
                          ? "Medium"
                          : "Low"}{" "}
                        confidence)
                      </p>
                    </div>
                    {roboflowResults.inference_time && (
                      <div>
                        <p className="font-medium">Processing Time</p>
                        <p className="text-sm text-gray-600">
                          {roboflowResults.inference_time}ms
                        </p>
                      </div>
                    )}
                    {roboflowResults.image_dimensions && (
                      <div>
                        <p className="font-medium">Image Dimensions</p>
                        <p className="text-sm text-gray-600">
                          {roboflowResults.image_dimensions.width} x{" "}
                          {roboflowResults.image_dimensions.height} pixels
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Next Steps */}
                <Card>
                  <CardHeader>
                    <CardTitle>Next Steps</CardTitle>
                    <CardDescription>
                      Recommended actions based on your results
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {diagnosis === "normal" || diagnosis === "no_anemia" ? (
                      <>
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="font-medium">
                              Continue Healthy Habits
                            </p>
                            <p className="text-sm text-gray-600">
                              Maintain your current diet and lifestyle
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium">Regular Monitoring</p>
                            <p className="text-sm text-gray-600">
                              Schedule next screening in 6 months
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                          <div>
                            <p className="font-medium">
                              Consult Healthcare Provider
                            </p>
                            <p className="text-sm text-gray-600">
                              Schedule an appointment for blood tests
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Pill className="w-5 h-5 text-purple-600 mt-0.5" />
                          <div>
                            <p className="font-medium">
                              Follow Dietary Recommendations
                            </p>
                            <p className="text-sm text-gray-600">
                              Increase iron-rich foods in your diet
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                    {aiRecommendations?.follow_up && (
                      <div className="flex items-start space-x-3">
                        <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium">Follow-up</p>
                          <p className="text-sm text-gray-600">
                            {aiRecommendations.follow_up}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
