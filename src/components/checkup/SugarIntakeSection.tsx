import React, { useState, useMemo } from 'react';
import {
  Utensils,
  Coffee,
  Sun,
  Sunset,
  Moon,
  Cookie,
  Plus,
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Shield,
  Info,
  Edit2,
  Check,
  RotateCcw,
  Scale,
  Activity,
  Flame,
  PieChart,
  Calendar,
  Lock,
} from 'lucide-react';
import {
  BloodSugarReading,
  DailyDietLog,
  LoggedFoodItem,
  MealType,
  User,
} from '../../types';
import {
  calculateDailyDietTotals,
  estimateSugarFromFoodLog,
  getSugarDiabetesInsight,
  matchSingleFoodItem,
  FOOD_DATABASE,
} from '../../utils/sugarEstimator';

interface SugarIntakeSectionProps {
  currentUser: User | null;
  glucoseReadings: BloodSugarReading[];
  dietLog: DailyDietLog;
  onUpdateDietLog: (updated: DailyDietLog) => void;
  onOpenBloodSugarModal?: () => void;
}

export const SugarIntakeSection: React.FC<SugarIntakeSectionProps> = ({
  currentUser,
  glucoseReadings,
  dietLog,
  onUpdateDietLog,
  onOpenBloodSugarModal,
}) => {
  // Gender-based guideline default (25g for women, 36g for men)
  const defaultTarget = currentUser?.bloodGroup ? 25 : 25; // standard ~25g default
  const targetLimit = dietLog.customLimit || defaultTarget;

  // Meal input states
  const [inputs, setInputs] = useState<Record<MealType, string>>({
    breakfast: '',
    lunch: '',
    dinner: '',
    snacks: '',
  });

  // Custom limit editing
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [tempLimit, setTempLimit] = useState(targetLimit.toString());

  // Quick suggestions for one-click add
  const quickSuggestions: Record<MealType, string[]> = {
    breakfast: ['2 idlis', '1 cup chai', 'Oats bowl', '2 boiled eggs', '1 banana', '2 slices bread'],
    lunch: ['2 rotis', '1 cup white rice', '1 bowl dal', 'Curd cup', 'Mixed veg', 'Paneer curry'],
    dinner: ['2 chapatis', '1 bowl khichdi', '1 bowl salad', '1 cup milk', '1 bowl soup'],
    snacks: ['1 cup chai', '1 apple', '1 samosa', '3 marie biscuits', 'Roasted chana', '1 can soda'],
  };

  // Calculate live daily totals & subtotals
  const { totalSugar, totalCarbs, subtotals } = useMemo(() => {
    return calculateDailyDietTotals(dietLog.meals);
  }, [dietLog.meals]);

  const hasAnyMealsLogged =
    dietLog.meals.breakfast.length > 0 ||
    dietLog.meals.lunch.length > 0 ||
    dietLog.meals.dinner.length > 0 ||
    dietLog.meals.snacks.length > 0;

  // Generate correlated risk-awareness insight
  const insight = useMemo(() => {
    return getSugarDiabetesInsight(
      glucoseReadings,
      totalSugar,
      targetLimit,
      hasAnyMealsLogged
    );
  }, [glucoseReadings, totalSugar, targetLimit, hasAnyMealsLogged]);

  // Percentage of daily limit
  const percentOfLimit = Math.round((totalSugar / targetLimit) * 100);
  const isOverLimit = totalSugar > targetLimit;
  const isNearLimit = totalSugar >= targetLimit * 0.8 && !isOverLimit;

  // Add items from text input (comma-separated or single)
  const handleAddFood = (meal: MealType) => {
    const text = inputs[meal].trim();
    if (!text) return;

    const parsedItems = estimateSugarFromFoodLog(text);
    if (parsedItems.length === 0) return;

    const updatedMeals = {
      ...dietLog.meals,
      [meal]: [...dietLog.meals[meal], ...parsedItems],
    };

    const newTotals = calculateDailyDietTotals(updatedMeals);
    onUpdateDietLog({
      ...dietLog,
      meals: updatedMeals,
      totalSugar: newTotals.totalSugar,
      totalCarbs: newTotals.totalCarbs,
    });

    setInputs((prev) => ({ ...prev, [meal]: '' }));
  };

  // Quick add single suggestion
  const handleQuickAdd = (meal: MealType, foodName: string) => {
    const single = matchSingleFoodItem(foodName);
    const updatedMeals = {
      ...dietLog.meals,
      [meal]: [...dietLog.meals[meal], single],
    };

    const newTotals = calculateDailyDietTotals(updatedMeals);
    onUpdateDietLog({
      ...dietLog,
      meals: updatedMeals,
      totalSugar: newTotals.totalSugar,
      totalCarbs: newTotals.totalCarbs,
    });
  };

  // Remove a food chip
  const handleRemoveItem = (meal: MealType, itemId: string) => {
    const updatedMeals = {
      ...dietLog.meals,
      [meal]: dietLog.meals[meal].filter((item) => item.id !== itemId),
    };

    const newTotals = calculateDailyDietTotals(updatedMeals);
    onUpdateDietLog({
      ...dietLog,
      meals: updatedMeals,
      totalSugar: newTotals.totalSugar,
      totalCarbs: newTotals.totalCarbs,
    });
  };

  // Update sugar grams directly (for custom items or manual overrides)
  const handleUpdateItemSugar = (meal: MealType, itemId: string, newSugar: number) => {
    if (isNaN(newSugar) || newSugar < 0) return;

    const updatedMeals = {
      ...dietLog.meals,
      [meal]: dietLog.meals[meal].map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            sugarGrams: parseFloat(newSugar.toFixed(1)),
          };
        }
        return item;
      }),
    };

    const newTotals = calculateDailyDietTotals(updatedMeals);
    onUpdateDietLog({
      ...dietLog,
      meals: updatedMeals,
      totalSugar: newTotals.totalSugar,
      totalCarbs: newTotals.totalCarbs,
    });
  };

  // Adjust quantity
  const handleQuantityChange = (meal: MealType, itemId: string, delta: number) => {
    const targetItem = dietLog.meals[meal].find((i) => i.id === itemId);
    if (!targetItem) return;

    const newQty = Math.max(1, targetItem.quantity + delta);
    if (newQty === targetItem.quantity) return;

    const ratio = newQty / targetItem.quantity;

    const updatedMeals = {
      ...dietLog.meals,
      [meal]: dietLog.meals[meal].map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: newQty,
            sugarGrams: parseFloat((item.sugarGrams * ratio).toFixed(1)),
            carbsGrams: parseFloat((item.carbsGrams * ratio).toFixed(1)),
            servingText: `${newQty}x portion`,
          };
        }
        return item;
      }),
    };

    const newTotals = calculateDailyDietTotals(updatedMeals);
    onUpdateDietLog({
      ...dietLog,
      meals: updatedMeals,
      totalSugar: newTotals.totalSugar,
      totalCarbs: newTotals.totalCarbs,
    });
  };

  // Clear all meals for today
  const handleClearAll = () => {
    const emptyMeals = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    };
    onUpdateDietLog({
      ...dietLog,
      meals: emptyMeals,
      totalSugar: 0,
      totalCarbs: 0,
    });
  };

  // Load sample day profiles for immediate testing
  const handleLoadSample = (type: 'balanced' | 'high_sugar') => {
    let sampleMeals;
    if (type === 'balanced') {
      sampleMeals = {
        breakfast: [
          matchSingleFoodItem('2 idlis'),
          matchSingleFoodItem('1 cup chai without sugar'),
          matchSingleFoodItem('1 boiled egg'),
        ],
        lunch: [
          matchSingleFoodItem('2 rotis'),
          matchSingleFoodItem('1 bowl dal'),
          matchSingleFoodItem('1 cup curd'),
        ],
        dinner: [
          matchSingleFoodItem('1 bowl moong khichdi'),
          matchSingleFoodItem('1 cup salad'),
        ],
        snacks: [
          matchSingleFoodItem('1 apple'),
          matchSingleFoodItem('Roasted chana'),
        ],
      };
    } else {
      sampleMeals = {
        breakfast: [
          matchSingleFoodItem('1 masala dosa'),
          matchSingleFoodItem('1 cup sweet filter coffee'),
        ],
        lunch: [
          matchSingleFoodItem('1 plate biryani'),
          matchSingleFoodItem('1 glass sweet lassi'),
        ],
        dinner: [
          matchSingleFoodItem('2 butter naan'),
          matchSingleFoodItem('1 bowl paneer butter masala'),
          matchSingleFoodItem('2 gulab jamun'),
        ],
        snacks: [
          matchSingleFoodItem('1 can soda'),
          matchSingleFoodItem('1 samosa'),
        ],
      };
    }

    const totals = calculateDailyDietTotals(sampleMeals);
    onUpdateDietLog({
      ...dietLog,
      meals: sampleMeals,
      totalSugar: totals.totalSugar,
      totalCarbs: totals.totalCarbs,
    });
  };

  const handleSaveLimit = () => {
    const val = parseFloat(tempLimit);
    if (!isNaN(val) && val >= 5 && val <= 150) {
      onUpdateDietLog({
        ...dietLog,
        customLimit: val,
      });
      setIsEditingLimit(false);
    }
  };

  const mealConfigs: Array<{
    key: MealType;
    label: string;
    icon: React.ReactNode;
    color: string;
    placeholder: string;
  }> = [
    {
      key: 'breakfast',
      label: 'Breakfast',
      icon: <Sun className="w-4.5 h-4.5 text-amber-600" />,
      color: 'border-amber-200 bg-amber-50/40',
      placeholder: 'e.g. 2 idlis, chai, 1 banana...',
    },
    {
      key: 'lunch',
      label: 'Lunch',
      icon: <Utensils className="w-4.5 h-4.5 text-emerald-600" />,
      color: 'border-emerald-200 bg-emerald-50/40',
      placeholder: 'e.g. 2 rotis, 1 cup rice, dal, curd...',
    },
    {
      key: 'dinner',
      label: 'Dinner',
      icon: <Moon className="w-4.5 h-4.5 text-indigo-600" />,
      color: 'border-indigo-200 bg-indigo-50/40',
      placeholder: 'e.g. 2 chapatis, khichdi, sabzi...',
    },
    {
      key: 'snacks',
      label: 'Snacks & Beverages',
      icon: <Cookie className="w-4.5 h-4.5 text-purple-600" />,
      color: 'border-purple-200 bg-purple-50/40',
      placeholder: 'e.g. tea with sugar, apple, samosa, biscuit...',
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-[#E5EAF3] p-7 sm:p-8 shadow-sm space-y-7">
      {/* Top Title & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Flame className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Dietary Glycemic Analytics
              </span>
              <span className="text-xs font-bold text-gray-400">Live Intake vs Glucose Trends</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-[#0F1D3D] mt-1 tracking-tight">
              Sugar Intake & Diabetes Risk Insight
            </h3>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {hasAnyMealsLogged && (
            <button
              onClick={handleClearAll}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Today</span>
            </button>
          )}
          <button
            onClick={() => handleLoadSample('balanced')}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition"
          >
            Load Sample Balanced Day
          </button>
          <button
            onClick={() => handleLoadSample('high_sugar')}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-xl border border-rose-200 transition"
          >
            Load High-Sugar Sample
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: DAILY TOTAL & RECOMMENDED LIMIT COMPARISON */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Sugar Card with Progress Ring / Bar */}
        <div
          className={`lg:col-span-2 p-6 sm:p-7 rounded-3xl border transition-all ${
            isOverLimit
              ? 'bg-rose-50/50 border-rose-200'
              : isNearLimit
              ? 'bg-amber-50/50 border-amber-200'
              : 'bg-emerald-50/40 border-emerald-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
                Daily Intake Summary
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${
                    isOverLimit
                      ? 'text-rose-700'
                      : isNearLimit
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {totalSugar}g
                </span>
                <span className="text-base font-bold text-gray-500">
                  / {targetLimit}g recommended
                </span>
              </div>
            </div>

            {/* Target Customizer */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-xs font-bold text-gray-600">
                <span>Daily Target Limit:</span>
                {!isEditingLimit ? (
                  <button
                    onClick={() => setIsEditingLimit(true)}
                    className="text-[#2563EB] hover:underline flex items-center gap-1"
                  >
                    <span>{targetLimit}g</span>
                    <Edit2 className="w-3 h-3" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="5"
                      max="150"
                      value={tempLimit}
                      onChange={(e) => setTempLimit(e.target.value)}
                      className="w-14 p-1 text-center font-bold border rounded-lg text-xs"
                    />
                    <button
                      onClick={handleSaveLimit}
                      className="p-1 bg-emerald-600 text-white rounded-md"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-gray-400">
                Guideline: ~25g/day (Women) • ~36g/day (Men)
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span
                className={
                  isOverLimit
                    ? 'text-rose-700'
                    : isNearLimit
                    ? 'text-amber-700'
                    : 'text-emerald-700'
                }
              >
                {percentOfLimit}% of Daily Sugar Limit
              </span>
              <span className="text-gray-500 font-mono">
                {totalSugar <= targetLimit
                  ? `${(targetLimit - totalSugar).toFixed(1)}g remaining`
                  : `${(totalSugar - targetLimit).toFixed(1)}g over guideline`}
              </span>
            </div>

            <div className="w-full h-3.5 bg-gray-200 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverLimit
                    ? 'bg-rose-600'
                    : isNearLimit
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'
                }`}
                style={{ width: `${Math.min(percentOfLimit, 100)}%` }}
              />
            </div>
          </div>

          {/* Meal Breakdown Pills */}
          <div className="mt-5 pt-4 border-t border-gray-200/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2.5 bg-white rounded-xl border border-gray-100">
              <span className="text-gray-400 block text-[11px]">Breakfast</span>
              <span className="font-bold text-[#0F1D3D] font-mono">{subtotals.breakfast.sugar}g</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-gray-100">
              <span className="text-gray-400 block text-[11px]">Lunch</span>
              <span className="font-bold text-[#0F1D3D] font-mono">{subtotals.lunch.sugar}g</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-gray-100">
              <span className="text-gray-400 block text-[11px]">Dinner</span>
              <span className="font-bold text-[#0F1D3D] font-mono">{subtotals.dinner.sugar}g</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-gray-100">
              <span className="text-gray-400 block text-[11px]">Snacks</span>
              <span className="font-bold text-[#0F1D3D] font-mono">{subtotals.snacks.sugar}g</span>
            </div>
          </div>
        </div>

        {/* Total Carbs & Nutritional Signal Card */}
        <div className="bg-[#F8FAFC] p-6 sm:p-7 rounded-3xl border border-[#E5EAF3] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">
                Glycemic Impact
              </span>
              <PieChart className="w-4.5 h-4.5 text-blue-600" />
            </div>
            <h4 className="text-base font-bold text-[#0F1D3D] mt-1">Total Carbohydrates</h4>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl sm:text-4xl font-black font-mono text-[#0F1D3D]">
                {totalCarbs}g
              </span>
              <span className="text-xs font-bold text-gray-500">approx. net carbs</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Carbohydrates break down into blood glucose. Balancing fiber-rich complex carbs helps
              prevent sharp post-prandial glycemic spikes.
            </p>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-gray-200 text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Added & Natural Sugars:</span>
              <strong className="text-[#0F1D3D] font-mono">{totalSugar}g</strong>
            </div>
            <div className="flex justify-between">
              <span>Complex Starches/Fiber:</span>
              <strong className="text-[#0F1D3D] font-mono">{Math.max(0, parseFloat((totalCarbs - totalSugar).toFixed(1)))}g</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: DAILY DIET LOG INPUT (4 MEAL SECTIONS) */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xl font-extrabold text-[#0F1D3D]">Today's Diet Log</h4>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Type or tap foods to estimate sugar and carbohydrate content (e.g., "2 idlis, chai, banana").
            </p>
          </div>
        </div>

        {/* Empty State Banner if no meals logged */}
        {!hasAnyMealsLogged && (
          <div className="p-5 bg-blue-50/60 rounded-2xl border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-blue-900">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-[#2563EB] shrink-0" />
              <div>
                <p className="text-sm font-bold">
                  No meals logged yet today — add what you've eaten to see your estimated sugar intake.
                </p>
                <p className="text-xs text-blue-700">
                  Select common items below or type in your meal items to calculate real-time totals.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4 Meal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {mealConfigs.map((meal) => {
            const items = dietLog.meals[meal.key];
            const subtotal = subtotals[meal.key];

            return (
              <div
                key={meal.key}
                className={`p-5 rounded-3xl border ${meal.color} bg-white shadow-2xs space-y-4 flex flex-col justify-between`}
              >
                <div className="space-y-3.5">
                  {/* Meal Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center">
                        {meal.icon}
                      </div>
                      <h5 className="font-extrabold text-[#0F1D3D] text-base">{meal.label}</h5>
                    </div>

                    <span className="text-xs font-mono font-bold text-[#0F1D3D] bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                      Subtotal: {subtotal.sugar}g sugar
                    </span>
                  </div>

                  {/* Input Box */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={meal.placeholder}
                      value={inputs[meal.key]}
                      onChange={(e) =>
                        setInputs((prev) => ({ ...prev, [meal.key]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFood(meal.key);
                        }
                      }}
                      className="flex-1 px-3.5 py-2.5 bg-white border border-[#E5EAF3] rounded-xl text-xs sm:text-sm text-[#0F1D3D] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddFood(meal.key)}
                      className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Quick Suggestions Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-gray-400 mr-1">Quick Add:</span>
                    {quickSuggestions[meal.key].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleQuickAdd(meal.key, sug)}
                        className="text-[11px] font-medium px-2 py-1 bg-white hover:bg-blue-50 text-gray-600 hover:text-[#2563EB] rounded-lg border border-gray-200 hover:border-blue-300 transition"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>

                  {/* Logged Food Items Chips */}
                  {items.length > 0 ? (
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 bg-[#F8FAFC] rounded-2xl border border-gray-100 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-[#0F1D3D] truncate">
                                {item.name}
                              </span>
                              {item.isCustom && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                                  Custom
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-400 block truncate">
                              {item.servingText} • {item.carbsGrams}g carbs
                            </span>
                          </div>

                          {/* Editable Sugar Value & Quantity Controls */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Quantity buttons */}
                            <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(meal.key, item.id, -1)}
                                className="px-1.5 py-0.5 hover:bg-gray-100 text-gray-600 font-bold text-xs"
                                title="Decrease portion"
                              >
                                -
                              </button>
                              <span className="px-1.5 text-[11px] font-mono font-bold text-gray-700">
                                {item.quantity}x
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(meal.key, item.id, 1)}
                                className="px-1.5 py-0.5 hover:bg-gray-100 text-gray-600 font-bold text-xs"
                                title="Increase portion"
                              >
                                +
                              </button>
                            </div>

                            {/* Sugar Badge / Input for custom items */}
                            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2 py-1 rounded-lg text-amber-900 font-mono font-bold">
                              {item.isCustom ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    max="150"
                                    value={item.sugarGrams}
                                    onChange={(e) =>
                                      handleUpdateItemSugar(
                                        meal.key,
                                        item.id,
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-11 text-center bg-white border border-amber-300 rounded px-0.5 py-0.2 text-[11px] font-bold"
                                    title="Edit sugar grams"
                                  />
                                  <span className="text-[10px]">g</span>
                                </div>
                              ) : (
                                <span>{item.sugarGrams}g</span>
                              )}
                            </div>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(meal.key, item.id)}
                              className="p-1 text-gray-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition"
                              title="Remove item"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic text-center py-2">
                      No items logged in this meal yet.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: CORRELATE WITH HISTORICAL GLUCOSE READINGS & INSIGHT PANEL */}
      {/* ========================================================================= */}
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h4 className="text-xl font-extrabold text-[#0F1D3D]">
              Historical Glucose & Diet Correlation
            </h4>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Cross-referencing your recent blood sugar readings with dietary sugar consumption.
            </p>
          </div>

          {onOpenBloodSugarModal && (
            <button
              onClick={onOpenBloodSugarModal}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Glucose Reading</span>
            </button>
          )}
        </div>

        {/* Glucose Trend Table */}
        <div className="bg-[#F8FAFC] rounded-3xl border border-[#E5EAF3] p-5 sm:p-6 overflow-hidden space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-gray-600 pb-2 border-b border-gray-200">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-rose-600" />
              Last {Math.min(glucoseReadings.length, 7)} Saved Glucose Readings
            </span>
            <span className="text-gray-400 font-mono">Reference Signal</span>
          </div>

          {glucoseReadings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-200 text-[11px] uppercase">
                    <th className="py-2 font-bold">Date & Time</th>
                    <th className="py-2 font-bold">Test Condition</th>
                    <th className="py-2 font-bold">Measured Value</th>
                    <th className="py-2 font-bold">Status</th>
                    <th className="py-2 font-bold">Diet Sugar Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {glucoseReadings.slice(0, 5).map((reading, idx) => (
                    <tr key={reading.id} className="hover:bg-white/60 transition">
                      <td className="py-2.5 text-[#0F1D3D] font-bold">
                        {reading.date} <span className="text-gray-400 font-normal">at {reading.time}</span>
                      </td>
                      <td className="py-2.5 capitalize text-gray-600">
                        {reading.testType.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 font-mono font-bold text-[#0F1D3D]">
                        {reading.value} {reading.unit}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            reading.status === 'normal'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : reading.status === 'elevated'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : reading.status === 'high'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {reading.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-500">
                        {idx === 0
                          ? `Today: ${totalSugar}g logged`
                          : 'Logged in session history'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
              No saved blood sugar readings found. Log readings in the Blood Sugar card above to
              populate trend insights.
            </div>
          )}
        </div>

        {/* Lightweight Non-Diagnostic Risk-Awareness Insight Panel */}
        <div
          className={`p-6 sm:p-7 rounded-3xl border transition-all space-y-4 ${
            insight.level === 'caution'
              ? 'bg-gradient-to-br from-[#FFF5F5] to-[#FFF0F0] border-rose-200 shadow-sm'
              : insight.level === 'advisory'
              ? 'bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7]/40 border-amber-200 shadow-sm'
              : insight.level === 'optimal'
              ? 'bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7]/40 border-emerald-200 shadow-sm'
              : 'bg-gradient-to-br from-[#F8FAFC] to-[#EFF6FF]/40 border-blue-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              {insight.level === 'caution' ? (
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              ) : insight.level === 'optimal' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : (
                <Sparkles className="w-6 h-6 text-amber-600" />
              )}
              <h5 className="text-lg font-black text-[#0F1D3D]">{insight.title}</h5>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                insight.level === 'caution'
                  ? 'bg-rose-100 text-rose-800'
                  : insight.level === 'optimal'
                  ? 'bg-emerald-100 text-emerald-800'
                  : insight.level === 'advisory'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {insight.badge}
            </span>
          </div>

          <p className="text-sm sm:text-base text-gray-700 leading-relaxed font-medium">
            {insight.message}
          </p>

          <div className="p-3.5 bg-white/80 backdrop-blur-xs rounded-2xl border border-gray-200/80 space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 block">
              Suggested Dietary Guidance & Habit
            </span>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {insight.recommendedAction}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: MANDATORY DISCLAIMER */}
      {/* ========================================================================= */}
      <div className="p-4.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-start gap-3.5 text-gray-600 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-gray-200/80 text-gray-700 flex items-center justify-center shrink-0 mt-0.5">
          <Lock className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-[#0F1D3D]">Health & Diagnostic Disclaimer</p>
          <p className="text-xs leading-relaxed text-gray-600">
            This tool provides general awareness based on your logged food and readings. It is not a
            medical diagnosis. Please consult a doctor or certified dietitian for a proper
            evaluation of your blood sugar health.
          </p>
        </div>
      </div>
    </div>
  );
};
