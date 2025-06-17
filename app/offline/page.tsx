"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WifiOff, RefreshCw, Heart, Activity } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleRetry = () => {
    if (isOnline) {
      router.back()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <WifiOff className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">You're Offline</CardTitle>
            <CardDescription>
              {isOnline
                ? "Connection restored! You can continue using Hemascan."
                : "Check your internet connection to access all features."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Heart className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <h3 className="font-medium text-sm">Vital Signs</h3>
                <p className="text-xs text-gray-600">Available offline</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-medium text-sm">History</h3>
                <p className="text-xs text-gray-600">Cached data</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Available offline:</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• View cached vital signs</li>
                <li>• Browse previous test results</li>
                <li>• Access AI recommendations</li>
                <li>• Use camera for image capture</li>
              </ul>
            </div>

            <Button
              onClick={handleRetry}
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
              disabled={!isOnline}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {isOnline ? "Continue" : "Retry Connection"}
            </Button>

            <p className="text-xs text-center text-gray-500">
              Your data will sync automatically when connection is restored.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
