// phases.js — declarative definitions for every flight phase.
//
// Each phase has:
//   id, name               — identity + tab label
//   subtitle               — short helper text under the phase title
//   layout (optional)      — "craft" uses the CRAFT letter grid renderer
//   custom (optional)      — "setup" has a SimBrief block + reset button
//   fields                 — array of { id, label, placeholder, type?, wide?, source? }
//   calls                  — array of { type: "you"|"atc", label, text }
//                              text is either a string or { icao, faa } variant.
//   tips                   — array of short contextual reminders
//
// Template tokens use {{fieldId}} and render as underlined red blanks when empty.

export const PHASES = [
  // -----------------------------------------------------------------------
  {
    id: "setup",
    name: "Setup",
    subtitle: "Import from SimBrief and confirm flight identity.",
    custom: "setup",
    fields: [
      { id: "callsign",  label: "Callsign",         placeholder: "VLG8UR" },
      { id: "aircraft",  label: "Aircraft",         placeholder: "A320" },
      { id: "depIcao",   label: "Departure ICAO",   placeholder: "LEPA" },
      { id: "arrIcao",   label: "Arrival ICAO",     placeholder: "EGLL" },
      { id: "depName",   label: "Departure name",   placeholder: "Palma" },
      { id: "arrName",   label: "Arrival name",     placeholder: "London Heathrow" },
      { id: "stand",     label: "Stand / Gate",     placeholder: "A12" },
      { id: "cruiseLevel", label: "Cruise level",   placeholder: "FL360" },
      { id: "route",     label: "Route",            placeholder: "SID … STAR", wide: true },
      { id: "sid",       label: "SID",              placeholder: "ident" },
      { id: "star",      label: "STAR",             placeholder: "ident" },
      { id: "costIndex", label: "Cost index",       placeholder: "35" },
      { id: "zfw",       label: "ZFW (kg)",         placeholder: "58000" },
      { id: "fuel",      label: "Block fuel (kg)",  placeholder: "12500" },
      { id: "pax",       label: "Pax",              placeholder: "174" },
      { id: "cargo",     label: "Cargo (kg)",       placeholder: "1200" },
    ],
    calls: [],
    tips: [
      "Fetch your OFP from SimBrief first — all downstream phases reuse this data.",
      "Your Pilot ID / username is remembered; flight data is cleared when you hit Reset.",
    ],
  },

  // -----------------------------------------------------------------------
  {
    id: "atis",
    name: "ATIS",
    subtitle: "Listen to departure ATIS and fill in the weather picture.",
    fields: [
      { id: "atisLetter",         label: "Information letter", placeholder: "A" },
      { id: "depRwy",             label: "Active runway",      placeholder: "24L" },
      { id: "depWind",            label: "Wind",               placeholder: "240/12" },
      { id: "depVisibility",      label: "Visibility",         placeholder: "10KM / CAVOK" },
      { id: "depClouds",          label: "Clouds",             placeholder: "FEW030" },
      { id: "depTemp",            label: "Temp",               placeholder: "18" },
      { id: "depDewpoint",        label: "Dewpoint",           placeholder: "12" },
      { id: "depQnh",             label: "QNH",                placeholder: "1013" },
      { id: "depTransitionLevel", label: "Transition level",   placeholder: "FL70" },
      { id: "depAtisNotes",       label: "Notes",              placeholder: "Remarks, NOTAMs…", type: "textarea", wide: true },
    ],
    calls: [],
    tips: [
      "Have the ATIS letter memorised before you call Delivery — it goes in every initial call.",
      "Set the QNH on both altimeters as soon as you copy it.",
    ],
  },

  // -----------------------------------------------------------------------
  {
    id: "clearance",
    name: "Clearance",
    subtitle: "CRAFT: Clearance limit, Route, Altitude, Frequency, Transponder.",
    layout: "craft",
    fields: [
      { id: "craftClearanceLimit", label: "Clearance limit",   placeholder: "ARR ICAO", source: "arrIcao" },
      { id: "craftRoute",          label: "Route / SID",       placeholder: "SID ident", source: "sid" },
      { id: "craftAltitude",       label: "Initial altitude",  placeholder: "5000 / FL80" },
      { id: "craftFrequency",      label: "Next frequency",    placeholder: "121.800" },
      { id: "craftSquawk",         label: "Transponder",       placeholder: "1234" },
    ],
    calls: [
      {
        type: "you",
        label: "Initial call to Delivery",
        text: "{{depIcao}} Delivery, {{callsign}}, stand {{stand}}, request IFR clearance to {{arrIcao}}, information {{atisLetter}}.",
      },
      {
        type: "atc",
        label: "Expected clearance from ATC",
        text: {
          icao: "{{callsign}}, cleared to {{craftClearanceLimit}} via the {{craftRoute}} departure, climb initially {{craftAltitude}}, squawk {{craftSquawk}}, contact {{craftFrequency}} when ready.",
          faa:  "{{callsign}}, cleared to {{craftClearanceLimit}} airport, {{craftRoute}} departure, climb and maintain {{craftAltitude}}, departure frequency {{craftFrequency}}, squawk {{craftSquawk}}.",
        },
      },
      {
        type: "you",
        label: "Your readback",
        text: {
          icao: "Cleared to {{craftClearanceLimit}} via {{craftRoute}}, climb {{craftAltitude}}, squawk {{craftSquawk}}, {{craftFrequency}} when ready, {{callsign}}.",
          faa:  "Cleared to {{craftClearanceLimit}}, {{craftRoute}} departure, climb and maintain {{craftAltitude}}, departure {{craftFrequency}}, squawk {{craftSquawk}}, {{callsign}}.",
        },
      },
    ],
    tips: [
      "Read back every CRAFT element exactly — altitude, squawk, and frequency are mandatory readback items.",
      "Set the assigned squawk on the transponder the moment you read it back.",
    ],
  },

  // -----------------------------------------------------------------------
  {
    id: "pushback",
    name: "Pushback & Startup",
    subtitle: "Request pushback and engine start from Ground.",
    fields: [],
    calls: [
      {
        type: "you",
        label: "Request pushback and startup",
        text: "{{depIcao}} Ground, {{callsign}}, stand {{stand}}, request pushback and startup.",
      },
      {
        type: "atc",
        label: "Expected clearance",
        text: "{{callsign}}, pushback and startup approved, facing {{depRwy|FACING}}.",
      },
      {
        type: "you",
        label: "Readback",
        text: "Pushback and startup approved, {{callsign}}.",
      },
    ],
    tips: [
      "Confirm the brakes are released and ground crew are connected before you call.",
      "Some busy airports split pushback and startup into separate calls — adapt as instructed.",
    ],
  },

  // -----------------------------------------------------------------------
  {
    id: "taxi",
    name: "Taxi",
    subtitle: "Request taxi clearance to the active runway.",
    fields: [
      { id: "taxiRoute",     label: "Taxi route",   placeholder: "A B1 K", wide: true },
      { id: "taxiHoldPoint", label: "Hold point",   placeholder: "CAT II RWY 24L" },
    ],
    calls: [
      {
        type: "you",
        label: "Ready to taxi",
        text: "{{depIcao}} Ground, {{callsign}}, stand {{stand}}, ready to taxi, information {{atisLetter}}.",
      },
      {
        type: "atc",
        label: "Expected taxi clearance",
        text: {
          icao: "{{callsign}}, taxi to holding point {{taxiHoldPoint}} runway {{depRwy}} via {{taxiRoute}}, QNH {{depQnh}}.",
          faa:  "{{callsign}}, taxi to runway {{depRwy}} via {{taxiRoute}}, hold short {{taxiHoldPoint}}, altimeter {{depQnh}}.",
        },
      },
      {
        type: "you",
        label: "Full readback",
        text: {
          icao: "Taxi to holding point {{taxiHoldPoint}} runway {{depRwy}} via {{taxiRoute}}, QNH {{depQnh}}, {{callsign}}.",
          faa:  "Taxi to runway {{depRwy}} via {{taxiRoute}}, hold short {{taxiHoldPoint}}, altimeter {{depQnh}}, {{callsign}}.",
        },
      },
    ],
    tips: [
      "Always read back the full taxi route plus the hold point — this is a mandatory readback.",
      "If the route is long, write it down before you start moving.",
    ],
  },

  // -----------------------------------------------------------------------
  {
    id: "tower",
    name: "Tower",
    subtitle: "Contact Tower when approaching the holding point.",
    fields: [],
    calls: [
      {
        type: "you",
        label: "Check in with Tower",
        text: "{{depIcao}} Tower, {{callsign}}, holding point {{taxiHoldPoint}} runway {{depRwy}}, ready for departure.",
      },
      {
        type: "atc",
        label: "Line up and wait (if traffic ahead)",
        text: "{{callsign}}, line up and wait runway {{depRwy}}.",
      },
      {
        type: "you",
        label: "Readback",
        text: "Line up and wait runway {{depRwy}}, {{callsign}}.",
      },
      {
        type: "atc",
        label: "Takeoff clearance",
        text: "{{callsign}}, wind {{depWind}}, runway {{depRwy}}, cleared for takeoff.",
      },
      {
        type: "you",
        label: "Readback",
        text: "Runway {{depRwy}}, cleared for takeoff, {{callsign}}.",
      },
    ],
    tips: [
      "Do NOT call anyone after takeoff until Tower hands you off to Departure.",
      "If Tower says 'hold position', stop immediately — that's not the same as 'line up and wait'.",
    ],
  },

  // -----------------------------------------------------------------------
  {
    id: "departure",
    name: "Departure",
    subtitle: "Check in with Departure after the handoff, reporting altitude.",
    fields: [
      { id: "departureAltitude", label: "Passing altitude", placeholder: "2500 ft / FL80" },
      { id: "depFrequency",      label: "Departure freq",   placeholder: "119.400" },
    ],
    calls: [
      {
        type: "you",
        label: "Check-in with Departure",
        text: {
          icao: "{{depIcao}} Departure, {{callsign}}, passing {{departureAltitude}} climbing {{craftAltitude}}.",
          faa:  "{{depIcao}} Departure, {{callsign}}, with you passing {{departureAltitude}} for {{craftAltitude}}.",
        },
      },
      {
        type: "atc",
        label: "Radar identified, climb",
        text: {
          icao: "{{callsign}}, identified, climb {{cruiseLevel}}.",
          faa:  "{{callsign}}, radar contact, climb and maintain {{cruiseLevel}}.",
        },
      },
      {
        type: "you",
        label: "Readback",
        text: {
          icao: "Climb {{cruiseLevel}}, {{callsign}}.",
          faa:  "Climb and maintain {{cruiseLevel}}, {{callsign}}.",
        },
      },
    ],
    tips: [
      "Use the altitude you are passing through, not the one you're cleared to.",
      "Don't report 'identified' — that's the controller's word.",
    ],
  },

  // -----------------------------------------------------------------------
  {
    id: "enroute",
    name: "En Route",
    subtitle: "Center handoffs and scratchpad for clearances in the cruise.",
    fields: [
      { id: "enrouteFrequency", label: "Current Center",   placeholder: "128.050" },
      { id: "enrouteNotes",     label: "Scratchpad",       placeholder: "Direct waypoints, new freqs, altitudes…", type: "textarea", wide: true },
    ],
    calls: [
      {
        type: "you",
        label: "Standard Center check-in",
        text: {
          icao: "{{depIcao|CENTER}}, {{callsign}}, level {{cruiseLevel}}.",
          faa:  "{{depIcao|CENTER}}, {{callsign}}, level {{cruiseLevel}}.",
        },
      },
      {
        type: "atc",
        label: "Typical handoff",
        text: "{{callsign}}, contact next Center on {{enrouteFrequency}}, good day.",
      },
      {
        type: "you",
        label: "Handoff readback",
        text: "{{enrouteFrequency}}, {{callsign}}, good day.",
      },
    ],
    tips: [
      "Always read back new frequencies before you switch.",
      "If you get 'direct waypoint', read back the waypoint name, not just 'direct'.",
    ],
  },

  // -----------------------------------------------------------------------
  {
    id: "arrival",
    name: "Arrival",
    subtitle: "Pull the arrival ATIS and note the assigned STAR and approach.",
    fields: [
      { id: "arrAtisLetter",      label: "Information letter", placeholder: "K" },
      { id: "arrRwy",             label: "Landing runway",     placeholder: "27R" },
      { id: "arrWind",            label: "Wind",               placeholder: "270/08" },
      { id: "arrVisibility",      label: "Visibility",         placeholder: "10KM" },
      { id: "arrClouds",          label: "Clouds",             placeholder: "BKN018" },
      { id: "arrTemp",            label: "Temp",               placeholder: "15" },
      { id: "arrDewpoint",        label: "Dewpoint",           placeholder: "11" },
      { id: "arrQnh",             label: "QNH",                placeholder: "1012" },
      { id: "arrTransitionLevel", label: "Transition level",   placeholder: "FL80" },
      { id: "assignedStar",       label: "Assigned STAR",      placeholder: "LAM1H" },
      { id: "assignedApproach",   label: "Assigned approach",  placeholder: "ILS 27R" },
      { id: "arrAtisNotes",       label: "Notes",              placeholder: "Remarks…", type: "textarea", wide: true },
    ],
    calls: [
      {
        type: "you",
        label: "Arrival check-in",
        text: "{{arrIcao}} Arrival, {{callsign}}, descending {{cruiseLevel}}, information {{arrAtisLetter}}.",
      },
      {
        type: "atc",
        label: "Expected assignment",
        text: "{{callsign}}, descend via the {{assignedStar}} arrival, expect {{assignedApproach}} runway {{arrRwy}}.",
      },
      {
        type: "you",
        label: "Readback",
        text: "Descend via the {{assignedStar}} arrival, expect {{assignedApproach}} runway {{arrRwy}}, {{callsign}}.",
      },
    ],
    tips: [
      "Have the arrival ATIS ready before you call Arrival — same rule as departure.",
      "Double-check your STAR matches the landing runway — mismatches are common.",
    ],
  },

  // -----------------------------------------------------------------------
  {
    id: "approach",
    name: "Approach",
    subtitle: "Vectors, final descent, and the cleared approach call.",
    fields: [
      { id: "vectorHeading",     label: "Vector heading", placeholder: "250" },
      { id: "vectorAltitude",    label: "Vector altitude", placeholder: "3000 ft" },
      { id: "approachFrequency", label: "Approach freq",   placeholder: "119.725" },
    ],
    calls: [
      {
        type: "atc",
        label: "Vectors to final",
        text: {
          icao: "{{callsign}}, turn left heading {{vectorHeading}}, descend {{vectorAltitude}}, vectors ILS runway {{arrRwy}}.",
          faa:  "{{callsign}}, turn left heading {{vectorHeading}}, descend and maintain {{vectorAltitude}}, vectors ILS runway {{arrRwy}}.",
        },
      },
      {
        type: "you",
        label: "Vector readback",
        text: {
          icao: "Left heading {{vectorHeading}}, descend {{vectorAltitude}}, {{callsign}}.",
          faa:  "Left heading {{vectorHeading}}, descend and maintain {{vectorAltitude}}, {{callsign}}.",
        },
      },
      {
        type: "atc",
        label: "Cleared for approach",
        text: "{{callsign}}, {{vectorAltitude}} until established, cleared {{assignedApproach}} runway {{arrRwy}}.",
      },
      {
        type: "you",
        label: "Readback",
        text: "{{vectorAltitude}} until established, cleared {{assignedApproach}} runway {{arrRwy}}, {{callsign}}.",
      },
      {
        type: "you",
        label: "Established call (when asked)",
        text: "{{callsign}}, established {{assignedApproach}} runway {{arrRwy}}.",
      },
    ],
    tips: [
      "Only descend on the glideslope once you're established on the localiser.",
      "Don't call 'established' unless the controller asks — most EU ATC wants the call, some don't.",
    ],
  },

  // -----------------------------------------------------------------------
  {
    id: "landing",
    name: "Landing",
    subtitle: "Switch to Tower on final and copy the landing clearance.",
    fields: [],
    calls: [
      {
        type: "you",
        label: "Tower check-in",
        text: "{{arrIcao}} Tower, {{callsign}}, {{assignedApproach}} runway {{arrRwy}}.",
      },
      {
        type: "atc",
        label: "Landing clearance",
        text: "{{callsign}}, wind {{arrWind}}, runway {{arrRwy}}, cleared to land.",
      },
      {
        type: "you",
        label: "Readback",
        text: "Runway {{arrRwy}}, cleared to land, {{callsign}}.",
      },
    ],
    tips: [
      "If you're not cleared to land by 500 ft AGL, call 'final, {{arrRwy}}' as a reminder.",
      "Read back the runway every time — omitting it is a common VATSIM mistake.",
    ],
  },

  // -----------------------------------------------------------------------
  {
    id: "ground",
    name: "Ground",
    subtitle: "Report runway vacated and taxi to stand.",
    fields: [
      { id: "taxiInRoute", label: "Taxi-in route", placeholder: "B K A", wide: true },
      { id: "taxiInStand", label: "Arrival stand", placeholder: "B24" },
    ],
    calls: [
      {
        type: "you",
        label: "Runway vacated",
        text: "{{arrIcao}} Ground, {{callsign}}, runway {{arrRwy}} vacated.",
      },
      {
        type: "atc",
        label: "Taxi to stand",
        text: {
          icao: "{{callsign}}, taxi to stand {{taxiInStand}} via {{taxiInRoute}}.",
          faa:  "{{callsign}}, taxi to gate {{taxiInStand}} via {{taxiInRoute}}.",
        },
      },
      {
        type: "you",
        label: "Readback",
        text: {
          icao: "Taxi to stand {{taxiInStand}} via {{taxiInRoute}}, {{callsign}}.",
          faa:  "Taxi to gate {{taxiInStand}} via {{taxiInRoute}}, {{callsign}}.",
        },
      },
    ],
    tips: [
      "Wait until the whole aircraft is past the runway hold line before calling 'vacated'.",
      "If Ground doesn't answer in 10 seconds, stay on Tower's frequency until they prompt you.",
    ],
  },
];

export const CRAFT_LETTERS = [
  { letter: "C", fieldId: "craftClearanceLimit" },
  { letter: "R", fieldId: "craftRoute" },
  { letter: "A", fieldId: "craftAltitude" },
  { letter: "F", fieldId: "craftFrequency" },
  { letter: "T", fieldId: "craftSquawk" },
];

// -------------------------------------------------------------------------
// REQUIRED_FIELDS: auto-derived set of every field ID that appears in any
// radio-call template across the whole app (ICAO or FAA variant). These are
// the fields whose absence would leave a blank in an actual radio call, so
// they get the red "needs filling" treatment in the UI.
//
// Purely-informational fields (notes, scratchpad, cargo, cost index, etc.)
// are NOT in this set and are treated as optional.
// -------------------------------------------------------------------------
const TOKEN_RE = /\{\{\s*([a-zA-Z0-9_]+)/g;

export const REQUIRED_FIELDS = (() => {
  const set = new Set();
  const scan = (str) => {
    if (typeof str !== "string") return;
    let m;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(str)) !== null) set.add(m[1]);
  };
  for (const phase of PHASES) {
    for (const call of phase.calls || []) {
      const t = call.text;
      if (typeof t === "string") scan(t);
      else if (t && typeof t === "object") for (const v of Object.values(t)) scan(v);
    }
  }
  return set;
})();

// For a given phase, return the IDs of its own fields that are required but
// currently empty in the supplied state. Used for per-phase "missing" counts.
export function missingFieldsForPhase(phase, state) {
  if (!phase || !phase.fields) return [];
  return phase.fields
    .filter((f) => REQUIRED_FIELDS.has(f.id))
    .filter((f) => !String(state[f.id] || "").trim())
    .map((f) => f.id);
}
