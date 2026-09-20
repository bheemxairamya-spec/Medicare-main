import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  UserCheck,
  Video,
  MapPin,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Phone,
  Search,
  Sparkles,
} from 'lucide-react';
import { AppointmentItem, RouteKey } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { ReassuranceBar } from '../common/ReassuranceBar';
import { mockDoctors } from '../../services/api';
import { addAppointment, getMyAppointments, type AppointmentRecord } from '../../services/medicationService';

interface AppointmentsScreenProps {
  onNavigate: (route: RouteKey) => void;
  id?: string;
}

export const AppointmentsScreen: React.FC<AppointmentsScreenProps> = ({ onNavigate, id }) => {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [appointmentError, setAppointmentError] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'upcoming' | 'past' | 'book'>('upcoming');

  // Booking Form State
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(mockDoctors[0]?.id || '');
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingTime, setBookingTime] = useState<string>('10:30 AM');
  const [consultType, setConsultType] = useState<'in-person' | 'telehealth'>('in-person');
  const [symptoms, setSymptoms] = useState<string>('');

  const toAppointmentItem = (appointment: AppointmentRecord): AppointmentItem => ({
    id: appointment.id,
    doctorName: appointment.doctor_name,
    specialty: appointment.specialty || 'General Consultation',
    hospital: appointment.hospital_name || 'Medicare Health Center',
    dateTime: appointment.appointment_time
      ? `${appointment.appointment_date} • ${appointment.appointment_time}`
      : appointment.appointment_date,
    type: (appointment.visit_type as AppointmentItem['type']) || 'in-person',
    status: 'confirmed',
    notes: appointment.notes || undefined,
  });

  const loadAppointments = async () => {
    const result = await getMyAppointments();
    if (!result.success) {
      setAppointmentError(result.message || 'Could not load appointments.');
      return;
    }
    setAppointmentError(null);
    setAppointments(result.appointments.map(toAppointmentItem));
  };

  useEffect(() => {
    void loadAppointments();
  }, []);

  const specialties = [
    'All',
    'Cardiology',
    'Endocrinology',
    'General Medicine',
    'Hematology & Transfusion',
    'Pulmonology',
  ];

  const filteredDoctors =
    selectedSpecialty === 'All'
      ? mockDoctors
      : mockDoctors.filter((d) => d.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase()));

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const doc = mockDoctors.find((d) => d.id === selectedDoctorId) || mockDoctors[0];
    const docName = doc?.name || 'Consulting Specialist';
    const specialty = doc?.specialty || (selectedSpecialty !== 'All' ? selectedSpecialty : 'General Consultation');
    const hospitalName = doc?.hospital || 'Medicare Health Center';

    const result = await addAppointment(docName, bookingDate, symptoms, {
      specialty,
      hospitalName,
      visitType: consultType,
      appointmentTime: bookingTime,
    });
    if (!result.success) {
      setAppointmentError(result.message || 'Could not book your appointment.');
      return;
    }
    await loadAppointments();
    setViewTab('upcoming');
    alert(`Appointment successfully confirmed with ${docName} for ${bookingDate} at ${bookingTime}.`);
  };

  const upcomingList = appointments.filter((a) => a.status === 'confirmed');
  const pastList = appointments.filter((a) => a.status === 'completed');

  return (
    <div id={id || 'appointments-screen'} className="max-w-7xl mx-auto space-y-7">
      {appointmentError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {appointmentError}
        </div>
      )}
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-[#0F1D3D] rounded-3xl p-7 sm:p-9 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-extrabold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full border border-white/20">
              Clinical Consultations
            </span>
            <span className="text-xs font-bold bg-purple-400/30 text-purple-100 px-3 py-1 rounded-full border border-purple-300/30">
              Telehealth & In-Clinic
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Doctor Appointments & Specialists
          </h2>
          <p className="text-sm sm:text-base text-purple-100/90 max-w-xl leading-relaxed">
            Schedule consultations with board-certified physicians, link your IoT vitals telemetry,
            and join HIPAA-compliant encrypted video rooms.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <button
            onClick={() => setViewTab('book')}
            className="px-6 py-3.5 bg-white hover:bg-gray-100 text-purple-900 font-extrabold text-sm sm:text-base rounded-xl shadow-lg flex items-center gap-2 transition active:scale-98"
          >
            <Plus className="w-5 h-5 text-purple-700" />
            <span>Book New Appointment</span>
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
        <button
          onClick={() => setViewTab('upcoming')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            viewTab === 'upcoming'
              ? 'bg-[#0F1D3D] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Upcoming Consultations ({upcomingList.length})
        </button>

        <button
          onClick={() => setViewTab('past')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            viewTab === 'past'
              ? 'bg-[#0F1D3D] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Past Consultations ({pastList.length})
        </button>

        <button
          onClick={() => setViewTab('book')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            viewTab === 'book'
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          + Book New Consultation
        </button>
      </div>

      {/* TAB 1: Upcoming Appointments */}
      {viewTab === 'upcoming' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingList.map((apt) => (
              <div
                key={apt.id}
                className="bg-white rounded-3xl border border-[#E5EAF3] p-7 shadow-sm flex flex-col justify-between space-y-5 hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-13 h-13 rounded-2xl bg-purple-50 text-purple-600 font-extrabold flex items-center justify-center text-base shadow-2xs">
                        Dr
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-[#0F1D3D]">{apt.doctorName}</h4>
                        <p className="text-sm text-purple-700 font-semibold">{apt.specialty}</p>
                      </div>
                    </div>

                    <StatusPill variant="confirmed" label="Confirmed" />
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-100 space-y-2.5 text-sm text-gray-600">
                    <p className="flex items-center gap-2 font-mono font-bold text-[#0F1D3D]">
                      <CalendarIcon className="w-4.5 h-4.5 text-[#2563EB]" />
                      <span>{apt.dateTime}</span>
                    </p>

                    <p className="flex items-center gap-2">
                      <MapPin className="w-4.5 h-4.5 text-gray-400" />
                      <span>{apt.hospital}</span>
                    </p>

                    <p className="flex items-center gap-2">
                      {apt.type === 'telehealth' ? (
                        <Video className="w-4.5 h-4.5 text-emerald-600" />
                      ) : (
                        <MapPin className="w-4.5 h-4.5 text-purple-600" />
                      )}
                      <span className="capitalize font-semibold text-[#0F1D3D]">
                        {apt.type === 'telehealth'
                          ? 'Encrypted Telehealth Video'
                          : 'In-Clinic Physical Visit'}
                      </span>
                    </p>

                    {apt.notes && (
                      <p className="text-xs sm:text-sm text-gray-500 italic bg-[#F4F7FC] p-3 rounded-xl leading-relaxed">
                        "{apt.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center gap-2.5">
                  {apt.type === 'telehealth' ? (
                    <button
                      onClick={() =>
                        alert(
                          `Launching secure HIPAA video room with ${apt.doctorName}. Camera & microphone initialized.`
                        )
                      }
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Video className="w-4 h-4" />
                      <span>Join Video Consultation</span>
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        alert(`Opening navigation directions to ${apt.hospital}.`)
                      }
                      className="flex-1 py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Get Clinic Directions</span>
                    </button>
                  )}

                  <button
                    onClick={() => alert('Calendar invite (.ics) synced to your device calendar.')}
                    className="p-3 bg-[#F4F7FC] hover:bg-gray-100 text-gray-700 rounded-xl border border-[#E5EAF3] text-sm font-bold transition"
                    title="Sync Calendar"
                  >
                    <CalendarIcon className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {upcomingList.length === 0 && (
            <div className="bg-white rounded-3xl border border-[#E5EAF3] p-12 text-center space-y-4">
              <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto" />
              <h4 className="text-lg font-bold text-[#0F1D3D]">No Upcoming Consultations</h4>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">Book your next routine check-up with our specialists.</p>
              <button
                onClick={() => setViewTab('book')}
                className="px-5 py-2.5 bg-[#2563EB] text-white text-sm font-bold rounded-xl"
              >
                Book Consultation Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Past History */}
      {viewTab === 'past' && (
        <div className="space-y-4">
          {pastList.length > 0 ? (
            pastList.map((apt) => (
              <div
                key={apt.id}
                className="bg-white rounded-2xl border border-[#E5EAF3] p-5 shadow-2xs flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-gray-100 text-gray-600 font-bold flex items-center justify-center text-sm">
                    Dr
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#0F1D3D]">{apt.doctorName}</h4>
                    <p className="text-sm text-gray-500">
                      {apt.specialty} • {apt.dateTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <span className="text-xs sm:text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl">
                    Completed
                  </span>
                  <button
                    onClick={() => alert('Downloading clinical encounter summary & doctor prescription PDF.')}
                    className="text-sm font-bold text-[#2563EB] hover:underline"
                  >
                    Download Summary PDF
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl border border-[#E5EAF3] p-12 text-center space-y-4">
              <Clock className="w-12 h-12 text-gray-300 mx-auto" />
              <h4 className="text-lg font-bold text-[#0F1D3D]">No Past Consultations</h4>
              <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                Encounter summaries and prescription notes will be archived here once you complete appointments.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Booking Wizard */}
      {viewTab === 'book' && (
        <form onSubmit={handleBookAppointment} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E5EAF3] p-7 sm:p-9 shadow-sm space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-xl font-bold text-[#0F1D3D]">Book a Specialist Consultation</h3>
              <p className="text-sm text-gray-500 mt-1">
                Select your preferred doctor, clinical date, time window, and consultation mode.
              </p>
            </div>

            {/* Specialty filter chips */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#0F1D3D]">Specialty Department</label>
              <div className="flex flex-wrap gap-2.5">
                {specialties.map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => setSelectedSpecialty(spec)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      selectedSpecialty === spec
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-[#F4F7FC] text-gray-700 border border-[#E5EAF3] hover:bg-gray-100'
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            {/* Doctor Picker */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#0F1D3D]">Select Doctor</label>
              {filteredDoctors.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filteredDoctors.map((doc) => {
                    const isSelected = selectedDoctorId === doc.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoctorId(doc.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                          isSelected
                            ? 'bg-purple-50/50 border-purple-600 ring-2 ring-purple-600/20 shadow-xs'
                            : 'bg-[#F4F7FC] border-[#E5EAF3] hover:border-gray-300'
                        }`}
                      >
                        <div className="w-11 h-11 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                          Dr
                        </div>
                        <div>
                          <h4 className="text-sm sm:text-base font-bold text-[#0F1D3D]">{doc.name}</h4>
                          <p className="text-xs sm:text-sm text-purple-700 font-semibold">{doc.specialty}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {doc.hospital} • {doc.experience}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-[#F4F7FC] border border-dashed border-[#E5EAF3] text-center text-xs sm:text-sm text-gray-500">
                  No specialists currently registered or connected to database.
                </div>
              )}
            </div>

            {/* Consultation Mode */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#0F1D3D]">Consultation Mode</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div
                  onClick={() => setConsultType('in-person')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                    consultType === 'in-person'
                      ? 'bg-purple-50/50 border-purple-600 text-[#0F1D3D]'
                      : 'bg-[#F4F7FC] border-[#E5EAF3] text-gray-700'
                  }`}
                >
                  <MapPin className="w-6 h-6 text-purple-600" />
                  <div>
                    <p className="text-sm font-bold">In-Person Clinic Visit</p>
                    <p className="text-xs text-gray-500 mt-0.5">Physical examination at hospital</p>
                  </div>
                </div>

                <div
                  onClick={() => setConsultType('telehealth')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                    consultType === 'telehealth'
                      ? 'bg-purple-50/50 border-purple-600 text-[#0F1D3D]'
                      : 'bg-[#F4F7FC] border-[#E5EAF3] text-gray-700'
                  }`}
                >
                  <Video className="w-6 h-6 text-emerald-600" />
                  <div>
                    <p className="text-sm font-bold">Encrypted Telehealth</p>
                    <p className="text-xs text-gray-500 mt-0.5">HD Video call via browser</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#0F1D3D] mb-1.5">Appointment Date</label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-sm sm:text-base rounded-xl px-4 py-3 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#0F1D3D] mb-1.5">Time Slot</label>
                <select
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-sm sm:text-base rounded-xl px-4 py-3 text-[#0F1D3D] font-bold"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:30 AM">10:30 AM (Recommended)</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="04:30 PM">04:30 PM</option>
                </select>
              </div>
            </div>

            {/* Symptoms */}
            <div>
              <label className="block text-sm font-bold text-[#0F1D3D] mb-1.5">
                Reason for Visit / Symptoms
              </label>
              <textarea
                rows={3}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Briefly describe what you would like to discuss with the physician..."
                className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-sm sm:text-base rounded-xl p-3.5 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-purple-600/30 leading-relaxed"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-7 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm sm:text-base rounded-xl shadow-md flex items-center gap-2 transition active:scale-98"
              >
                <span>Confirm & Lock Appointment</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white rounded-3xl border border-[#E5EAF3] p-7 shadow-sm space-y-4">
              <h4 className="text-base font-bold text-[#0F1D3D]">Connected Telemetry Sync</h4>
              <p className="text-sm text-gray-500 leading-relaxed">
                When confirmed, your latest ESP32 biometric readings (Temperature, Pulse, SpO2) are
                securely pre-attached to your consultation record for the attending physician.
              </p>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-sm">
                <span className="font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                  Auto-Sync Active
                </span>
              </div>
            </div>
          </div>
        </form>
      )}

      <ReassuranceBar />
    </div>
  );
};
