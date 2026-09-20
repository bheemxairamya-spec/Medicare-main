import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Flame,
  CheckCircle2,
  Circle,
  Sun,
  Moon,
  Droplets,
  Heart,
  Brain,
  Utensils,
  Trophy,
  Calendar,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { HabitItem, RouteKey } from '../../types';
import { ProgressRing } from '../common/ProgressRing';
import { ReassuranceBar } from '../common/ReassuranceBar';
import { getGoodHabits } from '../../services/contentService';

interface GoodHabitsScreenProps {
  onNavigate: (route: RouteKey) => void;
  id?: string;
}

export const GoodHabitsScreen: React.FC<GoodHabitsScreenProps> = ({ onNavigate, id }) => {
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('morning');
  const [newTargetTime, setNewTargetTime] = useState('08:00 AM');

  useEffect(() => {
    void getGoodHabits().then((result) => {
      if (!result.success) {
        setHabits([]);
        setIsLoading(false);
        return;
      }

      const mapped = (result.habits || []).map((item: any, index: number) => ({
        id: String(item.id ?? `habit-${index}`),
        title: item.title ?? item.name ?? 'Wellness habit',
        category: item.category ?? 'general',
        description: item.description ?? item.benefits ?? '',
        targetTime: item.target_time ?? item.targetTime ?? '09:00 AM',
        streakDays: Number(item.streak_days ?? item.streakDays ?? 0),
        completedToday: Boolean(item.completed_today ?? item.completedToday ?? false),
      }));

      setHabits(mapped);
      setIsLoading(false);
    });
  }, []);

  const categories = [
    { id: 'all', label: 'All Routines' },
    { id: 'morning', label: 'Morning' },
    { id: 'hydration', label: 'Hydration' },
    { id: 'movement', label: 'Movement' },
    { id: 'nutrition', label: 'Nutrition' },
    { id: 'mindfulness', label: 'Mindfulness' },
    { id: 'sleep', label: 'Rest & Sleep' },
    { id: 'general', label: 'General' },
  ];

  const handleAddDefaultHabits = () => {
    const starterHabits: HabitItem[] = [
      {
        id: 'h1',
        title: 'Morning Natural Light Exposure',
        description: 'Spend 10-15 minutes outdoors within 1 hour of waking to calibrate circadian cortisol rhythm.',
        category: 'morning',
        completedToday: false,
        streakDays: 0,
        targetTime: '07:30 AM',
      },
      {
        id: 'h2',
        title: 'Electrolyte Hydration (500ml)',
        description: 'Drink 500ml water with pinch of mineral salt to support cellular osmolarity.',
        category: 'hydration',
        completedToday: false,
        streakDays: 0,
        targetTime: '08:00 AM',
      },
      {
        id: 'h3',
        title: 'Post-Meal Zone 1 Walk (15 mins)',
        description: 'Light walking following lunch to attenuate postprandial glycemic excursions.',
        category: 'movement',
        completedToday: false,
        streakDays: 0,
        targetTime: '01:30 PM',
      },
      {
        id: 'h4',
        title: 'Diaphragmatic Box Breathing',
        description: '4-second inhale, 4-second hold, 4-second exhale, 4-second hold for parasympathetic tone.',
        category: 'mindfulness',
        completedToday: false,
        streakDays: 0,
        targetTime: '09:00 PM',
      },
    ];
    setHabits(starterHabits);
  };

  const handleCreateCustomHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created: HabitItem = {
      id: 'h-' + Date.now(),
      title: newTitle.trim(),
      description: newDesc.trim() || 'Daily preventive routine',
      category: newCategory,
      completedToday: false,
      streakDays: 0,
      targetTime: newTargetTime || '09:00 AM',
    };
    setHabits([...habits, created]);
    setNewTitle('');
    setNewDesc('');
    setIsAdding(false);
  };

  const toggleHabit = (idToToggle: string) => {
    setHabits(
      habits.map((h) => {
        if (h.id === idToToggle) {
          const nextCompleted = !h.completedToday;
          return {
            ...h,
            completedToday: nextCompleted,
            streakDays: nextCompleted ? h.streakDays + 1 : Math.max(0, h.streakDays - 1),
          };
        }
        return h;
      })
    );
  };

  const completedCount = habits.filter((h) => h.completedToday).length;
  const progressPercent = habits.length > 0 ? (completedCount / habits.length) * 100 : 0;
  const maxStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streakDays), 0) : 0;

  const filteredHabits =
    selectedCategory === 'all'
      ? habits
      : habits.filter((h) => h.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div id={id || 'good-habits-screen'} className="max-w-7xl mx-auto space-y-7">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-[#0F1D3D] rounded-3xl p-7 sm:p-9 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-extrabold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full border border-white/20">
              Circadian & Preventive Health
            </span>
            <span className="text-xs font-bold bg-amber-400/30 text-amber-200 px-3 py-1 rounded-full border border-amber-300/30 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              {maxStreak > 0 ? `${maxStreak}-Day Active Streak` : '0-Day Streak (Start Today)'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Daily Habits & Preventive Routines
          </h2>
          <p className="text-sm sm:text-base text-emerald-100/90 max-w-xl leading-relaxed">
            Small, continuous biological habits compound into long-term vitality, immune stability,
            and cardiovascular resilience.
          </p>
        </div>

        <div className="flex items-center gap-5 bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/15 shrink-0 relative z-10">
          <div>
            <span className="text-xs text-emerald-200 font-bold uppercase tracking-wider block">
              Today's Completion
            </span>
            <p className="text-2xl font-black text-white mt-1">
              {completedCount} of {habits.length} Done
            </p>
          </div>
          <ProgressRing
            percentage={progressPercent}
            size={72}
            strokeWidth={7}
            color="#34D399"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-3xl border border-dashed border-[#CBD5E1] p-12 text-center space-y-3">
          <Flame className="w-12 h-12 text-emerald-600/40 mx-auto animate-pulse" />
          <h4 className="text-lg font-bold text-[#0F1D3D]">Loading daily habits…</h4>
        </div>
      ) : (
        <>
      {/* Category Pills & Add Button */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
        <div className="flex items-center gap-2.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4.5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#0F1D3D] text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-[#E5EAF3] hover:bg-gray-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shrink-0 transition shadow-xs"
        >
          {isAdding ? 'Cancel' : '+ New Routine'}
        </button>
      </div>

      {/* Add Custom Habit Form */}
      {isAdding && (
        <form onSubmit={handleCreateCustomHabit} className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-7 shadow-sm space-y-5">
          <h4 className="text-sm font-extrabold text-[#0F1D3D] uppercase tracking-wider">
            Create Custom Preventive Habit
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Habit Title</label>
              <input
                type="text"
                required
                placeholder="e.g., 20-min Morning Sun Exposure"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-3 bg-[#F4F7FC] border border-[#E5EAF3] rounded-xl text-sm sm:text-base text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-4 py-3 bg-[#F4F7FC] border border-[#E5EAF3] rounded-xl text-sm sm:text-base text-[#0F1D3D] font-medium"
              >
                <option value="morning">Morning</option>
                <option value="hydration">Hydration</option>
                <option value="movement">Movement</option>
                <option value="nutrition">Nutrition</option>
                <option value="mindfulness">Mindfulness</option>
                <option value="sleep">Rest & Sleep</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Target Time</label>
              <input
                type="text"
                placeholder="e.g., 07:30 AM"
                value={newTargetTime}
                onChange={(e) => setNewTargetTime(e.target.value)}
                className="w-full px-4 py-3 bg-[#F4F7FC] border border-[#E5EAF3] rounded-xl text-sm sm:text-base text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Clinical Rationale / Notes</label>
              <input
                type="text"
                placeholder="e.g., Enhances dopamine and resets circadian clock"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-4 py-3 bg-[#F4F7FC] border border-[#E5EAF3] rounded-xl text-sm sm:text-base text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-xs"
            >
              Save Routine
            </button>
          </div>
        </form>
      )}

      {/* Habits Grid */}
      {filteredHabits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHabits.map((habit) => (
            <div
              key={habit.id}
              onClick={() => toggleHabit(habit.id)}
              className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                habit.completedToday
                  ? 'bg-emerald-50/50 border-emerald-200/80 shadow-xs'
                  : 'bg-white border-[#E5EAF3] hover:border-emerald-300 hover:shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-lg bg-[#F4F7FC] text-gray-600 border border-gray-200">
                    {habit.category} • {habit.targetTime}
                  </span>

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                      habit.completedToday
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'border-2 border-gray-300 text-transparent hover:border-emerald-500'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <h4
                  className={`text-lg font-bold mt-3.5 ${
                    habit.completedToday ? 'text-emerald-950 line-through' : 'text-[#0F1D3D]'
                  }`}
                >
                  {habit.title}
                </h4>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{habit.description}</p>
              </div>

              <div className="pt-3.5 border-t border-gray-100/80 flex items-center justify-between text-sm">
                <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                  {habit.streakDays} Day Streak
                </span>

                <span className="text-xs text-gray-400 font-medium">
                  {habit.completedToday ? 'Completed Today' : 'Tap to Mark Done'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-dashed border-[#CBD5E1] p-12 text-center space-y-4">
          <Sparkles className="w-14 h-14 text-emerald-600/40 mx-auto" />
          <div className="space-y-1.5">
            <h3 className="text-lg sm:text-xl font-bold text-[#0F1D3D]">No Daily Habits Configured Yet</h3>
            <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto leading-relaxed">
              Cultivate preventive health habits (hydration, circadian sunlight, restorative breathing). Load clinically recommended starter routines or create your own custom routine.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-3">
            <button
              onClick={handleAddDefaultHabits}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-xs transition"
            >
              Load Starter Health Routines
            </button>
            <button
              onClick={() => setIsAdding(true)}
              className="px-5 py-3 bg-[#F4F7FC] hover:bg-gray-100 border border-[#E5EAF3] text-[#0F1D3D] text-sm font-bold rounded-xl transition"
            >
              + Create Custom Routine
            </button>
          </div>
        </div>
      )}

      <ReassuranceBar />
    </>
      )}
    </div>
  );
};
