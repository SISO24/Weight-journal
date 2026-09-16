// indianFoods.js — a curated calorie database for common Indian dishes,
// logged the way people actually eat them (per roti, per katori, per piece)
// instead of forcing everyone to weigh food on a kitchen scale.
//
// Values are per 100g of the prepared dish (typical home-style recipe) plus
// a realistic default serving size, so picking "1 medium roti" auto-fills a
// sensible gram amount that you can still edit if your recipe differs.
// Oil/ghee quantity varies a lot between kitchens — treat these as solid
// estimates, not lab-precise numbers.

const INDIAN_FOODS = [
  // Breads
  { name: 'Roti / Chapati (whole wheat)', aliases: ['chapati','phulka'], unitLabel: '1 medium roti', unitGrams: 40, kcalPer100g: 297 },
  { name: 'Naan (plain, tawa)', aliases: [], unitLabel: '1 piece', unitGrams: 90, kcalPer100g: 310 },
  { name: 'Paratha (plain)', aliases: [], unitLabel: '1 piece', unitGrams: 60, kcalPer100g: 330 },
  { name: 'Aloo paratha', aliases: [], unitLabel: '1 piece', unitGrams: 100, kcalPer100g: 265 },
  { name: 'Puri', aliases: [], unitLabel: '1 piece', unitGrams: 30, kcalPer100g: 380 },
  { name: 'Bhatura', aliases: [], unitLabel: '1 piece', unitGrams: 80, kcalPer100g: 340 },

  // Rice
  { name: 'Steamed rice (white)', aliases: ['chawal','bhaat'], unitLabel: '1 katori', unitGrams: 150, kcalPer100g: 130 },
  { name: 'Jeera rice', aliases: [], unitLabel: '1 katori', unitGrams: 150, kcalPer100g: 165 },
  { name: 'Veg biryani', aliases: [], unitLabel: '1 plate', unitGrams: 250, kcalPer100g: 155 },
  { name: 'Chicken biryani', aliases: [], unitLabel: '1 plate', unitGrams: 300, kcalPer100g: 180 },
  { name: 'Curd rice', aliases: ['thayir sadam'], unitLabel: '1 katori', unitGrams: 180, kcalPer100g: 120 },
  { name: 'Khichdi', aliases: [], unitLabel: '1 katori', unitGrams: 200, kcalPer100g: 110 },
  { name: 'Pulao (veg)', aliases: [], unitLabel: '1 katori', unitGrams: 180, kcalPer100g: 160 },

  // Dals / curries (veg)
  { name: 'Dal tadka', aliases: ['dal fry'], unitLabel: '1 katori', unitGrams: 150, kcalPer100g: 116 },
  { name: 'Dal makhani', aliases: [], unitLabel: '1 katori', unitGrams: 150, kcalPer100g: 190 },
  { name: 'Sambar', aliases: [], unitLabel: '1 katori', unitGrams: 150, kcalPer100g: 85 },
  { name: 'Rajma curry', aliases: [], unitLabel: '1 katori', unitGrams: 150, kcalPer100g: 140 },
  { name: 'Chole (chana masala)', aliases: ['channa masala'], unitLabel: '1 katori', unitGrams: 150, kcalPer100g: 165 },
  { name: 'Paneer butter masala', aliases: [], unitLabel: '1 katori', unitGrams: 150, kcalPer100g: 245 },
  { name: 'Palak paneer', aliases: [], unitLabel: '1 katori', unitGrams: 150, kcalPer100g: 190 },
  { name: 'Aloo sabzi (dry)', aliases: ['aloo bhaji'], unitLabel: '1 katori', unitGrams: 120, kcalPer100g: 130 },
  { name: 'Bhindi masala', aliases: ['okra sabzi'], unitLabel: '1 katori', unitGrams: 120, kcalPer100g: 105 },
  { name: 'Baingan bharta', aliases: [], unitLabel: '1 katori', unitGrams: 120, kcalPer100g: 115 },
  { name: 'Mixed veg curry', aliases: [], unitLabel: '1 katori', unitGrams: 150, kcalPer100g: 110 },
  { name: 'Kadhi', aliases: [], unitLabel: '1 katori', unitGrams: 150, kcalPer100g: 95 },

  // Non-veg curries
  { name: 'Chicken curry (home-style)', aliases: [], unitLabel: '1 katori', unitGrams: 150, kcalPer100g: 175 },
  { name: 'Butter chicken', aliases: [], unitLabel: '1 katori', unitGrams: 150, kcalPer100g: 240 },
  { name: 'Chicken tikka (grilled)', aliases: [], unitLabel: '4 pieces', unitGrams: 120, kcalPer100g: 195 },
  { name: 'Mutton curry', aliases: [], unitLabel: '1 katori', unitGrams: 150, kcalPer100g: 220 },
  { name: 'Fish curry', aliases: [], unitLabel: '1 katori', unitGrams: 150, kcalPer100g: 150 },
  { name: 'Egg curry', aliases: [], unitLabel: '1 katori (2 eggs)', unitGrams: 150, kcalPer100g: 160 },
  { name: 'Boiled egg', aliases: [], unitLabel: '1 egg', unitGrams: 50, kcalPer100g: 155 },
  { name: 'Egg bhurji', aliases: ['scrambled egg'], unitLabel: '1 serving (2 eggs)', unitGrams: 120, kcalPer100g: 180 },

  // South Indian breakfast
  { name: 'Idli', aliases: [], unitLabel: '1 piece', unitGrams: 40, kcalPer100g: 150 },
  { name: 'Dosa (plain)', aliases: [], unitLabel: '1 piece', unitGrams: 90, kcalPer100g: 168 },
  { name: 'Masala dosa', aliases: [], unitLabel: '1 piece', unitGrams: 160, kcalPer100g: 180 },
  { name: 'Uttapam', aliases: [], unitLabel: '1 piece', unitGrams: 100, kcalPer100g: 170 },
  { name: 'Medu vada', aliases: [], unitLabel: '1 piece', unitGrams: 40, kcalPer100g: 250 },
  { name: 'Upma', aliases: [], unitLabel: '1 katori', unitGrams: 150, kcalPer100g: 150 },
  { name: 'Poha', aliases: [], unitLabel: '1 katori', unitGrams: 150, kcalPer100g: 130 },

  // Snacks / street food
  { name: 'Samosa', aliases: [], unitLabel: '1 piece', unitGrams: 60, kcalPer100g: 308 },
  { name: 'Kachori', aliases: [], unitLabel: '1 piece', unitGrams: 50, kcalPer100g: 340 },
  { name: 'Pakora / bhajiya', aliases: [], unitLabel: '5 pieces', unitGrams: 80, kcalPer100g: 315 },
  { name: 'Pani puri', aliases: ['golgappa'], unitLabel: '6 pieces', unitGrams: 90, kcalPer100g: 240 },
  { name: 'Bhel puri', aliases: [], unitLabel: '1 plate', unitGrams: 100, kcalPer100g: 190 },
  { name: 'Vada pav', aliases: [], unitLabel: '1 piece', unitGrams: 120, kcalPer100g: 260 },
  { name: 'Pav bhaji', aliases: [], unitLabel: '1 plate (2 pav)', unitGrams: 300, kcalPer100g: 165 },
  { name: 'Dhokla', aliases: [], unitLabel: '4 pieces', unitGrams: 100, kcalPer100g: 160 },
  { name: 'Chaat (aloo tikki)', aliases: [], unitLabel: '1 plate', unitGrams: 150, kcalPer100g: 200 },

  // Dairy / sides
  { name: 'Curd / dahi (plain)', aliases: ['yogurt'], unitLabel: '1 katori', unitGrams: 150, kcalPer100g: 60 },
  { name: 'Raita', aliases: [], unitLabel: '1 katori', unitGrams: 100, kcalPer100g: 70 },
  { name: 'Paneer (raw)', aliases: [], unitLabel: '50g cube', unitGrams: 50, kcalPer100g: 265 },
  { name: 'Ghee', aliases: [], unitLabel: '1 tsp', unitGrams: 5, kcalPer100g: 900 },
  { name: 'Papad (roasted)', aliases: [], unitLabel: '1 piece', unitGrams: 10, kcalPer100g: 350 },
  { name: 'Pickle (achaar)', aliases: [], unitLabel: '1 tsp', unitGrams: 10, kcalPer100g: 250 },

  // Sweets
  { name: 'Gulab jamun', aliases: [], unitLabel: '1 piece', unitGrams: 40, kcalPer100g: 330 },
  { name: 'Jalebi', aliases: [], unitLabel: '1 piece', unitGrams: 25, kcalPer100g: 350 },
  { name: 'Rasgulla', aliases: [], unitLabel: '1 piece', unitGrams: 40, kcalPer100g: 190 },
  { name: 'Barfi', aliases: [], unitLabel: '1 piece', unitGrams: 30, kcalPer100g: 400 },
  { name: 'Kheer', aliases: [], unitLabel: '1 katori', unitGrams: 150, kcalPer100g: 130 },
  { name: 'Halwa (sooji/gajar)', aliases: [], unitLabel: '1 katori', unitGrams: 100, kcalPer100g: 300 },

  // Beverages
  { name: 'Chai (with milk & sugar)', aliases: ['tea'], unitLabel: '1 cup', unitGrams: 150, kcalPer100g: 45 },
  { name: 'Black coffee', aliases: [], unitLabel: '1 cup', unitGrams: 150, kcalPer100g: 2 },
  { name: 'Masala chai', aliases: [], unitLabel: '1 cup', unitGrams: 150, kcalPer100g: 50 },
  { name: 'Lassi (sweet)', aliases: [], unitLabel: '1 glass', unitGrams: 250, kcalPer100g: 90 },
  { name: 'Buttermilk / chaas', aliases: [], unitLabel: '1 glass', unitGrams: 250, kcalPer100g: 25 },
  { name: 'Coconut water', aliases: [], unitLabel: '1 glass', unitGrams: 250, kcalPer100g: 19 },

  // Lentils / legumes (plain cooked, for building your own combos)
  { name: 'Moong dal (cooked, plain)', aliases: [], unitLabel: '1 katori', unitGrams: 150, kcalPer100g: 105 },
  { name: 'Toor dal (cooked, plain)', aliases: ['arhar dal'], unitLabel: '1 katori', unitGrams: 150, kcalPer100g: 110 },
  { name: 'Chana (boiled)', aliases: ['chickpeas boiled'], unitLabel: '1 katori', unitGrams: 150, kcalPer100g: 164 },
  { name: 'Sprouts salad', aliases: [], unitLabel: '1 katori', unitGrams: 100, kcalPer100g: 100 },

  // Fruits commonly eaten
  { name: 'Banana', aliases: ['kela'], unitLabel: '1 medium', unitGrams: 120, kcalPer100g: 89 },
  { name: 'Apple', aliases: ['seb'], unitLabel: '1 medium', unitGrams: 180, kcalPer100g: 52 },
  { name: 'Mango', aliases: ['aam'], unitLabel: '1 medium', unitGrams: 200, kcalPer100g: 60 },
  { name: 'Papaya', aliases: [], unitLabel: '1 katori chopped', unitGrams: 150, kcalPer100g: 43 }
];

function normalize(s){ return s.toLowerCase().trim(); }

function searchIndianFoods(query){
  const q = normalize(query);
  if(!q) return [];
  const scored = INDIAN_FOODS
    .map(f => {
      const nameMatch = normalize(f.name).includes(q);
      const aliasMatch = f.aliases.some(a => normalize(a).includes(q));
      if(!nameMatch && !aliasMatch) return null;
      // exact/near-start matches rank higher
      const score = normalize(f.name).startsWith(q) ? 0 : 1;
      return { score, food: f };
    })
    .filter(Boolean)
    .sort((a,b) => a.score - b.score)
    .slice(0, 6)
    .map(x => ({
      source: 'local',
      id: x.food.name,
      name: x.food.name,
      kcalPer100g: x.food.kcalPer100g,
      unitLabel: x.food.unitLabel,
      unitGrams: x.food.unitGrams
    }));
  return scored;
}

window.IndianFoodDB = { searchIndianFoods, INDIAN_FOODS };
