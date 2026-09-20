import React from 'react';
import {
  Pill,
  HeartHandshake,
  Search,
  Sparkles,
  BookOpenCheck,
  ShieldAlert,
  Calendar,
  User as UserIcon,
  LogOut,
  ChevronRight,
  Zap,
  HeartPulse,
} from 'lucide-react';
import { PortalType, RouteKey, User } from '../../types';

interface SidebarNavProps {
  currentRoute: RouteKey;
  onNavigate: (route: RouteKey) => void;
  currentUser: User | null;
  onLogout: () => void;
  portalType: PortalType;
  isDeviceConnected?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  id?: string;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentRoute,
  onNavigate,
  currentUser,
  onLogout,
  portalType,
  collapsed = false,
  isMobileOpen = false,
  onCloseMobile,
  id,
}) => {
  interface NavItem {
    id: RouteKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    description?: string;
  }

  // Scoped navigation items strictly mapped to the active Portal Context
  const getNavItemsForPortal = (portal: PortalType): NavItem[] => {
    switch (portal) {
      case 'medi-reminder':
        return [
          {
            id: 'medi-reminder-step1',
            label: 'Medi Reminder',
            icon: Pill,
            badge: '3-Step Rx',
            description: 'Patient Info & Schedule',
          },
          {
            id: 'appointments',
            label: 'Appointments',
            icon: Calendar,
            description: 'Bookings & Clinics',
          },
          {
            id: 'good-habits',
            label: 'Daily Good Habits',
            icon: Sparkles,
            description: 'Hydration & Nutrition',
          },
          {
            id: 'natural-wellness',
            label: "Do's & Don'ts / Wellness",
            icon: BookOpenCheck,
            description: 'Clinical Precautions',
          },
          {
            id: 'first-aid',
            label: 'First Aid & Emergency',
            icon: ShieldAlert,
            description: 'Protocols & CPR Guides',
          },
          {
            id: 'profile',
            label: 'Account Profile',
            icon: UserIcon,
            description: 'Personal Info & Settings',
          },
        ];

      case 'blood-donation':
        return [
          {
            id: 'volunteer-step1',
            label: 'Blood Donor Portal',
            icon: HeartHandshake,
            badge: 'Registration',
            description: 'Donor Registration & Screening',
          },
          {
            id: 'volunteer-status',
            label: 'Donor Status & Card',
            icon: Sparkles,
            description: 'Inspection & Digital Card',
          },
          {
            id: 'donor-viewer',
            label: 'Find Blood Donors',
            icon: Search,
            description: 'Emergency Blood Directory',
          },
          {
            id: 'good-habits',
            label: 'Daily Good Habits',
            icon: Sparkles,
            description: 'Donor Health & Nutrition',
          },
          {
            id: 'first-aid',
            label: 'First Aid & Emergency',
            icon: ShieldAlert,
            description: 'Emergency CPR & Protocols',
          },
          {
            id: 'profile',
            label: 'Account Profile',
            icon: UserIcon,
            description: 'Personal Info & Settings',
          },
        ];

      case 'general-checkup':
        return [
          {
            id: 'general-checkup',
            label: 'General Check-up',
            icon: HeartPulse,
            badge: 'IoT Vitals',
            description: 'ESP32 Telemetry & Vitals',
          },
          {
            id: 'appointments',
            label: 'Appointments',
            icon: Calendar,
            description: 'Bookings & Clinics',
          },
          {
            id: 'good-habits',
            label: 'Daily Good Habits',
            icon: Sparkles,
            description: 'Hydration & Nutrition',
          },
          {
            id: 'natural-wellness',
            label: "Do's & Don'ts / Wellness",
            icon: BookOpenCheck,
            description: 'Clinical Precautions',
          },
          {
            id: 'first-aid',
            label: 'First Aid & Emergency',
            icon: ShieldAlert,
            description: 'Protocols & CPR Guides',
          },
          {
            id: 'profile',
            label: 'Account Profile',
            icon: UserIcon,
            description: 'Personal Info & Settings',
          },
        ];

      case 'find-donors':
        return [
          {
            id: 'donor-viewer',
            label: 'Find Blood Donors',
            icon: Search,
            badge: 'Emergency Search',
            description: 'Emergency Donor Search',
          },
          {
            id: 'volunteer-step1',
            label: 'Become a Blood Donor',
            icon: HeartHandshake,
            description: 'Register as Verified Donor',
          },
          {
            id: 'good-habits',
            label: 'Daily Good Habits',
            icon: Sparkles,
            description: 'Hydration & Health',
          },
          {
            id: 'first-aid',
            label: 'First Aid & Emergency',
            icon: ShieldAlert,
            description: 'Protocols & CPR Guides',
          },
          {
            id: 'profile',
            label: 'Account Profile',
            icon: UserIcon,
            description: 'Personal Info & Settings',
          },
        ];

      default:
        return [
          {
            id: 'general-checkup',
            label: 'General Check-up',
            icon: HeartPulse,
            badge: 'IoT Vitals',
            description: 'ESP32 Telemetry & Vitals',
          },
          {
            id: 'appointments',
            label: 'Appointments',
            icon: Calendar,
            description: 'Bookings & Clinics',
          },
          {
            id: 'good-habits',
            label: 'Daily Good Habits',
            icon: Sparkles,
            description: 'Hydration & Nutrition',
          },
          {
            id: 'natural-wellness',
            label: "Do's & Don'ts / Wellness",
            icon: BookOpenCheck,
            description: 'Clinical Precautions',
          },
          {
            id: 'first-aid',
            label: 'First Aid & Emergency',
            icon: ShieldAlert,
            description: 'Protocols & CPR Guides',
          },
          {
            id: 'profile',
            label: 'Account Profile',
            icon: UserIcon,
            description: 'Personal Info & Settings',
          },
        ];
    }
  };

  const navItems = getNavItemsForPortal(portalType);

  const getPortalDefaultRoute = (portal: PortalType): RouteKey => {
    switch (portal) {
      case 'medi-reminder':
        return 'medi-reminder-step1';
      case 'blood-donation':
        return 'volunteer-step1';
      case 'find-donors':
        return 'donor-viewer';
      case 'general-checkup':
      default:
        return 'general-checkup';
    }
  };

  const portalMeta: Record<
    PortalType,
    { name: string; tag: string; badgeBg: string }
  > = {
    'medi-reminder': {
      name: 'Medi Reminder Portal',
      tag: 'Prescription & Adherence',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    'blood-donation': {
      name: 'Blood Donation Portal',
      tag: 'Donor Registry Network',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    'general-checkup': {
      name: 'General Checkup Portal',
      tag: 'IoT Telemetry & Health',
      badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
    },
    'find-donors': {
      name: 'Find Blood Donors Portal',
      tag: 'Emergency Donor Search',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  };

  const isItemActive = (itemId: RouteKey): boolean => {
    if (itemId === 'general-checkup') {
      return (
        currentRoute === 'general-checkup' ||
        currentRoute === 'general-checkup-step1' ||
        currentRoute === 'general-checkup-step2' ||
        currentRoute === 'general-checkup-step3'
      );
    }
    if (itemId === 'medi-reminder-step1') {
      return (
        currentRoute === 'medi-reminder' ||
        currentRoute === 'reminder' ||
        currentRoute === 'medi-reminder-step1' ||
        currentRoute === 'medi-reminder-step2' ||
        currentRoute === 'medi-reminder-dashboard'
      );
    }
    if (itemId === 'volunteer-step1') {
      return (
        currentRoute === 'volunteer-step1' ||
        currentRoute === 'volunteer-step2' ||
        currentRoute === 'volunteer-step3' ||
        currentRoute === 'volunteer-step4'
      );
    }
    if (itemId === 'volunteer-status') {
      return currentRoute === 'volunteer-status';
    }
    if (itemId === 'donor-viewer') {
      return currentRoute === 'donor-viewer';
    }
    return currentRoute === itemId;
  };

  const handleItemClick = (targetId: RouteKey) => {
    if (onCloseMobile) {
      onCloseMobile();
    }
    onNavigate(targetId);
  };

  const activePortalInfo = portalMeta[portalType] || portalMeta['general-checkup'];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        id={id || 'app-sidebar'}
        className={`bg-white border-r border-[#E5EAF3] flex flex-col justify-between shrink-0 h-full select-none z-30 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen
            ? 'fixed inset-y-0 left-0 shadow-2xl flex translate-x-0 z-50'
            : 'hidden md:flex'
        }`}
      >
        {/* Top section: Logo & Scoped Portal Context Title */}
        <div>
          <div className="px-4 py-3.5 border-b border-[#E5EAF3]">
            <div
              id="sidebar-brand-logo"
              onClick={() => handleItemClick(getPortalDefaultRoute(portalType))}
              className="flex items-center gap-2.5 cursor-pointer select-none overflow-hidden hover:opacity-90 transition-opacity"
              title={`Go to ${activePortalInfo.name} Primary Screen`}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white shadow-xs shrink-0">
                <Zap className="w-5 h-5 fill-white/20 stroke-[2.2]" />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <span className="text-xl font-black text-[#0F1D3D] tracking-tight leading-tight block">
                    Medi<span className="text-[#2563EB]">care</span>
                  </span>
                  <span className="block text-[11px] text-gray-400 font-medium leading-tight truncate">
                    {activePortalInfo.tag}
                  </span>
                </div>
              )}
            </div>

            {/* Portal Badge */}
            {!collapsed && (
              <div className="mt-2.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${activePortalInfo.badgeBg}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                  <span className="truncate">{activePortalInfo.name}</span>
                </span>
              </div>
            )}
          </div>

          {/* Navigation items (clean padding and responsive spacing) */}
          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-170px)] custom-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.id);

              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => handleItemClick(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group relative ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-xs font-bold'
                      : 'text-[#4B5563] hover:text-[#0F1D3D] hover:bg-[#F4F7FC]'
                  } ${collapsed ? 'justify-center px-2' : ''}`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#2563EB]'
                    }`}
                  />
                  {!collapsed && (
                    <div className="flex-1 flex items-center justify-between min-w-0 text-left">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-blue-50 text-[#2563EB] border border-blue-100'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                  {isActive && !collapsed && (
                    <ChevronRight className="w-4 h-4 text-white/70 shrink-0" />
                  )}
                </button>
              );
            })}

            {/* Contextual Infobox for 2-item portals so spacing is balanced and purposeful */}
            {navItems.length <= 2 && !collapsed && (
              <div className="mt-5 p-3.5 rounded-2xl bg-[#F4F7FC]/80 border border-[#E5EAF3] text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#0F1D3D]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">Portal Active</span>
                </div>
                <p className="text-[#4B5563] text-[11px] leading-relaxed">
                  {portalType === 'blood-donation' && 'Dedicated blood donor registration & life-saving hospital dispatch network.'}
                  {portalType === 'general-checkup' && 'ESP32 vital telemetry, core temperature, blood pressure, and diagnostic checkup.'}
                  {portalType === 'find-donors' && 'Emergency donor directory with real-time location and blood compatibility search.'}
                </p>
              </div>
            )}
          </nav>
        </div>

        {/* Bottom section: User info & logout */}
        <div className="p-3 border-t border-[#E5EAF3] bg-gray-50/50">
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div
                onClick={() => handleItemClick('profile')}
                className="flex items-center gap-2.5 cursor-pointer min-w-0"
              >
                {currentUser?.avatar_url || currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar_url || currentUser.avatar}
                    alt={currentUser.name || 'User Avatar'}
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#0F1D3D] truncate">{currentUser?.name || 'Welcome'}</p>
                  <p className="text-xs text-gray-500 truncate">{currentUser?.email || 'Logged In'}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Log Out"
                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogout}
              title="Log Out"
              className="w-full flex justify-center p-2.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
