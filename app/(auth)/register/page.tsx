import Link from "next/link"
import { signup } from "@/app/actions/auth"
import { AuthSubmitButton } from '@/components/shared/auth-submit-button'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const { message } = await searchParams

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="space-y-2">
        <p
          className="text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ color: 'var(--lp-accent)', fontFamily: 'var(--font-dm)' }}
        >
          Free forever to start
        </p>
        <h2
          className="text-3xl font-extrabold tracking-[-0.03em]"
          style={{ fontFamily: 'var(--font-syne)', color: 'var(--lp-text)' }}
        >
          Start your agency workspace
        </h2>
        <p
          className="text-sm"
          style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)', fontWeight: 300 }}
        >
          Set up workspaces, invite your team, and connect your first lead intake form.
        </p>
      </div>

      {/* Alert */}
      {message && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: 'rgba(255,77,28,0.08)',
            border: '1px solid rgba(255,77,28,0.2)',
            color: 'var(--lp-accent)',
            fontFamily: 'var(--font-dm)',
          }}
        >
          {message}
        </div>
      )}

      {/* Form */}
      <form action={signup} className="auth-form space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="fullName"
            className="block text-xs font-semibold uppercase tracking-[0.1em]"
            style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}
          >
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Jordan Rivera"
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
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-[0.1em]"
            style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}
          >
            Work email
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
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-[0.1em]"
            style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}
          >
            Password
          </label>
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
          <p
            className="text-[11px]"
            style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}
          >
            Your workspace data is encrypted and scoped to your account.
          </p>
        </div>

        <AuthSubmitButton label="Create free account" loadingText="Creating account…" />
      </form>

      {/* Footer */}
      <p
        className="text-center text-sm"
        style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}
      >
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold transition-opacity hover:opacity-80"
          style={{ color: 'var(--lp-text)' }}
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
