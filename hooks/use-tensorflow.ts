"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"

interface TensorFlowModels {
  blazeface: any
  faceLandmarks: any
}

export function useTensorFlow() {
  const [models, setModels] = useState<TensorFlowModels>({
    blazeface: null,
    faceLandmarks: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true)

        // Wait for TensorFlow.js to be available
        while (typeof window === "undefined" || !window.tf) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        // Load BlazeFace model for face detection
        const blazefaceModel = await window.blazeface.load()

        // Load Face Landmarks model (if needed)
        // const faceLandmarksModel = await window.faceLandmarksDetection.load()

        setModels({
          blazeface: blazefaceModel,
          faceLandmarks: null, // faceLandmarksModel
        })

        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load TensorFlow models")
        setIsLoading(false)
      }
    }

    loadModels()
  }, [])

  return { models, isLoading, error }
}

export function useFaceDetection(videoRef: React.RefObject<HTMLVideoElement>) {
  const [faces, setFaces] = useState<any[]>([])
  const [isDetecting, setIsDetecting] = useState(false)
  const { models, isLoading } = useTensorFlow()
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const startDetection = () => {
    if (!models.blazeface || !videoRef.current || isDetecting) return

    setIsDetecting(true)

    const detectFaces = async () => {
      if (!videoRef.current || !models.blazeface) return

      try {
        const predictions = await models.blazeface.estimateFaces(videoRef.current, false)
        setFaces(predictions)
      } catch (error) {
        console.error("Face detection error:", error)
      }
    }

    detectionIntervalRef.current = setInterval(detectFaces, 100) // 10 FPS
  }

  const stopDetection = () => {
    setIsDetecting(false)
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }
    setFaces([])
  }

  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
    }
  }, [])

  return {
    faces,
    isDetecting,
    startDetection,
    stopDetection,
    isModelLoaded: !isLoading && !!models.blazeface,
  }
}
