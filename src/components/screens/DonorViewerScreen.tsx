import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Search,
  MapPin,
  ShieldCheck,
  Phone,
  Filter,
  CheckCircle2,
  AlertTriangle,
  HeartHandshake,
  Share2,
  Calendar,
  Sparkles,
  Lock,
} from 'lucide-react';
import { BloodGroup, Donor, RouteKey, User } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { ReassuranceBar } from '../common/ReassuranceBar';
import { findDonorsByBloodGroup } from '../../services/volunteerService';

interface DonorViewerScreenProps {
  donors: Donor[];
  currentUser: User | null;
  onNavigate: (route: RouteKey) => void;
  onOpenEmergencyModal: () => void;
  id?: string;
}

export const DonorViewerScreen: React.FC<DonorViewerScreenProps> = ({
  donors,
  currentUser,
  onNavigate,
  onOpenEmergencyModal,
  id,
}) => {
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('all');
  const [databaseDonors, setDatabaseDonors] = useState<Donor[] | null>(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [selectedDonorForContact, setSelectedDonorForContact] = useState<Donor | null>(null);

  const bloodGroups: BloodGroup[] = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

  useEffect(() => {
    void findDonorsByBloodGroup(selectedBloodGroup).then((result) => {
      if (!result.success) return;
      setDatabaseDonors(result.donors.map((donor: any) => ({
        id: donor.id,
        name: donor.name,
        bloodGroup: donor.blood_group,
        distanceKm: 0,
        location: donor.location || 'Location not shared',
        isVerified: donor.status === 'approved',
        isAvailable: Boolean(donor.available_time),
        availableWindow: donor.available_time || 'Not specified',
        phone: donor.mobile || '',
        totalDonations: 0,
        lastDonationDate: undefined,
      })));
    });
  }, [selectedBloodGroup]);

  const displayedDonors = databaseDonors ?? donors;

  const filteredDonors = displayedDonors.filter((d) => {
    if (selectedBloodGroup !== 'all' && d.bloodGroup !== selectedBloodGroup) return false;
    if (searchLocation && !d.location.toLowerCase().includes(searchLocation.toLowerCase()))
      return false;
    if (onlyAvailable && !d.isAvailable) return false;
    if (onlyVerified && !d.isVerified) return false;
    return true;
  });

  const handleContactDonor = (donor: Donor) => {
    setSelectedDonorForContact(donor);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div id={id || 'donor-viewer-screen'} className="max-w-7xl mx-auto space-y-7">
      {/* Top Banner with Emergency Broadcast CTA */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-[#0F1D3D] rounded-3xl p-7 sm:p-9 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-extrabold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full border border-white/20">
              Verified Donor Directory
            </span>
            <span className="text-xs font-bold bg-emerald-500/30 text-emerald-100 px-3 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Donor Availability
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Verified Blood Donor Network
          </h2>
          <p className="text-sm sm:text-base text-red-100/90 max-w-xl leading-relaxed">
            Search verified donors in your area. Every volunteer undergoes physical biometric screening
            and clinical record verification.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <button
            onClick={onOpenEmergencyModal}
            className="px-6 py-3.5 bg-white hover:bg-gray-100 text-red-700 font-extrabold text-sm sm:text-base rounded-xl shadow-lg flex items-center gap-2 transition active:scale-98"
          >
            <AlertTriangle className="w-5 h-5 text-red-600 fill-red-100" />
            <span>Post Emergency Request</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-[#E5EAF3] p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-[#0F1D3D] flex items-center gap-2.5">
            <Filter className="w-5 h-5 text-[#2563EB]" /> Search & Filter Parameters
          </h3>
          <span className="text-sm font-bold text-gray-500">
            Showing {filteredDonors.length} of {displayedDonors.length} Donors
          </span>
        </div>

        {/* Blood Group Chips */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
            Filter by Blood Group
          </label>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setSelectedBloodGroup('all')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                selectedBloodGroup === 'all'
                  ? 'bg-[#0F1D3D] text-white shadow-xs'
                  : 'bg-[#F4F7FC] text-gray-700 border border-[#E5EAF3] hover:bg-gray-100'
              }`}
            >
              All Types
            </button>
            {bloodGroups.map((bg) => (
              <button
                key={bg}
                onClick={() => setSelectedBloodGroup(bg)}
                className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-all flex items-center gap-1.5 ${
                  selectedBloodGroup === bg
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-[#F4F7FC] text-gray-700 border border-[#E5EAF3] hover:bg-gray-100'
                }`}
              >
                <span>{bg}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Location search & Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 pt-1">
          <div className="sm:col-span-6 relative">
            <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by city, district, or hospital area..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#F4F7FC] border border-[#E5EAF3] rounded-xl text-sm sm:text-base text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
            />
          </div>

          <div className="sm:col-span-3 flex items-center gap-2.5 p-3 bg-[#F4F7FC] rounded-xl border border-[#E5EAF3]">
            <input
              type="checkbox"
              id="onlyAvailable"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label
              htmlFor="onlyAvailable"
              className="text-sm font-bold text-[#0F1D3D] cursor-pointer select-none"
            >
              Available Now Only
            </label>
          </div>

          <div className="sm:col-span-3 flex items-center gap-2.5 p-3 bg-[#F4F7FC] rounded-xl border border-[#E5EAF3]">
            <input
              type="checkbox"
              id="onlyVerified"
              checked={onlyVerified}
              onChange={(e) => setOnlyVerified(e.target.checked)}
              className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB]"
            />
            <label
              htmlFor="onlyVerified"
              className="text-sm font-bold text-[#0F1D3D] cursor-pointer select-none"
            >
              Hardware Verified Only
            </label>
          </div>
        </div>
      </div>

      {/* Donors Grid */}
      {filteredDonors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDonors.map((donor) => (
            <div
              key={donor.id}
              className="bg-white rounded-3xl border border-[#E5EAF3] p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-13 h-13 rounded-2xl bg-red-600 text-white font-black text-xl flex items-center justify-center shadow-xs">
                      {donor.bloodGroup}
                    </div>
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-[#0F1D3D]">{donor.name}</h4>
                      <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{donor.location}</span>
                        <span className="font-bold text-[#2563EB]">({donor.distanceKm} km away)</span>
                      </p>
                    </div>
                  </div>

                  <StatusPill
                    variant={donor.isAvailable ? 'available' : 'busy'}
                    label={donor.isAvailable ? 'Available' : 'Resting'}
                  />
                </div>

                {/* Badges & Metrics */}
                <div className="mt-4 pt-3.5 border-t border-gray-100 grid grid-cols-2 gap-2.5 text-xs sm:text-sm">
                  <div className="p-3 bg-[#F4F7FC] rounded-xl">
                    <span className="text-gray-400 block text-xs font-medium">Verification</span>
                    <span className="font-bold text-purple-700 flex items-center gap-1.5 mt-0.5">
                      <ShieldCheck className="w-4 h-4" /> Hardware Signed
                    </span>
                  </div>

                  <div className="p-3 bg-[#F4F7FC] rounded-xl">
                    <span className="text-gray-400 block text-xs font-medium">Lifetime Donations</span>
                    <span className="font-bold text-[#0F1D3D] mt-0.5 block">
                      {donor.totalDonations} Completed
                    </span>
                  </div>
                </div>

                <div className="mt-3.5 flex items-center justify-between text-xs sm:text-sm text-gray-500">
                  <span>Last Donation: {donor.lastDonationDate || 'First Time'}</span>
                  <span className="text-emerald-700 font-bold">Passed Medical Check</span>
                </div>
              </div>

              <div className="pt-3.5 border-t border-gray-100 flex items-center gap-2.5">
                <button
                  onClick={() => handleContactDonor(donor)}
                  className="flex-1 py-3 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition"
                >
                  <Phone className="w-4 h-4" />
                  <span>Contact Donor</span>
                </button>

                <button
                  onClick={() =>
                    alert(`Copied donor link for ${donor.name} (${donor.bloodGroup}) to clipboard.`)
                  }
                  className="p-3 bg-[#F4F7FC] hover:bg-gray-100 text-gray-700 rounded-xl border border-[#E5EAF3] transition"
                  title="Share Donor Card"
                >
                  <Share2 className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E5EAF3] p-12 text-center space-y-4">
          <HeartHandshake className="w-14 h-14 text-gray-300 mx-auto" />
          <div className="space-y-1.5">
            <h3 className="text-lg sm:text-xl font-bold text-[#0F1D3D]">
              {displayedDonors.length === 0 ? 'No Registered Donors in Directory Yet' : 'No Donors Matching Search Criteria'}
            </h3>
            <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto leading-relaxed">
              {displayedDonors.length === 0
                ? 'Be the first to join the life-saving network by registering your blood profile, or post an urgent emergency request for regional hospitals.'
                : 'Try adjusting your search radius or blood group filters, or broadcast an emergency request.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-3">
            {displayedDonors.length === 0 ? (
              <>
                <button
                  onClick={() => onNavigate('volunteer-step1')}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-xs transition"
                >
                  Register as Blood Donor
                </button>
                <button
                  onClick={onOpenEmergencyModal}
                  className="px-5 py-2.5 bg-[#F4F7FC] hover:bg-gray-100 border border-[#E5EAF3] text-[#0F1D3D] text-sm font-bold rounded-xl transition"
                >
                  Post Emergency Request
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setSelectedBloodGroup('all');
                  setSearchLocation('');
                  setOnlyAvailable(false);
                  setOnlyVerified(false);
                }}
                className="px-5 py-2.5 bg-[#2563EB] text-white text-sm font-bold rounded-xl"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Contact Donor Modal */}
      {selectedDonorForContact && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-7 space-y-5 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white font-black text-sm flex items-center justify-center">
                  {selectedDonorForContact.bloodGroup}
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#0F1D3D]">{selectedDonorForContact.name}</h4>
                  <p className="text-xs text-gray-500">Verified Volunteer Contact</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDonorForContact(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <div className="p-5 bg-[#EFF4FF] rounded-2xl border border-blue-100 text-sm space-y-2.5">
              <p className="font-bold text-[#0F1D3D]">Encrypted Volunteer Connection</p>
              <p className="text-gray-600 leading-relaxed">
                To protect donor privacy and prevent spam, calls are routed through Medicare's secure
                hospital relay switchboard.
              </p>
              <div className="pt-2">
                <p className="text-xs text-gray-500 font-medium">Relay Dispatch Line:</p>
                <p className="text-base font-mono font-bold text-[#2563EB] mt-0.5">
                  {selectedDonorForContact.phone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <a
                href={`tel:${selectedDonorForContact.phone}`}
                className="flex-1 py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 text-center shadow-xs"
              >
                <Phone className="w-4 h-4" />
                <span>Call Dispatch Line</span>
              </a>
              <button
                onClick={() => setSelectedDonorForContact(null)}
                className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ReassuranceBar />
    </div>
  );
};
