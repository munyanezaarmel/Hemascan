import { type NextRequest, NextResponse } from "next/server"

const THINGSPEAK_CHANNEL_ID = process.env.THINGSPEAK_CHANNEL_ID || ""
const THINGSPEAK_READ_API_KEY = process.env.THINGSPEAK_READ_API_KEY
const THINGSPEAK_WRITE_API_KEY = process.env.THINGSPEAK_WRITE_API_KEY

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const results = searchParams.get("results") || "1"

    // Build ThingSpeak URL
    let thingSpeakUrl = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?results=${results}`

    if (THINGSPEAK_READ_API_KEY) {
      thingSpeakUrl += `&api_key=${THINGSPEAK_READ_API_KEY}`
    }

    console.log("Fetching from ThingSpeak:", thingSpeakUrl)

    const response = await fetch(thingSpeakUrl, {
      headers: {
        "User-Agent": "Hemascan-App/1.0",
      },
    })

    if (!response.ok) {
      throw new Error(`ThingSpeak API error: ${response.status}`)
    }

    const data = await response.json()
    console.log("ThingSpeak response:", data)

    // Parse the data assuming field1 = heart rate, field2 = oxygen level
    const feeds = data.feeds || []
    const latestFeed = feeds[feeds.length - 1]

    if (latestFeed) {
      const heartRate = Number.parseFloat(latestFeed.field1) || 0
      const oxygenLevel = Number.parseFloat(latestFeed.field2) || 0

      // Determine status based on values
      let status = "normal"
      if (heartRate < 60 || heartRate > 100 || oxygenLevel < 95) {
        status = "warning"
      }
      if (heartRate < 50 || heartRate > 120 || oxygenLevel < 90) {
        status = "critical"
      }

      const vitalSigns = {
        heartRate,
        oxygenLevel,
        timestamp: latestFeed.created_at,
        status,
        channel: data.channel?.name || "MAX30100 Sensor",
        entry_id: latestFeed.entry_id,
      }

      return NextResponse.json(vitalSigns)
    } else {
      return NextResponse.json(
        {
          error: "No data available",
          message: "No sensor data found in ThingSpeak channel",
        },
        { status: 404 },
      )
    }
  } catch (error) {
    console.error("ThingSpeak API error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch vital signs data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { heartRate, oxygenLevel } = await request.json()

    if (!THINGSPEAK_WRITE_API_KEY) {
      return NextResponse.json(
        {
          error: "ThingSpeak write API key not configured",
        },
        { status: 500 },
      )
    }

    // Validate input
    if (!heartRate || !oxygenLevel) {
      return NextResponse.json(
        {
          error: "Heart rate and oxygen level are required",
        },
        { status: 400 },
      )
    }

    // ThingSpeak write URL
    const thingSpeakUrl = `https://api.thingspeak.com/update?api_key=${THINGSPEAK_WRITE_API_KEY}&field1=${heartRate}&field2=${oxygenLevel}`

    console.log("Writing to ThingSpeak:", { heartRate, oxygenLevel })

    const response = await fetch(thingSpeakUrl, {
      method: "POST",
      headers: {
        "User-Agent": "Hemascan-App/1.0",
      },
    })

    if (!response.ok) {
      throw new Error(`ThingSpeak write error: ${response.status}`)
    }

    const result = await response.text()
    const entryId = Number.parseInt(result)

    if (entryId > 0) {
      return NextResponse.json({
        success: true,
        entryId,
        message: "Data uploaded to ThingSpeak successfully",
        timestamp: new Date().toISOString(),
      })
    } else {
      throw new Error("Failed to write data to ThingSpeak")
    }
  } catch (error) {
    console.error("ThingSpeak write error:", error)
    return NextResponse.json(
      {
        error: "Failed to upload data to ThingSpeak",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
