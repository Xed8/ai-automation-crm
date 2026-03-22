import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--ink)' }}
    >
      {/* Left panel — branding + social proof */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-10 xl:p-14 relative overflow-hidden"
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Ambient orbs */}
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: 500,
            height: 500,
            top: '-15%',
            right: '-10%',
            background: 'radial-gradient(circle, rgba(255,77,28,0.10) 0%, transparent 70%)',
          }}
        />
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: 400,
            height: 400,
            bottom: '-10%',
            left: '-5%',
            background: 'radial-gradient(circle, rgba(0,87,255,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm"
              style={{ background: 'var(--lp-accent)', fontFamily: 'var(--font-syne)', color: '#fff' }}
            >
              L
            </div>
            <span
              className="font-bold text-base"
              style={{ fontFamily: 'var(--font-syne)', color: 'var(--lp-text)' }}
            >
              LeadFlow
            </span>
          </Link>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-6">
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: 'var(--lp-accent)', fontFamily: 'var(--font-dm)' }}
          >
            Built for agencies
          </p>
          <h1
            className="text-4xl xl:text-5xl font-extrabold leading-[0.92] tracking-[-0.04em]"
            style={{ fontFamily: 'var(--font-syne)', color: 'var(--lp-text)' }}
          >
            Your pipeline.<br />
            <span style={{ color: 'var(--lp-accent)' }}>Fully alive.</span>
          </h1>
          <p
            className="text-sm leading-relaxed max-w-sm"
            style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)', fontWeight: 300 }}
          >
            Lead intake, AI follow-ups, kanban pipelines, and automation — all in one workspace your team will actually use.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { val: 'Free', label: 'to start' },
              { val: '∞', label: 'team members' },
              { val: 'AI', label: 'follow-ups' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-3.5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div
                  className="text-xl font-extrabold"
                  style={{ fontFamily: 'var(--font-syne)', color: 'var(--lp-text)' }}
                >
                  {s.val}
                </div>
                <div
                  className="text-[11px] mt-0.5"
                  style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div
          className="relative z-10 rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p
            className="text-sm leading-relaxed italic"
            style={{ color: 'var(--lp-text)', fontFamily: 'var(--font-dm)' }}
          >
            &ldquo;We replaced GoHighLevel and HubSpot with LeadFlow. The AI follow-up alone recovered three deals we had written off.&rdquo;
          </p>
          <div className="mt-3 flex items-center gap-2.5">
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--lp-accent)', color: '#fff', fontFamily: 'var(--font-syne)' }}
            >
              M
            </div>
            <div>
              <div
                className="text-xs font-semibold"
                style={{ color: 'var(--lp-text)', fontFamily: 'var(--font-syne)' }}
              >
                Mia Santos
              </div>
              <div
                className="text-[11px]"
                style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}
              >
                Founder · SynthGrowth Agency
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex lg:w-1/2 flex-1 flex-col">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-6 py-4 lg:px-10"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <div
              className="h-7 w-7 rounded-md flex items-center justify-center font-bold text-xs"
              style={{ background: 'var(--lp-accent)', fontFamily: 'var(--font-syne)', color: '#fff' }}
            >
              L
            </div>
            <span
              className="font-bold text-sm"
              style={{ fontFamily: 'var(--font-syne)', color: 'var(--lp-text)' }}
            >
              LeadFlow
            </span>
          </Link>
          <div className="hidden lg:block" />

          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
            style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
        </div>

        {/* Form area */}
        <div className="flex flex-1 items-center justify-center px-6 py-10 lg:px-12">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
