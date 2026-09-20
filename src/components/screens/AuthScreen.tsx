import React, { useState } from 'react';
import {
  HeartPulse,
  Eye,
  EyeOff,
  Pill,
  HeartHandshake,
  LayoutDashboard,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Activity,
  Search,
  AlertCircle,
  Loader2,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { RouteKey, User, UserPurpose } from '../../types';
import { PhoneInput } from '../common/PhoneInput';
import {
  login,
  signUp,
  resendConfirmation,
  loginWithGoogle,
  sendEmailOtp,
  verifyEmailOtp,
} from '../../services/authService';
import { getMyMedications } from '../../services/medicationService';
import { supabase } from '../../services/supabaseClient';
import type { Session } from '@supabase/supabase-js';

interface AuthScreenProps {
  onLoginSuccess: (user: User, intendedRoute?: RouteKey) => void;
  intendedRoute?: RouteKey | null;
  initialPurpose?: UserPurpose;
  initialMode?: 'login' | 'register';
  onNavigate: (route: RouteKey) => void;
  /** Pre-fills the error banner on mount (e.g. expired email-link redirect). */
  initialError?: string;
  /** Completes app-level login after this tab detects email confirmation. */
  onConfirmedSession: (session: Session) => Promise<void> | void;
  id?: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  intendedRoute,
  initialPurpose = 'general',
  initialMode = 'login',
  onNavigate,
  initialError,
  onConfirmedSession,
  id,
}) => {
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedPurpose, setSelectedPurpose] = useState<UserPurpose>(initialPurpose);

  // Confirmation-pending & OTP state
  const [pendingConfirmEmail, setPendingConfirmEmail] = useState<string | null>(null);
  const [confirmationTimedOut, setConfirmationTimedOut] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [otpToken, setOtpToken] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Sync state whenever initialMode or initialPurpose changes (e.g. user clicking "Log In" or "Get Started" from navbar)
  React.useEffect(() => {
    setIsRegister(initialMode === 'register');
    setAuthError(null);
  }, [initialMode]);

  React.useEffect(() => {
    setSelectedPurpose(initialPurpose);
    setAuthError(null);
  }, [initialPurpose]);

  // Seed the error banner from an initialError prop (e.g. expired confirmation link)
  React.useEffect(() => {
    if (initialError) {
      setAuthError(initialError);
      // Treat it as an unconfirmed-email error so the Resend button appears
      setIsUnconfirmedError(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [dob, setDob] = useState('');
  const [dobTouched, setDobTouched] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Tracks whether the current login error is an unconfirmed-email error
  const [isUnconfirmedError, setIsUnconfirmedError] = useState(false);

  // Confirmation can happen in a different tab. Poll this tab's shared Supabase
  // session so it can continue automatically once the email link is clicked.
  React.useEffect(() => {
    if (!pendingConfirmEmail || confirmationTimedOut) return;

    let active = true;
    let checking = false;
    const hasConfirmedEmail = (session: Session) =>
      Boolean(
        session.user.email_confirmed_at ||
          (session.user as { confirmed_at?: string }).confirmed_at
      );

    const checkForConfirmedSession = async () => {
      if (checking || !active) return;
      checking = true;
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!error && session && hasConfirmedEmail(session)) {
          active = false;
          window.clearInterval(intervalId);
          window.clearTimeout(timeoutId);
          await onConfirmedSession(session);
        }
      } catch (error) {
        console.error('[Auth] Confirmation session check failed', error);
      } finally {
        checking = false;
      }
    };

    const intervalId = window.setInterval(() => void checkForConfirmedSession(), 3_000);
    const timeoutId = window.setTimeout(() => {
      if (!active) return;
      active = false;
      window.clearInterval(intervalId);
      setConfirmationTimedOut(true);
    }, 120_000);

    void checkForConfirmedSession();

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [confirmationTimedOut, onConfirmedSession, pendingConfirmEmail]);

  // Helper to calculate exact age in years from DOB string
  const calculateAge = (dobString: string): number => {
    if (!dobString) return 0;
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const isVolunteerSignup = isRegister && selectedPurpose === 'volunteer';
  const volunteerAge = calculateAge(dob);
  const isUnderage = isVolunteerSignup && (dobTouched || dob.length > 0) && volunteerAge < 18;

  const isPasswordMismatch =
    isRegister && (confirmPasswordTouched || confirmPassword.length > 0) && password !== confirmPassword;

  const isSubmitDisabled =
    isLoading ||
    (isRegister && (!password || !confirmPassword || password !== confirmPassword)) ||
    (isVolunteerSignup && (!dob || volunteerAge < 18));

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsUnconfirmedError(false);

    // Validation: 18+ Age Check for Blood Donor
    if (isRegister && selectedPurpose === 'volunteer') {
      if (!dob) {
        setAuthError('Please enter your Date of Birth to verify donor eligibility.');
        return;
      }
      if (calculateAge(dob) < 18) {
        setAuthError('You must be at least 18 years old to register as a blood donor.');
        return;
      }
    }

    // Validation: Passwords match
    if (isRegister && password !== confirmPassword) {
      setAuthError('Passwords do not match. Please re-enter your password.');
      return;
    }

    // Validation: Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    // Validation: Password length
    if (!password || password.length < 6) {
      setAuthError('Password must be at least 6 characters in length.');
      return;
    }

    // Validation: Registration fields
    if (isRegister) {
      if (!name.trim()) {
        setAuthError('Please enter your full legal name.');
        return;
      }
      const rawPhoneDigits = phone.replace(/\D/g, '');
      const cleanPhoneDigits = rawPhoneDigits.startsWith('91') && rawPhoneDigits.length > 10 ? rawPhoneDigits.slice(2) : rawPhoneDigits;
      if (cleanPhoneDigits.length !== 10) {
        setAuthError('Please enter a valid 10-digit Indian mobile number.');
        return;
      }
    }

    // Perform Authentication Call
    setIsLoading(true);
    try {
      const role = selectedPurpose === 'volunteer' ? 'volunteer' : 'patient';
      const trimmedEmail = email.trim();

      let portal: 'medi-reminder' | 'blood-donation' | 'general-checkup' | 'find-donors' = 'general-checkup';
      if (selectedPurpose === 'medi-reminder') portal = 'medi-reminder';
      else if (selectedPurpose === 'volunteer') portal = 'blood-donation';
      else if (selectedPurpose === 'find-donor') portal = 'find-donors';
      else portal = 'general-checkup';

      // Persist chosen portal context and pending purpose immediately
      localStorage.setItem('medicare_pending_purpose', selectedPurpose);
      localStorage.setItem('medicare_portal_context', portal);

      if (isRegister) {
        // ── SIGN UP PATH ────────────────────────────────────────────────────────
        const result = await signUp(trimmedEmail, password, name.trim(), role, {
          phone: phone.trim(),
          selectedPurpose,
        });

        if (!result.success) {
          setAuthError(result.message || 'Registration failed. Please try again.');
          return;
        }

        // Show the email-confirmation waiting screen instead of logging in.
        setConfirmationTimedOut(false);
        setPendingConfirmEmail(trimmedEmail);
        return;
      } else {
        // ── LOGIN PATH ──────────────────────────────────────────────────────────
        const result = await login(trimmedEmail, password);

        if (!result.success) {
          const msg = result.message || '';
          // Detect Supabase's "Email not confirmed" error
          if (
            msg.toLowerCase().includes('email not confirmed') ||
            msg.toLowerCase().includes('email_not_confirmed')
          ) {
            setIsUnconfirmedError(true);
            setAuthError(
              'Your email address has not been confirmed yet. Please check your inbox for the verification link.'
            );
          } else {
            setAuthError(msg || 'Authentication failed. Please check your credentials and try again.');
          }
          return;
        }

        const supabaseUser = result.data?.user;
        const meta = supabaseUser?.user_metadata ?? {};

        // Sync selected purpose to Supabase user metadata in the background
        void supabase.auth.updateUser({ data: { selected_purpose: selectedPurpose } });

        const resolvedRole =
          meta.role === 'volunteer' || meta.role === 'admin' || meta.role === 'patient'
            ? meta.role
            : role;

        const authedUser: User = {
          id: supabaseUser?.id || 'usr-' + Math.floor(1000 + Math.random() * 9000),
          name:
            (meta.full_name as string) ||
            name.trim() ||
            (trimmedEmail ? trimmedEmail.split('@')[0] : 'User'),
          email: supabaseUser?.email || trimmedEmail,
          phone: phone.trim(),
          isPhoneVerified: Boolean(phone.trim()),
          avatar: '',
          bloodGroup: 'Not set',
          role: resolvedRole,
          selectedPurpose,
          portalType: portal,
        };

        // Determine target route. Prefer the selected portal, and ignore stale or cross-portal
        // routes that were set for a different flow or a previous auth attempt.
        const isSpecificMediReminderRoute =
          Boolean(intendedRoute) &&
          intendedRoute !== 'home' &&
          (intendedRoute as string) !== 'iot-health' &&
          intendedRoute.startsWith('medi-reminder');

        let destination: RouteKey = 'general-checkup';
        if (selectedPurpose === 'medi-reminder') {
          if (isSpecificMediReminderRoute) {
            destination = intendedRoute;
          } else {
            let hasExistingMedications = false;
            try {
              const medicationResult = await getMyMedications();
              hasExistingMedications = medicationResult.success && medicationResult.medications.length > 0;
            } catch {
              hasExistingMedications = false;
            }
            destination = hasExistingMedications ? 'medi-reminder-dashboard' : 'medi-reminder-step1';
          }
        } else if (selectedPurpose === 'volunteer') {
          destination = 'volunteer-step1';
        } else if (selectedPurpose === 'find-donor') {
          destination = 'donor-viewer';
        } else {
          destination = 'general-checkup';
        }

        onLoginSuccess(authedUser, destination);
      }
    } catch {
      setAuthError('Authentication failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async (emailAddress: string) => {
    setResendLoading(true);
    setResendMessage(null);
    try {
      const result = await resendConfirmation(emailAddress);
      if (result.success) {
        setResendMessage('✅ Verification email resent! Please check your inbox.');
        setConfirmationTimedOut(false);
      } else {
        setResendMessage(`Failed to resend: ${result.message}`);
      }
    } catch {
      setResendMessage('Failed to resend the email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError(null);

    // If blood donor registration, ensure age eligibility if dob was entered
    if (isRegister && selectedPurpose === 'volunteer' && dob && calculateAge(dob) < 18) {
      setAuthError('You must be at least 18 years old to register as a blood donor.');
      return;
    }

    setIsGoogleLoading(true);
    try {
      let portal: 'medi-reminder' | 'blood-donation' | 'general-checkup' | 'find-donors' = 'general-checkup';
      if (selectedPurpose === 'medi-reminder') portal = 'medi-reminder';
      else if (selectedPurpose === 'volunteer') portal = 'blood-donation';
      else if (selectedPurpose === 'find-donor') portal = 'find-donors';
      else portal = 'general-checkup';

      localStorage.setItem('medicare_pending_purpose', selectedPurpose);
      localStorage.setItem('medicare_portal_context', portal);

      const result = await loginWithGoogle();
      if (!result.success) {
        setAuthError(
          result.message?.includes('provider is not enabled')
            ? 'Google Provider is not enabled in your Supabase Auth dashboard yet. Please use email & password or enable Google in Supabase Auth.'
            : result.message || 'Google sign-in failed. Please try again or use email.'
        );
      }
      // If successful, Supabase OAuth redirects to Google login page automatically
    } catch (err: any) {
      setAuthError(err?.message || 'Google sign-in failed. Please try again or use email.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!pendingConfirmEmail) return;
    const cleanToken = otpToken.trim();
    if (!cleanToken || cleanToken.length < 6) {
      setOtpError('Please enter the 6-digit verification code from your email.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);
    try {
      const result = await verifyEmailOtp(pendingConfirmEmail, cleanToken);
      if (result.success && result.data?.session) {
        await onConfirmedSession(result.data.session);
      } else {
        setOtpError(result.message || 'Invalid or expired OTP code. Please check your email or click Resend.');
      }
    } catch (err: any) {
      setOtpError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // ── EMAIL CONFIRMATION PENDING SCREEN ────────────────────────────────────
  if (pendingConfirmEmail) {
    return (
      <div
        id={id || 'auth-screen'}
        className="w-full min-h-screen flex flex-col lg:flex-row bg-white overflow-x-hidden"
      >
        {/* Left Gradient Branding Panel (reused) */}
        <div className="w-full lg:w-[42%] xl:w-[38%] bg-gradient-to-br from-[#0F1D3D] via-[#1E3A8A] to-[#2563EB] text-white p-6 sm:p-10 lg:p-12 xl:p-14 flex flex-col justify-between relative overflow-hidden shrink-0">
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1.5px 1.5px, white 1.5px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-400/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-3 cursor-pointer select-none group"
            >
              <div className="w-11 h-11 rounded-xl bg-white text-[#2563EB] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <HeartPulse className="w-7 h-7 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-2xl font-black text-white tracking-tight">
                  Medi<span className="text-blue-300">care</span>
                </span>
                <p className="text-xs text-blue-200/90 font-medium">Clinical Health Portal</p>
              </div>
            </div>

            <div className="mt-10 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/30 text-emerald-200 text-xs font-semibold tracking-wide">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>Account Created Successfully</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight text-white">
                One last step!<br />
                <span className="text-blue-300">Check your inbox</span>
              </h2>
              <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed max-w-lg">
                We've sent a secure verification link to your email. Click it to activate your account and log in automatically.
              </p>
            </div>
          </div>

          <div className="relative z-10 py-6 sm:py-8 my-auto">
            <div className="bg-white/[0.08] backdrop-blur-md rounded-2xl p-5 border border-white/15">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white mb-1">What happens next?</p>
                  <ul className="text-xs text-blue-200/90 space-y-1.5 leading-relaxed">
                    <li>📬 Open the email from Medicare in your inbox</li>
                    <li>🔗 Click the verification link inside the email</li>
                    <li>✅ You'll be logged in automatically — no extra steps</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-blue-100/90 font-medium">
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-300" /> 256-bit HIPAA Security
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified Medical Network
            </span>
          </div>
        </div>

        {/* Right: Confirmation Message Panel */}
        <div className="w-full lg:w-[58%] xl:w-[62%] min-h-full bg-white flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 xl:p-14">
          <div className="w-full max-w-md mx-auto text-center space-y-6">
            {/* Animated checkmark / email icon */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center animate-pulse">
                <Mail className="w-12 h-12 text-emerald-500" />
              </div>
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-[#0F1D3D] tracking-tight">
                ✅ Account Created!
              </h1>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                We've sent a verification link to
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl">
                <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-sm font-bold text-[#2563EB] break-all">{pendingConfirmEmail}</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed pt-1">
                Please check your inbox and click the link to activate your account.
                Once confirmed, you'll be logged in automatically.
              </p>
              {confirmationTimedOut ? (
                <p className="text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  Still waiting for confirmation. You can enter your 6-digit code or resend the email below.
                </p>
              ) : (
                <p className="text-xs font-medium text-blue-600">
                  Waiting for confirmation and checking automatically every 3 seconds…
                </p>
              )}
            </div>

            {/* Direct 6-Digit OTP Code Verification */}
            <div className="p-4 sm:p-5 bg-white border border-blue-200 rounded-2xl shadow-xs space-y-3 text-left">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Or Enter 6-Digit Verification Code:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="flex-1 text-center tracking-[0.3em] font-mono text-lg font-bold py-2.5 px-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <button
                  type="button"
                  disabled={isVerifyingOtp || otpToken.length < 6}
                  onClick={handleVerifyOtp}
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  {isVerifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Verify</span>
                </button>
              </div>
              {otpError && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                  {otpError}
                </p>
              )}
            </div>

            {/* Resend section */}
            <div className="p-4 bg-[#F4F7FC] border border-[#E5EAF3] rounded-2xl space-y-3">
              <p className="text-sm text-gray-600 font-medium">
                Didn't receive the email? Check your spam folder, or resend it below.
              </p>

              {resendMessage && (
                <p
                  id="resend-status-msg"
                  className={`text-sm font-semibold px-3 py-2 rounded-lg ${
                    resendMessage.startsWith('✅')
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {resendMessage}
                </p>
              )}

              <button
                id="resend-confirmation-btn"
                type="button"
                disabled={resendLoading}
                onClick={() => handleResendConfirmation(pendingConfirmEmail)}
                className="w-full py-3 px-4 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2.5 transition active:scale-98 cursor-pointer"
              >
                {resendLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Resending...</span></>
                ) : (
                  <><RefreshCw className="w-4 h-4" /><span>Resend Confirmation Email</span></>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setPendingConfirmEmail(null);
                setIsRegister(false);
                setAuthError(null);
              }}
              className="text-sm text-gray-500 hover:text-gray-800 font-medium transition flex items-center gap-1.5 mx-auto cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={id || 'auth-screen'}
      className="w-full min-h-screen flex flex-col lg:flex-row bg-white overflow-x-hidden"
    >
      {/* Left Gradient Branding Panel */}
      <div className="w-full lg:w-[42%] xl:w-[38%] bg-gradient-to-br from-[#0F1D3D] via-[#1E3A8A] to-[#2563EB] text-white p-6 sm:p-10 lg:p-12 xl:p-14 flex flex-col justify-between relative overflow-hidden shrink-0">
        {/* Subtle geometric dot background overlay */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1.5px 1.5px, white 1.5px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Soft glowing ambient orbs */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-400/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Logo & Back Navigation */}
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-4">
            <div
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-3 cursor-pointer select-none group"
            >
              <div className="w-11 h-11 rounded-xl bg-white text-[#2563EB] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <HeartPulse className="w-7 h-7 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-2xl font-black text-white tracking-tight">
                  Medi<span className="text-blue-300">care</span>
                </span>
                <p className="text-xs text-blue-200/90 font-medium">Clinical Health Portal</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-blue-100 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
          </div>

          <div className="mt-8 sm:mt-10 space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/25 border border-blue-400/30 text-blue-200 text-xs font-semibold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
              <span>Hospital & Clinical Grade Telemetry</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-black tracking-tight leading-tight text-white">
              Welcome to Medi<span className="text-blue-300">care</span>
            </h2>
            <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed max-w-lg">
              Connect your IoT health monitors, track precision daily regimens, and join our verified emergency donor corps.
            </p>
          </div>
        </div>

        {/* Middle: Clinical Feature Highlights (eliminates empty space in middle) */}
        <div className="relative z-10 py-6 sm:py-8 my-auto space-y-3.5">
          <div className="bg-white/[0.08] backdrop-blur-md rounded-2xl p-4 border border-white/15 flex items-start gap-3.5 transition hover:bg-white/[0.12]">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
              <Activity className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-[15px] font-bold text-white">Live Vital Synchronization</p>
              <p className="text-xs sm:text-sm text-blue-200/90 mt-0.5 leading-relaxed">
                Direct ESP32 telemetry with encrypted SpO2, heart rate, temperature, & weight sync.
              </p>
            </div>
          </div>

          <div className="bg-white/[0.08] backdrop-blur-md rounded-2xl p-4 border border-white/15 flex items-start gap-3.5 transition hover:bg-white/[0.12]">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
              <Pill className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-[15px] font-bold text-white">Intelligent Dosage Reminders</p>
              <p className="text-xs sm:text-sm text-blue-200/90 mt-0.5 leading-relaxed">
                Smart multi-slot schedule alarms with push, SMS, and adherence compliance tracking.
              </p>
            </div>
          </div>

          <div className="bg-white/[0.08] backdrop-blur-md rounded-2xl p-4 border border-white/15 flex items-start gap-3.5 transition hover:bg-white/[0.12]">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-[15px] font-bold text-white">Verified Blood Donor Corps</p>
              <p className="text-xs sm:text-sm text-blue-200/90 mt-0.5 leading-relaxed">
                Instant emergency compatibility matching with verified clinical donor records.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom: Security and Reassurance */}
        <div className="relative z-10 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-blue-100/90 font-medium">
          <span className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-300" /> 256-bit HIPAA Security
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified Medical Network
          </span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-[58%] xl:w-[62%] min-h-full bg-white flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14 overflow-y-auto">
        <div className="w-full max-w-xl mx-auto flex flex-col justify-between flex-1">
          <div>
            {/* Top: Header Tabs & Status */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-1.5 p-1.5 bg-[#F4F7FC] rounded-xl border border-[#E5EAF3]">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setAuthError(null);
                  }}
                  className={`px-5 py-2 rounded-lg text-sm sm:text-base font-bold transition-all cursor-pointer ${
                    !isRegister
                      ? 'bg-white text-[#0F1D3D] shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setAuthError(null);
                  }}
                  className={`px-5 py-2 rounded-lg text-sm sm:text-base font-bold transition-all cursor-pointer ${
                    isRegister
                      ? 'bg-white text-[#0F1D3D] shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {intendedRoute && (
                <span className="text-xs font-bold text-[#2563EB] bg-[#EFF4FF] px-3 py-1.5 rounded-lg border border-blue-200">
                  Authentication Required
                </span>
              )}
            </div>

            {/* Inline Error Banner */}
            {authError && (
              <div
                id="auth-error-banner"
                className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex flex-col gap-2.5 text-red-700 text-sm animate-shake"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{authError}</div>
                </div>
                {/* Resend button shown when the error is an unconfirmed email */}
                {isUnconfirmedError && (
                  <div className="pl-7 space-y-2">
                    {resendMessage && (
                      <p
                        id="login-resend-status-msg"
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg ${
                          resendMessage.startsWith('✅')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {resendMessage}
                      </p>
                    )}
                    <button
                      id="resend-from-login-btn"
                      type="button"
                      disabled={resendLoading || !email.trim()}
                      onClick={() => handleResendConfirmation(email.trim())}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      {resendLoading ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Resending...</span></>
                      ) : (
                        <><RefreshCw className="w-3.5 h-3.5" /><span>Resend confirmation email</span></>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}



            {/* Main Form Fields */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-sm sm:text-[15px] font-bold text-[#0F1D3D] mb-1.5">
                    Full Legal Name
                  </label>
                  <input
                    id="auth-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    placeholder="Full Legal Name"
                    className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-sm sm:text-base rounded-xl px-4 py-3 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="min-w-0">
                  <label className="block text-sm sm:text-[15px] font-bold text-[#0F1D3D] mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="auth-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    placeholder="name@medicare.health"
                    className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-sm sm:text-base rounded-xl px-4 py-3 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-sm sm:text-[15px] font-bold text-[#0F1D3D] mb-1.5">
                    Mobile Number
                  </label>
                  <PhoneInput
                    id="auth-phone-input"
                    required
                    value={phone}
                    onChange={(val) => {
                      setPhone(val);
                      if (authError) setAuthError(null);
                    }}
                  />
                </div>
              </div>

              {/* 18+ Date of Birth Field (Only for Blood Donor on Create Account) */}
              {isVolunteerSignup && (
                <div className="p-4 bg-rose-50/70 border border-rose-200/90 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm sm:text-[15px] font-bold text-[#0F1D3D]">
                      Date of Birth <span className="text-rose-600 font-semibold">* (18+ Required)</span>
                    </label>
                    {dob && (
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded ${
                          volunteerAge >= 18
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        Age: {volunteerAge} yrs {volunteerAge >= 18 ? '✓ Eligible' : '✗ Underage'}
                      </span>
                    )}
                  </div>
                  <input
                    id="auth-volunteer-dob"
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={dob}
                    onChange={(e) => {
                      setDob(e.target.value);
                      setDobTouched(true);
                      if (authError) setAuthError(null);
                    }}
                    onBlur={() => setDobTouched(true)}
                    className="w-full bg-white border border-rose-200 text-sm sm:text-base rounded-xl px-4 py-3 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition"
                  />
                  {isUnderage && (
                    <p
                      id="volunteer-age-error"
                      className="text-red-600 text-xs sm:text-sm font-semibold flex items-center gap-1.5 mt-1"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      You must be at least 18 years old to register as a blood donor.
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Clinical donation guidelines require blood donors to be at least 18 years of age.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm sm:text-[15px] font-bold text-[#0F1D3D] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    placeholder="••••••••••••"
                    className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-sm sm:text-base rounded-xl pl-4 pr-11 py-3 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field (Only on Create Account Tab) */}
              {isRegister && (
                <div>
                  <label className="block text-sm sm:text-[15px] font-bold text-[#0F1D3D] mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="auth-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setConfirmPasswordTouched(true);
                        if (authError) setAuthError(null);
                      }}
                      onBlur={() => setConfirmPasswordTouched(true)}
                      placeholder="Re-enter your password"
                      className={`w-full bg-[#F4F7FC] border text-sm sm:text-base rounded-xl pl-4 pr-11 py-3 text-[#0F1D3D] focus:outline-none focus:ring-2 transition ${
                        isPasswordMismatch
                          ? 'border-red-400 focus:ring-red-400/30 focus:border-red-500'
                          : 'border-[#E5EAF3] focus:ring-[#2563EB]/30 focus:border-[#2563EB]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {isPasswordMismatch && (
                    <p id="confirm-password-error" className="text-red-500 text-xs sm:text-sm font-semibold mt-1 flex items-center gap-1.5">
                      Passwords do not match
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-sm sm:text-[15px] pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <span className="text-gray-700 font-medium">Remember this device</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password reset verification link sent to your registered email.')}
                  className="font-bold text-[#2563EB] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Purpose Selection Cards */}
              <div className="pt-4">
                <div className="mb-3">
                  <label className="block text-base sm:text-lg font-black text-[#0F1D3D] tracking-tight">
                    What would you like to use Medicare for?
                  </label>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Select your primary portal to launch customized medical tools upon sign in.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                  {[
                    {
                      id: 'medi-reminder' as UserPurpose,
                      label: 'Medi Reminder',
                      desc: 'Dosage & schedule builder',
                      icon: Pill,
                    },
                    {
                      id: 'volunteer' as UserPurpose,
                      label: 'Blood Donor',
                      desc: 'Become a verified blood donor',
                      icon: HeartHandshake,
                    },
                    {
                      id: 'general' as UserPurpose,
                      label: 'General Health',
                      desc: 'Full wellness dashboard',
                      icon: LayoutDashboard,
                    },
                    {
                      id: 'find-donor' as UserPurpose,
                      label: 'Find Donor',
                      desc: 'Search verified blood donors',
                      icon: Search,
                    },
                  ].map((p) => {
                    const Icon = p.icon;
                    const isSelected = selectedPurpose === p.id;
                    return (
                      <div
                        key={p.id}
                        id={`auth-purpose-${p.id}`}
                        onClick={() => {
                          setSelectedPurpose(p.id);
                          setAuthError(null);
                        }}
                        className={`p-4 sm:p-4.5 rounded-2xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between min-h-[105px] ${
                          isSelected
                            ? 'bg-[#F4F8FF] border-[#2563EB] shadow-xs'
                            : 'bg-white border-[#E5EAF3] hover:border-gray-300 hover:shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-blue-100 text-[#2563EB]' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            <Icon className="w-5 h-5 stroke-[2.2]" />
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-[#2563EB] shrink-0" />
                          )}
                        </div>
                        <div>
                          <p
                            className={`text-base font-bold leading-tight ${
                              isSelected ? 'text-[#0F1D3D]' : 'text-gray-800'
                            }`}
                          >
                            {p.label}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-normal font-normal">
                            {p.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                id="auth-submit-btn"
                disabled={isSubmitDisabled}
                className="w-full py-4 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#2563EB] text-white font-extrabold text-base sm:text-lg rounded-xl shadow-md flex items-center justify-center gap-2.5 transition active:scale-98 mt-4 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{isRegister ? 'Creating Account & Verifying...' : 'Authenticating...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isRegister ? 'Complete Signup & Proceed' : 'Sign In & Launch Medicare'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="pt-6 mt-6 border-t border-gray-100 text-center text-xs sm:text-sm text-gray-500">
            <span>By proceeding, you agree to Medicare's </span>
            <span className="text-[#2563EB] font-semibold hover:underline cursor-pointer">Terms</span>
            <span> and </span>
            <span className="text-[#2563EB] font-semibold hover:underline cursor-pointer">
              Privacy Protocol
            </span>
            .
          </div>
        </div>
      </div>
    </div>
  );
};
