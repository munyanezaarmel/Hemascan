"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Heart, Activity, Wifi, WifiOff, AlertTriangle } from "lucide-react"

interface VitalSigns {
  heartRate: number
  oxygenLevel: number
  timestamp: string
  status: "normal" | "warning" | "critical"
}

interface VitalSignsMonitorProps {
  refreshInterval?: number
}

export function VitalSignsMonitor({ refreshInterval = 5000 }: VitalSignsMonitorProps) {
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({
    heartRate: 0,
    oxygenLevel: 0,
    timestamp: new Date().toISOString(),
    status: "normal",
  })
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchVitalSigns = async () => {
      try {
        const response = await fetch("/api/thingspeak")

        if (response.ok) {
          const data = await response.json()
          setVitalSigns(data)
          setIsConnected(true)
        } else {
          setIsConnected(false)
        }
      } catch (error) {
        console.error("Failed to fetch vital signs:", error)
        setIsConnected(false)
      } finally {
        setIsLoading(false)
      }
    }

    // Initial fetch
    fetchVitalSigns()

    // Set up interval for real-time updates
    const interval = setInterval(fetchVitalSigns, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval])

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

  const getHeartRateStatus = (hr: number) => {
    if (hr < 60 || hr > 100) return "warning"
    if (hr < 50 || hr > 120) return "critical"
    return "normal"
  }

  const getOxygenStatus = (spo2: number) => {
    if (spo2 < 95) return "warning"
    if (spo2 < 90) return "critical"
    return "normal"
  }

  if (isLoading) {
    return (
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Real-time Vital Signs</h3>
        <div className="flex items-center space-x-2">
          {isConnected ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-red-600" />}
          <span className="text-sm text-gray-600">{isConnected ? "Connected to MAX30100" : "Sensor Disconnected"}</span>
        </div>
      </div>

      {/* Vital Signs Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Heart Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="mr-2 h-5 w-5 text-red-600" />
              Heart Rate
            </CardTitle>
            <CardDescription>Real-time pulse monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold text-red-600">{Math.round(vitalSigns.heartRate)}</div>
              <div className="text-lg text-gray-600">BPM</div>
              <Badge className={getStatusColor(getHeartRateStatus(vitalSigns.heartRate))}>
                {getHeartRateStatus(vitalSigns.heartRate).toUpperCase()}
              </Badge>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Normal: 60-100 BPM</span>
                </div>
                <Progress value={Math.min((vitalSigns.heartRate / 120) * 100, 100)} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Oxygen Level */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5 text-blue-600" />
              Oxygen Saturation
            </CardTitle>
            <CardDescription>SpO2 pulse oximetry</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold text-blue-600">{Math.round(vitalSigns.oxygenLevel)}</div>
              <div className="text-lg text-gray-600">SpO2 %</div>
              <Badge className={getStatusColor(getOxygenStatus(vitalSigns.oxygenLevel))}>
                {getOxygenStatus(vitalSigns.oxygenLevel).toUpperCase()}
              </Badge>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Normal: 95-100%</span>
                </div>
                <Progress value={vitalSigns.oxygenLevel} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(!isConnected ||
        getHeartRateStatus(vitalSigns.heartRate) !== "normal" ||
        getOxygenStatus(vitalSigns.oxygenLevel) !== "normal") && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Health Alert</p>
                <p className="text-sm text-yellow-700">
                  {!isConnected && "Sensor connection lost. "}
                  {getHeartRateStatus(vitalSigns.heartRate) !== "normal" && "Heart rate outside normal range. "}
                  {getOxygenStatus(vitalSigns.oxygenLevel) !== "normal" && "Oxygen levels need attention. "}
                  Please consult a healthcare professional if symptoms persist.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Update */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(vitalSigns.timestamp).toLocaleTimeString()}
      </div>
    </div>
  )
}
