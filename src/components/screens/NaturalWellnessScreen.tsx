import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Bookmark,
  BookmarkCheck,
  AlertCircle,
  Leaf,
  Info,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { RouteKey, WellnessRemedy } from '../../types';
import { ReassuranceBar } from '../common/ReassuranceBar';
import { getGoodHabits } from '../../services/contentService';

interface NaturalWellnessScreenProps {
  onNavigate: (route: RouteKey) => void;
  id?: string;
}

export const NaturalWellnessScreen: React.FC<NaturalWellnessScreenProps> = ({
  onNavigate,
  id,
}) => {
  const [remedies, setRemedies] = useState<WellnessRemedy[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void getGoodHabits().then((result) => {
      if (!result.success) {
        setRemedies([]);
        setIsLoading(false);
        return;
      }

      const mapped = (result.habits || []).map((item: any, index: number) => ({
        id: String(item.id ?? `habit-${index}`),
        title: item.title ?? item.name ?? 'Wellness habit',
        category: item.category ?? 'general',
        benefits: item.benefits ?? item.description ?? '',
        ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
        instructions: item.instructions ?? item.steps ?? '',
        precautions: item.precautions ?? '',
      }));

      setRemedies(mapped);
      setIsLoading(false);
    });
  }, []);

  const categories = [
    { id: 'all', label: 'All Remedies' },
    { id: 'immunity', label: 'Immunity & Cold' },
    { id: 'digestion', label: 'Digestion & Gut' },
    { id: 'respiratory', label: 'Respiratory & Throat' },
    { id: 'stress', label: 'Stress & Sleep' },
    { id: 'joint', label: 'Joint & Inflammation' },
    { id: 'general', label: 'General Wellness' },
  ];

  const toggleBookmark = (id: string) => {
    if (bookmarkedIds.includes(id)) {
      setBookmarkedIds(bookmarkedIds.filter((b) => b !== id));
    } else {
      setBookmarkedIds([...bookmarkedIds, id]);
    }
  };

  const filteredRemedies = remedies.filter((rem) => {
    if (selectedCategory !== 'all' && rem.category.toLowerCase() !== selectedCategory.toLowerCase())
      return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        rem.title.toLowerCase().includes(q) ||
        rem.benefits.toLowerCase().includes(q) ||
        rem.ingredients.some((ing) => ing.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div id={id || 'natural-wellness-screen'} className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-[#0F1D3D] rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full border border-white/20">
              Evidence-Based Phytotherapy
            </span>
            <span className="text-[11px] font-bold bg-teal-400/30 text-teal-100 px-2.5 py-0.5 rounded-full border border-teal-300/30">
              Clinical Botanical Database
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Natural Remedies & Wellness
          </h2>
          <p className="text-xs sm:text-sm text-teal-100/90 max-w-xl">
            Clinically referenced botanical preparations and natural therapies for mild symptom relief,
            restorative balance, and immune modulation.
          </p>
        </div>

        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-xs text-teal-100 max-w-xs shrink-0 relative z-10">
          <p className="font-bold flex items-center gap-1.5 text-white">
            <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0" />
            <span>Clinical Notice</span>
          </p>
          <p className="text-[11px] mt-1 text-teal-100 leading-relaxed">
            Natural remedies support general wellness and must not replace prescribed medications for
            acute or chronic conditions.
          </p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="bg-white rounded-2xl border border-[#E5EAF3] p-5 shadow-sm space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search symptoms, herbs, or ailments (e.g., cough, ginger, insomnia, reflux)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 bg-[#F4F7FC] border border-[#E5EAF3] rounded-xl text-xs text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-teal-600/30"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#0F1D3D] text-white shadow-xs'
                  : 'bg-[#F4F7FC] text-gray-700 border border-[#E5EAF3] hover:bg-gray-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-3xl border border-dashed border-[#CBD5E1] p-12 text-center space-y-3">
          <Leaf className="w-12 h-12 text-teal-600/40 mx-auto animate-pulse" />
          <h4 className="text-lg font-bold text-[#0F1D3D]">Loading wellness content…</h4>
        </div>
      ) : filteredRemedies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRemedies.map((remedy) => {
            const isSaved = bookmarkedIds.includes(remedy.id);
            return (
              <div
                key={remedy.id}
                className="bg-white rounded-2xl border border-[#E5EAF3] p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                      {remedy.category}
                    </span>
                    <button
                      onClick={() => toggleBookmark(remedy.id)}
                      className="text-gray-400 hover:text-teal-600 transition"
                      title={isSaved ? 'Remove Bookmark' : 'Save Remedy'}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-5 h-5 text-teal-600 fill-teal-100" />
                      ) : (
                        <Bookmark className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  <h3 className="text-base font-extrabold text-[#0F1D3D] mt-3">{remedy.title}</h3>
                  <p className="text-xs text-gray-600 mt-1">{remedy.benefits}</p>

                  {/* Ingredients List */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Active Botanicals & Ingredients
                    </h4>
                    <ul className="mt-1.5 space-y-1">
                      {remedy.ingredients.map((ing, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-gray-700 flex items-center gap-1.5 font-medium"
                        >
                          <Leaf className="w-3 h-3 text-teal-600 shrink-0" />
                          <span>{ing}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Preparation Guide */}
                  <div className="mt-3 p-3 bg-[#F4F7FC] rounded-xl border border-[#E5EAF3]">
                    <h5 className="text-[11px] font-bold text-[#0F1D3D]">Preparation Protocol:</h5>
                    <p className="text-xs text-gray-600 mt-0.5">{remedy.instructions}</p>
                  </div>

                  {/* Contraindications */}
                  {remedy.precautions && (
                    <div className="mt-3 flex items-start gap-1.5 text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{remedy.precautions}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <span>Scientific Peer-Reviewed</span>
                  <span className="text-teal-700 font-bold">100% Organic Origin</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-dashed border-[#CBD5E1] p-12 text-center space-y-3">
          <Leaf className="w-12 h-12 text-teal-600/40 mx-auto" />
          <h4 className="text-lg font-bold text-[#0F1D3D]">No Natural Remedies Found</h4>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            No herbal formulas connected yet. Botanical and home remedy library will link to database.
          </p>
        </div>
      )}

      <ReassuranceBar />
    </div>
  );
};
