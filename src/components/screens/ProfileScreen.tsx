import React, { useState, useRef } from 'react';
import {
  User as UserIcon,
  ShieldCheck,
  Save,
  CheckCircle2,
  Camera,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { BloodGroup, RouteKey, User } from '../../types';
import { ReassuranceBar } from '../common/ReassuranceBar';
import { PhoneInput } from '../common/PhoneInput';
import { uploadAvatar } from '../../services/storageService';

interface ProfileScreenProps {
  currentUser: User | null;
  onUpdateUser: (updated: Partial<User>) => void;
  onNavigate: (route: RouteKey) => void;
  id?: string;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  currentUser,
  onUpdateUser,
  onNavigate,
  id,
}) => {
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [bloodGroup, setBloodGroup] = useState<string>(currentUser?.bloodGroup || 'O+');
  const [avatarUrl, setAvatarUrl] = useState<string>(
    currentUser?.avatar_url || currentUser?.avatar || ''
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const bloodGroups: BloodGroup[] = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setAvatarError(null);
    try {
      const result = await uploadAvatar(file);
      if (result.success && result.url) {
        setAvatarUrl(result.url);
        onUpdateUser({ avatar: result.url, avatar_url: result.url });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      } else {
        setAvatarError(result.message || 'Failed to upload profile photo.');
      }
    } catch {
      setAvatarError('An unexpected error occurred while uploading.');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      name: name.trim() || 'Member',
      email: email.trim(),
      phone: phone.trim(),
      bloodGroup,
      avatar: avatarUrl,
      avatar_url: avatarUrl,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div id={id || 'profile-screen'} className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0F1D3D] via-[#1E3A8A] to-[#2563EB] rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="relative group">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white/15 backdrop-blur-md text-white font-black text-2xl flex items-center justify-center border border-white/20 shadow-md shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name || 'User Profile'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{name ? name.charAt(0).toUpperCase() : 'U'}</span>
              )}
            </div>

            <button
              type="button"
              disabled={isUploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 p-2 bg-[#2563EB] hover:bg-blue-600 active:scale-95 text-white rounded-xl shadow-md border-2 border-white transition flex items-center justify-center cursor-pointer disabled:opacity-50"
              title="Change Profile Photo"
            >
              {isUploadingAvatar ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">{name || 'User Profile'}</h2>
              <span className="text-[11px] font-bold bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
                Verified Member
              </span>
            </div>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-0.5">
              {email || 'No email attached'} • Blood Type: <span className="font-bold text-white">{bloodGroup}</span>
            </p>
            <button
              type="button"
              disabled={isUploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-xs font-semibold text-blue-200 hover:text-white underline cursor-pointer flex items-center gap-1"
            >
              {isUploadingAvatar ? 'Uploading photo...' : 'Change Photo'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <span className="text-xs font-bold text-emerald-300 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            256-bit HIPAA Shield
          </span>
        </div>
      </div>

      {avatarError && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{avatarError}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile details updated successfully!</span>
        </div>
      )}

      {/* Account Info Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E5EAF3] p-6 sm:p-8 shadow-sm space-y-5">
        <h3 className="text-sm sm:text-base font-extrabold text-[#0F1D3D] flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-[#2563EB]" /> Personal Details & Clinical Identification
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#0F1D3D] mb-1">Full Legal Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Legal Name"
              className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-xs rounded-xl px-3.5 py-2.5 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F1D3D] mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@medicare.health"
              className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-xs rounded-xl px-3.5 py-2.5 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F1D3D] mb-1">Mobile Contact (SMS Dispatch)</label>
            <PhoneInput
              id="profile-phone-input"
              required
              value={phone}
              onChange={(val) => setPhone(val)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F1D3D] mb-1">Blood Group</label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-xs rounded-xl px-3.5 py-2.5 text-[#0F1D3D] font-bold focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
            >
              {bloodGroups.map((bg) => (
                <option key={bg} value={bg}>
                  {bg} (ABO / Rh Type)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Details</span>
          </button>
        </div>
      </form>

      <ReassuranceBar />
    </div>
  );
};
