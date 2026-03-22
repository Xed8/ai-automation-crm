import Link from 'next/link'
import { login } from '@/app/actions/auth'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthSubmitButton } from '@/components/shared/auth-submit-button'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; success?: string }>
}) {
  const { message, success } = await searchParams

  return (
    <Card className="surface-card mx-auto w-full max-w-lg border-white/70 bg-background/90">
      <CardHeader className="space-y-4">
        <span className="eyebrow w-fit">Welcome back</span>
        <div className="space-y-2">
          <CardTitle className="text-3xl">Sign in to your workspace</CardTitle>
          <CardDescription className="text-base">
            Use your team credentials to access leads, boards, forms, and workspace settings.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={login} className="space-y-1">
        <CardContent className="space-y-5">
          {message && (
            <div className={[
              'rounded-[1.25rem] border px-4 py-3 text-sm',
              success === '1'
                ? 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400'
                : 'border-destructive/20 bg-destructive/10 text-destructive',
            ].join(' ')}>
              {message}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@agency.com"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
              <Link href="/forgot-password" className="text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-primary">
                Forgot password?
              </Link>
            </div>
            <Input id="password" name="password" type="password" required />
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-4">
          <AuthSubmitButton label="Sign in" loadingText="Signing in…" />
          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
              Create one
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
