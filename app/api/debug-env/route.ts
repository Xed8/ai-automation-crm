import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

  return NextResponse.json({
    url_set: !!url,
    url_preview: url ? `${url.slice(0, 20)}...${url.slice(-10)}` : 'MISSING',
    anon_set: !!anon,
    anon_preview: anon ? `${anon.slice(0, 10)}...${anon.slice(-6)}` : 'MISSING',
    service_set: !!service,
    service_preview: service ? `${service.slice(0, 10)}...${service.slice(-6)}` : 'MISSING',
  })
}
