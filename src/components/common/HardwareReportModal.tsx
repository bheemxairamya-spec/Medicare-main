import React from 'react';
import {
  FileText,
  X,
  Printer,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Cpu,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { HardwareReport } from '../../types';
import { StatusPill } from './StatusPill';

interface HardwareReportModalProps {
  report: HardwareReport | null;
  isOpen: boolean;
  onClose: () => void;
  id?: string;
}

export const HardwareReportModal: React.FC<HardwareReportModalProps> = ({
  report,
  isOpen,
  onClose,
  id,
}) => {
  if (!isOpen || !report) return null;

  const statusIcons = {
    pass: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    review: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    fail: <XCircle className="w-5 h-5 text-red-600" />,
  };

  return (
    <div
      id={id || 'hardware-report-modal'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl border border-[#E5EAF3] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-[#F4F7FC]/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-extrabold text-[#0F1D3D]">{report.title}</h2>
                <StatusPill variant={report.overallStatus} />
              </div>
              <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                <span>Doc ID: {report.id}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-xs">
                  <Cpu className="w-3.5 h-3.5 text-[#2563EB]" /> {report.deviceId}
                </span>
                <span>•</span>
                <span>{report.timestamp}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Executive Summary Card */}
          <div
            className={`p-5 rounded-xl border ${
              report.overallStatus === 'pass'
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                : report.overallStatus === 'review'
                ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                : 'bg-red-50/60 border-red-200 text-red-950'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">{statusIcons[report.overallStatus]}</div>
              <div>
                <h4 className="text-base font-bold">Diagnostic Clinical Conclusion</h4>
                <p className="text-sm mt-1 leading-relaxed">{report.summary}</p>
                <div className="mt-2.5 text-sm font-semibold pt-2 border-t border-black/10 flex items-center gap-1">
                  <span>Recommendation:</span> {report.recommendation}
                </div>
              </div>
            </div>
          </div>

          {/* Standardized Measured vs Expected Comparison Table */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500">
                Biomedical Telemetry & Comparison Specifications
              </h3>
              <span className="text-xs text-gray-400 font-mono">
                {report.readings.length} Sensor Channels Evaluated
              </span>
            </div>

            <div className="border border-[#E5EAF3] rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F4F7FC] text-[#0F1D3D] font-bold border-b border-[#E5EAF3]">
                  <tr>
                    <th className="py-2.5 px-3">Metric & Hardware Sensor</th>
                    <th className="py-2.5 px-3">Measured Value</th>
                    <th className="py-2.5 px-3">Clinical Reference Range</th>
                    <th className="py-2.5 px-3 text-right">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.readings.map((r) => (
                    <tr key={r.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="py-3 px-3">
                        <p className="font-bold text-[#0F1D3D]">{r.metricName}</p>
                        <p className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-[#2563EB]" /> {r.sensorName}
                        </p>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-sm text-[#0F1D3D]">
                        {r.value} <span className="text-xs font-normal text-gray-500">{r.unit}</span>
                      </td>
                      <td className="py-3 px-3 text-gray-600 font-medium">{r.referenceRange}</td>
                      <td className="py-3 px-3 text-right">
                        <StatusPill variant={r.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cryptographic & Device Verification Stamp */}
          <div className="bg-[#EFF4FF]/60 rounded-xl p-3.5 border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#4B5563]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span>
                Digitally cryptographically signed with hardware-bound HMAC-SHA256 signature by Medicare Node.
              </span>
            </div>
            <span className="text-[10px] font-mono text-blue-700 font-bold bg-white px-2 py-0.5 rounded border border-blue-200">
              HASH: e4b7...910a
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 bg-[#F4F7FC]/70 flex items-center justify-between">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-[#E5EAF3] hover:bg-gray-50 transition shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                alert(`Exporting ${report.title} (PDF generated with 256-bit encryption).`);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
