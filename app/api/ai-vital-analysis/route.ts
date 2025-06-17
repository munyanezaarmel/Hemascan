import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(request: NextRequest) {
  try {
    const { heartRate, oxygenLevel, anemiaLevel, notes } = await request.json()

    // Validate input
    if (!heartRate || !oxygenLevel) {
      return NextResponse.json({ error: "Heart rate and oxygen level are required" }, { status: 400 })
    }

    const prompt = `
    As a medical AI assistant, analyze these vital signs and provide health recommendations:
    
    VITAL SIGNS:
    - Heart Rate: ${heartRate} BPM
    - Oxygen Saturation: ${oxygenLevel}%
    - Anemia Risk Level: ${anemiaLevel || 0}/100
    - Additional Notes: ${notes || "None provided"}
    
    ANALYSIS REQUIRED:
    1. Assessment of each vital sign (normal, concerning, critical)
    2. Overall health status interpretation
    3. Specific actionable recommendations
    4. Dietary suggestions if applicable
    5. When to seek immediate medical attention
    6. Lifestyle modifications
    
    Please provide a comprehensive but concise analysis. Focus on practical, evidence-based recommendations.
    Always emphasize consulting healthcare professionals for medical decisions.
    
    Format your response as clear, actionable advice.
    `

    console.log("Sending request to Groq AI...")

    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile"),
      prompt,
      system: `You are a medical AI assistant providing evidence-based health recommendations. 
               Always remind users to consult healthcare professionals for medical decisions.
               Provide clear, actionable advice based on vital signs analysis.
               Be thorough but concise in your recommendations.`,
    })

    console.log("Received response from Groq AI")

    return NextResponse.json({
      suggestions: text,
      analysis_timestamp: new Date().toISOString(),
      ai_model: "llama-3.1-70b-versatile",
      vital_signs_analyzed: {
        heart_rate: heartRate,
        oxygen_level: oxygenLevel,
        anemia_level: anemiaLevel,
      },
    })
  } catch (error) {
    console.error("AI vital analysis error:", error)

    // Provide a structured fallback response
    const { heartRate, oxygenLevel, anemiaLevel } = await request.json()

    let fallbackSuggestions = "Based on your vital signs:\n\n"

    // Heart rate analysis
    if (heartRate < 60) {
      fallbackSuggestions +=
        "• Your heart rate is below normal (bradycardia). Monitor for symptoms like dizziness or fatigue.\n"
    } else if (heartRate > 100) {
      fallbackSuggestions +=
        "• Your heart rate is elevated (tachycardia). Consider rest and stress reduction techniques.\n"
    } else {
      fallbackSuggestions += "• Your heart rate is within normal range (60-100 BPM).\n"
    }

    // Oxygen level analysis
    if (oxygenLevel < 90) {
      fallbackSuggestions += "• Oxygen levels are critically low. Seek immediate medical attention.\n"
    } else if (oxygenLevel < 95) {
      fallbackSuggestions +=
        "• Oxygen levels are below normal. Ensure good ventilation and consider medical consultation.\n"
    } else {
      fallbackSuggestions += "• Your oxygen saturation is within normal range (95-100%).\n"
    }

    // Anemia level analysis
    if (anemiaLevel > 50) {
      fallbackSuggestions +=
        "• Anemia risk level suggests attention needed. Consider iron-rich foods and medical evaluation.\n"
    }

    fallbackSuggestions += "\nGeneral Recommendations:\n"
    fallbackSuggestions += "• Maintain a balanced diet rich in iron and vitamins\n"
    fallbackSuggestions += "• Stay hydrated and get adequate sleep\n"
    fallbackSuggestions += "• Regular exercise as tolerated\n"
    fallbackSuggestions += "• Consult healthcare professionals for personalized advice\n"

    return NextResponse.json({
      suggestions: fallbackSuggestions,
      analysis_timestamp: new Date().toISOString(),
      ai_model: "fallback-analysis",
      error: "AI service temporarily unavailable, using fallback analysis",
      vital_signs_analyzed: {
        heart_rate: heartRate,
        oxygen_level: oxygenLevel,
        anemia_level: anemiaLevel,
      },
    })
  }
}
