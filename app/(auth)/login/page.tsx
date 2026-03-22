import Link from 'next/link'
import { login } from '@/app/actions/auth'
import { AuthSubmitButton } from '@/components/shared/auth-submit-button'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; success?: string }>
}) {
  const { message, success } = await searchParams

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="space-y-2">
        <p
          className="text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ color: 'var(--lp-accent)', fontFamily: 'var(--font-dm)' }}
        >
          Welcome back
        </p>
        <h2
          className="text-3xl font-extrabold tracking-[-0.03em]"
          style={{ fontFamily: 'var(--font-syne)', color: 'var(--lp-text)' }}
        >
          Sign in to your workspace
        </h2>
        <p
          className="text-sm"
          style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)', fontWeight: 300 }}
        >
          Access leads, pipelines, and your team settings.
        </p>
      </div>

      {/* Alert */}
      {message && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: success === '1' ? 'rgba(74,222,128,0.08)' : 'rgba(255,77,28,0.08)',
            border: `1px solid ${success === '1' ? 'rgba(74,222,128,0.2)' : 'rgba(255,77,28,0.2)'}`,
            color: success === '1' ? '#4ade80' : 'var(--lp-accent)',
            fontFamily: 'var(--font-dm)',
          }}
        >
          {message}
        </div>
      )}

      {/* Form */}
      <form action={login} className="auth-form space-y-5">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-[0.1em]"
            style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@agency.com"
            required
            className="auth-input w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--lp-text)',
              fontFamily: 'var(--font-dm)',
            }}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-[0.1em]"
              style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs transition-opacity hover:opacity-70"
              style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="auth-input w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--lp-text)',
              fontFamily: 'var(--font-dm)',
            }}
          />
        </div>

        <AuthSubmitButton label="Sign in" loadingText="Signing in…" />
      </form>

      {/* Footer link */}
      <p
        className="text-center text-sm"
        style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}
      >
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-semibold transition-opacity hover:opacity-80"
          style={{ color: 'var(--lp-text)' }}
        >
          Create one free
        </Link>
      </p>
    </div>
  )
}
