// app/auth/callback/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Supabase will parse the URL hash and update session automatically
      const { error } = await supabase.auth.getSession()

      if (error) {
        console.error('Error handling Supabase auth callback:', error)
      }

      // Redirect user to dashboard (or wherever you want)
      router.replace('/dashboard')
    }

    handleOAuthCallback()
  }, [router])

  return <p>Logging in...</p>
}
