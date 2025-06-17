import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (for API routes)
export const createServerClient = () => {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Storage functions for image uploads
export const uploadImage = async (file: File, bucket: string, path: string) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  })
  return { data, error }
}

export const getImageUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export const deleteImage = async (bucket: string, path: string) => {
  const { data, error } = await supabase.storage.from(bucket).remove([path])
  return { data, error }
}

// Auth helper functions
export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export const getSession = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

// Database functions (these will work with your existing Supabase tables)
export const saveVitalSigns = async (
  userId: string,
  heartRate: number,
  oxygenLevel: number,
  anemiaLevel: number,
  notes?: string,
) => {
  const { data, error } = await supabase.from("vital_signs").insert({
    user_id: userId,
    heart_rate: heartRate,
    oxygen_level: oxygenLevel,
    anemia_level: anemiaLevel,
    notes,
    source: "manual",
  })
  return { data, error }
}

export const saveDiagnosisResult = async (
  userId: string,
  type: string,
  result: string,
  confidence: number,
  imageUrl?: string,
  aiAnalysis?: any,
  patientDetails?: any,
) => {
  const { data, error } = await supabase.from("diagnosis_results").insert({
    user_id: userId,
    type,
    result,
    confidence,
    image_url: imageUrl,
    ai_analysis: aiAnalysis,
    patient_details: patientDetails,
  })
  return { data, error }
}

export const getUserVitalSigns = async (userId: string, limit = 10) => {
  const { data, error } = await supabase
    .from("vital_signs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)
  return { data, error }
}

export const getUserDiagnosisResults = async (userId: string, limit = 10) => {
  const { data, error } = await supabase
    .from("diagnosis_results")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)
  return { data, error }
}
