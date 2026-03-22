'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(workspaceSlug: string, formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const fullName = (formData.get('full_name') as string | null)?.trim() ?? ''
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const avatarUrl = (formData.get('avatar_url') as string | null)?.trim() || null

  if (!fullName) {
    redirect(`/w/${workspaceSlug}/settings/profile?status=error&message=${encodeURIComponent('Full name is required.')}`)
  }

  // Update auth.users — triggers Supabase confirmation email if email changed
  const authUpdate: { data: { full_name: string }; email?: string } = {
    data: { full_name: fullName },
  }
  if (email && email !== user.email) {
    authUpdate.email = email
  }

  const { error: updateAuthError } = await supabase.auth.updateUser(authUpdate)
  if (updateAuthError) {
    redirect(`/w/${workspaceSlug}/settings/profile?status=error&message=${encodeURIComponent(updateAuthError.message)}`)
  }

  // Sync the profiles table
  const profileUpdate: { full_name: string; avatar_url?: string | null } = { full_name: fullName }
  if (avatarUrl !== undefined) profileUpdate.avatar_url = avatarUrl

  const { error: profileError } = await supabase
    .from('profiles')
    .update(profileUpdate)
    .eq('id', user.id)

  if (profileError) {
    redirect(`/w/${workspaceSlug}/settings/profile?status=error&message=${encodeURIComponent('Profile saved but failed to sync display name.')}`)
  }

  revalidatePath(`/w/${workspaceSlug}`, 'layout')

  const successMsg = email && email !== user.email
    ? 'Profile updated. Check your new email address to confirm the change.'
    : 'Profile updated.'

  redirect(`/w/${workspaceSlug}/settings/profile?status=success&message=${encodeURIComponent(successMsg)}`)
}
