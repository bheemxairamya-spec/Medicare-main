import React, { useState, useEffect } from 'react';
import { HeartPulse, Menu, X } from 'lucide-react';
import { RouteKey, User } from '../../types';

interface NavbarPublicProps {
  currentRoute: RouteKey;
  onNavigate: (route: RouteKey) => void;
  onOpenAuth?: (mode?: 'login' | 'register', purpose?: string) => void;
  currentUser?: User | null;
  onLogout?: () => void;
  id?: string;
}

export const NavbarPublic: React.FC<NavbarPublicProps> = ({
  currentRoute,
  onNavigate,
  onOpenAuth,
  currentUser,
  onLogout,
  id,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('home');

  const handleOpenLogin = () => {
    if (onOpenAuth) {
      onOpenAuth('login');
    } else {
      onNavigate('login');
    }
  };

  const handleOpenGetStarted = () => {
    if (onOpenAuth) {
      onOpenAuth('register');
    } else {
      onNavigate('login');
    }
  };

  const anchorLinks = [
    { label: 'Home', href: '#home', id: 'home' },
    { label: 'Services', href: '#services', id: 'services' },
    { label: 'How It Works', href: '#how-it-works', id: 'how-it-works' },
    { label: 'About Us', href: '#about-us', id: 'about-us' },
    { label: 'Contact', href: '#contact', id: 'contact' },
  ];

  // Scrollspy effect to highlight current section in view
  useEffect(() => {
    if (currentRoute !== 'landing') return;

    const handleScroll = () => {
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80;
      if (isAtBottom) {
        setActiveSection('contact');
        return;
      }

      const scrollPosition = window.scrollY + 120; // offset for navbar height
      const sections = ['contact', 'how-it-works', 'about-us', 'services', 'home'];

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentRoute]);

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, sectionId: string) => {
    e.preventDefault();
    setMobileOpen(false);
    setActiveSection(sectionId);

    const scrollToTarget = () => {
      if (sectionId === 'home' || href === '#home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const target = document.getElementById(sectionId) || document.querySelector(href);
      if (target) {
        const navHeight = 70;
        const targetTop = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({ top: targetTop, behavior: 'smooth' });
      }
    };

    if (currentRoute !== 'landing') {
      onNavigate('landing');
      setTimeout(scrollToTarget, 150);
      return;
    }

    scrollToTarget();
  };

  const handleLogoClick = () => {
    if (currentUser) {
      const target: RouteKey =
        currentUser.selectedPurpose === 'volunteer'
          ? 'volunteer-status'
          : currentUser.selectedPurpose === 'find-donor'
          ? 'donor-viewer'
          : currentUser.selectedPurpose === 'medi-reminder'
          ? 'medi-reminder-dashboard'
          : 'general-checkup';
      onNavigate(target);
      return;
    }
    if (currentRoute !== 'landing') {
      onNavigate('landing');
    }
    setActiveSection('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      id={id || 'public-navbar'}
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5EAF3] shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo & Wordmark (No PLUS badge) */}
        <div
          id="navbar-brand"
          onClick={handleLogoClick}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <HeartPulse className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-2xl font-black text-[#0F1D3D] tracking-tight">
            Medi<span className="text-[#2563EB]">care</span>
          </span>
        </div>

        {/* Center: Plain Anchor Links with Active Highlight */}
        <nav id="navbar-center-links" className="hidden md:flex items-center gap-7 lg:gap-9">
          {anchorLinks.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href, link.id)}
                className={`text-base transition-colors relative py-1 ${
                  isActive
                    ? 'font-bold text-[#2563EB]'
                    : 'font-semibold text-[#4B5563] hover:text-[#2563EB]'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right: Outline Log In & Solid Blue Get Started */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3">
            <button
              id="navbar-login-btn"
              onClick={handleOpenLogin}
              className="px-5 py-2.5 text-base font-bold text-[#0F1D3D] border border-gray-300 rounded-xl hover:border-[#2563EB] hover:text-[#2563EB] hover:bg-gray-50 transition-colors shadow-2xs"
            >
              Log In
            </button>
            <button
              id="navbar-get-started-btn"
              onClick={handleOpenGetStarted}
              className="px-5 py-2.5 bg-[#2563EB] text-white text-base font-bold rounded-xl hover:bg-blue-700 transition shadow-xs"
            >
              Get Started
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            id="navbar-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div id="navbar-mobile-menu" className="md:hidden bg-white border-b border-[#E5EAF3] px-4 pt-2 pb-4 space-y-2">
          {anchorLinks.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href, link.id)}
                className={`block px-3.5 py-2.5 text-base rounded-xl transition-colors ${
                  isActive
                    ? 'font-bold text-[#2563EB] bg-[#EFF4FF]'
                    : 'font-semibold text-[#4B5563] hover:text-[#2563EB] hover:bg-[#EFF4FF]'
                }`}
              >
                {link.label}
              </a>
            );
          })}
          <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                handleOpenLogin();
                setMobileOpen(false);
              }}
              className="w-full py-2.5 text-base font-bold text-[#0F1D3D] border border-gray-300 rounded-xl hover:bg-gray-50 text-center"
            >
              Log In
            </button>
            <button
              onClick={() => {
                handleOpenGetStarted();
                setMobileOpen(false);
              }}
              className="w-full py-2.5 bg-[#2563EB] text-white font-bold text-base rounded-xl text-center shadow-xs"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
