"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Eye,
  Heart,
  Activity,
  Plus,
  Camera,
  BarChart3,
  History,
  User,
  Settings,
  LogOut,
  Wifi,
  WifiOff,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface VitalSignsData {
  heartRate: number
  oxygenLevel: number
  timestamp: string
  status: "normal" | "warning" | "critical"
}

function DashboardContent() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [vitalSigns, setVitalSigns] = useState<VitalSignsData>({
    heartRate: 0,
    oxygenLevel: 0,
    timestamp: new Date().toISOString(),
    status: "normal",
  })
  const [recentTests, setRecentTests] = useState<any[]>([])
  const [vitalHistory, setVitalHistory] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load user data from Supabase
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return

      try {
        // Load user's vital signs history
        const { data: vitalsData, error: vitalsError } = await supabase
          .from("vital_signs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10)

        if (vitalsError) {
          console.error("Error loading vital signs:", vitalsError)
        } else if (vitalsData && vitalsData.length > 0) {
          setVitalHistory(vitalsData)
          // Set latest vital signs if available
          const latest = vitalsData[0]
          setVitalSigns({
            heartRate: latest.heart_rate,
            oxygenLevel: latest.oxygen_level,
            timestamp: latest.created_at,
            status: getVitalStatus(latest.heart_rate, latest.oxygen_level),
          })
        }

        // Load user's diagnosis results
        const { data: diagnosisData, error: diagnosisError } = await supabase
          .from("diagnosis_results")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5)

        if (diagnosisError) {
          console.error("Error loading diagnosis results:", diagnosisError)
        } else if (diagnosisData) {
          setRecentTests(diagnosisData)
        }

        // Try to fetch real-time vital signs from ThingSpeak
        try {
          const thingSpeakResponse = await fetch("/api/thingspeak")
          if (thingSpeakResponse.ok) {
            const thingSpeakData = await thingSpeakResponse.json()
            if (thingSpeakData.heartRate && thingSpeakData.oxygenLevel) {
              setVitalSigns({
                heartRate: thingSpeakData.heartRate,
                oxygenLevel: thingSpeakData.oxygenLevel,
                timestamp: thingSpeakData.timestamp || new Date().toISOString(),
                status: getVitalStatus(thingSpeakData.heartRate, thingSpeakData.oxygenLevel),
              })
              setIsConnected(true)
            }
          }
        } catch (error) {
          console.warn("ThingSpeak connection failed:", error)
          setIsConnected(false)
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error)
        toast({
          title: "Error loading data",
          description: "Some dashboard data may not be available.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [user, toast])

  // Set up real-time updates for ThingSpeak data
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/thingspeak")
        if (response.ok) {
          const data = await response.json()
          if (data.heartRate && data.oxygenLevel) {
            setVitalSigns({
              heartRate: data.heartRate,
              oxygenLevel: data.oxygenLevel,
              timestamp: data.timestamp || new Date().toISOString(),
              status: getVitalStatus(data.heartRate, data.oxygenLevel),
            })
            setIsConnected(true)
          }
        } else {
          setIsConnected(false)
        }
      } catch (error) {
        setIsConnected(false)
      }
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const getVitalStatus = (heartRate: number, oxygenLevel: number): "normal" | "warning" | "critical" => {
    if (heartRate < 60 || heartRate > 100 || oxygenLevel < 95) {
      return "warning"
    }
    if (heartRate < 50 || heartRate > 120 || oxygenLevel < 90) {
      return "critical"
    }
    return "normal"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "text-green-600 bg-green-50 border-green-200"
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "critical":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await signOut()
      if (error) {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  // Transform vital signs history for chart
  const chartData = vitalHistory
    .slice(0, 7)
    .reverse()
    .map((vital) => ({
      time: new Date(vital.created_at).toLocaleDateString(),
      heartRate: vital.heart_rate,
      oxygen: vital.oxygen_level,
    }))

  const diseases = [
    {
      id: "anemia",
      name: "Anemia Detection",
      description: "AI-powered conjunctival analysis with voice guidance",
      icon: Eye,
      available: true,
      accuracy: "95%",
      color: "from-red-500 to-red-600",
    },
    {
      id: "diabetic-retinopathy",
      name: "Diabetic Retinopathy",
      description: "Early detection of diabetic eye complications",
      icon: Eye,
      available: false,
      accuracy: "92%",
      color: "from-purple-500 to-purple-600",
    },
    {
      id: "glaucoma",
      name: "Glaucoma Screening",
      description: "Detect signs of glaucoma in retinal images",
      icon: Eye,
      available: false,
      accuracy: "89%",
      color: "from-blue-500 to-blue-600",
    },
    {
      id: "cardiovascular",
      name: "Heart Health Analysis",
      description: "Comprehensive cardiovascular risk assessment",
      icon: Heart,
      available: false,
      accuracy: "88%",
      color: "from-pink-500 to-pink-600",
    },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Dashboard...</h2>
          <p className="text-gray-600">Please wait while we load your health data.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              Hemascan
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isConnected ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-red-600" />}
              <span className="text-sm text-gray-600">{isConnected ? "Connected" : "Disconnected"}</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder.svg"} alt="User" />
                    <AvatarFallback>
                      {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.user_metadata?.full_name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.user_metadata?.full_name?.split(" ")[0] || "User"}!
          </h1>
          <p className="text-gray-600">Monitor your health with AI-powered diagnostics and real-time vital signs</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="vitals" className="text-xs sm:text-sm">
              Vitals
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="text-xs sm:text-sm">
              Diagnostics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Heart Rate</p>
                      <p className="text-2xl font-bold text-red-600">
                        {vitalSigns.heartRate > 0 ? Math.round(vitalSigns.heartRate) : "--"}
                      </p>
                      <p className="text-xs text-gray-500">BPM</p>
                    </div>
                    <Heart className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Oxygen Level</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {vitalSigns.oxygenLevel > 0 ? Math.round(vitalSigns.oxygenLevel) : "--"}
                      </p>
                      <p className="text-xs text-gray-500">SpO2 %</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Tests</p>
                      <p className="text-2xl font-bold">{recentTests.length}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Health Score</p>
                      <p className="text-2xl font-bold text-green-600">
                        {vitalSigns.status === "normal" ? "94" : vitalSigns.status === "warning" ? "75" : "45"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {vitalSigns.status === "normal"
                          ? "Excellent"
                          : vitalSigns.status === "warning"
                            ? "Good"
                            : "Needs Attention"}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vital Signs Chart */}
            {chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Vital Signs History</CardTitle>
                  <CardDescription>Your recent vital signs data from Supabase</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="heartRate"
                        stroke="#dc2626"
                        strokeWidth={2}
                        name="Heart Rate (BPM)"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="oxygen"
                        stroke="#2563eb"
                        strokeWidth={2}
                        name="Oxygen Level (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="vitals" className="space-y-6">
            {/* Real-time Vital Signs */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="mr-2 h-5 w-5 text-red-600" />
                    Heart Rate Monitor
                  </CardTitle>
                  <CardDescription>
                    {isConnected ? "Real-time data from ThingSpeak" : "Latest recorded data"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="text-6xl font-bold text-red-600">
                      {vitalSigns.heartRate > 0 ? Math.round(vitalSigns.heartRate) : "--"}
                    </div>
                    <div className="text-lg text-gray-600">BPM</div>
                    <Badge className={getStatusColor(vitalSigns.status)}>{vitalSigns.status.toUpperCase()}</Badge>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Resting Range: 60-100 BPM</span>
                      </div>
                      <Progress
                        value={vitalSigns.heartRate > 0 ? Math.min((vitalSigns.heartRate / 100) * 100, 100) : 0}
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="mr-2 h-5 w-5 text-blue-600" />
                    Oxygen Saturation
                  </CardTitle>
                  <CardDescription>
                    {isConnected ? "SpO2 levels via ThingSpeak" : "Latest recorded data"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="text-6xl font-bold text-blue-600">
                      {vitalSigns.oxygenLevel > 0 ? Math.round(vitalSigns.oxygenLevel) : "--"}
                    </div>
                    <div className="text-lg text-gray-600">SpO2 %</div>
                    <Badge className={getStatusColor(vitalSigns.status)}>{vitalSigns.status.toUpperCase()}</Badge>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Normal Range: 95-100%</span>
                      </div>
                      <Progress value={vitalSigns.oxygenLevel} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ThingSpeak Connection Status */}
            <Card>
              <CardHeader>
                <CardTitle>Sensor Connection Status</CardTitle>
                <CardDescription>MAX30100 sensor via ThingSpeak IoT platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                    <div>
                      <p className="font-medium">{isConnected ? "Connected to ThingSpeak" : "Connection Lost"}</p>
                      <p className="text-sm text-gray-600">
                        Last update: {new Date(vitalSigns.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    Reconnect
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diagnostics" className="space-y-6">
            {/* Disease Detection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-6">
              {diseases.map((disease) => (
                <Card key={disease.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-12 h-12 bg-gradient-to-r ${disease.color} rounded-lg flex items-center justify-center`}
                      >
                        <disease.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={disease.available ? "default" : "secondary"}>
                          {disease.available ? "Available" : "Coming Soon"}
                        </Badge>
                        <Badge variant="outline">{disease.accuracy}</Badge>
                      </div>
                    </div>
                    <CardTitle className="text-xl">{disease.name}</CardTitle>
                    <CardDescription>{disease.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-2">
                      {disease.available ? (
                        <>
                          <Link href={`/diagnosis/${disease.id}/camera`} className="flex-1">
                            <Button className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700">
                              <Camera className="mr-2 h-4 w-4" />
                              Start Scan
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <Button disabled className="w-full">
                          <Plus className="mr-2 h-4 w-4" />
                          Coming Soon
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Tests */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Diagnostic Tests</CardTitle>
                    <CardDescription>Your latest AI-powered health analyses from Supabase</CardDescription>
                  </div>
                  <Button variant="outline">
                    <History className="mr-2 h-4 w-4" />
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentTests.length > 0 ? (
                  <div className="space-y-4">
                    {recentTests.map((test) => (
                      <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                            <Eye className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium capitalize">{test.type.replace("_", " ")}</p>
                            <p className="text-sm text-gray-600">{new Date(test.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              test.result === "normal" || test.result === "no_anemia" ? "default" : "destructive"
                            }
                          >
                            {test.result.replace("_", " ")}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">{test.confidence}% confidence</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No diagnostic tests yet</p>
                    <Link href="/diagnosis/anemia/camera">
                      <Button>
                        <Camera className="mr-2 h-4 w-4" />
                        Start Your First Scan
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <PWAInstallPrompt />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
