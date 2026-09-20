import React, { useState } from 'react';
import {
  RouteKey,
  User,
  UserPurpose,
  PortalType,
  MedicationItem,
  MedicationProfile,
  VolunteerProfile,
  Donor,
  BloodRequest,
  AppointmentItem,
} from './types';
// Common Components
import { NavbarPublic } from './components/common/NavbarPublic';
import { SidebarNav } from './components/common/SidebarNav';
import { HeaderAuth } from './components/common/HeaderAuth';
import { EmergencyModal } from './components/common/EmergencyModal';

// Screens
import { LandingScreen } from './components/screens/LandingScreen';
import { AuthScreen } from './components/screens/AuthScreen';
import { MediReminderStep1 } from './components/screens/MediReminderStep1';
import { MediReminderStep2 } from './components/screens/MediReminderStep2';
import { MediReminderDashboard } from './components/screens/MediReminderDashboard';
import { VolunteerStep1 } from './components/screens/VolunteerStep1';
import { VolunteerStep2 } from './components/screens/VolunteerStep2';
import { VolunteerStep3 } from './components/screens/VolunteerStep3';
import { VolunteerStep4 } from './components/screens/VolunteerStep4';
import { VolunteerStatusScreen } from './components/screens/VolunteerStatusScreen';
import { DonorViewerScreen } from './components/screens/DonorViewerScreen';
import { GeneralCheckupScreen } from './components/screens/GeneralCheckupScreen';
import { GoodHabitsScreen } from './components/screens/GoodHabitsScreen';
import { NaturalWellnessScreen } from './components/screens/NaturalWellnessScreen';
import { FirstAidScreen } from './components/screens/FirstAidScreen';
import { AppointmentsScreen } from './components/screens/AppointmentsScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { supabase } from './services/supabaseClient';
import { logout } from './services/authService';
import { registerForPush } from './services/pushNotifications';
import { getMyMedications } from './services/medicationService';
import type { Session, User as AuthUser } from '@supabase/supabase-js';

function purposeFromRoute(route: RouteKey): UserPurpose {
  if (route.startsWith('medi-reminder') || route === 'reminder' || route === 'medi-reminder') {
    return 'medi-reminder';
  }
  if (route.startsWith('volunteer')) return 'volunteer';
  if (route === 'donor-viewer') return 'find-donor';
  return 'general';
}

function purposeFromRoleOrMeta(
  role: string | undefined,
  metaPurpose: string | undefined
): UserPurpose {
  if (
    metaPurpose === 'medi-reminder' ||
    metaPurpose === 'volunteer' ||
    metaPurpose === 'find-donor' ||
    metaPurpose === 'general'
  ) {
    return metaPurpose;
  }
  if (role === 'volunteer') return 'volunteer';
  return 'general';
}

function portalFromPurpose(purpose: UserPurpose): PortalType {
  if (purpose === 'medi-reminder') return 'medi-reminder';
  if (purpose === 'volunteer') return 'blood-donation';
  if (purpose === 'find-donor') return 'find-donors';
  return 'general-checkup';
}

function destinationFromPurpose(purpose: UserPurpose, hasExistingMedications = false): RouteKey {
  if (purpose === 'medi-reminder') {
    return hasExistingMedications ? 'medi-reminder-dashboard' : 'medi-reminder-step1';
  }
  if (purpose === 'volunteer') return 'volunteer-step1';
  if (purpose === 'find-donor') return 'donor-viewer';
  return 'general-checkup';
}

async function buildUserFromSession(authUser: AuthUser): Promise<{ user: User; destination: RouteKey }> {
  const meta = authUser.user_metadata ?? {};
  let profile: { full_name?: string; role?: string; avatar_url?: string } | null = null;

  try {
    const { data } = await supabase.from('profiles').select('full_name, role, avatar_url').eq('id', authUser.id).maybeSingle();
    profile = data;
  } catch (err) {
    console.error('[App] Failed to fetch profile', err);
  }

  const roleRaw = profile?.role || meta.role || 'patient';
  const role: User['role'] =
    roleRaw === 'volunteer' || roleRaw === 'admin' || roleRaw === 'patient' ? roleRaw : 'patient';

  const pendingPurpose = localStorage.getItem('medicare_pending_purpose') as UserPurpose | null;
  const savedPortal = localStorage.getItem('medicare_portal_context') as PortalType | null;
  const portalPurposeMap: Partial<Record<PortalType, UserPurpose>> = {
    'medi-reminder': 'medi-reminder',
    'blood-donation': 'volunteer',
    'find-donors': 'find-donor',
  };
  const fallbackFromPortal = savedPortal ? portalPurposeMap[savedPortal] : undefined;

  const rawPurpose = pendingPurpose || (meta.selected_purpose as string) || fallbackFromPortal;
  const selectedPurpose = purposeFromRoleOrMeta(role, rawPurpose);
  const portalType = portalFromPurpose(selectedPurpose);

  const userAvatar = profile?.avatar_url || (meta.avatar_url as string) || '';

  const user: User = {
    id: authUser.id,
    name: profile?.full_name || (meta.full_name as string) || (authUser.email ? authUser.email.split('@')[0] : 'User'),
    email: authUser.email || '',
    phone: (meta.phone as string) || '',
    isPhoneVerified: Boolean(meta.phone),
    avatar: userAvatar,
    avatar_url: userAvatar,
    bloodGroup: 'Not set',
    role,
    selectedPurpose,
    portalType,
  };

  let hasExistingMedications = false;
  if (selectedPurpose === 'medi-reminder') {
    try {
      const medicationResult = await getMyMedications();
      hasExistingMedications = medicationResult.success && medicationResult.medications.length > 0;
    } catch {
      hasExistingMedications = false;
    }
  }

  return { user, destination: destinationFromPurpose(selectedPurpose, hasExistingMedications) };
}

export default function App() {
  // Global State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRoute, setCurrentRoute] = useState<RouteKey>('landing');
  const [intendedRoute, setIntendedRoute] = useState<RouteKey | null>(null);
  const [authPurpose, setAuthPurpose] = useState<UserPurpose>('general');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authReady, setAuthReady] = useState(false);
  // Holds a human-readable error surfaced from a bad auth-redirect URL (e.g. expired link)
  const [authLinkError, setAuthLinkError] = useState<string | null>(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  // Application Domain State
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [mediProfile, setMediProfile] = useState<MedicationProfile>({
    name: '',
    age: 0,
    gender: 'Female',
    mobile: '',
    emergencyContact: '',
    medicalCondition: '',
    doctorOrHospital: '',
    currentMedications: '',
    allergies: '',
    notes: '',
    reminderChannels: {
      push: true,
      sms: false,
      dashboard: true,
    },
  });
  const [volunteerProfile, setVolunteerProfile] = useState<VolunteerProfile>({
    name: '',
    dob: '',
    gender: 'Female',
    bloodGroup: 'O+',
    mobile: '',
    email: '',
    location: '',
    emergencyContact: '',
    preferredDonationLocation: '',
    availableDays: [],
    availableTime: '09:00 AM – 02:00 PM',
    idDocumentUploaded: false,
    idDocumentName: '',
    hardwareReadings: [],
    hardwareReport: null,
    externalLabReportUploaded: false,
    externalLabReportName: '',
    habits: {
      sleepSchedule: '',
      exerciseFrequency: '',
      waterIntake: '',
      smoking: '',
      alcoholConsumption: '',
      recentMedicationUsage: '',
      recentIllness: '',
      previousBloodDonation: '',
      physicalActivityLevel: '',
      notes: '',
    },
    lifestyleScore: 0,
    declaration: {
      confirmedAge: false,
      confirmedWeight: false,
      confirmedHealth: false,
      confirmedNoRecentTattoos: false,
      consentGiven: false,
    },
    verificationStatus: 'pending',
    isVerified: false,
    inPersonInspected: false,
    memberSince: '',
    totalDonations: 0,
    lastDonationDate: '',
    availabilityToggle: true,
  });
  const [donors, setDonors] = useState<Donor[]>([]);
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);

  // Portal Context State (Persisted across sessions)
  const [portalType, setPortalType] = useState<PortalType>(() => {
    const saved = localStorage.getItem('medicare_portal_context');
    if (
      saved === 'medi-reminder' ||
      saved === 'blood-donation' ||
      saved === 'general-checkup' ||
      saved === 'find-donors'
    ) {
      return saved as PortalType;
    }
    return 'general-checkup';
  });

  const handleSetPortalType = (portal: PortalType) => {
    setPortalType(portal);
    localStorage.setItem('medicare_portal_context', portal);
  };

  // Shared universal routes accessible across all portals
  const sharedRoutes: RouteKey[] = [
    'appointments',
    'good-habits',
    'natural-wellness',
    'first-aid',
    'profile',
  ];

  // Scoped Route Access per Portal Context
  const portalAllowedRoutes: Record<PortalType, RouteKey[]> = {
    'medi-reminder': [
      'medi-reminder',
      'reminder',
      'medi-reminder-step1',
      'medi-reminder-step2',
      'medi-reminder-dashboard',
      ...sharedRoutes,
    ],
    'blood-donation': [
      'volunteer-step1',
      'volunteer-step2',
      'volunteer-step3',
      'volunteer-step4',
      'volunteer-status',
      'donor-viewer',
      ...sharedRoutes,
    ],
    'general-checkup': [
      'general-checkup',
      'general-checkup-step1',
      'general-checkup-step2',
      'general-checkup-step3',
      ...sharedRoutes,
    ],
    'find-donors': [
      'donor-viewer',
      'volunteer-step1',
      'volunteer-status',
      ...sharedRoutes,
    ],
  };

  const getDefaultRouteForPortal = (portal: PortalType, user: User | null): RouteKey => {
    switch (portal) {
      case 'medi-reminder':
        return medications.length > 0 ? 'medi-reminder-dashboard' : 'medi-reminder-step1';
      case 'blood-donation':
        return 'volunteer-step1';
      case 'find-donors':
        return 'donor-viewer';
      case 'general-checkup':
      default:
        return 'general-checkup';
    }
  };

  // Protected Routes List
  const protectedRoutes: RouteKey[] = [
    'home',
    'medi-reminder',
    'reminder',
    'medi-reminder-step1',
    'medi-reminder-step2',
    'medi-reminder-dashboard',
    'volunteer-step1',
    'volunteer-step2',
    'volunteer-step3',
    'volunteer-step4',
    'volunteer-status',
    'donor-viewer',
    'general-checkup',
    'general-checkup-step1',
    'general-checkup-step2',
    'general-checkup-step3',
    'good-habits',
    'natural-wellness',
    'first-aid',
    'appointments',
    'profile',
  ];

  // Auto-redirect away from legacy home or auto-sync portal
  React.useEffect(() => {
    if (
      currentRoute === 'home' ||
      (currentRoute as string) === 'iot-health' ||
      (currentRoute as string) === 'iot-checkup'
    ) {
      setCurrentRoute(getDefaultRouteForPortal(portalType, currentUser));
    } else if (currentUser && !['landing', 'login'].includes(currentRoute)) {
      const allowed = portalAllowedRoutes[portalType] || [];
      if (!allowed.includes(currentRoute)) {
        if (
          currentRoute.startsWith('medi-reminder') ||
          currentRoute === 'reminder'
        ) {
          handleSetPortalType('medi-reminder');
        } else if (currentRoute.startsWith('volunteer-')) {
          handleSetPortalType('blood-donation');
        } else if (currentRoute === 'donor-viewer') {
          handleSetPortalType('find-donors');
        } else if (currentRoute.startsWith('general-checkup')) {
          handleSetPortalType('general-checkup');
        } else {
          setCurrentRoute(getDefaultRouteForPortal(portalType, currentUser));
        }
      }
    }
  }, [currentRoute, currentUser, portalType]);

  // Auth guard: redirect logged-out users trying to access protected routes
  React.useEffect(() => {
    if (!authReady) return;
    if (protectedRoutes.includes(currentRoute) && !currentUser) {
      setIntendedRoute(currentRoute);
      setAuthMode('login');
      setAuthPurpose(purposeFromRoute(currentRoute));
      setCurrentRoute('login');
    }
  }, [currentRoute, currentUser, authReady]);

  // Routing Handler with Scoped Portal Guards
  const handleNavigate = (route: RouteKey) => {
    setIsMobileMenuOpen(false);

    let targetRoute: RouteKey = route;
    if (
      route === 'home' ||
      (route as string) === 'iot-health' ||
      (route as string) === 'iot-checkup'
    ) {
      targetRoute = getDefaultRouteForPortal(portalType, currentUser);
    } else if (
      (route as string) === 'medi-reminder' ||
      (route as string) === 'reminder' ||
      (route as string) === '/medi-reminder' ||
      (route as string) === '/reminder'
    ) {
      targetRoute = medications.length > 0 ? 'medi-reminder-dashboard' : 'medi-reminder-step1';
    } else if (
      (route as string) === 'general-checkup' ||
      (route as string) === '/general-checkup' ||
      (route as string) === 'checkup'
    ) {
      targetRoute = 'general-checkup';
    }

    // Auto switch active portal context if navigating to a dedicated portal route
    if (
      targetRoute.startsWith('medi-reminder') ||
      targetRoute === 'reminder'
    ) {
      if (portalType !== 'medi-reminder') {
        handleSetPortalType('medi-reminder');
      }
    } else if (
      targetRoute.startsWith('volunteer-')
    ) {
      if (portalType !== 'blood-donation') {
        handleSetPortalType('blood-donation');
      }
    } else if (
      targetRoute.startsWith('general-checkup')
    ) {
      if (portalType !== 'general-checkup') {
        handleSetPortalType('general-checkup');
      }
    }

    // If attempting to access protected route without login
    if (protectedRoutes.includes(targetRoute) && !currentUser) {
      setIntendedRoute(targetRoute);
      setAuthMode('login');
      setAuthPurpose(purposeFromRoute(targetRoute));
      setCurrentRoute('login');
      return;
    }

    setCurrentRoute(targetRoute);
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login', purpose: UserPurpose = 'general') => {
    setAuthMode(mode);
    setAuthPurpose(purpose);
    setIntendedRoute(null);
    setCurrentRoute('login');
  };

  const handleSelectGatedFlow = (
    intended: RouteKey,
    purpose: UserPurpose
  ) => {
    let portal: PortalType = 'general-checkup';
    if (purpose === 'medi-reminder') portal = 'medi-reminder';
    else if (purpose === 'volunteer') portal = 'blood-donation';
    else if (purpose === 'find-donor') portal = 'find-donors';
    handleSetPortalType(portal);

    setIntendedRoute(intended);
    setAuthPurpose(purpose);
    setAuthMode('login');
    setCurrentRoute('login');
  };

  // Called directly from the 4 service cards on the landing page
  const handleSelectPortal = (portal: PortalType, targetRoute?: RouteKey) => {
    handleSetPortalType(portal);
    const dest = targetRoute || getDefaultRouteForPortal(portal, currentUser);

    if (currentUser || portal === 'find-donors') {
      setCurrentRoute(dest);
    } else {
      const purposeMap: Record<PortalType, UserPurpose> = {
        'medi-reminder': 'medi-reminder',
        'blood-donation': 'volunteer',
        'find-donors': 'find-donor',
        'general-checkup': 'general',
      };
      setIntendedRoute(dest);
      setAuthPurpose(purposeMap[portal]);
      setAuthMode('login');
      setCurrentRoute('login');
    }
  };

  // Auth Handlers
  const handleLoginSuccess = (user: User, destination?: RouteKey) => {
    let activePortal = user.portalType || portalType;
    if (!user.portalType && user.selectedPurpose) {
      if (user.selectedPurpose === 'medi-reminder') activePortal = 'medi-reminder';
      else if (user.selectedPurpose === 'volunteer') activePortal = 'blood-donation';
      else if (user.selectedPurpose === 'find-donor') activePortal = 'find-donors';
      else activePortal = 'general-checkup';
    }
    handleSetPortalType(activePortal);
    setCurrentUser({ ...user, portalType: activePortal });
    setIntendedRoute(null);

    const allowed = portalAllowedRoutes[activePortal] || [];
    const defaultTarget = getDefaultRouteForPortal(activePortal, user);
    const normalizedDestination =
      destination && destination !== 'home' && destination !== 'iot-health' && destination !== 'iot-checkup'
        ? destination
        : undefined;
    const target =
      normalizedDestination && allowed.includes(normalizedDestination)
        ? normalizedDestination
        : defaultTarget;
    setCurrentRoute(target);
  };

  const handleConfirmedSession = async (session: Session) => {
    const { user, destination } = await buildUserFromSession(session.user);
    localStorage.removeItem('medicare_pending_purpose');
    handleLoginSuccess(user, destination);
  };

  const handleLogout = () => {
    void logout();
    setCurrentUser(null);
    localStorage.removeItem('medicare_portal_context');
    setCurrentRoute('landing');
  };

  React.useEffect(() => {
    if (!currentUser?.id) return;
    void registerForPush(currentUser.id);
  }, [currentUser?.id]);

  const handleLoginSuccessRef = React.useRef(handleLoginSuccess);
  handleLoginSuccessRef.current = handleLoginSuccess;

  // ── URL hash cleanup helper ────────────────────────────────────────────────
  // Strips #access_token=..., #error=..., or any fragment left by Supabase
  // from the browser URL without triggering a navigation or a page reload.
  const stripUrlHash = () => {
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  // Restore Supabase session (email confirmation redirect or existing login)
  React.useEffect(() => {
    let cancelled = false;

    const applySession = async (session: Session | null) => {
      if (!session?.user) return;
      const confirmed = Boolean(
        session.user.email_confirmed_at || (session.user as { confirmed_at?: string }).confirmed_at
      );
      if (!confirmed) return;
      try {
        const { user, destination } = await buildUserFromSession(session.user);
        if (cancelled) return;
        localStorage.removeItem('medicare_pending_purpose');
        handleLoginSuccessRef.current(user, destination);
      } catch (err) {
        console.error('[Auth] Failed to restore session', err);
      }
    };

    // ── 1. Parse & immediately strip the URL hash ──────────────────────────
    // This must happen before getSession() so we read the hash before Supabase
    // consumes it, and we clean the URL regardless of outcome.
    const rawHash = window.location.hash;
    if (rawHash) {
      const hashParams = new URLSearchParams(rawHash.replace(/^#/, ''));
      const error = hashParams.get('error');
      const errorCode = hashParams.get('error_code');

      if (error) {
        // ── Error fragment (e.g. #error=access_denied&error_code=otp_expired)
        stripUrlHash();

        setAuthLinkError(
          error === 'access_denied' && errorCode === 'otp_expired'
            ? 'This confirmation link has expired or already been used. Please log in or request a new confirmation email.'
            : 'We could not verify this confirmation link. Please log in or request a new confirmation email.'
        );
        setAuthMode('login');
        setCurrentRoute('login');
        setAuthReady(true);
        return; // Skip getSession — there is no valid session
      }
      // For success fragments (#access_token=...) Supabase will read them in
      // getSession(); we strip the URL right after the call resolves (see below).
    }

    // ── 2. Restore an existing or just-confirmed session ───────────────────
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      // Always strip the hash now that Supabase has had its chance to read it
      stripUrlHash();
      if (cancelled) return;
      if (error) {
        console.error('[Auth] Failed to read session from confirmation redirect', error);
        setAuthLinkError('We could not complete email confirmation. Please log in or request a new confirmation email.');
        setAuthMode('login');
        setCurrentRoute('login');
        setAuthReady(true);
        return;
      }
      if (session) {
        applySession(session).finally(() => {
          if (!cancelled) setAuthReady(true);
        });
      } else {
        setAuthReady(true);
      }
    }).catch((error) => {
      stripUrlHash();
      if (cancelled) return;
      console.error('[Auth] Unexpected session restore failure', error);
      setAuthLinkError('We could not complete email confirmation. Please log in or request a new confirmation email.');
      setAuthMode('login');
      setCurrentRoute('login');
      setAuthReady(true);
    });

    // ── 3. Listen for future auth events (SIGNED_IN from email link click)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        localStorage.removeItem('medicare_portal_context');
        setCurrentRoute('landing');
        return;
      }
      if (
        session &&
        (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION')
      ) {
        // Strip any leftover hash that Supabase may not have cleared yet
        stripUrlHash();
        applySession(session);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Medication Handlers
  const handleToggleMedication = (id: string) => {
    setMedications(
      medications.map((m) => (m.id === id ? { ...m, takenToday: !m.takenToday } : m))
    );
  };

  const handleSaveMediProfile = (data: Partial<MedicationProfile>) => {
    setMediProfile((prev) => ({ ...prev, ...data }));
  };

  const handleSaveMedicationList = (items: MedicationItem[]) => {
    setMedications(items);
  };

  // Volunteer Handlers
  const handleSaveVolunteerStep1 = (data: Partial<VolunteerProfile>) => {
    setVolunteerProfile((prev) => ({ ...prev, ...data }));
  };

  const handleSaveVolunteerStep2 = (readings: any, report: any, extra?: Partial<VolunteerProfile>) => {
    setVolunteerProfile((prev) => ({
      ...prev,
      hardwareReadings: readings,
      hardwareReport: report,
      ...(extra || {}),
    }));
  };

  const handleSaveVolunteerStep3 = (habits: any, score: number) => {
    setVolunteerProfile((prev) => ({
      ...prev,
      habits,
      lifestyleScore: score,
    }));
  };

  const handleSaveVolunteerStep4 = (declaration: any) => {
    const updatedProfile: VolunteerProfile = {
      ...volunteerProfile,
      declaration,
      isVerified: true,
      inPersonInspected: false,
      memberSince: volunteerProfile.memberSince || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      totalDonations: volunteerProfile.totalDonations || 0,
      availabilityToggle: true,
    };
    setVolunteerProfile(updatedProfile);

    // Register active donor entry if name is present
    if (updatedProfile.name) {
      const newDonor: Donor = {
        id: 'donor-' + Date.now(),
        name: updatedProfile.name,
        bloodGroup: updatedProfile.bloodGroup || 'O+',
        distanceKm: 1.2,
        location: updatedProfile.location || 'Local Area',
        isVerified: true,
        lastVerifiedDate: 'Today (Biometrics Certified)',
        availableWindow: updatedProfile.availableTime || '09:00 AM – 05:00 PM',
        phone: updatedProfile.mobile || '+1 (555) 000-0000',
        unitsDonated: updatedProfile.totalDonations || 0,
        rating: 5.0,
        lastHealthCheck: 'Pass (ESP32 Screening Verified)',
      };
      setDonors((prev) => [newDonor, ...prev.filter((d) => d.name !== updatedProfile.name)]);
    }
  };

  const handleToggleInspection = () => {
    setVolunteerProfile((prev) => ({
      ...prev,
      inPersonInspected: !prev.inPersonInspected,
    }));
  };

  // Emergency Request Submission Handler
  const handleSubmitEmergencyRequest = (reqData: any) => {
    const newReq: BloodRequest = {
      id: 'req-' + Date.now(),
      patientName: reqData.patientName,
      bloodGroup: reqData.bloodGroup,
      unitsNeeded: reqData.unitsNeeded,
      hospital: reqData.hospital,
      location: reqData.location,
      urgency: reqData.urgency,
      contactPhone: reqData.contactPhone,
      requiredByTime: 'Within 2 Hours',
      status: 'active',
      createdAt: 'Just now',
    };
    setBloodRequests([newReq, ...bloodRequests]);
    alert(
      `Emergency request broadcasted successfully to all verified ${reqData.bloodGroup} donors within 25 km!`
    );
  };

  const getHeaderInfo = (route: RouteKey, user: User | null) => {
    switch (route) {
      case 'home':
        return {
          title: user?.name ? `Welcome back, ${user.name}` : 'Main Health Overview',
          subtitle: 'Unified clinical health overview and IoT telemetry monitors.',
        };
      case 'medi-reminder':
      case 'reminder':
      case 'medi-reminder-step1':
        return {
          title: 'Step 1: Patient Basic Information',
          subtitle: 'Configure identity, emergency dispatch contact, and clinical history.',
        };
      case 'medi-reminder-step2':
        return {
          title: 'Step 2: Prescription Schedule Builder',
          subtitle: 'Add medicines, dosage strengths, times of day, and intake rules.',
        };
      case 'medi-reminder-dashboard':
        return {
          title: 'Medi Reminder Regimen Dashboard',
          subtitle: 'Daily medication schedules, dose compliance, and dispatch alerts.',
        };
      case 'volunteer-step1':
        return {
          title: 'Blood Donor Step 1: Basic Information & ID Verification',
          subtitle: 'Enter personal details, blood group, availability, and government ID.',
        };
      case 'volunteer-step2':
        return {
          title: 'Blood Donor Step 2: ESP32 Biomedical Hardware Test',
          subtitle: 'Live DS18B20 core temperature and HX711 load cell vital telemetry.',
        };
      case 'volunteer-step3':
        return {
          title: 'Blood Donor Step 3: Habits & Lifestyle Assessment',
          subtitle: 'Medical lifestyle compatibility and donor suitability rating.',
        };
      case 'volunteer-step4':
        return {
          title: 'Blood Donor Step 4: Legal Consent & Declaration',
          subtitle: 'Electronic declaration and medical compliance agreement.',
        };
      case 'volunteer-status':
        return {
          title: 'Blood Donor Portal & Status',
          subtitle: 'Verified donor card, inspection status, and active hospital requests.',
        };
      case 'donor-viewer':
        return {
          title: 'Find Verified Blood Donors',
          subtitle: 'Locate nearby screened donors filtered by blood type and proximity.',
        };
      case 'general-checkup':
      case 'general-checkup-step1':
      case 'general-checkup-step2':
      case 'general-checkup-step3':
        return {
          title: 'General Health Assessment',
          subtitle: 'IoT vitals telemetry, symptoms review, and clinical diagnostic scorecard.',
        };
      case 'good-habits':
        return {
          title: 'Daily Good Habits Guide',
          subtitle: 'Evidence-backed preventive routines and daily streak tracker.',
        };
      case 'natural-wellness':
        return {
          title: "Do's & Don'ts / Natural Wellness",
          subtitle: 'Clinically safe lifestyle guidelines and evidence-based herbal remedies.',
        };
      case 'first-aid':
        return {
          title: 'First Aid Protocols & Emergency Triage',
          subtitle: 'Standardized life support, CPR cadences, and burn/poisoning protocols.',
        };
      case 'appointments':
        return {
          title: 'Clinical Consultations & Appointments',
          subtitle: 'Book and manage specialist doctor appointments and telehealth sessions.',
        };
      case 'profile':
        return {
          title: 'Account Profile',
          subtitle: 'Manage credentials, personal details, and clinical contact information.',
        };
      default:
        return {
          title: 'Medicare Clinical Portal',
          subtitle: 'Connected clinical health management system.',
        };
    }
  };

  const headerInfo = getHeaderInfo(currentRoute, currentUser);

  // Determine Layout Structure
  const isPublicLayout = currentRoute === 'landing' || currentRoute === 'login';

  return (
    <div
      className={`${
        isPublicLayout ? 'min-h-screen' : 'h-screen overflow-hidden'
      } bg-[#F4F7FC] text-[#0F1D3D] flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900`}
    >
      {/* PUBLIC NAVBAR (Used for Landing) */}
      {currentRoute === 'landing' && (
        <NavbarPublic
          currentRoute={currentRoute}
          currentUser={currentUser}
          onNavigate={handleNavigate}
          onOpenAuth={handleOpenAuth}
          onLogout={handleLogout}
        />
      )}

      {/* MAIN CONTAINER */}
      {isPublicLayout ? (
        <main className="flex-1">
          {currentRoute === 'landing' && (
            <LandingScreen
              currentUser={currentUser}
              onNavigate={handleNavigate}
              onSelectGatedFlow={handleSelectGatedFlow}
              onSelectPortal={handleSelectPortal}
              onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
            />
          )}

          {currentRoute === 'login' && (
            <AuthScreen
              onLoginSuccess={handleLoginSuccess}
              intendedRoute={intendedRoute}
              initialPurpose={authPurpose}
              initialMode={authMode}
              initialError={authLinkError ?? undefined}
              onConfirmedSession={handleConfirmedSession}
              onNavigate={handleNavigate}
            />
          )}
        </main>
      ) : (
        /* AUTHENTICATED WORKSPACE LAYOUT (Fixed Sidebar + Header + Inner Scroll Content) */
        <div className="flex-1 flex overflow-hidden h-full">
          {/* Sidebar (Fixed in place) */}
          <SidebarNav
            currentRoute={currentRoute}
            onNavigate={handleNavigate}
            collapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            currentUser={currentUser}
            onLogout={handleLogout}
            portalType={portalType}
            isDeviceConnected={true}
            isMobileOpen={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />

          {/* Main Content Area (Independent Smooth Scroll) */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto bg-[#F4F7FC]">
            <HeaderAuth
              title={headerInfo.title}
              subtitle={headerInfo.subtitle}
              currentUser={currentUser}
              onNavigate={handleNavigate}
              onOpenEmergency={() => setIsEmergencyModalOpen(true)}
              onToggleSidebar={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              onLogout={handleLogout}
            />

            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {/* Screens 3, 4, 5: Medi Reminder Flow */}
              {(currentRoute === 'medi-reminder-step1' ||
                currentRoute === 'medi-reminder' ||
                currentRoute === 'reminder') && (
                <MediReminderStep1
                  profile={mediProfile}
                  onSaveProfile={handleSaveMediProfile}
                  onNavigate={handleNavigate}
                  currentUser={currentUser}
                />
              )}

              {currentRoute === 'medi-reminder-step2' && (
                <MediReminderStep2
                  medications={medications}
                  onSaveMedications={handleSaveMedicationList}
                  onNavigate={handleNavigate}
                />
              )}

              {currentRoute === 'medi-reminder-dashboard' && (
                <MediReminderDashboard
                  medications={medications}
                  profile={mediProfile}
                  onToggleTaken={handleToggleMedication}
                  onNavigate={handleNavigate}
                />
              )}

              {/* Screens 6, 7, 8, 9, 10: Volunteer Registration & Status Flow */}
              {currentRoute === 'volunteer-step1' && (
                <VolunteerStep1
                  volunteerProfile={volunteerProfile}
                  onSaveStep1={handleSaveVolunteerStep1}
                  onNavigate={handleNavigate}
                  currentUser={currentUser}
                />
              )}

              {currentRoute === 'volunteer-step2' && (
                <VolunteerStep2
                  volunteerProfile={volunteerProfile}
                  onSaveStep2={handleSaveVolunteerStep2}
                  onNavigate={handleNavigate}
                />
              )}

              {currentRoute === 'volunteer-step3' && (
                <VolunteerStep3
                  volunteerProfile={volunteerProfile}
                  onSaveStep3={handleSaveVolunteerStep3}
                  onNavigate={handleNavigate}
                />
              )}

              {currentRoute === 'volunteer-step4' && (
                <VolunteerStep4
                  volunteerProfile={volunteerProfile}
                  onSaveStep4={handleSaveVolunteerStep4}
                  onNavigate={handleNavigate}
                />
              )}

              {currentRoute === 'volunteer-status' && (
                <VolunteerStatusScreen
                  volunteerProfile={volunteerProfile}
                  bloodRequests={bloodRequests}
                  onToggleInspection={handleToggleInspection}
                  onNavigate={handleNavigate}
                />
              )}

              {/* Screen 11: Donor Viewer (Authenticated) */}
              {currentRoute === 'donor-viewer' && (
                <DonorViewerScreen
                  donors={donors}
                  currentUser={currentUser}
                  onNavigate={handleNavigate}
                  onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
                />
              )}

              {/* General Health Check-Up (Step 1, 2, 3) */}
              {(currentRoute === 'general-checkup' ||
                currentRoute === 'general-checkup-step1' ||
                currentRoute === 'general-checkup-step2' ||
                currentRoute === 'general-checkup-step3') && (
                <GeneralCheckupScreen
                  currentUser={currentUser}
                  onNavigate={handleNavigate}
                />
              )}

              {/* Screen 13: Good Habits Guidance */}
              {currentRoute === 'good-habits' && (
                <GoodHabitsScreen onNavigate={handleNavigate} />
              )}

              {/* Screen 14: Natural Wellness & Phytotherapy */}
              {currentRoute === 'natural-wellness' && (
                <NaturalWellnessScreen onNavigate={handleNavigate} />
              )}

              {/* Screen 15: First Aid Protocols */}
              {currentRoute === 'first-aid' && (
                <FirstAidScreen onNavigate={handleNavigate} />
              )}

              {/* Screen 16: Appointments & Specialist Consultations */}
              {currentRoute === 'appointments' && (
                <AppointmentsScreen onNavigate={handleNavigate} />
              )}

              {/* Screen 18: Account Profile */}
              {currentRoute === 'profile' && (
                <ProfileScreen
                  currentUser={currentUser}
                  onUpdateUser={(updated) =>
                    setCurrentUser((prev) => (prev ? { ...prev, ...updated } : null))
                  }
                  onNavigate={handleNavigate}
                />
              )}
            </main>
          </div>
        </div>
      )}

      {/* Global Emergency Blood Request Modal */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        onSubmit={handleSubmitEmergencyRequest}
      />
    </div>
  );
}
