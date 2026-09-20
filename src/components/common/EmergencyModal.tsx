import React from 'react';
import {
  ShieldAlert,
  PhoneCall,
  MapPin,
  Ambulance,
  HeartPulse,
  X,
  Share2,
  AlertOctagon,
} from 'lucide-react';
import { RouteKey } from '../../types';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: RouteKey) => void;
  id?: string;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  id,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id={id || 'emergency-support-modal'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl border-2 border-red-300 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Emergency Assistance & Dispatch</h2>
              <p className="text-xs text-red-100">Immediate 24/7 Life Safety & Trauma Support</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Direct 911 Call Button */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-800 flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5 text-red-600" /> National Emergency Line
              </span>
              <p className="text-2xl font-black text-red-900 mt-0.5">Dial 911 / 112</p>
              <p className="text-xs text-red-700">Immediate police, fire, & paramedic ambulance dispatch</p>
            </div>
            <a
              href="tel:911"
              className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm rounded-xl shadow-md flex items-center gap-2 shrink-0 transition"
            >
              <PhoneCall className="w-4 h-4 animate-bounce" />
              <span>Call 911</span>
            </a>
          </div>

          {/* Quick Action Tiles */}
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => {
                onClose();
                onNavigate('donor-viewer');
              }}
              className="p-3.5 rounded-xl border border-[#E5EAF3] bg-[#F4F7FC] hover:bg-blue-50/70 hover:border-blue-300 transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                <HeartPulse className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-[#0F1D3D]">Find Emergency Blood</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Search live O-, A+, B+ local blood banks</p>
            </div>

            <div
              onClick={() => {
                onClose();
                onNavigate('first-aid');
              }}
              className="p-3.5 rounded-xl border border-[#E5EAF3] bg-[#F4F7FC] hover:bg-amber-50/70 hover:border-amber-300 transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                <Ambulance className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-[#0F1D3D]">First Aid Protocols</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">CPR, choking, severe bleeding steps</p>
            </div>
          </div>

          {/* Nearby Hospital info */}
          <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F1D3D] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#2563EB]" /> Nearest Trauma Center
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                1.4 km • Open 24/7
              </span>
            </div>
            <p className="text-xs font-bold text-gray-800">Metropolitan Emergency & Trauma Center</p>
            <p className="text-[11px] text-gray-500">450 Healthcare Blvd, Building A • Tel: +91 98765 43210</p>
            <div className="pt-1.5 flex items-center gap-2">
              <button
                onClick={() => alert('GPS emergency location beacon broadcast to local dispatch: 37.7749° N, 122.4194° W')}
                className="flex-1 py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Share2 className="w-3.5 h-3.5" /> Share Live Location
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
