import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Heart, Activity, Zap, CheckCircle, ArrowRight, Camera, BarChart3, Mic } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function LandingPage() {
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
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-red-100 text-red-700 hover:bg-red-100">🩸 Advanced Blood Analysis AI</Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-red-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
            Hemascan AI Diagnostics
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Revolutionary non-invasive anemia detection with real-time eye analysis, voice guidance, and comprehensive
            health monitoring including heart rate and oxygen levels.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-lg px-8 py-6"
              >
                Start Health Scan
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Watch Demo
            </Button>
          </div>

          {/* Hero Image */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl p-1">
              <div className="bg-white rounded-xl p-8">
                <Image
                  src="/placeholder.svg?height=400&width=800"
                  alt="Hemascan AI Dashboard"
                  width={800}
                  height={400}
                  className="w-full rounded-lg shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Advanced AI Health Monitoring</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Cutting-edge TensorFlow.js and voice-guided technology for comprehensive health analysis
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">AI Eye Analysis</h3>
                <p className="text-gray-600">
                  TensorFlow.js powered real-time eye detection with lighting and movement analysis
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mic className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Voice Guidance</h3>
                <p className="text-gray-600">
                  Web Speech API provides real-time audio instructions for optimal image capture
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-rose-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Heart Rate Monitor</h3>
                <p className="text-gray-600">
                  Real-time heart rate tracking using MAX30100 sensor via ThingSpeak integration
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Oxygen Levels</h3>
                <p className="text-gray-600">Continuous SpO2 monitoring with real-time data visualization and alerts</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-red-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How Hemascan Works</h2>
            <p className="text-xl text-gray-600">Advanced AI analysis in 4 simple steps</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">1. AI-Guided Capture</h3>
              <p className="text-gray-600">
                TensorFlow.js detects your eye position with voice guidance for perfect image quality
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">2. Real-time Analysis</h3>
              <p className="text-gray-600">
                Advanced computer vision analyzes conjunctival pallor with medical-grade accuracy
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-rose-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">3. Vital Signs</h3>
              <p className="text-gray-600">
                Monitor heart rate and oxygen levels through integrated MAX30100 sensor data
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">4. AI Insights</h3>
              <p className="text-gray-600">
                Get comprehensive health reports with AI-powered recommendations and trends
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Why Choose Hemascan?</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">TensorFlow.js Powered</h3>
                    <p className="text-gray-600">Advanced machine learning for precise eye detection and analysis</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Voice-Guided Experience</h3>
                    <p className="text-gray-600">Real-time audio instructions for optimal image capture</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Comprehensive Monitoring</h3>
                    <p className="text-gray-600">Heart rate, oxygen levels, and anemia detection in one platform</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Real-time IoT Integration</h3>
                    <p className="text-gray-600">MAX30100 sensor data via ThingSpeak for continuous monitoring</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <Image
                src="/placeholder.svg?height=500&width=600"
                alt="Hemascan Technology"
                width={600}
                height={500}
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-red-600 to-pink-600">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Health Monitoring?</h2>
          <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
            Join the future of AI-powered health diagnostics with Hemascan's advanced technology
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100 text-lg px-8 py-6">
              Start Your Health Journey
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Hemascan</span>
              </div>
              <p className="text-gray-400">Advanced AI-powered health diagnostics and monitoring</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Technology</h3>
              <ul className="space-y-2 text-gray-400">
                <li>TensorFlow.js</li>
                <li>Computer Vision</li>
                <li>Voice AI</li>
                <li>IoT Integration</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Health Metrics</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Anemia Detection</li>
                <li>Heart Rate</li>
                <li>Oxygen Levels</li>
                <li>Health Trends</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Contact</li>
                <li>Privacy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Hemascan. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
