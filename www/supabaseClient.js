// supabaseClient.js — data layer for the app.
//
// If you've connected a Supabase project (see /supabase/schema.sql + README),
// fill in SUPABASE_URL and SUPABASE_ANON_KEY below and this talks to your
// real Postgres database, synced across devices, using an anonymous
// Supabase-auth session (no email/password needed).
//
// If you leave them blank, the app falls back to on-device storage
// (localStorage) automatically — it still works fully offline, it just
// won't sync between devices.

const SUPABASE_URL = ""; // e.g. 'https://xxxxxxxx.supabase.co'
const SUPABASE_ANON_KEY = ""; // your project's public anon key

const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
let sb = null;
let userId = null;

async function initDataLayer() {
  if (!isSupabaseConfigured) return { mode: "local" };
  // supabase-js is loaded globally via the CDN <script> tag in index.html
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) {
    const { data, error } = await sb.auth.signInAnonymously();
    if (error) {
      console.error(
        "Anonymous sign-in failed, falling back to local storage",
        error,
      );
      sb = null;
      return { mode: "local" };
    }
    session = data.session;
  }
  userId = session.user.id;
  return { mode: "supabase" };
}

// ---------- local storage fallback ----------
function localGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
function localSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------- unified API ----------

async function getProfile() {
  if (!sb) return localGet("wj_profile", null);
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error(error);
    return null;
  }
  return data;
}

async function saveProfile(profile) {
  if (!sb) return localSet("wj_profile", profile);
  const { error } = await sb
    .from("profiles")
    .upsert({ user_id: userId, ...profile });
  if (error) console.error(error);
}

async function getGoal() {
  if (!sb) return localGet("wj_goal", null);
  const { data, error } = await sb
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error(error);
    return null;
  }
  return data;
}

async function saveGoal(goal) {
  if (!sb) return localSet("wj_goal", goal);
  const { error } = await sb.from("goals").upsert({ user_id: userId, ...goal });
  if (error) console.error(error);
}

// entries shape: { 'YYYY-MM-DD': { weight, food: [{id,name,grams,kcalPer100g}], exercise: [{id,name,duration}], notes } }

async function getEntries() {
  if (!sb) return localGet("wj_entries", {});
  const { data, error } = await sb
    .from("entries")
    .select("id, date, weight, notes, foods(*), exercises(*)")
    .eq("user_id", userId);
  if (error) {
    console.error(error);
    return {};
  }
  const map = {};
  (data || []).forEach((row) => {
    map[row.date] = {
      _id: row.id,
      weight: row.weight,
      notes: row.notes || "",
      food: (row.foods || []).map((f) => ({
        id: f.id,
        name: f.name,
        grams: f.grams,
        kcalPer100g: f.kcal_per_100g,
      })),
      exercise: (row.exercises || []).map((x) => ({
        id: x.id,
        name: x.name,
        duration: x.duration,
      })),
    };
  });
  return map;
}

// Saves a single day's entry. `entry` matches the shape above.
async function saveEntry(dateKey, entry) {
  if (!sb) {
    const all = localGet("wj_entries", {});
    all[dateKey] = entry;
    localSet("wj_entries", all);
    return;
  }
  const { data: existing } = await sb
    .from("entries")
    .select("id")
    .eq("user_id", userId)
    .eq("date", dateKey)
    .maybeSingle();

  let entryId = existing ? existing.id : null;
  if (entryId) {
    await sb
      .from("entries")
      .update({ weight: entry.weight, notes: entry.notes })
      .eq("id", entryId);
    await sb.from("foods").delete().eq("entry_id", entryId);
    await sb.from("exercises").delete().eq("entry_id", entryId);
  } else {
    const { data, error } = await sb
      .from("entries")
      .insert({
        user_id: userId,
        date: dateKey,
        weight: entry.weight,
        notes: entry.notes,
      })
      .select("id")
      .single();
    if (error) {
      console.error(error);
      return;
    }
    entryId = data.id;
  }
  if (entry.food.length) {
    await sb.from("foods").insert(
      entry.food.map((f) => ({
        entry_id: entryId,
        name: f.name,
        grams: f.grams,
        kcal_per_100g: f.kcalPer100g,
      })),
    );
  }
  if (entry.exercise.length) {
    await sb.from("exercises").insert(
      entry.exercise.map((x) => ({
        entry_id: entryId,
        name: x.name,
        duration: x.duration,
      })),
    );
  }
}

async function resetAll() {
  if (!sb) {
    localStorage.removeItem("wj_goal");
    localStorage.removeItem("wj_profile");
    localStorage.removeItem("wj_entries");
    return;
  }
  await sb.from("entries").delete().eq("user_id", userId); // cascades to foods/exercises
  await sb.from("goals").delete().eq("user_id", userId);
  await sb.from("profiles").delete().eq("user_id", userId);
}

window.DataLayer = {
  initDataLayer,
  isSupabaseConfigured,
  getProfile,
  saveProfile,
  getGoal,
  saveGoal,
  getEntries,
  saveEntry,
  resetAll,
};
