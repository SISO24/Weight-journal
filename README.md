# Weight Journal

A personal weight-loss journal: log weight, food (with real calorie lookups),
exercise, and notes. Includes a calorie-target calculator based on your body
stats. Runs as an installable Android app (APK) — no Play Store account needed.

This README is the whole setup path, free end to end. Do the steps in order.

## 1. Put this on GitHub (free)

1. Create a free account at github.com if you don't have one.
2. Create a new **empty** repository (no README/license) — e.g. `weight-journal`.
3. From inside this folder, run:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/weight-journal.git
   git push -u origin main
   ```

That's it — GitHub Actions (see step 3) will now build your APK automatically
every time you push.

## 2. Set up your free database (Supabase)

This step is optional but recommended — without it, the app still works
perfectly, it just stores data only on the one phone it's installed on
(via localStorage) instead of syncing across devices.

1. Create a free account at supabase.com and create a new project (free tier).
2. In your project dashboard: **Authentication → Providers → Anonymous** — turn this on.
   (This lets the app create a private, no-password account for each device automatically.)
3. Go to **SQL Editor → New query**, paste the contents of `supabase/schema.sql`
   from this repo, and run it. This creates your tables with security rules so
   nobody but you can ever read your rows.
4. Go to **Project Settings → API**. Copy your **Project URL** and **anon public key**.
5. Open `www/supabaseClient.js` and paste them in:
   ```js
   const SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key-here';
   ```
6. Commit and push that change — the next APK build will use your database.

## 3. Get your APK (free, automatic)

1. On GitHub, open your repo's **Actions** tab.
2. You'll see "Build Android APK" running (it kicks off automatically on push).
   Wait for the green checkmark (a couple of minutes).
3. Click into that run → scroll to **Artifacts** → download `weight-journal-apk`.
   It's a zip containing `app-debug.apk`.

## 4. Install it on your phone

Android blocks installs from outside the Play Store by default — this is a
one-time toggle, not a cost:

1. Unzip and transfer `app-debug.apk` to your phone (email it to yourself,
   or use a USB cable / Google Drive / Files app — whatever's easiest).
2. Tap the file on your phone. If it's blocked, go to
   **Settings → Security → Install unknown apps**, allow it for the app you
   used to open the file (e.g. your Files app or Gmail).
3. Tap install. It opens like a normal app from then on, with its own icon.

## Calorie lookups

Food search checks three sources, in order:

1. **`www/indianFoods.js`** — a curated database of ~80 common Indian dishes
   (roti, dal, sabzi, biryani, South Indian breakfast, snacks, sweets, etc.),
   logged in familiar units like "1 medium roti" or "1 katori" instead of
   forcing you to weigh everything. Instant, no network call, no rate limit.
   Add your own regular dishes by editing the `INDIAN_FOODS` array — each
   entry just needs a name, a typical serving size in grams, and calories
   per 100g.
2. **USDA FoodData Central** — used automatically for anything not in the
   local list, via the public `DEMO_KEY` (rate-limited to ~30 searches/hour).
   For unlimited use, grab a free key in 30 seconds at
   https://fdc.nal.usda.gov/api-key-signup and paste it into `USDA_API_KEY`
   in `www/foodApi.js`.
3. **Open Food Facts** — final fallback for packaged/branded products.

## Making changes later

Any time you edit files in `www/` and push to `main`, GitHub Actions rebuilds
a fresh APK automatically — just repeat step 3 to grab the new one.

## What this is not

This isn't a Play Store listing — nobody can search for and find it in the
store. It's a real, installable native app that only you (and anyone you send
the APK to) can install. Getting an actual Play Store listing costs a one-time
$25 Google fee and requires a Google Play Console account — genuinely no way
around that part, since it's Google's policy, not a technical limitation.
