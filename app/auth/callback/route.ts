import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const rawNext = searchParams.get('next') ?? '/workspaces'
  // Prevent open redirect — only allow relative paths
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/workspaces'

  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'

  function redirect(path: string) {
    if (isLocalEnv) return NextResponse.redirect(`${origin}${path}`)
    if (forwardedHost) return NextResponse.redirect(`https://${forwardedHost}${path}`)
    return NextResponse.redirect(`${origin}${path}`)
  }

  if (!code) {
    return redirect('/login?message=Could not login with provider')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return redirect(`/auth/error?message=${encodeURIComponent(error.message)}`)
  }

  // For password recovery, always send to /reset-password regardless of next param
  const destination = type === 'recovery' ? '/reset-password' : next
  return redirect(destination)
}
