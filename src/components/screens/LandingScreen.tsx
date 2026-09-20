import React, { useState } from 'react';
import {
  Pill,
  HeartHandshake,
  Search,
  Activity,
  Sparkles,
  BookOpenCheck,
  ShieldAlert,
  Calendar,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  TrendingUp,
  Zap,
  Mail,
  MapPin,
  MessageSquare,
  Send,
  Clock,
  Stethoscope,
  HeartPulse,
} from 'lucide-react';
import { PortalType, RouteKey, User, UserPurpose } from '../../types';
import { StatusPill } from '../common/StatusPill';

interface LandingScreenProps {
  onNavigate: (route: RouteKey) => void;
  currentUser?: User | null;
  onOpenEmergencyModal?: () => void;
  onOpenEmergency?: () => void;
  onSelectGatedFlow?: (intendedRoute: RouteKey, purpose: UserPurpose) => void;
  onSelectPortal?: (portal: PortalType, targetRoute?: RouteKey) => void;
  id?: string;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onNavigate,
  currentUser,
  onOpenEmergencyModal,
  onOpenEmergency,
  onSelectGatedFlow,
  onSelectPortal,
  id,
}) => {
  const triggerEmergency = onOpenEmergencyModal || onOpenEmergency || (() => {});
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: '',
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({ name: '', email: '', subject: 'General Inquiry', message: '' });
    }, 4000);
  };

  const handleMediReminderClick = () => {
    if (onSelectPortal) {
      onSelectPortal('medi-reminder', 'medi-reminder-step1');
    } else if (currentUser) {
      onNavigate('medi-reminder-step1');
    } else if (onSelectGatedFlow) {
      onSelectGatedFlow('medi-reminder-step1', 'medi-reminder');
    } else {
      onNavigate('login');
    }
  };

  const handleVolunteerClick = () => {
    if (onSelectPortal) {
      onSelectPortal('blood-donation', 'volunteer-step1');
    } else if (currentUser) {
      onNavigate('volunteer-step1');
    } else if (onSelectGatedFlow) {
      onSelectGatedFlow('volunteer-step1', 'volunteer');
    } else {
      onNavigate('login');
    }
  };

  const handleDonorViewerClick = () => {
    if (onSelectPortal) {
      onSelectPortal('find-donors', 'donor-viewer');
    } else if (currentUser) {
      onNavigate('donor-viewer');
    } else if (onSelectGatedFlow) {
      onSelectGatedFlow('donor-viewer', 'find-donor');
    } else {
      onNavigate('login');
    }
  };

  const handleGeneralHealthClick = () => {
    if (onSelectPortal) {
      onSelectPortal('general-checkup', 'general-checkup');
    } else if (currentUser) {
      onNavigate('general-checkup');
    } else if (onSelectGatedFlow) {
      onSelectGatedFlow('general-checkup', 'general');
    } else {
      onNavigate('login');
    }
  };

  const handleFeatureClick = (route: RouteKey) => {
    if (currentUser) {
      onNavigate(route);
    } else if (onSelectGatedFlow) {
      onSelectGatedFlow(route, 'general');
    } else {
      onNavigate('login');
    }
  };

  return (
    <div id={id || 'medicare-landing-page'} className="min-h-screen bg-[#F4F7FC]">
      {/* Hero Section */}
      <section id="home" className="relative pt-12 pb-18 lg:pt-16 lg:pb-24 overflow-hidden scroll-mt-20">
        {/* Subtle background ambient mesh */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-100/50 via-[#EFF4FF]/30 to-transparent pointer-events-none -z-10 rounded-3xl" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6 flex flex-col items-center">
            {/* Brand-Focused Hero Lockup (Medicare Headline + Large Icon) */}
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white shadow-xl shadow-blue-500/25 shrink-0">
                <HeartPulse className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 stroke-[2.4]" />
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0F1D3D] tracking-tight leading-none">
                Medi<span className="text-[#2563EB]">care</span>
              </h1>
            </div>

            {/* Supporting Paragraph */}
            <p className="text-base sm:text-lg text-[#4B5563] leading-relaxed max-w-2xl mx-auto">
              Medicare combines intelligent medication scheduling, hardware-verified blood
              donation registration with ESP32 biomedical telemetry, daily wellness tracking, and
              instant emergency dispatch into a single clinical-grade platform.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                id="hero-explore-services-btn"
                onClick={() => {
                  const servicesEl = document.getElementById('services');
                  if (servicesEl) {
                    servicesEl.scrollIntoView({ behavior: 'smooth' });
                  } else if (currentUser) {
                    const target: RouteKey =
                      currentUser.selectedPurpose === 'volunteer'
                        ? 'volunteer-status'
                        : currentUser.selectedPurpose === 'find-donor'
                        ? 'donor-viewer'
                        : currentUser.selectedPurpose === 'medi-reminder'
                        ? 'medi-reminder-dashboard'
                        : 'general-checkup';
                    onNavigate(target);
                  } else {
                    onNavigate('login');
                  }
                }}
                className="px-6 py-3.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm sm:text-base rounded-xl shadow-md flex items-center gap-2 transition active:scale-98"
              >
                <span>Explore Services</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={triggerEmergency}
                className="px-6 py-3.5 bg-white hover:bg-red-50 text-[#DC2626] border border-[#DC2626] font-bold text-sm sm:text-base rounded-xl shadow-xs flex items-center gap-2 transition active:scale-98"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Emergency Support</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Entry Cards (With Auth Routing Logic) */}
      <section id="services" className="py-14 bg-white border-y border-[#E5EAF3] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F1D3D] tracking-tight">
              Start Your Medicare Journey
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] mt-1.5">
              Select one of our primary clinical pathways tailored for patients, blood donors, and
              emergency responders.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Medi Reminder (Auth Required) */}
            <div
              id="landing-card-medi-reminder"
              onClick={handleMediReminderClick}
              className="bg-gradient-to-b from-[#EFF4FF] to-white rounded-2xl border border-blue-200/80 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#2563EB] text-white flex items-center justify-center mb-3.5 group-hover:scale-110 transition shadow-xs">
                  <Pill className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <h3 className="text-base font-bold text-[#0F1D3D]">Medi Reminder</h3>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    Auth Required
                  </span>
                </div>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Never miss a dosage with multi-channel push, SMS, and dashboard alerts. Complete our
                  2-step customized schedule builder.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-blue-100 flex items-center justify-between text-xs font-bold text-[#2563EB]">
                <span>Set Up My Medications</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: Become a Blood Donor (Auth Required) */}
            <div
              id="landing-card-volunteer"
              onClick={handleVolunteerClick}
              className="bg-gradient-to-b from-purple-50/70 to-white rounded-2xl border border-purple-200/80 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-3.5 group-hover:scale-110 transition shadow-xs">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <h3 className="text-base font-bold text-[#0F1D3D]">Become a Blood Donor</h3>
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                    Hardware Verified
                  </span>
                </div>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Join our verified blood donor network. Includes 5-step registration with live ESP32
                  vital testing (DS18B20 temp, Load Cell weight, MQ-3 alcohol screening).
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-purple-100 flex items-center justify-between text-xs font-bold text-purple-700">
                <span>Start Donor Verification</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 3: Find Blood Donors (Auth Required) */}
            <div
              id="landing-card-donor-viewer"
              onClick={handleDonorViewerClick}
              className="bg-gradient-to-b from-rose-50/70 to-white rounded-2xl border border-red-200/80 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#DC2626] text-white flex items-center justify-center mb-3.5 group-hover:scale-110 transition shadow-xs">
                  <Search className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <h3 className="text-base font-bold text-[#0F1D3D]">Find Blood Donors</h3>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    Auth Required
                  </span>
                </div>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Instant emergency search for hospitals and families. Filter by blood group
                  compatibility, proximity, and verified donor readiness.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-rose-100 flex items-center justify-between text-xs font-bold text-red-600">
                <span>Search Donors</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 4: General Health Checkup (Auth Required) */}
            <div
              id="landing-card-general-health"
              onClick={handleGeneralHealthClick}
              className="bg-gradient-to-b from-teal-50/70 to-white rounded-2xl border border-teal-200/80 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-3.5 group-hover:scale-110 transition shadow-xs">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <h3 className="text-base font-bold text-[#0F1D3D]">General Health Checkup</h3>
                  <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                    Auth Required
                  </span>
                </div>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Get the complete Medicare experience — IoT vitals, daily habits, appointments,
                  wellness guidance, and more, all in one dashboard.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-teal-100 flex items-center justify-between text-xs font-bold text-teal-700">
                <span>Explore Full Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3x2 Feature Links Grid */}
      <section id="about-us" className="py-14 bg-[#F4F7FC] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F1D3D] tracking-tight">
              Comprehensive Health Capabilities
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] mt-1.5">
              Explore the full spectrum of modern health management and safety modules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                id: 'feat-general-checkup',
                title: 'General Health Assessment',
                desc: 'Comprehensive clinical evaluation combining vitals assessment, symptom review, and preventive scoring.',
                icon: HeartPulse,
                color: 'text-blue-600 bg-blue-50 border-blue-200',
                route: 'general-checkup' as RouteKey,
                badge: 'Clinical Scorecard',
              },
              {
                id: 'feat-habits',
                title: 'Daily Good Habits',
                desc: 'Interactive tracker for hydration, morning exercise, balanced meals, steps, and sleep cycles.',
                icon: Sparkles,
                color: 'text-amber-600 bg-amber-50 border-amber-200',
                route: 'good-habits' as RouteKey,
                badge: 'Wellness Index',
              },
              {
                id: 'feat-wellness',
                title: 'Natural Wellness & Remedies',
                desc: 'Doctor-curated holistic guides for hypertension, diabetes, and prenatal vitality.',
                icon: BookOpenCheck,
                color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
                route: 'natural-wellness' as RouteKey,
                badge: 'Clinical',
              },
              {
                id: 'feat-dosdonts',
                title: "Do's & Don'ts Protocols",
                desc: 'Clear side-by-side evidence-based guidelines for chronic and acute health situations.',
                icon: CheckCircle2,
                color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
                route: 'natural-wellness' as RouteKey,
                badge: 'Reference',
              },
              {
                id: 'feat-firstaid',
                title: 'First Aid & Emergency Info',
                desc: 'Rapid CPR, choking (Heimlich), burn management, and severe hemorrhage response guides.',
                icon: ShieldAlert,
                color: 'text-red-600 bg-red-50 border-red-200',
                route: 'first-aid' as RouteKey,
                badge: 'Immediate Safety',
              },
              {
                id: 'feat-appointments',
                title: 'Appointment Reminders',
                desc: 'Smart calendar synchronization with hospital specialists and virtual telemedicine visits.',
                icon: Calendar,
                color: 'text-purple-600 bg-purple-50 border-purple-200',
                route: 'appointments' as RouteKey,
                badge: 'Sync & Notes',
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.id}
                  onClick={() => handleFeatureClick(f.route)}
                  className="bg-white rounded-2xl border border-[#E5EAF3] p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group hover:border-[#2563EB]/40 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border ${f.color}`}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {f.badge}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#0F1D3D] group-hover:text-[#2563EB] transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">{f.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-400 group-hover:text-[#2563EB]">
                    <span>Open Module</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3-Step "How Medicare Works" Strip */}
      <section id="how-it-works" className="py-14 bg-white border-t border-[#E5EAF3] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
              Seamless Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F1D3D] tracking-tight mt-1">
              How Medicare Operates
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="bg-[#F4F7FC] rounded-2xl p-6 border border-[#E5EAF3] relative text-center md:text-left">
              <div className="w-10 h-10 rounded-full bg-[#2563EB] text-white font-extrabold text-sm flex items-center justify-center mb-3.5 mx-auto md:mx-0 shadow-xs">
                01
              </div>
              <h4 className="text-base font-bold text-[#0F1D3D]">Create Your Care Profile</h4>
              <p className="text-xs text-[#4B5563] mt-1.5 leading-relaxed">
                Choose your purpose: Medication schedule reminders, blood donation registration, or
                connected IoT health tracking.
              </p>
            </div>

            <div className="bg-[#F4F7FC] rounded-2xl p-6 border border-[#E5EAF3] relative text-center md:text-left">
              <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-extrabold text-sm flex items-center justify-center mb-3.5 mx-auto md:mx-0 shadow-xs">
                02
              </div>
              <h4 className="text-base font-bold text-[#0F1D3D]">Hardware Verification & Sync</h4>
              <p className="text-xs text-[#4B5563] mt-1.5 leading-relaxed">
                Plug in the Medicare ESP32 rig to capture clinical grade temperature, pulse oximetry, and
                alcohol screening with cryptographic proof.
              </p>
            </div>

            <div className="bg-[#F4F7FC] rounded-2xl p-6 border border-[#E5EAF3] relative text-center md:text-left">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center mb-3.5 mx-auto md:mx-0 shadow-xs">
                03
              </div>
              <h4 className="text-base font-bold text-[#0F1D3D]">Stay Protected & Save Lives</h4>
              <p className="text-xs text-[#4B5563] mt-1.5 leading-relaxed">
                Receive punctual dosage reminders, access emergency blood donor matches, and trigger
                immediate emergency dispatch anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us & Clinical Inquiries Section */}
      <section id="contact" className="py-14 bg-[#F4F7FC] border-t border-[#E5EAF3] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
              Get In Touch
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F1D3D] tracking-tight mt-1">
              Contact Medicare Support & Clinical Care
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] mt-1.5">
              Have questions about IoT hardware verification, blood donor matching, or clinic partnerships? Our medical coordination desk is available 24/7.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Contact Channels Cards (5 cols) */}
            <div className="lg:col-span-5 space-y-3.5">
              {/* Emergency Hotline */}
              <div className="bg-red-50/80 border border-red-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-red-600 block">
                      Emergency Support Hotline (24/7)
                    </span>
                    <p className="text-lg font-black text-[#0F1D3D] mt-0.5">+1 (800) 633-4227</p>
                    <p className="text-xs text-red-700/80 mt-1 leading-relaxed">
                      Direct hotline for urgent blood transfusions, cardiac events, and ambulance dispatch.
                    </p>
                  </div>
                </div>
              </div>

              {/* Clinical & General Inquiries */}
              <div className="bg-white border border-[#E5EAF3] rounded-2xl p-5 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#2563EB] block">
                      Email Coordination Desk
                    </span>
                    <p className="text-sm font-bold text-[#0F1D3D] mt-0.5">clinical-desk@medicare.health</p>
                    <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                      Average response time under 15 minutes for verified patient & blood donor inquiries.
                    </p>
                  </div>
                </div>
              </div>

              {/* Physical Clinical Center */}
              <div className="bg-white border border-[#E5EAF3] rounded-2xl p-5 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 block">
                      Headquarters & Diagnostic Lab
                    </span>
                    <p className="text-sm font-bold text-[#0F1D3D] mt-0.5">500 Healthcare Plaza, Suite 400</p>
                    <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                      San Francisco Medical District, CA 94107
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Contact Form (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E5EAF3] p-6 sm:p-7 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-[#2563EB]" />
                <h3 className="text-base font-bold text-[#0F1D3D]">Send Us a Direct Message</h3>
              </div>

              {contactSubmitted ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                  <h4 className="text-base font-bold text-emerald-900">Message Received!</h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    Thank you for reaching out. A Medicare care specialist will contact you shortly via email.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[#0F1D3D] mb-1">
                        Your Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="Dr. / Patient Name"
                        className="w-full px-3.5 py-2.5 bg-[#F4F7FC] border border-[#E5EAF3] rounded-xl text-xs text-[#0F1D3D] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0F1D3D] mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="you@example.com"
                        className="w-full px-3.5 py-2.5 bg-[#F4F7FC] border border-[#E5EAF3] rounded-xl text-xs text-[#0F1D3D] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0F1D3D] mb-1">
                      Inquiry Topic
                    </label>
                    <select
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#F4F7FC] border border-[#E5EAF3] rounded-xl text-xs text-[#0F1D3D] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition"
                    >
                      <option value="General Inquiry">General Platform Inquiry</option>
                      <option value="Blood Donor Program">Blood Donor Program</option>
                      <option value="IoT Hardware Rig">ESP32 Hardware & Biometric Diagnostics</option>
                      <option value="Medi Reminder Setup">Medi Reminder & Clinical Scheduling</option>
                      <option value="Hospital Partnership">Hospital & Emergency Dispatch Integration</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0F1D3D] mb-1">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="How can our clinical coordination team assist you today?"
                      className="w-full px-3.5 py-2.5 bg-[#F4F7FC] border border-[#E5EAF3] rounded-xl text-xs text-[#0F1D3D] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition active:scale-98"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Dark Footer with Emergency Support Callout */}
      <footer className="bg-[#0F1D3D] text-white py-14 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pb-10 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#2563EB] flex items-center justify-center text-white">
                  <Zap className="w-6 h-6 fill-white/20" />
                </div>
                <span className="text-2xl font-extrabold tracking-tight">
                  Medi<span className="text-blue-400">care</span>
                </span>
              </div>
              <p className="text-sm sm:text-base text-slate-400 mt-2.5 max-w-sm leading-relaxed">
                Universal healthcare platform powering medication adherence, verified blood donations,
                and biomedical IoT diagnostics.
              </p>
            </div>

            {/* Emergency Hotline Callout */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 sm:p-6 flex items-center gap-4.5 w-full sm:w-auto">
              <div className="w-13 h-13 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <PhoneCall className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-red-400">
                  24/7 Emergency Support Hotline
                </span>
                <p className="text-2xl sm:text-3xl font-black text-white">+1 (800) MEDICARE-911</p>
                <p className="text-xs text-slate-400 mt-0.5">Immediate response ambulance & blood dispatch</p>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
            <p>© 2026 Medicare Platform Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="hover:text-white cursor-pointer">Privacy Policy</span>
              <span className="hover:text-white cursor-pointer">Terms of Service</span>
              <span className="hover:text-white cursor-pointer">HIPAA Disclosures</span>
              <span className="hover:text-white cursor-pointer">Security Certifications</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
