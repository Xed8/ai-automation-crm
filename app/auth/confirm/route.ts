import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/workspaces'

  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'

  function redirect(path: string) {
    if (isLocalEnv) return NextResponse.redirect(`${origin}${path}`)
    if (forwardedHost) return NextResponse.redirect(`https://${forwardedHost}${path}`)
    return NextResponse.redirect(`${origin}${path}`)
  }

  const supabase = await createClient()

  // PKCE flow — token_hash starts with "pkce_" or a code param is present
  if (code || (token_hash && token_hash.startsWith('pkce_'))) {
    const { error } = await supabase.auth.exchangeCodeForSession(code ?? token_hash!)
    if (error) {
      return redirect(`/auth/error?message=${encodeURIComponent(error.message)}`)
    }
    return redirect(next)
  }

  // OTP / magic-link flow
  if (!token_hash || !type) {
    return redirect(`/auth/error?message=${encodeURIComponent('Invalid confirmation link.')}`)
  }

  const { error } = await supabase.auth.verifyOtp({ token_hash, type })
  if (error) {
    return redirect(`/auth/error?message=${encodeURIComponent(error.message)}`)
  }

  return redirect(next)
}
