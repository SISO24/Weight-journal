(function(){
  const root = document.getElementById('app');
  const todayKey = () => new Date().toISOString().slice(0,10);
  const fmtDate = (key, opts) => new Date(key + 'T00:00:00').toLocaleDateString('en-US', opts || { weekday:'long', month:'long', day:'numeric' });
  const uid = () => 'local-' + Math.random().toString(36).slice(2,9);

  let goal = null;
  let profile = null;
  let entries = {};
  let activeTab = 'today';
  let ready = false;
  let mode = 'local';
  let pendingFoodPick = null; // {name, kcalPer100g} awaiting a grams amount
  let foodSearchResults = [];
  let searchDebounce = null;

  function currentEntry(){
    const k = todayKey();
    if(!entries[k]) entries[k] = { weight:null, food:[], exercise:[], notes:'' };
    return entries[k];
  }

  async function loadAll(){
    const info = await window.DataLayer.initDataLayer();
    mode = info.mode;
    [goal, profile, entries] = await Promise.all([
      window.DataLayer.getGoal(),
      window.DataLayer.getProfile(),
      window.DataLayer.getEntries()
    ]);
    ready = true;
    render();
  }

  function sortedDates(){ return Object.keys(entries).sort(); }

  function dailyCalorieTarget(){
    if(!profile || !profile.height_cm || !profile.age) return null;
    const latestWeight = latestLoggedWeight();
    const weightKg = goal && goal.unit === 'lb' ? CalorieCalc.lbToKg(latestWeight || goal.start_weight) : (latestWeight || (goal ? goal.start_weight : null));
    if(!weightKg) return null;
    return CalorieCalc.dailyTarget({
      weightKg,
      heightCm: profile.height_cm,
      age: profile.age,
      sex: profile.sex,
      activity: profile.activity,
      goalType: profile.goal_type,
      paceKgPerWeek: profile.pace_kg_per_week
    });
  }

  function latestLoggedWeight(){
    const dates = sortedDates().filter(d => entries[d].weight != null);
    return dates.length ? entries[dates[dates.length-1]].weight : null;
  }

  function todaysCalories(){
    const e = currentEntry();
    return e.food.reduce((sum, f) => sum + FoodApi.caloriesForPortion(f.kcalPer100g, f.grams), 0);
  }

  function buildSparkline(points){
    if(points.length < 2) return '';
    const w = 400, h = 64, pad = 6;
    const vals = points.map(p => p.weight);
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = (max - min) || 1;
    const stepX = (w - pad*2) / (points.length - 1);
    const coords = points.map((p,i) => {
      const x = pad + i*stepX;
      const y = h - pad - ((p.weight - min) / range) * (h - pad*2);
      return [x,y];
    });
    const path = coords.map((c,i) => (i===0?'M':'L') + c[0].toFixed(1) + ',' + c[1].toFixed(1)).join(' ');
    const dots = coords.map(c => `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="2.5" fill="var(--navy)"/>`).join('');
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <path d="${path}" fill="none" stroke="var(--sage)" stroke-width="2"/>
      ${dots}
    </svg>`;
  }

  function deltaPill(dates){
    const last = entries[dates[dates.length-1]].weight;
    const prev = entries[dates[dates.length-2]].weight;
    const diff = last - prev;
    const cls = diff <= 0 ? 'delta-down' : 'delta-up';
    const sign = diff <= 0 ? '' : '+';
    return `<div class="delta-pill ${cls}">${sign}${diff.toFixed(1)} since last log</div>`;
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function renderToday(){
    const unit = goal ? goal.unit : 'kg';
    const dates = sortedDates().filter(d => entries[d].weight != null);
    const last14 = dates.slice(-14).map(d => ({date:d, weight: entries[d].weight}));
    const latest = dates.length ? entries[dates[dates.length-1]].weight : null;

    let progressHtml = '';
    if(!goal){
      progressHtml = `<div class="card progress-card">
        <div class="empty-note">Set a goal weight to see your progress here. <a data-action="go-goal">Set it up →</a></div>
      </div>`;
    } else {
      const remaining = latest != null ? (latest - goal.goal_weight) : null;
      progressHtml = `<div class="card progress-card">
        <div class="row">
          <div>
            <div class="big-number">${latest != null ? latest.toFixed(1) : '—'}<span class="unit">${unit}</span></div>
            <div class="stat-label">current weight</div>
          </div>
          ${dates.length >= 2 ? deltaPill(dates) : ''}
        </div>
        ${buildSparkline(last14) || `<div class="empty-note" style="margin-top:14px;">Log a few more days to see your trend.</div>`}
        <div class="goal-line">
          <span>Start: <strong>${goal.start_weight}${unit}</strong></span>
          <span>Goal: <strong>${goal.goal_weight}${unit}</strong></span>
          <span>${remaining != null ? (remaining > 0 ? `<strong>${remaining.toFixed(1)}${unit}</strong> to go` : 'Goal reached 🎉') : ''}</span>
        </div>
      </div>`;
    }

    const target = dailyCalorieTarget();
    const eaten = todaysCalories();
    let calorieHtml = '';
    if(!target){
      calorieHtml = `<div class="card"><div class="empty-note">Fill in your body stats on the Profile tab to get a daily calorie target. <a data-action="go-profile">Set it up →</a></div></div>`;
    } else {
      const pct = Math.min(100, Math.round((eaten / target) * 100));
      calorieHtml = `<div class="card">
        <div class="section-title" style="margin-top:0;">Calories today</div>
        <div class="cal-ring">
          <div class="num">${eaten}<span style="font-size:15px; color:var(--text-muted); font-family:'IBM Plex Sans',sans-serif;"> / ${target} kcal</span></div>
        </div>
        <div class="cal-bar" style="margin-top:10px;"><div class="cal-bar-fill" style="width:${pct}%;"></div></div>
      </div>`;
    }

    const e = currentEntry();
    const foodHtml = e.food.map(f => `<div class="list-item">
        <span>${escapeHtml(f.name)}<span class="meta"> — ${f.grams}g, ${FoodApi.caloriesForPortion(f.kcalPer100g, f.grams)} kcal</span></span>
        <span class="remove" data-action="rm-food" data-id="${f.id}">×</span>
      </div>`).join('') || `<div class="empty-note" style="padding:6px 0;">Nothing logged yet.</div>`;
    const exHtml = e.exercise.map(x => `<div class="list-item"><span>${escapeHtml(x.name)}${x.duration ? ' — ' + escapeHtml(x.duration) : ''}</span><span class="remove" data-action="rm-ex" data-id="${x.id}">×</span></div>`).join('') || `<div class="empty-note" style="padding:6px 0;">Nothing logged yet.</div>`;

    let foodSearchHtml = '';
    if(foodSearchResults.length){
      foodSearchHtml = foodSearchResults.map((f,i) => {
        const meta = f.unitLabel
          ? `${f.unitLabel} ≈ ${FoodApi.caloriesForPortion(f.kcalPer100g, f.unitGrams)} kcal`
          : `${f.kcalPer100g} kcal/100g`;
        return `<div class="food-result" data-action="pick-food" data-idx="${i}">
          <span>${escapeHtml(f.name)}</span><span class="meta" style="color:var(--text-muted);">${meta}</span>
        </div>`;
      }).join('');
    }

    let gramsPromptHtml = '';
    if(pendingFoodPick){
      const hasServing = pendingFoodPick.unitGrams != null;
      const prefill = hasServing ? pendingFoodPick.unitGrams : '';
      gramsPromptHtml = `<div class="card" style="margin-top:10px; background:var(--surface-2);">
        <div class="field" style="margin-bottom:10px;">
          <label>Grams of "${escapeHtml(pendingFoodPick.name)}"${hasServing ? ` <span style="color:var(--text-muted);">(${escapeHtml(pendingFoodPick.unitLabel)} ≈ ${pendingFoodPick.unitGrams}g — edit if yours is different)</span>` : ''}</label>
          <div class="inline-row">
            <input type="number" id="grams-input" value="${prefill}" placeholder="e.g. 150" autofocus>
            <button class="btn small" data-action="confirm-grams">Add</button>
            <button class="btn small secondary" data-action="cancel-grams">Cancel</button>
          </div>
        </div>
      </div>`;
    }

    return `
      <div class="header">
        <div>
          <div class="title">Today</div>
          <div class="date">${fmtDate(todayKey())}</div>
        </div>
        <span class="badge">${mode === 'supabase' ? 'synced' : 'on this device'}</span>
      </div>
      ${progressHtml}
      ${calorieHtml}
      <div class="card">
        <div class="field">
          <label for="weight-input">Today's weight (${unit})</label>
          <input type="number" step="0.1" id="weight-input" value="${e.weight != null ? e.weight : ''}" placeholder="e.g. 72.4">
        </div>

        <div class="section-title">Food</div>
        <div class="inline-row" style="margin-bottom:2px;">
          <input type="text" id="food-input" placeholder="Search a food, e.g. banana">
        </div>
        ${foodSearchHtml}
        ${gramsPromptHtml}
        <div style="margin-top:10px;">${foodHtml}</div>

        <div class="section-title">Exercise</div>
        <div class="inline-row" style="margin-bottom:10px;">
          <input type="text" id="ex-input" placeholder="Activity">
          <input type="text" id="ex-duration" placeholder="Duration" style="max-width:100px;">
          <button class="btn small" data-action="add-ex">Add</button>
        </div>
        ${exHtml}

        <div class="section-title">Notes</div>
        <textarea id="notes-input" placeholder="How did today feel?">${escapeHtml(e.notes || '')}</textarea>

        <div style="margin-top:16px;">
          <button class="btn" data-action="save-day" style="width:100%;">Save today's log</button>
        </div>
      </div>
    `;
  }

  function renderHistory(){
    const dates = sortedDates().reverse();
    if(dates.length === 0){
      return `<div class="header"><div class="title">History</div></div>
        <div class="card"><div class="empty-note">No entries yet. Log today's weight on the Today tab to get started.</div></div>`;
    }
    const rows = dates.map(d => {
      const entry = entries[d];
      const priorDates = sortedDates().filter(x => x < d && entries[x].weight != null);
      const prior = priorDates.length ? entries[priorDates[priorDates.length-1]].weight : null;
      let delta = '';
      if(entry.weight != null && prior != null){
        const diff = entry.weight - prior;
        const cls = diff <= 0 ? 'delta-down' : 'delta-up';
        const sign = diff <= 0 ? '' : '+';
        delta = `<span class="delta-pill ${cls}">${sign}${diff.toFixed(1)}</span>`;
      }
      const foodList = entry.food.length ? entry.food.map(f=>escapeHtml(f.name) + ` (${f.grams}g)`).join(', ') : '—';
      const exList = entry.exercise.length ? entry.exercise.map(x=>escapeHtml(x.name) + (x.duration ? ` (${escapeHtml(x.duration)})` : '')).join(', ') : '—';
      const totalKcal = entry.food.reduce((sum,f)=> sum + FoodApi.caloriesForPortion(f.kcalPer100g, f.grams), 0);
      return `<div class="history-day">
          <div class="history-head" data-action="toggle-hist" data-id="${d}">
            <div class="hd-date"><span class="day-name">${fmtDate(d,{weekday:'short'})}</span>${fmtDate(d,{month:'short', day:'numeric'})}</div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span>${entry.weight != null ? entry.weight.toFixed(1) + (goal?goal.unit:'') : '—'}</span>
              ${delta}
            </div>
          </div>
          <div class="history-detail" id="hist-${d}">
            <div><strong style="color:var(--text);">Calories:</strong> ${totalKcal || '—'} kcal</div>
            <div><strong style="color:var(--text);">Food:</strong> ${foodList}</div>
            <div><strong style="color:var(--text);">Exercise:</strong> ${exList}</div>
            ${entry.notes ? `<div><strong style="color:var(--text);">Notes:</strong> ${escapeHtml(entry.notes)}</div>` : ''}
          </div>
        </div>`;
    }).join('');
    return `<div class="header"><div class="title">History</div></div><div class="card">${rows}</div>`;
  }

  function renderGoal(){
    const g = goal || { unit:'kg', start_weight:'', goal_weight:'', start_date: todayKey() };
    return `
      <div class="header"><div class="title">Goal</div></div>
      <div class="card">
        <div class="unit-toggle">
          <button data-action="set-unit" data-unit="kg" class="${g.unit==='kg'?'active':''}">kg</button>
          <button data-action="set-unit" data-unit="lb" class="${g.unit==='lb'?'active':''}">lb</button>
        </div>
        <div class="field"><label for="start-weight">Starting weight</label><input type="number" step="0.1" id="start-weight" value="${g.start_weight}"></div>
        <div class="field"><label for="goal-weight">Goal weight</label><input type="number" step="0.1" id="goal-weight" value="${g.goal_weight}"></div>
        <div class="field"><label for="start-date">Start date</label><input type="date" id="start-date" value="${g.start_date}"></div>
        <button class="btn" data-action="save-goal" style="width:100%;">Save goal</button>
      </div>
      <div class="card">
        <div class="section-title" style="margin-top:0;">Reset</div>
        <div class="empty-note" style="margin-bottom:12px;">This clears every logged day, your goal, and your profile. It can't be undone.</div>
        <button class="btn danger" data-action="reset-all">Erase all data</button>
      </div>
    `;
  }

  function renderProfile(){
    const p = profile || { height_cm:'', age:'', sex:'female', activity:'sedentary', goal_type:'lose', pace_kg_per_week:0.5 };
    const activityOptions = Object.keys(CalorieCalc.ACTIVITY_LABELS).map(k =>
      `<option value="${k}" ${p.activity===k?'selected':''}>${CalorieCalc.ACTIVITY_LABELS[k]}</option>`).join('');
    return `
      <div class="header"><div class="title">Profile</div></div>
      <div class="card">
        <div class="empty-note" style="margin-bottom:14px;">Used only to work out your daily calorie target — nothing here is shared.</div>
        <div class="two-col">
          <div class="field"><label for="p-height">Height (cm)</label><input type="number" id="p-height" value="${p.height_cm}"></div>
          <div class="field"><label for="p-age">Age</label><input type="number" id="p-age" value="${p.age}"></div>
        </div>
        <div class="field">
          <label>Sex (for the calorie formula)</label>
          <div class="unit-toggle">
            <button data-action="set-sex" data-sex="female" class="${p.sex==='female'?'active':''}">Female</button>
            <button data-action="set-sex" data-sex="male" class="${p.sex==='male'?'active':''}">Male</button>
          </div>
        </div>
        <div class="field">
          <label for="p-activity">Activity level</label>
          <select id="p-activity">${activityOptions}</select>
        </div>
        <div class="field">
          <label>Goal</label>
          <div class="unit-toggle">
            <button data-action="set-goaltype" data-gt="lose" class="${p.goal_type==='lose'?'active':''}">Lose</button>
            <button data-action="set-goaltype" data-gt="maintain" class="${p.goal_type==='maintain'?'active':''}">Maintain</button>
            <button data-action="set-goaltype" data-gt="gain" class="${p.goal_type==='gain'?'active':''}">Gain</button>
          </div>
        </div>
        <div class="field">
          <label for="p-pace">Pace (kg/week)</label>
          <input type="number" step="0.1" id="p-pace" value="${p.pace_kg_per_week}">
        </div>
        <button class="btn" data-action="save-profile" style="width:100%;">Save profile</button>
      </div>
    `;
  }

  function render(){
    if(!ready){ root.innerHTML = `<div class="loading">Opening your journal…</div>`; return; }
    const views = { today: renderToday(), history: renderHistory(), goal: renderGoal(), profile: renderProfile() };
    root.innerHTML = `
      <div class="view active">${views[activeTab]}</div>
      <div class="tabbar">
        <div class="tabbar-inner">
          <button class="tab ${activeTab==='today'?'active':''}" data-action="tab" data-tab="today">Today</button>
          <button class="tab ${activeTab==='history'?'active':''}" data-action="tab" data-tab="history">History</button>
          <button class="tab ${activeTab==='goal'?'active':''}" data-action="tab" data-tab="goal">Goal</button>
          <button class="tab ${activeTab==='profile'?'active':''}" data-action="tab" data-tab="profile">Profile</button>
        </div>
      </div>
    `;
    attachEvents();
    const foodInput = document.getElementById('food-input');
    if(foodInput){
      foodInput.addEventListener('input', onFoodInput);
      foodInput.focus();
      foodInput.setSelectionRange(foodInput.value.length, foodInput.value.length);
    }
  }

  function attachEvents(){
    root.querySelectorAll('[data-action]').forEach(el => el.addEventListener('click', onAction));
  }

  function onFoodInput(ev){
    const q = ev.target.value;
    clearTimeout(searchDebounce);
    if(q.trim().length < 2){ foodSearchResults = []; renderFoodResultsOnly(); return; }
    searchDebounce = setTimeout(async () => {
      foodSearchResults = await FoodApi.searchFood(q);
      renderFoodResultsOnly();
    }, 400);
  }

  // Lightweight re-render of just the results list so we don't steal input focus
  function renderFoodResultsOnly(){
    const existing = root.querySelector('.food-result')?.parentElement;
    render();
  }

  let pendingUnit = null, pendingSex = null, pendingGoalType = null;

  async function onAction(ev){
    const action = ev.currentTarget.getAttribute('data-action');
    const e = currentEntry();

    if(action === 'tab'){ activeTab = ev.currentTarget.getAttribute('data-tab'); foodSearchResults = []; pendingFoodPick = null; render(); }
    else if(action === 'go-goal'){ activeTab = 'goal'; render(); }
    else if(action === 'go-profile'){ activeTab = 'profile'; render(); }
    else if(action === 'pick-food'){
      const idx = parseInt(ev.currentTarget.getAttribute('data-idx'), 10);
      pendingFoodPick = foodSearchResults[idx];
      foodSearchResults = [];
      render();
      document.getElementById('grams-input')?.focus();
    }
    else if(action === 'confirm-grams'){
      const grams = parseFloat(document.getElementById('grams-input').value);
      if(!isNaN(grams) && grams > 0 && pendingFoodPick){
        e.food.push({ id: uid(), name: pendingFoodPick.name, grams, kcalPer100g: pendingFoodPick.kcalPer100g });
      }
      pendingFoodPick = null;
      render();
    }
    else if(action === 'cancel-grams'){ pendingFoodPick = null; render(); }
    else if(action === 'rm-food'){ e.food = e.food.filter(f => f.id !== ev.currentTarget.getAttribute('data-id')); render(); }
    else if(action === 'add-ex'){
      const name = document.getElementById('ex-input'), dur = document.getElementById('ex-duration');
      if(name.value.trim()){
        e.exercise.push({ id: uid(), name: name.value.trim(), duration: dur.value.trim() });
        render();
      }
    }
    else if(action === 'rm-ex'){ e.exercise = e.exercise.filter(x => x.id !== ev.currentTarget.getAttribute('data-id')); render(); }
    else if(action === 'save-day'){
      const w = document.getElementById('weight-input').value;
      e.weight = w !== '' ? parseFloat(w) : null;
      e.notes = document.getElementById('notes-input').value;
      const btn = ev.currentTarget;
      btn.textContent = 'Saving…';
      await window.DataLayer.saveEntry(todayKey(), e);
      btn.textContent = 'Saved ✓';
      setTimeout(render, 700);
    }
    else if(action === 'toggle-hist'){
      document.getElementById('hist-' + ev.currentTarget.getAttribute('data-id')).classList.toggle('open');
    }
    else if(action === 'set-unit'){
      pendingUnit = ev.currentTarget.getAttribute('data-unit');
      root.querySelectorAll('.unit-toggle button').forEach(b => { if(b.hasAttribute('data-unit')) b.classList.toggle('active', b.getAttribute('data-unit') === pendingUnit); });
    }
    else if(action === 'set-sex'){
      pendingSex = ev.currentTarget.getAttribute('data-sex');
      root.querySelectorAll('[data-sex]').forEach(b => b.classList.toggle('active', b.getAttribute('data-sex') === pendingSex));
    }
    else if(action === 'set-goaltype'){
      pendingGoalType = ev.currentTarget.getAttribute('data-gt');
      root.querySelectorAll('[data-gt]').forEach(b => b.classList.toggle('active', b.getAttribute('data-gt') === pendingGoalType));
    }
    else if(action === 'save-goal'){
      const start_weight = parseFloat(document.getElementById('start-weight').value);
      const goal_weight = parseFloat(document.getElementById('goal-weight').value);
      const start_date = document.getElementById('start-date').value;
      const unit = pendingUnit || (goal ? goal.unit : 'kg');
      if(isNaN(start_weight) || isNaN(goal_weight) || !start_date){ alert('Fill in starting weight, goal weight, and a start date.'); return; }
      goal = { unit, start_weight, goal_weight, start_date };
      pendingUnit = null;
      const btn = ev.currentTarget;
      btn.textContent = 'Saving…';
      await window.DataLayer.saveGoal(goal);
      btn.textContent = 'Saved ✓';
      activeTab = 'today';
      setTimeout(render, 500);
    }
    else if(action === 'save-profile'){
      const height_cm = parseFloat(document.getElementById('p-height').value);
      const age = parseInt(document.getElementById('p-age').value, 10);
      const activity = document.getElementById('p-activity').value;
      const pace_kg_per_week = parseFloat(document.getElementById('p-pace').value) || 0.5;
      const sex = pendingSex || (profile ? profile.sex : 'female');
      const goal_type = pendingGoalType || (profile ? profile.goal_type : 'lose');
      if(isNaN(height_cm) || isNaN(age)){ alert('Fill in your height and age.'); return; }
      profile = { height_cm, age, sex, activity, goal_type, pace_kg_per_week };
      pendingSex = null; pendingGoalType = null;
      const btn = ev.currentTarget;
      btn.textContent = 'Saving…';
      await window.DataLayer.saveProfile(profile);
      btn.textContent = 'Saved ✓';
      setTimeout(render, 500);
    }
    else if(action === 'reset-all'){
      if(confirm('Erase all logged days, your goal, and your profile? This can\'t be undone.')){
        goal = null; profile = null; entries = {};
        await window.DataLayer.resetAll();
        activeTab = 'today';
        render();
      }
    }
  }

  loadAll();
})();
