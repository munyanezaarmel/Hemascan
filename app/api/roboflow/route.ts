import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Extract base64 data from data URL
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, "")

    // Roboflow API configuration
    const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY || "B9YYHDcbvfEistW2dcqU"
    const MODEL_ENDPOINT = process.env.ROBOFLOW_MODEL_ENDPOINT || "anemia_pcm2/2"

    const roboflowUrl = `https://detect.roboflow.com/${MODEL_ENDPOINT}?api_key=${ROBOFLOW_API_KEY}`

    console.log("Sending request to Roboflow:", roboflowUrl)

    const response = await fetch(roboflowUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: base64Data,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Roboflow API error:", response.status, errorText)
      throw new Error(`Roboflow API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log("Roboflow response:", result)

    // Process the result to extract anemia detection
    const processedResult = {
      predictions: result.predictions || [],
      confidence: result.predictions?.[0]?.confidence || 0,
      class: result.predictions?.[0]?.class || "unknown",
      inference_time: result.time || 0,
      image_dimensions: {
        width: result.image?.width || 0,
        height: result.image?.height || 0,
      },
    }

    return NextResponse.json(processedResult)
  } catch (error) {
    console.error("Roboflow API error:", error)
    return NextResponse.json(
      {
        error: "Failed to analyze image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
