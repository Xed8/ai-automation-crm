import Link from 'next/link'
import { headers } from 'next/headers'
import { requestPasswordReset } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; success?: string }>
}) {
  const { message, success } = await searchParams
  const headersList = await headers()
  const origin = headersList.get('origin') ?? headersList.get('x-forwarded-proto')
    ? `${headersList.get('x-forwarded-proto')}://${headersList.get('host')}`
    : 'http://localhost:3000'

  return (
    <Card className="surface-card mx-auto w-full max-w-lg border-white/70 bg-background/90">
      <CardHeader className="space-y-4">
        <span className="eyebrow w-fit">Password reset</span>
        <div className="space-y-2">
          <CardTitle className="text-3xl">Forgot your password?</CardTitle>
          <CardDescription className="text-base">
            Enter your email and we&apos;ll send you a link to reset your password.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={requestPasswordReset} className="space-y-1">
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
          {/* Pass origin so the server action can build the absolute redirectTo URL */}
          <input type="hidden" name="origin" value={origin} />
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@agency.com"
              required
              autoFocus
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-4">
          <Button type="submit" className="w-full">Send reset link</Button>
          <div className="text-center text-sm text-muted-foreground">
            Remember it?{' '}
            <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
