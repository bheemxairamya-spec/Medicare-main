import { supabase } from './supabaseClient';

const getRedirectUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:5173';
  return window.location.origin;
};

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: string,
  extra?: { phone?: string; selectedPurpose?: string }
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getRedirectUrl(),
      data: {
        full_name: fullName,
        role: role,
        phone: extra?.phone || '',
        selected_purpose: extra?.selectedPurpose || 'general',
      },
    },
  });
  if (error) return { success: false, message: error.message };
  return { success: true, data };
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, message: error.message };
  return { success: true, data };
}

export async function loginWithGoogle() {
  const redirectUrl = getRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  if (error) return { success: false, message: error.message };
  return { success: true, data };
}

export async function sendEmailOtp(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: getRedirectUrl(),
    },
  });
  if (error) return { success: false, message: error.message };
  return { success: true, data };
}

export async function verifyEmailOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  if (error) return { success: false, message: error.message };
  return { success: true, data };
}

export async function logout() {
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function resendConfirmation(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: getRedirectUrl() },
  });
  if (error) return { success: false, message: error.message };
  return { success: true };
}
