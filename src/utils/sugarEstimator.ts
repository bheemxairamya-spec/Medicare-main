import {
  BloodPressureReading,
  BloodSugarReading,
  BloodSugarTestType,
  FoodDatabaseItem,
  GlucoseStatus,
  LoggedFoodItem,
  MealType,
  SugarRiskInsight,
} from '../types';

// =========================================================================
// COMPREHENSIVE FOOD DATABASE (50+ COMMON FOODS WITH REALISTIC VALUES)
// =========================================================================

export const FOOD_DATABASE: FoodDatabaseItem[] = [
  // --- Rice & Grains ---
  {
    id: 'food-white-rice',
    name: 'Cooked White Rice',
    aliases: ['rice', 'white rice', 'cooked rice', 'chawal', 'steamed rice'],
    category: 'rice_grains',
    servingSize: '1 cup (158g)',
    sugarGrams: 0.1,
    carbsGrams: 45,
    calories: 205,
  },
  {
    id: 'food-brown-rice',
    name: 'Brown Rice',
    aliases: ['brown rice', 'unpolished rice'],
    category: 'rice_grains',
    servingSize: '1 cup (195g)',
    sugarGrams: 0.7,
    carbsGrams: 45.8,
    calories: 218,
  },
  {
    id: 'food-idli',
    name: 'Idli (Steamed Rice Cakes)',
    aliases: ['idli', 'idlis', 'steamed idli', 'rava idli'],
    category: 'rice_grains',
    servingSize: '2 medium pcs (100g)',
    sugarGrams: 0.8,
    carbsGrams: 24,
    calories: 130,
  },
  {
    id: 'food-dosa',
    name: 'Plain Dosa',
    aliases: ['dosa', 'plain dosa', 'sada dosa'],
    category: 'rice_grains',
    servingSize: '1 medium pc (80g)',
    sugarGrams: 1.2,
    carbsGrams: 28,
    calories: 168,
  },
  {
    id: 'food-masala-dosa',
    name: 'Masala Dosa with Potato',
    aliases: ['masala dosa', 'aloo dosa'],
    category: 'rice_grains',
    servingSize: '1 large pc (150g)',
    sugarGrams: 2.5,
    carbsGrams: 42,
    calories: 285,
  },
  {
    id: 'food-biryani',
    name: 'Vegetable / Chicken Biryani',
    aliases: ['biryani', 'veg biryani', 'chicken biryani', 'mutton biryani'],
    category: 'rice_grains',
    servingSize: '1 plate (250g)',
    sugarGrams: 3.2,
    carbsGrams: 58,
    calories: 390,
  },
  {
    id: 'food-poha',
    name: 'Poha (Flattened Rice)',
    aliases: ['poha', 'flattened rice', 'kanda poha', 'aval'],
    category: 'rice_grains',
    servingSize: '1 medium bowl (150g)',
    sugarGrams: 1.5,
    carbsGrams: 36,
    calories: 210,
  },
  {
    id: 'food-upma',
    name: 'Rava Upma',
    aliases: ['upma', 'rava upma', 'sooji upma'],
    category: 'rice_grains',
    servingSize: '1 medium bowl (150g)',
    sugarGrams: 2.0,
    carbsGrams: 32,
    calories: 220,
  },
  {
    id: 'food-khichdi',
    name: 'Moong Dal Khichdi',
    aliases: ['khichdi', 'khichri', 'dal khichdi'],
    category: 'rice_grains',
    servingSize: '1 medium bowl (200g)',
    sugarGrams: 1.0,
    carbsGrams: 38,
    calories: 230,
  },
  {
    id: 'food-oats',
    name: 'Rolled Oats / Porridge',
    aliases: ['oats', 'oatmeal', 'porridge', 'rolled oats'],
    category: 'rice_grains',
    servingSize: '1 bowl cooked (234g)',
    sugarGrams: 1.1,
    carbsGrams: 28,
    calories: 160,
  },

  // --- Bread & Roti ---
  {
    id: 'food-roti',
    name: 'Whole Wheat Roti / Chapati',
    aliases: ['roti', 'rotis', 'chapati', 'chapatis', 'phulka', 'phulkas', 'chapatti'],
    category: 'bread_roti',
    servingSize: '2 medium pcs (60g)',
    sugarGrams: 0.6,
    carbsGrams: 30,
    calories: 180,
  },
  {
    id: 'food-paratha',
    name: 'Plain Wheat Paratha',
    aliases: ['paratha', 'plain paratha', 'parantha'],
    category: 'bread_roti',
    servingSize: '1 medium pc (75g)',
    sugarGrams: 1.4,
    carbsGrams: 29,
    calories: 240,
  },
  {
    id: 'food-aloo-paratha',
    name: 'Aloo Paratha (Stuffed)',
    aliases: ['aloo paratha', 'potato paratha', 'aloo parantha'],
    category: 'bread_roti',
    servingSize: '1 large pc (120g)',
    sugarGrams: 2.8,
    carbsGrams: 44,
    calories: 310,
  },
  {
    id: 'food-white-bread',
    name: 'White Bread Slices',
    aliases: ['white bread', 'toast', 'bread slice', 'white toast'],
    category: 'bread_roti',
    servingSize: '2 slices (50g)',
    sugarGrams: 3.4,
    carbsGrams: 26,
    calories: 140,
  },
  {
    id: 'food-whole-wheat-bread',
    name: 'Whole Wheat / Multigrain Bread',
    aliases: ['brown bread', 'whole wheat bread', 'multigrain bread'],
    category: 'bread_roti',
    servingSize: '2 slices (56g)',
    sugarGrams: 2.0,
    carbsGrams: 24,
    calories: 135,
  },
  {
    id: 'food-naan',
    name: 'Butter Naan / Tandoori Roti',
    aliases: ['naan', 'butter naan', 'garlic naan', 'tandoori roti'],
    category: 'bread_roti',
    servingSize: '1 piece (90g)',
    sugarGrams: 3.2,
    carbsGrams: 46,
    calories: 260,
  },
  {
    id: 'food-puri',
    name: 'Fried Puri / Poori',
    aliases: ['puri', 'poori', 'puris'],
    category: 'bread_roti',
    servingSize: '2 small pcs (60g)',
    sugarGrams: 0.8,
    carbsGrams: 24,
    calories: 210,
  },

  // --- Fruits ---
  {
    id: 'food-apple',
    name: 'Fresh Apple',
    aliases: ['apple', 'apples', 'red apple', 'green apple'],
    category: 'fruits',
    servingSize: '1 medium fruit (182g)',
    sugarGrams: 19.0,
    carbsGrams: 25.1,
    calories: 95,
  },
  {
    id: 'food-banana',
    name: 'Ripe Banana',
    aliases: ['banana', 'bananas', 'kela'],
    category: 'fruits',
    servingSize: '1 medium fruit (118g)',
    sugarGrams: 14.4,
    carbsGrams: 27.0,
    calories: 105,
  },
  {
    id: 'food-mango',
    name: 'Fresh Mango Slices',
    aliases: ['mango', 'mangoes', 'aam', 'alphonso'],
    category: 'fruits',
    servingSize: '1 cup sliced (165g)',
    sugarGrams: 22.5,
    carbsGrams: 24.7,
    calories: 99,
  },
  {
    id: 'food-orange',
    name: 'Fresh Orange',
    aliases: ['orange', 'oranges', 'santra', 'tangerine'],
    category: 'fruits',
    servingSize: '1 medium fruit (131g)',
    sugarGrams: 12.2,
    carbsGrams: 15.4,
    calories: 62,
  },
  {
    id: 'food-papaya',
    name: 'Ripe Papaya Cubes',
    aliases: ['papaya', 'papita'],
    category: 'fruits',
    servingSize: '1 cup cubed (145g)',
    sugarGrams: 11.3,
    carbsGrams: 15.7,
    calories: 62,
  },
  {
    id: 'food-grapes',
    name: 'Fresh Table Grapes',
    aliases: ['grapes', 'grape', 'angoor', 'black grapes', 'green grapes'],
    category: 'fruits',
    servingSize: '1 cup (151g)',
    sugarGrams: 23.2,
    carbsGrams: 27.3,
    calories: 104,
  },
  {
    id: 'food-watermelon',
    name: 'Fresh Watermelon Slice',
    aliases: ['watermelon', 'tarbooz'],
    category: 'fruits',
    servingSize: '1 wedge / 1 cup (152g)',
    sugarGrams: 9.4,
    carbsGrams: 11.5,
    calories: 46,
  },
  {
    id: 'food-guava',
    name: 'Fresh Guava',
    aliases: ['guava', 'amrood'],
    category: 'fruits',
    servingSize: '1 medium fruit (100g)',
    sugarGrams: 4.9,
    carbsGrams: 8.9,
    calories: 68,
  },
  {
    id: 'food-dates',
    name: 'Medjool Dates',
    aliases: ['dates', 'date', 'khajoor', 'medjool dates'],
    category: 'fruits',
    servingSize: '2 whole dates (48g)',
    sugarGrams: 16.0,
    carbsGrams: 18.0,
    calories: 133,
  },

  // --- Dairy & Sweets ---
  {
    id: 'food-milk',
    name: 'Whole / Cow Milk (Unsweetened)',
    aliases: ['milk', 'cow milk', 'whole milk', 'glass of milk', 'doodh'],
    category: 'dairy_sweets',
    servingSize: '1 glass (240ml)',
    sugarGrams: 12.0, // Naturally occurring lactose
    carbsGrams: 12.0,
    calories: 149,
  },
  {
    id: 'food-curd',
    name: 'Plain Curd / Plain Yogurt',
    aliases: ['curd', 'dahi', 'plain yogurt', 'yogurt', 'greek yogurt'],
    category: 'dairy_sweets',
    servingSize: '1 cup (200g)',
    sugarGrams: 5.2,
    carbsGrams: 8.0,
    calories: 120,
  },
  {
    id: 'food-sweet-lassi',
    name: 'Sweet Lassi (Traditional)',
    aliases: ['lassi', 'sweet lassi', 'mango lassi'],
    category: 'dairy_sweets',
    servingSize: '1 tall glass (300ml)',
    sugarGrams: 28.5,
    carbsGrams: 36.0,
    calories: 240,
  },
  {
    id: 'food-gulab-jamun',
    name: 'Gulab Jamun in Sugar Syrup',
    aliases: ['gulab jamun', 'jamun', 'gulabjamun'],
    category: 'dairy_sweets',
    servingSize: '2 pieces (100g)',
    sugarGrams: 34.0,
    carbsGrams: 44.0,
    calories: 320,
  },
  {
    id: 'food-rasgulla',
    name: 'Rasgulla (Syrup Soaked Cottage Cheese)',
    aliases: ['rasgulla', 'roshogolla'],
    category: 'dairy_sweets',
    servingSize: '2 pieces (100g)',
    sugarGrams: 26.0,
    carbsGrams: 34.0,
    calories: 250,
  },
  {
    id: 'food-jalebi',
    name: 'Crispy Sweet Jalebi',
    aliases: ['jalebi', 'imarti'],
    category: 'dairy_sweets',
    servingSize: '2-3 pcs (75g)',
    sugarGrams: 29.0,
    carbsGrams: 42.0,
    calories: 300,
  },
  {
    id: 'food-kheer',
    name: 'Rice Kheer / Payasam',
    aliases: ['kheer', 'payasam', 'rice pudding'],
    category: 'dairy_sweets',
    servingSize: '1 small bowl (150g)',
    sugarGrams: 22.0,
    carbsGrams: 32.0,
    calories: 235,
  },
  {
    id: 'food-ice-cream',
    name: 'Vanilla / Chocolate Ice Cream',
    aliases: ['ice cream', 'icecream', 'vanilla ice cream', 'gelato'],
    category: 'dairy_sweets',
    servingSize: '1 scoop (72g)',
    sugarGrams: 14.0,
    carbsGrams: 16.0,
    calories: 140,
  },
  {
    id: 'food-milk-chocolate',
    name: 'Milk Chocolate Bar',
    aliases: ['chocolate', 'milk chocolate', 'cadbury', 'chocolate bar'],
    category: 'dairy_sweets',
    servingSize: '1 standard bar (45g)',
    sugarGrams: 24.0,
    carbsGrams: 27.0,
    calories: 235,
  },
  {
    id: 'food-dark-chocolate',
    name: 'Dark Chocolate (70%+ Cocoa)',
    aliases: ['dark chocolate', '70% dark chocolate'],
    category: 'dairy_sweets',
    servingSize: '2 squares (20g)',
    sugarGrams: 4.8,
    carbsGrams: 9.0,
    calories: 120,
  },

  // --- Beverages ---
  {
    id: 'food-chai-sugar',
    name: 'Masala Chai with Sugar',
    aliases: ['chai', 'tea', 'masala chai', 'milk tea', 'sweet tea', 'chai with sugar', 'tea with sugar'],
    category: 'beverages',
    servingSize: '1 teacup (150ml)',
    sugarGrams: 8.5,
    carbsGrams: 9.5,
    calories: 75,
  },
  {
    id: 'food-chai-no-sugar',
    name: 'Masala Chai (No Added Sugar)',
    aliases: ['sugarless chai', 'tea without sugar', 'sugar free tea', 'black chai'],
    category: 'beverages',
    servingSize: '1 teacup (150ml)',
    sugarGrams: 2.8, // milk only
    carbsGrams: 3.5,
    calories: 40,
  },
  {
    id: 'food-coffee-sugar',
    name: 'Filter Coffee with Sugar & Milk',
    aliases: ['coffee', 'filter coffee', 'latte', 'cappuccino', 'sweet coffee', 'coffee with sugar'],
    category: 'beverages',
    servingSize: '1 cup (180ml)',
    sugarGrams: 9.5,
    carbsGrams: 11.0,
    calories: 85,
  },
  {
    id: 'food-black-coffee',
    name: 'Black Coffee / Green Tea (Unsweetened)',
    aliases: ['black coffee', 'espresso', 'green tea', 'black tea', 'americano'],
    category: 'beverages',
    servingSize: '1 cup (200ml)',
    sugarGrams: 0.0,
    carbsGrams: 0.2,
    calories: 2,
  },
  {
    id: 'food-soda-coke',
    name: 'Carbonated Soda / Cola (Regular)',
    aliases: ['soda', 'coke', 'cola', 'pepsi', 'sprite', 'fanta', 'soft drink'],
    category: 'beverages',
    servingSize: '1 can (330ml)',
    sugarGrams: 35.0,
    carbsGrams: 35.0,
    calories: 140,
  },
  {
    id: 'food-energy-drink',
    name: 'Caffeinated Energy Drink',
    aliases: ['energy drink', 'red bull', 'monster'],
    category: 'beverages',
    servingSize: '1 can (250ml)',
    sugarGrams: 27.0,
    carbsGrams: 28.0,
    calories: 110,
  },
  {
    id: 'food-fresh-orange-juice',
    name: 'Fresh Squeezed Orange Juice',
    aliases: ['orange juice', 'fresh juice', 'oj', 'mosambi juice'],
    category: 'beverages',
    servingSize: '1 glass (250ml)',
    sugarGrams: 21.0,
    carbsGrams: 26.0,
    calories: 112,
  },
  {
    id: 'food-packaged-fruit-juice',
    name: 'Packaged / Sweetened Fruit Juice',
    aliases: ['packaged juice', 'apple juice', 'mango juice', 'real juice', 'tropicana'],
    category: 'beverages',
    servingSize: '1 glass (250ml)',
    sugarGrams: 28.0,
    carbsGrams: 30.0,
    calories: 130,
  },
  {
    id: 'food-coconut-water',
    name: 'Fresh Tender Coconut Water',
    aliases: ['coconut water', 'nariyal pani', 'tender coconut'],
    category: 'beverages',
    servingSize: '1 glass (240ml)',
    sugarGrams: 6.2,
    carbsGrams: 8.9,
    calories: 45,
  },
  {
    id: 'food-lemonade',
    name: 'Sweet Lemonade / Nimbu Pani / Shikanji',
    aliases: ['lemonade', 'nimbu pani', 'shikanji', 'sweet lime soda'],
    category: 'beverages',
    servingSize: '1 glass (250ml)',
    sugarGrams: 16.5,
    carbsGrams: 18.0,
    calories: 78,
  },

  // --- Snacks & Meals ---
  {
    id: 'food-samosa',
    name: 'Potato Samosa',
    aliases: ['samosa', 'samosas', 'veg samosa'],
    category: 'snacks_meals',
    servingSize: '1 piece (80g)',
    sugarGrams: 1.8,
    carbsGrams: 24.0,
    calories: 260,
  },
  {
    id: 'food-pakora',
    name: 'Vegetable Pakora / Fritters',
    aliases: ['pakora', 'pakoras', 'bhajiya', 'onion pakoda'],
    category: 'snacks_meals',
    servingSize: '4 pieces (100g)',
    sugarGrams: 1.2,
    carbsGrams: 19.0,
    calories: 280,
  },
  {
    id: 'food-biscuits',
    name: 'Sweet Cream / Glucose Biscuits',
    aliases: ['biscuit', 'biscuits', 'cookies', 'parle g', 'good day', 'bourbon'],
    category: 'snacks_meals',
    servingSize: '3 biscuits (40g)',
    sugarGrams: 11.0,
    carbsGrams: 28.0,
    calories: 180,
  },
  {
    id: 'food-marie-biscuit',
    name: 'Marie / Tea Biscuits (Light)',
    aliases: ['marie biscuit', 'marie biscuits', 'digestive biscuit'],
    category: 'snacks_meals',
    servingSize: '3 biscuits (30g)',
    sugarGrams: 4.5,
    carbsGrams: 21.0,
    calories: 125,
  },
  {
    id: 'food-dal',
    name: 'Cooked Yellow Tadka Dal',
    aliases: ['dal', 'daal', 'tadka dal', 'sambar', 'lentil soup'],
    category: 'snacks_meals',
    servingSize: '1 bowl (180g)',
    sugarGrams: 1.4,
    carbsGrams: 22.0,
    calories: 160,
  },
  {
    id: 'food-paneer-curry',
    name: 'Paneer Butter Masala / Palak Paneer',
    aliases: ['paneer', 'paneer butter masala', 'palak paneer', 'shahi paneer'],
    category: 'snacks_meals',
    servingSize: '1 bowl (200g)',
    sugarGrams: 3.8,
    carbsGrams: 9.5,
    calories: 310,
  },
  {
    id: 'food-mixed-veg',
    name: 'Mixed Vegetable Sabzi',
    aliases: ['sabzi', 'mixed veg', 'aloo gobi', 'bhindi', 'vegetables'],
    category: 'snacks_meals',
    servingSize: '1 bowl (150g)',
    sugarGrams: 4.2,
    carbsGrams: 14.0,
    calories: 130,
  },
  {
    id: 'food-boiled-egg',
    name: 'Boiled / Scrambled Eggs',
    aliases: ['egg', 'eggs', 'boiled egg', 'boiled eggs', 'omelette', 'scrambled eggs'],
    category: 'snacks_meals',
    servingSize: '2 whole eggs (100g)',
    sugarGrams: 0.6,
    carbsGrams: 1.2,
    calories: 155,
  },
  {
    id: 'food-fries',
    name: 'French Fries (Fast Food)',
    aliases: ['french fries', 'fries', 'potato fries'],
    category: 'snacks_meals',
    servingSize: '1 medium pack (117g)',
    sugarGrams: 0.4,
    carbsGrams: 44.0,
    calories: 365,
  },
  {
    id: 'food-pizza',
    name: 'Pizza (Cheese & Veggie Slice)',
    aliases: ['pizza', 'pizza slice'],
    category: 'snacks_meals',
    servingSize: '1 regular slice (107g)',
    sugarGrams: 3.6,
    carbsGrams: 32.0,
    calories: 270,
  },
  {
    id: 'food-burger',
    name: 'Veg / Chicken Burger',
    aliases: ['burger', 'veggie burger', 'chicken burger'],
    category: 'snacks_meals',
    servingSize: '1 regular burger (180g)',
    sugarGrams: 5.5,
    carbsGrams: 40.0,
    calories: 380,
  },
  {
    id: 'food-namkeen',
    name: 'Namkeen / Roasted Mixture',
    aliases: ['namkeen', 'mixture', 'bhujia', 'sev'],
    category: 'snacks_meals',
    servingSize: '1 small cup (40g)',
    sugarGrams: 0.9,
    carbsGrams: 18.0,
    calories: 210,
  },
  {
    id: 'food-peanuts',
    name: 'Roasted Peanuts / Roasted Chana',
    aliases: ['peanuts', 'roasted chana', 'chana', 'nuts', 'almonds'],
    category: 'snacks_meals',
    servingSize: '1 handful (35g)',
    sugarGrams: 1.2,
    carbsGrams: 7.5,
    calories: 190,
  },
];

// =========================================================================
// PARSING & ESTIMATION UTILITIES
// =========================================================================

/**
 * Parses raw text input (e.g., "2 idlis, chai, banana, 1 gulab jamun") into structured food chips.
 */
export function estimateSugarFromFoodLog(rawInput: string): LoggedFoodItem[] {
  if (!rawInput || !rawInput.trim()) return [];

  // Split by comma or semicolon or newline
  const segments = rawInput
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const results: LoggedFoodItem[] = [];

  for (const segment of segments) {
    const parsed = matchSingleFoodItem(segment);
    if (parsed) {
      results.push(parsed);
    }
  }

  return results;
}

/**
 * Matches a single token or item string against our food database with quantity detection.
 */
export function matchSingleFoodItem(text: string): LoggedFoodItem {
  const clean = text.toLowerCase().trim();
  if (!clean) {
    return {
      id: 'custom-' + Date.now(),
      name: 'Custom Food Item',
      quantity: 1,
      servingText: '1 custom serving',
      sugarGrams: 5,
      carbsGrams: 15,
      isCustom: true,
    };
  }

  // 1. Detect quantity prefix e.g. "2 idlis", "1.5 cup rice", "3 x banana", "2 cups of tea"
  let quantity = 1;
  let foodQuery = clean;

  const qtyMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:x|pcs|pieces|cups|cup|glasses|glass|slices|slice|bowls|bowl|servings|serving|nos)?\s*(?:of)?\s+(.+)$/i);
  if (qtyMatch) {
    const parsedQty = parseFloat(qtyMatch[1]);
    if (!isNaN(parsedQty) && parsedQty > 0 && parsedQty <= 20) {
      quantity = parsedQty;
      foodQuery = qtyMatch[2].trim();
    }
  }

  // Normalize food query (remove extra words like "a", "an", "fresh", "hot", "some")
  const strippedQuery = foodQuery.replace(/^(a|an|some|hot|fresh|sweet|cooked|diet|plate of|cup of|glass of)\s+/i, '').trim();

  // 2. Exact or Alias search in FOOD_DATABASE
  let matchedDbItem = FOOD_DATABASE.find((item) => {
    if (item.name.toLowerCase() === foodQuery || item.name.toLowerCase() === strippedQuery) return true;
    return item.aliases.some((alias) => alias.toLowerCase() === foodQuery || alias.toLowerCase() === strippedQuery);
  });

  // 3. Substring / Token matching if no exact alias found
  if (!matchedDbItem) {
    matchedDbItem = FOOD_DATABASE.find((item) => {
      return item.aliases.some((alias) => {
        const words = alias.toLowerCase().split(/\s+/);
        return words.some((w) => w.length > 2 && foodQuery.includes(w));
      });
    });
  }

  if (matchedDbItem) {
    const totalSugar = parseFloat((matchedDbItem.sugarGrams * quantity).toFixed(1));
    const totalCarbs = parseFloat((matchedDbItem.carbsGrams * quantity).toFixed(1));
    return {
      id: `${matchedDbItem.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: matchedDbItem.name,
      quantity,
      servingText: quantity > 1 ? `${quantity}x ${matchedDbItem.servingSize}` : matchedDbItem.servingSize,
      sugarGrams: totalSugar,
      carbsGrams: totalCarbs,
      isCustom: false,
    };
  }

  // 4. Fallback for unrecognized item: user can manually edit estimated sugar value
  // Capitalize name
  const formattedName = text
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: formattedName,
    quantity: 1,
    servingText: '1 custom serving (approx)',
    sugarGrams: 4.0, // Default sensible estimate
    carbsGrams: 15.0,
    isCustom: true,
  };
}

/**
 * Computes daily totals from all 4 meals
 */
export function calculateDailyDietTotals(meals: {
  breakfast: LoggedFoodItem[];
  lunch: LoggedFoodItem[];
  dinner: LoggedFoodItem[];
  snacks: LoggedFoodItem[];
}): {
  totalSugar: number;
  totalCarbs: number;
  subtotals: Record<MealType, { sugar: number; carbs: number }>;
} {
  const subtotals: Record<MealType, { sugar: number; carbs: number }> = {
    breakfast: { sugar: 0, carbs: 0 },
    lunch: { sugar: 0, carbs: 0 },
    dinner: { sugar: 0, carbs: 0 },
    snacks: { sugar: 0, carbs: 0 },
  };

  let totalSugar = 0;
  let totalCarbs = 0;

  (Object.keys(meals) as MealType[]).forEach((mealKey) => {
    const items = meals[mealKey] || [];
    let mealSugar = 0;
    let mealCarbs = 0;

    items.forEach((item) => {
      mealSugar += item.sugarGrams || 0;
      mealCarbs += item.carbsGrams || 0;
    });

    subtotals[mealKey] = {
      sugar: parseFloat(mealSugar.toFixed(1)),
      carbs: parseFloat(mealCarbs.toFixed(1)),
    };

    totalSugar += mealSugar;
    totalCarbs += mealCarbs;
  });

  return {
    totalSugar: parseFloat(totalSugar.toFixed(1)),
    totalCarbs: parseFloat(totalCarbs.toFixed(1)),
    subtotals,
  };
}

// =========================================================================
// GLUCOSE CLASSIFICATION & DIABETES RISK INSIGHT ENGINE
// =========================================================================

export function classifyGlucose(value: number, testType: BloodSugarTestType): GlucoseStatus {
  if (testType === 'hba1c') {
    if (value < 5.7) return 'normal';
    if (value <= 6.4) return 'elevated';
    return 'high';
  }

  if (testType === 'fasting') {
    if (value < 70) return 'low';
    if (value <= 99) return 'normal';
    if (value <= 125) return 'elevated';
    return 'high';
  }

  // Post-Prandial or Random
  if (value < 70) return 'low';
  if (value < 140) return 'normal';
  if (value <= 199) return 'elevated';
  return 'high';
}

/**
 * Synthesizes logged diet sugar intake with saved historical glucose readings.
 * Adheres strictly to observational, non-diagnostic phrasing.
 */
export function getSugarDiabetesInsight(
  glucoseReadings: BloodSugarReading[],
  totalSugarGrams: number,
  recommendedLimitGrams: number,
  hasLoggedMeals: boolean
): SugarRiskInsight {
  // Case A: Insufficient glucose readings
  if (!glucoseReadings || glucoseReadings.length < 2) {
    return {
      level: 'neutral',
      title: 'Awaiting Glucose Baseline',
      badge: 'Data Gathering',
      message:
        'Log a few blood sugar readings to unlock personalized insight based on your trends.',
      recommendedAction:
        'Record at least 2 blood sugar readings (Fasting or Post-Meal) to enable cross-referenced correlation with your daily diet logs.',
    };
  }

  // Analyze recent trend (last 5-7 readings)
  const recentReadings = glucoseReadings.slice(0, 7);
  const elevatedOrHighCount = recentReadings.filter(
    (r) => r.status === 'elevated' || r.status === 'high'
  ).length;
  const isTrendElevated = elevatedOrHighCount >= Math.ceil(recentReadings.length / 2);
  const isOverSugarLimit = totalSugarGrams > recommendedLimitGrams;
  const isNearSugarLimit = totalSugarGrams >= recommendedLimitGrams * 0.85 && !isOverSugarLimit;

  // Case B: If no meals logged today yet
  if (!hasLoggedMeals || totalSugarGrams === 0) {
    return {
      level: 'neutral',
      title: 'Diet Log Incomplete for Today',
      badge: 'Daily Log Needed',
      message:
        'No meals logged yet today — add what you have eaten to see your estimated sugar intake correlated with your recent glucose readings.',
      recommendedAction:
        'Add breakfast, lunch, snacks, or beverages consumed today to compute your daily sugar progress.',
    };
  }

  // Case C: Elevated/High Glucose AND Over Sugar Limit (Caution)
  if (isTrendElevated && isOverSugarLimit) {
    return {
      level: 'caution',
      title: 'Elevated Glucose Trend & High Sugar Intake',
      badge: 'Attention Advised',
      message:
        'Your recent glucose readings have been elevated and today\'s sugar intake is above the recommended limit. Consider reducing high-sugar foods and consult your doctor for personalized guidance.',
      recommendedAction:
        'Opt for high-fiber, low-glycemic foods (such as whole grains, greens, and unsweetened beverages) and schedule a check-in with your healthcare team.',
    };
  }

  // Case D: Elevated Glucose BUT Sugar Intake is Within Limit (Advisory / Encouraging)
  if (isTrendElevated && !isOverSugarLimit) {
    return {
      level: 'advisory',
      title: 'Elevated Glucose Trend • Good Diet Control Today',
      badge: 'Moderate Awareness',
      message:
        'Your recent glucose readings have shown elevated tendencies, but today\'s sugar intake is within your recommended guideline. Maintaining lower dietary sugar helps stabilize glycemic balance.',
      recommendedAction:
        'Continue prioritizing complex carbohydrates and lean proteins. Keep tracking your fasting and post-meal glucose to monitor improvements.',
    };
  }

  // Case E: Normal Glucose Readings BUT Sugar Intake is Over Limit (Advisory)
  if (!isTrendElevated && isOverSugarLimit) {
    return {
      level: 'advisory',
      title: 'Normal Glucose Readings • Sugar Intake Over Limit',
      badge: 'Dietary Alert',
      message:
        'Your recent glucose readings are in the normal range, but today\'s estimated sugar intake exceeds the recommended daily limit. Moderating sweet foods and sugary beverages helps preserve long-term metabolic health.',
      recommendedAction:
        'Replace sweetened drinks or desserts with fresh whole fruit or infused water to stay within your daily target.',
    };
  }

  // Case F: Normal Glucose Readings AND Within Sugar Limit (Optimal)
  return {
    level: 'optimal',
    title: 'Optimal Glycemic & Sugar Alignment',
    badge: 'On Track',
    message:
      'Your recent readings are in the normal range and today\'s sugar intake is within the recommended limit. Keep it up.',
    recommendedAction:
      'Maintain your balanced meal portions, regular physical activity, and consistent vital tracking.',
  };
}

// =========================================================================
// PRE-SEEDED SAMPLE DATA FOR IMMEDIATE INTERACTIVE TESTING
// =========================================================================

export const INITIAL_MOCK_GLUCOSE_READINGS: BloodSugarReading[] = [];

export const INITIAL_MOCK_BP_READINGS: BloodPressureReading[] = [];
