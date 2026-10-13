/* ForEveroth Quest Lab — pure adaptive planner. Classic routes are guidance, not quest availability proof. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ForeverQuestPlanner = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const STATUSES = ["available", "active", "ready", "done", "skipped"];
  const ACTIONS = ["starts", "objectives", "ends", "completed"];
  const valid = n => n !== null && n !== "" && n !== undefined && Number.isFinite(Number(n));
  const number = (n, fallback = null) => valid(n) && n !== "" && n !== null ? Number(n) : fallback;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const unique = arr => Array.from(new Set(arr));
  const slug = value => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  const title = value => String(value || "").replace(/(^|\s)([a-z])/g, (_, space, c) => space + c.toUpperCase());

  function resolveRef(ref, data, levels) {
    let name = Array.isArray(ref) ? ref[0] : ref;
    let id;
    if (ref && typeof ref === "object" && !Array.isArray(ref)) {
      name = ref.name || ref.title || String(ref.id || "");
      id = number(ref.id);
    } else {
      id = data.quest_ids?.[name];
      if (Array.isArray(id)) {
        const phase = Array.isArray(ref) ? /p(\d+)/i.exec(String(ref[1] || "")) : null;
        id = id[clamp(phase ? Number(phase[1]) - 1 : 0, 0, id.length - 1)];
      }
      id = number(id);
    }
    const key = id && id > 0 ? "id:" + id : "name:" + slug(name) + (Array.isArray(ref) ? ":" + String(ref[1] || "") : "");
    const translation = id ? data.translations?.[String(id)] : null;
    return {key, id: id && id > 0 ? id : null, en: title(name), fr: translation || title(name), level: id ? number(levels?.[String(id)]) : null};
  }

  function buildCatalog({manifest, data, levels, profile, overlay = null}) {
    if (!data || !data.routes || !data.routes[profile]) throw new Error("Profil Classic indisponible.");
    if (overlay && overlay.schema_version !== 1) throw new Error("Schéma de surcouche incompatible.");
    const knownProfiles = manifest?.profiles?.[data.faction] || [];
    if (!knownProfiles.some(p => p.id === profile)) throw new Error("Profil non reconnu pour cette faction.");
    const quests = {};
    const points = [];
    const all = [...data.routes[profile], ...(data.routes.shared || [])];
    const overlays = overlay?.quests || {};
    let serial = 0;
    function ensure(ref) {
      const item = resolveRef(ref, data, levels);
      if (!quests[item.key]) quests[item.key] = {...item, minLevel: null, requires: [], prerequisitesKnown: false, removed: false};
      return quests[item.key];
    }
    function addPoint(raw, stage, zone, experience) {
      if (!raw || !raw.coords || !valid(raw.coords.x) || !valid(raw.coords.y)) return;
      const point = {
        id: "p" + serial++,
        zone, stage, experience, x: clamp(Number(raw.coords.x), 0, 100),
        y: clamp(Number(raw.coords.y), 0, 100), header: String(raw.header || ""),
        notes: raw.special || [], type: raw.type || "quest", actions: []
      };
      for (const field of ACTIONS) for (const ref of raw[field] || []) {
        const quest = ensure(ref);
        point.actions.push({questKey: quest.key, kind: field === "starts" ? "accept" : field === "objectives" ? "objective" : field === "ends" ? "turnin" : "instant"});
      }
      points.push(point);
    }
    all.forEach((stage, i) => (stage.waypoints || []).forEach(p => addPoint(p, i, stage.zone, number(stage.experience, 1))));
    for (const extra of overlay?.waypoints || []) {
      if (!extra.zone || !Array.isArray(extra.waypoints) || !valid(extra.level)) continue;
      if (extra.faction && extra.faction !== data.faction) continue;
      if (Array.isArray(extra.profiles) && !extra.profiles.includes(profile)) continue;
      // Overlay stops join the existing Classic stage timeline by level/zone;
      // they are NOT appended after level 60, so low-level Forever additions remain reachable.
      let insertAt = 0, distance = Infinity;
      all.forEach((stage, i) => {
        const value = Math.abs(number(stage.experience, 1) - Number(extra.level)) + (stage.zone === extra.zone ? 0 : 2);
        if (value < distance) {insertAt = i; distance = value;}
      });
      const stageIndex = Math.max(0, insertAt + number(extra.order, 0));
      extra.waypoints.forEach(p => addPoint(p, stageIndex, extra.zone, number(extra.level)));
    }
    for (const quest of Object.values(quests)) {
      const patch = overlays[String(quest.id)] || overlays[quest.key] || {};
      if (patch.name_fr) quest.fr = String(patch.name_fr);
      if (patch.name_en) quest.en = String(patch.name_en);
      if (patch.level != null) quest.level = number(patch.level, quest.level);
      if (patch.min_level != null) quest.minLevel = number(patch.min_level);
      if (Array.isArray(patch.requires)) {
        quest.requires = patch.requires.map(v => typeof v === "number" || /^\d+$/.test(String(v)) ? "id:" + v : String(v));
        quest.prerequisitesKnown = true;
      }
      quest.removed = patch.removed === true;
    }
    return {edition: overlay?.edition || "classic", faction: data.faction, profile,
      zones: manifest?.zones || {}, mapBase: manifest?.map_base || "",
      quests, points, totalStages: all.length, source: data.source_commit || ""};
  }

  function normalizeState(input = {}, catalog) {
    const states = {};
    for (const [key, value] of Object.entries(input.questStates || {}))
      if (catalog.quests[key] && STATUSES.includes(value) && value !== "available") states[key] = value;
    const first = catalog.points[0];
    const zone = catalog.zones[input.zone] ? input.zone : first?.zone || "";
    return {level: clamp(number(input.level, 5), 1, 60), zone,
      x: number(input.x) === null ? null : clamp(number(input.x), 0, 100),
      y: number(input.y) === null ? null : clamp(number(input.y), 0, 100),
      cursor: number(input.cursor), questStates: states};
  }

  function setStatus(state, questKey, status, catalog) {
    if (!catalog.quests[questKey] || !STATUSES.includes(status)) return state;
    const copy = {...state, questStates: {...state.questStates}};
    if (status === "available") delete copy.questStates[questKey];
    else copy.questStates[questKey] = status;
    return copy;
  }

  function getStatus(state, key) { return state.questStates?.[key] || "available"; }
  function canOffer(quest, state, opts) {
    if (quest.removed || getStatus(state, quest.key) !== "available") return {ok: false, reason: "state"};
    if (quest.requires.some(key => getStatus(state, key) !== "done")) return {ok: false, reason: "prerequisites"};
    if (quest.minLevel !== null && state.level < quest.minLevel) return {ok: false, reason: "minimum"};
    // Quest level is NOT an acceptance minimum. This safety margin prevents over-level recommendations.
    if (quest.level !== null && quest.level > state.level + (opts.levelMargin ?? 1)) return {ok: false, reason: "level"};
    return {ok: true};
  }
  function chooseAnchor(catalog, state) {
    const stages = new Map();
    for (const p of catalog.points) {
      if (!stages.has(p.stage)) stages.set(p.stage, {level:p.experience, zone:p.zone});
    }
    let best = 0, score = Infinity;
    for (const [i, p] of stages) {
      const dist = Math.abs(p.level - state.level) + (p.zone === state.zone ? 0 : 1.8);
      if (dist < score) {score = dist; best = i;}
    }
    // Leveling never strands a character at a stale saved guide stage.
    return state.cursor === null ? best : Math.max(best, state.cursor);
  }
  const hypot = (a,b,x,y) => Math.hypot((a ?? 50) - x, (b ?? 50) - y);
  function calculate(catalog, stateInput, options = {}) {
    const state = normalizeState(stateInput, catalog);
    const anchor = chooseAnchor(catalog, state);
    const maxStops = clamp(number(options.maxStops, 8), 1, 20);
    const before = number(options.backStages, 5), after = number(options.forwardStages, 8);
    const blocked = {level: 0, minimum: 0, prerequisites: 0};
    let pool = [];
    for (const point of catalog.points) {
      const actions = [];
      for (const action of point.actions) {
        const q = catalog.quests[action.questKey];
        if (!q || q.removed) continue;
        const status = getStatus(state, q.key);
        if (action.kind === "accept" || action.kind === "instant") {
          if (point.stage < anchor - before || point.stage > anchor + after) continue;
          const availability = canOffer(q, state, options);
          if (!availability.ok) {
            if (blocked[availability.reason] !== undefined) blocked[availability.reason]++;
            continue;
          }
          // Without a verified quest-level entry, rely conservatively on the guide's expected level.
          if (q.level === null && point.experience > state.level + (options.levelMargin ?? 1)) continue;
        } else if (action.kind === "objective" && status !== "active") continue;
        else if (action.kind === "turnin" && status !== "ready") continue;
        if (action.kind === "accept" || action.kind === "instant" || action.kind === "objective" || action.kind === "turnin")
          actions.push({...action, status});
      }
      // A quest completed immediately at this location must not also be proposed for acceptance.
      const instantKeys = new Set(actions.filter(a => a.kind === "instant").map(a => a.questKey));
      const distinctActions = actions.filter(a => a.kind !== "accept" || !instantKeys.has(a.questKey));
      if (distinctActions.length) pool.push({...point, actions: distinctActions});
    }
    const itinerary = [];
    let position = {zone:state.zone,x:state.x,y:state.y};
    let stage = anchor;
    const visited = new Set();
    const committed = new Set();
    for (let stop = 0; stop < maxStops && pool.length; stop++) {
      let bestIndex = -1, bestScore = Infinity;
      pool.forEach((p, i) => {
        if (visited.has(p.id)) return;
        const actions = p.actions.filter(a => a.kind === "objective" || !committed.has(a.questKey));
        if (!actions.length) return;
        const ranks = {turnin: -80, objective: -48, instant: -5, accept: 0};
        const rank = Math.min(...actions.map(a => ranks[a.kind]));
        const zonePenalty = p.zone === position.zone ? 0 : 90;
        const distance = p.zone === position.zone ? hypot(position.x,position.y,p.x,p.y) * 0.65 : 0;
        const stagePenalty = Math.abs(p.stage - stage) * 6;
        const score = rank + zonePenalty + distance + stagePenalty + p.stage * .0001;
        if (score < bestScore) { bestScore = score; bestIndex = i; }
      });
      if (bestIndex < 0) break;
      const point = pool[bestIndex];
      const actions = point.actions.filter(a => a.kind === "objective" || !committed.has(a.questKey));
      actions.forEach(a => {if (a.kind !== "objective") committed.add(a.questKey);});
      itinerary.push({...point, actions, score: bestScore});
      visited.add(point.id);
      // Earlier or repeated waypoints must not make the simulated route oscillate backwards.
      stage = Math.max(stage, point.stage);
      position = {zone:point.zone,x:point.x,y:point.y};
      pool.splice(bestIndex, 1);
    }
    const known = Object.values(catalog.quests);
    const counts = {active:0,ready:0,done:0,skipped:0};
    known.forEach(q => {const status = getStatus(state,q.key);if(counts[status] !== undefined) counts[status]++;});
    return {anchor, itinerary, blocked, counts, remainingCandidates:pool.length, profile:catalog.profile, edition:catalog.edition};
  }

  return {STATUSES, buildCatalog, normalizeState, setStatus, getStatus, canOffer, calculate};
});
