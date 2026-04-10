// state.js — single flight-state object with localStorage persistence + pub/sub

const KEY_FLIGHT = "ifr-companion:flight";
const KEY_PILOT  = "ifr-companion:pilotId";
const KEY_PHRASE = "ifr-companion:phraseology";

const PHASE_IDS = [
  "setup", "atis", "clearance", "pushback", "taxi", "tower",
  "departure", "enroute", "arrival", "approach", "landing", "ground",
];

function emptyFlight() {
  const phaseStatus = {};
  PHASE_IDS.forEach(id => { phaseStatus[id] = false; });
  return {
    // Identity / SimBrief
    callsign: "", aircraft: "",
    depIcao: "", depName: "", arrIcao: "", arrName: "",
    stand: "", route: "", cruiseLevel: "",
    sid: "", star: "",
    costIndex: "", zfw: "", fuel: "", pax: "", cargo: "",

    // Departure ATIS
    atisLetter: "", depWind: "", depVisibility: "", depClouds: "",
    depTemp: "", depDewpoint: "", depQnh: "", depRwy: "", depTransitionLevel: "",
    depAtisNotes: "",

    // CRAFT
    craftClearanceLimit: "", craftRoute: "", craftAltitude: "",
    craftFrequency: "", craftSquawk: "",

    // Taxi out
    taxiRoute: "", taxiHoldPoint: "",

    // Departure handoff
    depFrequency: "", departureAltitude: "",

    // En route
    enrouteFrequency: "", enrouteNotes: "",

    // Arrival ATIS
    arrAtisLetter: "", arrWind: "", arrVisibility: "", arrClouds: "",
    arrTemp: "", arrDewpoint: "", arrQnh: "", arrRwy: "", arrTransitionLevel: "",
    arrAtisNotes: "",
    assignedStar: "", assignedApproach: "",

    // Approach
    vectorHeading: "", vectorAltitude: "", approachFrequency: "",

    // Taxi in
    taxiInRoute: "", taxiInStand: "",

    // Meta
    phaseStatus,
    currentPhase: "setup",
  };
}

function loadFlight() {
  try {
    const raw = localStorage.getItem(KEY_FLIGHT);
    if (!raw) return emptyFlight();
    const parsed = JSON.parse(raw);
    // Merge with empty so new fields added later exist on old saves.
    const base = emptyFlight();
    const merged = { ...base, ...parsed };
    merged.phaseStatus = { ...base.phaseStatus, ...(parsed.phaseStatus || {}) };
    if (!PHASE_IDS.includes(merged.currentPhase)) merged.currentPhase = "setup";
    return merged;
  } catch {
    return emptyFlight();
  }
}

let flight = loadFlight();
let pilotId = localStorage.getItem(KEY_PILOT) || "";
let phraseology = localStorage.getItem(KEY_PHRASE) || "icao";
if (phraseology !== "icao" && phraseology !== "faa") phraseology = "icao";

const listeners = new Set();
function notify(change) {
  for (const fn of listeners) {
    try { fn(change); } catch (e) { console.error(e); }
  }
}

let saveTimer = null;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      localStorage.setItem(KEY_FLIGHT, JSON.stringify(flight));
    } catch (e) {
      console.error("Failed to save flight state", e);
    }
  }, 150);
}

// Public API ---------------------------------------------------------------

export const PHASES_ORDER = PHASE_IDS;

export function getState() { return flight; }

export function setField(key, value) {
  if (flight[key] === value) return;
  flight[key] = value;
  scheduleSave();
  notify({ type: "field", key, value });
}

export function setFields(patch) {
  let changed = false;
  for (const [k, v] of Object.entries(patch)) {
    if (flight[k] !== v) {
      flight[k] = v;
      changed = true;
    }
  }
  if (changed) {
    scheduleSave();
    notify({ type: "bulk", keys: Object.keys(patch) });
  }
}

export function markPhaseComplete(phaseId, complete = true) {
  if (!(phaseId in flight.phaseStatus)) return;
  if (flight.phaseStatus[phaseId] === complete) return;
  flight.phaseStatus[phaseId] = complete;
  scheduleSave();
  notify({ type: "phaseStatus", phaseId, complete });
}

export function setCurrentPhase(phaseId) {
  if (!PHASE_IDS.includes(phaseId)) return;
  if (flight.currentPhase === phaseId) return;
  flight.currentPhase = phaseId;
  scheduleSave();
  notify({ type: "currentPhase", phaseId });
}

export function resetFlight() {
  flight = emptyFlight();
  try { localStorage.setItem(KEY_FLIGHT, JSON.stringify(flight)); } catch {}
  notify({ type: "reset" });
}

export function getPilotId() { return pilotId; }
export function setPilotId(id) {
  pilotId = id || "";
  try {
    if (pilotId) localStorage.setItem(KEY_PILOT, pilotId);
    else localStorage.removeItem(KEY_PILOT);
  } catch {}
  notify({ type: "pilotId", value: pilotId });
}

export function getPhraseology() { return phraseology; }
export function setPhraseology(value) {
  const v = value === "faa" ? "faa" : "icao";
  if (v === phraseology) return;
  phraseology = v;
  try { localStorage.setItem(KEY_PHRASE, phraseology); } catch {}
  notify({ type: "phraseology", value: phraseology });
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
