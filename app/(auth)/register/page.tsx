import Link from "next/link"
import { signup } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const { message } = await searchParams

  return (
    <Card className="surface-card mx-auto w-full max-w-lg border-white/70 bg-background/90">
      <CardHeader className="space-y-4">
        <span className="eyebrow w-fit">Create account</span>
        <div className="space-y-2">
          <CardTitle className="text-3xl">Start your agency workspace</CardTitle>
          <CardDescription className="text-base">
            Create an owner account so you can set up workspaces, invite teammates, and configure intake flows.
          </CardDescription>
        </div>
      </CardHeader>
      <form action={signup} className="space-y-1">
        <CardContent className="space-y-5">
          {message && (
            <div className="rounded-[1.25rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {message}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium text-foreground">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Jordan Rivera"
              required
            />
          </div>
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
            <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
            <Input id="password" name="password" type="password" required />
            <p className="text-xs text-muted-foreground">
              Use a strong password so your workspace settings and lead data stay protected.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-4">
          <Button type="submit" className="w-full">
            Create account
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
