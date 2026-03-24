import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams
  const errorMessage = message ?? 'Something went wrong. Please try again.'

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--ink)' }}
    >
      {/* Ambient orb */}
      <div
        className="pointer-events-none fixed rounded-full"
        style={{
          width: 600,
          height: 600,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(255,77,28,0.07) 0%, transparent 65%)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(255,77,28,0.12)', border: '1px solid rgba(255,77,28,0.2)' }}
          >
            <AlertCircle className="h-6 w-6" style={{ color: 'var(--lp-accent)' }} />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1
            className="text-2xl font-extrabold tracking-tight"
            style={{ fontFamily: 'var(--font-syne)', color: 'var(--lp-text)' }}
          >
            Confirmation failed
          </h1>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}
          >
            {errorMessage}
          </p>
        </div>

        {/* Action */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--lp-accent)', fontFamily: 'var(--font-dm)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    </div>
  )
}
