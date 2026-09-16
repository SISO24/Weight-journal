// calorie.js — BMR / TDEE / daily calorie target calculations
// Uses the Mifflin-St Jeor equation, the formula most modern fitness apps
// (MyFitnessPal, Cronometer, etc.) use as their default.

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,      // little or no exercise
  light: 1.375,        // light exercise 1-3 days/week
  moderate: 1.55,      // moderate exercise 3-5 days/week
  active: 1.725,        // hard exercise 6-7 days/week
  very_active: 1.9     // very hard exercise, physical job
};

const ACTIVITY_LABELS = {
  sedentary: 'Sedentary (little/no exercise)',
  light: 'Light (1–3 days/week)',
  moderate: 'Moderate (3–5 days/week)',
  active: 'Active (6–7 days/week)',
  very_active: 'Very active (physical job / 2x/day)'
};

// weightKg, heightCm, age in years, sex 'male'|'female'
function bmr(weightKg, heightCm, age, sex){
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

function tdee(weightKg, heightCm, age, sex, activityKey){
  const mult = ACTIVITY_MULTIPLIERS[activityKey] || 1.2;
  return bmr(weightKg, heightCm, age, sex) * mult;
}

// goalType: 'lose' | 'maintain' | 'gain'
// paceKgPerWeek: how aggressively to cut/bulk (defaults to a safe 0.5kg/week)
function dailyTarget(profile){
  const { weightKg, heightCm, age, sex, activity, goalType, paceKgPerWeek } = profile;
  const maintenance = tdee(weightKg, heightCm, age, sex, activity);
  const pace = paceKgPerWeek || 0.5;
  // 1kg of body fat ≈ 7700 kcal
  const dailyAdjustment = (pace * 7700) / 7;
  if(goalType === 'lose') return Math.round(maintenance - dailyAdjustment);
  if(goalType === 'gain') return Math.round(maintenance + dailyAdjustment);
  return Math.round(maintenance);
}

function lbToKg(lb){ return lb * 0.453592; }
function kgToLb(kg){ return kg / 0.453592; }
function inToCm(inches){ return inches * 2.54; }
function cmToIn(cm){ return cm / 2.54; }

window.CalorieCalc = {
  ACTIVITY_MULTIPLIERS,
  ACTIVITY_LABELS,
  bmr,
  tdee,
  dailyTarget,
  lbToKg,
  kgToLb,
  inToCm,
  cmToIn
};
