import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(request: NextRequest) {
  try {
    const { diagnosis, confidence, patientDetails, vitalSigns } = await request.json()

    const prompt = `
    As a medical AI assistant, provide personalized health recommendations based on the following anemia detection results:
    
    DIAGNOSIS RESULTS:
    - Anemia Detection: ${diagnosis}
    - AI Confidence: ${confidence}%
    
    PATIENT INFORMATION:
    - Gender: ${patientDetails?.gender || "Not specified"}
    - Age Group: ${patientDetails?.ageGroup || "Not specified"}
    - Pregnancy Status: ${patientDetails?.isPregnant || "Not applicable"}
    - Medical History: ${patientDetails?.medicalHistory || "None specified"}
    
    VITAL SIGNS (if available):
    - Heart Rate: ${vitalSigns?.heartRate || "Not measured"} BPM
    - Oxygen Level: ${vitalSigns?.oxygenLevel || "Not measured"}%
    - Anemia Level: ${vitalSigns?.anemiaLevel || "Not measured"}
    
    Please provide a comprehensive analysis including:
    1. Assessment of the anemia detection result
    2. Specific dietary recommendations with iron-rich foods
    3. Lifestyle modifications
    4. When to seek immediate medical attention
    5. Follow-up recommendations
    6. Considerations based on patient demographics
    
    Format the response as JSON with the following structure:
    {
      "assessment": "Overall health assessment",
      "recommendations": ["recommendation 1", "recommendation 2", ...],
      "foods": ["food 1", "food 2", ...],
      "lifestyle": ["lifestyle tip 1", "lifestyle tip 2", ...],
      "medical_attention": "When to seek medical care",
      "follow_up": "Follow-up recommendations"
    }
    
    Keep recommendations evidence-based and always emphasize consulting healthcare professionals for medical decisions.
    `

    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile"),
      prompt,
      system:
        "You are a medical AI assistant providing evidence-based health recommendations. Always emphasize consulting healthcare professionals for medical decisions. Respond only with valid JSON.",
    })

    // Try to parse the AI response as JSON
    let recommendations
    try {
      recommendations = JSON.parse(text)
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError)
      // Fallback structured response
      recommendations = {
        assessment:
          diagnosis === "anemia"
            ? `The AI analysis suggests possible anemia with ${confidence}% confidence. This requires medical evaluation for confirmation.`
            : `The AI analysis indicates normal conjunctival appearance with ${confidence}% confidence. Continue maintaining good health practices.`,
        recommendations:
          diagnosis === "anemia"
            ? [
                "Consult with a healthcare professional for blood tests",
                "Increase iron-rich foods in your diet",
                "Consider iron supplements under medical supervision",
                "Monitor symptoms like fatigue and weakness",
                "Ensure adequate vitamin C intake to enhance iron absorption",
              ]
            : [
                "Maintain a balanced diet rich in iron and vitamins",
                "Continue regular health check-ups",
                "Stay hydrated and get adequate sleep",
                "Monitor for any changes in energy levels",
                "Maintain current healthy lifestyle",
              ],
        foods:
          diagnosis === "anemia"
            ? [
                "Spinach and dark leafy greens",
                "Red meat, poultry, and fish",
                "Beans, lentils, and chickpeas",
                "Fortified cereals and bread",
                "Tofu and tempeh",
                "Pumpkin seeds and cashews",
              ]
            : [
                "Variety of fruits and vegetables",
                "Lean proteins",
                "Whole grains",
                "Nuts and seeds",
                "Dairy products",
                "Iron-rich foods for prevention",
              ],
        lifestyle: [
          "Regular moderate exercise",
          "Adequate sleep (7-9 hours nightly)",
          "Stress management techniques",
          "Avoid excessive tea/coffee with meals",
          "Cook in iron cookware when possible",
        ],
        medical_attention:
          diagnosis === "anemia"
            ? "Seek immediate medical attention if experiencing severe fatigue, shortness of breath, chest pain, or dizziness. Schedule a blood test within 1-2 weeks."
            : "Consult a healthcare provider if you develop symptoms like persistent fatigue, weakness, or pale skin.",
        follow_up:
          diagnosis === "anemia"
            ? "Follow up with blood tests in 4-6 weeks after starting treatment. Regular monitoring every 3-6 months."
            : "Continue regular health screenings. Repeat anemia screening annually or as recommended by your healthcare provider.",
      }
    }

    return NextResponse.json({
      ...recommendations,
      timestamp: new Date().toISOString(),
      ai_model: "llama-3.1-70b-versatile",
      confidence_level: confidence,
    })
  } catch (error) {
    console.error("AI recommendations error:", error)

    // Return a structured error response
    return NextResponse.json(
      {
        error: "Failed to generate AI recommendations",
        assessment: "Unable to generate personalized recommendations at this time.",
        recommendations: [
          "Consult with a healthcare professional for personalized advice",
          "Maintain a balanced diet",
          "Stay hydrated and get adequate rest",
          "Monitor your symptoms",
        ],
        foods: [
          "Iron-rich foods like spinach and lean meats",
          "Vitamin C sources to enhance iron absorption",
          "Balanced meals with variety",
        ],
        lifestyle: ["Regular exercise as tolerated", "Adequate sleep", "Stress management"],
        medical_attention: "Consult a healthcare provider for proper evaluation and guidance.",
        follow_up: "Regular health check-ups as recommended by your healthcare provider.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
