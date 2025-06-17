"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, X, Smartphone, Zap, Wifi } from "lucide-react"
import { usePWA } from "@/hooks/use-pwa"

export function PWAInstallPrompt() {
  const { isInstallable, installApp, isOnline } = usePWA()
  const [isDismissed, setIsDismissed] = useState(false)

  if (!isInstallable || isDismissed) {
    return null
  }

  const handleInstall = async () => {
    const success = await installApp()
    if (!success) {
      setIsDismissed(true)
    }
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 text-sm">Install Hemascan</h3>
              <p className="text-xs text-blue-700">Get the full app experience</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center">
            <Zap className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-blue-800">Faster</p>
          </div>
          <div className="text-center">
            <Wifi className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-blue-800">Offline</p>
          </div>
          <div className="text-center">
            <Smartphone className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-xs text-blue-800">Native</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => setIsDismissed(true)} className="flex-1 text-xs">
            Later
          </Button>
          <Button
            onClick={handleInstall}
            size="sm"
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs"
          >
            <Download className="w-3 h-3 mr-1" />
            Install
          </Button>
        </div>

        {!isOnline && (
          <Badge variant="secondary" className="w-full justify-center mt-2 text-xs">
            Install now for offline access
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
