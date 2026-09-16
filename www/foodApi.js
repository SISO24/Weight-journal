// foodApi.js — looks up calories for a food name against free nutrition databases.
//
// Primary source: USDA FoodData Central (best coverage for generic/whole foods
// like "banana", "chicken breast"). It's a free US government API. It works
// out of the box with the public DEMO_KEY (rate-limited to ~30 requests/hour/IP),
// but for real daily use you should grab your own free key in 30 seconds at
// https://fdc.nal.usda.gov/api-key-signup and drop it into USDA_API_KEY below.
//
// Fallback source: Open Food Facts (no key required at all, community-run,
// stronger for branded/packaged products).

const USDA_API_KEY = 'DEMO_KEY'; // <-- replace with your own free key for higher limits

async function searchUSDA(query){
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=6&dataType=Foundation,SR%20Legacy,Survey%20(FNDDS)`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('USDA lookup failed: ' + res.status);
  const data = await res.json();
  return (data.foods || []).map(f => {
    const energy = (f.foodNutrients || []).find(n => n.nutrientName === 'Energy' && n.unitName === 'KCAL');
    return {
      source: 'usda',
      id: f.fdcId,
      name: f.description,
      kcalPer100g: energy ? Math.round(energy.value) : null
    };
  }).filter(f => f.kcalPer100g != null);
}

async function searchOpenFoodFacts(query){
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=6`;
  const res = await fetch(url);
  if(!res.ok) throw new Error('Open Food Facts lookup failed: ' + res.status);
  const data = await res.json();
  return (data.products || []).map(p => ({
    source: 'off',
    id: p.code,
    name: p.product_name || p.generic_name || query,
    kcalPer100g: p.nutriments && p.nutriments['energy-kcal_100g'] ? Math.round(p.nutriments['energy-kcal_100g']) : null
  })).filter(f => f.kcalPer100g != null && f.name);
}

// Returns a list of {source, id, name, kcalPer100g, unitLabel?, unitGrams?}
// Checks the curated Indian food database first (instant, no network call,
// and far more accurate for home-cooked dishes than the US-built databases
// below) — only falls through to USDA / Open Food Facts if nothing local matches.
async function searchFood(query){
  if(!query || !query.trim()) return [];

  const localResults = window.IndianFoodDB ? window.IndianFoodDB.searchIndianFoods(query) : [];
  if(localResults.length) return localResults;

  try{
    const usdaResults = await searchUSDA(query);
    if(usdaResults.length) return usdaResults;
  }catch(e){
    console.warn('USDA search failed, falling back to Open Food Facts', e);
  }
  try{
    return await searchOpenFoodFacts(query);
  }catch(e){
    console.warn('Open Food Facts search failed', e);
    return [];
  }
}

// grams: how many grams of the food were eaten
function caloriesForPortion(kcalPer100g, grams){
  return Math.round((kcalPer100g / 100) * grams);
}

window.FoodApi = { searchFood, caloriesForPortion };
