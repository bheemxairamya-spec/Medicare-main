import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Search,
  ShieldAlert,
  Menu,
  CheckCircle2,
  Clock,
  Pill,
  HeartHandshake,
  X,
  User as UserIcon,
  LogOut,
  Settings,
  ChevronDown,
  Sparkles,
  HeartPulse,
} from 'lucide-react';
import { User, RouteKey } from '../../types';

interface HeaderAuthProps {
  title: string;
  subtitle: string;
  currentUser: User | null;
  onOpenEmergency: () => void;
  onNavigate: (route: RouteKey) => void;
  onToggleSidebar?: () => void;
  onLogout?: () => void;
  id?: string;
}

export const HeaderAuth: React.FC<HeaderAuthProps> = ({
  title,
  subtitle,
  currentUser,
  onOpenEmergency,
  onNavigate,
  onToggleSidebar,
  onLogout,
  id,
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [notifications, setNotifications] = useState<
    Array<{
      id: number;
      type: string;
      title: string;
      desc: string;
      time: string;
      unread: boolean;
      route: RouteKey;
    }>
  >([]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header
      id={id || 'authenticated-header'}
      className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E5EAF3] px-4 sm:px-6 py-3 shadow-2xs"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Mobile menu button + Title & Subtitle */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 shrink-0 cursor-pointer"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold text-[#0F1D3D] tracking-tight truncate">
              {title}
            </h1>
            <p className="text-xs text-[#4B5563] truncate">{subtitle}</p>
          </div>
        </div>

        {/* Right: Search, Notifications, Avatar Dropdown, Red Emergency Button */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 self-end md:self-center w-full md:w-auto justify-between md:justify-end">
          {/* Global Search Bar */}
          <div className="relative flex-1 md:w-56 lg:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search meds, donors, habits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-xs rounded-xl pl-9 pr-3 py-2 text-[#0F1D3D] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
            />
          </div>

          {/* Notifications Bell with Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded-xl text-gray-600 bg-gray-100/80 hover:bg-gray-200 transition-colors relative cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-[#E5EAF3] shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F1D3D]">
                    Notifications {unreadCount > 0 ? `(${unreadCount} Unread)` : ''}
                  </span>
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-500">
                      <Bell className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                      <p className="font-semibold text-gray-700">No new notifications</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Alerts for scheduled medications and emergency requests will appear here.
                      </p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          onNavigate(n.route);
                          setNotificationsOpen(false);
                        }}
                        className={`p-3 hover:bg-[#F4F7FC] cursor-pointer transition-colors ${
                          n.unread ? 'bg-[#EFF4FF]/40' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              n.type === 'med'
                                ? 'bg-blue-100 text-blue-700'
                                : n.type === 'donor'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {n.type === 'med' ? (
                              <Pill className="w-3.5 h-3.5" />
                            ) : n.type === 'donor' ? (
                              <HeartHandshake className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-[#0F1D3D] truncate">{n.title}</p>
                              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> {n.time}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 line-clamp-1">{n.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Red Emergency help/support button */}
          <button
            onClick={onOpenEmergency}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-[#DC2626] hover:bg-red-700 transition shadow-xs shrink-0 active:scale-95 cursor-pointer"
            title="Immediate emergency help & dispatch"
          >
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            <span className="hidden sm:inline">Emergency Help</span>
          </button>

          {/* User Profile Avatar with Interactive Dropdown Menu */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              id="header-profile-avatar-btn"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="cursor-pointer flex items-center gap-1.5 pl-1 group p-1 rounded-xl hover:bg-gray-100 transition"
              title={currentUser ? currentUser.name : 'User Account Menu'}
            >
              {currentUser?.avatar_url || currentUser?.avatar ? (
                <img
                  src={currentUser.avatar_url || currentUser.avatar}
                  alt={currentUser.name || 'User Avatar'}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-[#EFF4FF] group-hover:ring-[#2563EB]/40 transition"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#2563EB] to-indigo-700 text-white font-bold text-sm flex items-center justify-center ring-2 ring-[#EFF4FF] group-hover:ring-[#2563EB]/40 transition">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-800 transition" />
            </button>

            {/* Profile & Logout Dropdown Menu */}
            {profileMenuOpen && (
              <div
                id="header-profile-dropdown"
                className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-[#E5EAF3] shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                {/* User Header Info */}
                <div className="px-4 py-3 border-b border-gray-100 bg-[#F8FAFC]/70 rounded-t-xl">
                  <p className="text-sm font-black text-[#0F1D3D] truncate">
                    {currentUser?.name || 'Medicare User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {currentUser?.email || 'user@medicare.local'}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200 uppercase tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {currentUser?.role || 'Patient Account'}
                    </span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onNavigate('profile');
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs sm:text-sm font-semibold text-gray-700 hover:bg-[#F4F7FC] hover:text-[#2563EB] flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    <span>View Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onNavigate('profile');
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs sm:text-sm font-semibold text-gray-700 hover:bg-[#F4F7FC] hover:text-[#2563EB] flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                    <span>Edit Profile & Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onNavigate('general-checkup');
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs sm:text-sm font-semibold text-gray-700 hover:bg-[#F4F7FC] hover:text-[#2563EB] flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <HeartPulse className="w-4 h-4 text-gray-400" />
                    <span>IoT Health Checkup</span>
                  </button>
                </div>

                {/* Logout Divider & Button */}
                <div className="border-t border-gray-100 pt-1.5 mt-1">
                  <button
                    type="button"
                    id="header-logout-btn"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      if (onLogout) {
                        onLogout();
                      }
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs sm:text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

