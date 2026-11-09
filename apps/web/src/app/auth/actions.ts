'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { UsernameSchema, ProfileUpdateSchema } from '@mors/domain';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = (formData.get('redirectTo') as string) || '/';

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect(redirectTo);
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmAge = formData.get('confirmAge') === 'on';

  if (!confirmAge) {
    return { error: 'You must confirm that you are at least 16 years of age' };
  }

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters long' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/onboarding');
}

export async function resetPassword(formData: FormData) {
  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'Email is required' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password/confirm`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: 'Password reset link has been dispatched to your email' };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/auth/login');
}

export async function completeOnboarding(formData: FormData) {
  const username = (formData.get('username') as string)?.trim().toLowerCase();
  const displayName = (formData.get('displayName') as string)?.trim();
  const isPrivate = formData.get('isPrivate') === 'on';
  const defaultVisibility = (formData.get('defaultVisibility') as string) || 'public';

  const usernameResult = UsernameSchema.safeParse(username);
  if (!usernameResult.success) {
    return { error: usernameResult.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Authentication required' };
  }

  // Update profile
  const { error } = await supabase
    .from('profiles')
    .update({
      username,
      display_name: displayName || username,
      is_private: isPrivate,
      default_visibility: defaultVisibility as 'public' | 'followers' | 'private',
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    if (error.code === '23505') {
      return { error: 'This username is already taken. Please choose another.' };
    }
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function updateProfile(formData: FormData) {
  const displayName = formData.get('displayName') as string;
  const bio = formData.get('bio') as string;
  const locationText = formData.get('locationText') as string;
  const isPrivate = formData.get('isPrivate') === 'on';
  const defaultVisibility = formData.get('defaultVisibility') as string;

  const parsed = ProfileUpdateSchema.safeParse({
    display_name: displayName,
    bio,
    location_text: locationText,
    is_private: isPrivate,
    default_visibility: defaultVisibility as any,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Authentication required' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      bio,
      location_text: locationText,
      is_private: isPrivate,
      default_visibility: defaultVisibility as 'public' | 'followers' | 'private',
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/settings');
  revalidatePath('/');
  return { success: 'Profile successfully updated.' };
}
