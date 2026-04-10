// simbrief.js — fetch latest OFP from SimBrief public API and map into state.

const ENDPOINT = "https://www.simbrief.com/api/xml.fetcher.php";

function pick(obj, path, fallback = "") {
  try {
    const parts = path.split(".");
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return fallback;
      cur = cur[p];
    }
    if (cur == null) return fallback;
    if (typeof cur === "object") return fallback;
    return String(cur);
  } catch { return fallback; }
}

function cleanRoute(r) {
  return String(r || "").replace(/\s+/g, " ").trim();
}

// Build a callsign from OFP data. SimBrief puts the ATC callsign in a few places;
// we prefer atc.callsign, then fall back to airline + flight_number.
function deriveCallsign(ofp) {
  const atcCs = pick(ofp, "atc.callsign");
  if (atcCs) return atcCs.toUpperCase();
  const airline = pick(ofp, "general.icao_airline");
  const flightNo = pick(ofp, "general.flight_number");
  if (airline && flightNo) return (airline + flightNo).toUpperCase();
  return "";
}

// Map an OFP JSON response into a partial flight-state patch.
export function mapOfpToState(ofp) {
  const cruise = pick(ofp, "general.initial_altitude");
  // SimBrief returns initial_altitude as feet (e.g. "36000"); convert to FL for brevity.
  let cruiseLevel = "";
  if (cruise) {
    const ft = parseInt(cruise, 10);
    if (!isNaN(ft) && ft >= 1000) cruiseLevel = "FL" + Math.round(ft / 100);
    else cruiseLevel = cruise;
  }

  const patch = {
    callsign:    deriveCallsign(ofp),
    aircraft:    pick(ofp, "aircraft.icao_code") || pick(ofp, "aircraft.icaocode"),
    depIcao:     pick(ofp, "origin.icao_code").toUpperCase(),
    depName:     pick(ofp, "origin.name"),
    arrIcao:     pick(ofp, "destination.icao_code").toUpperCase(),
    arrName:     pick(ofp, "destination.name"),
    route:       cleanRoute(pick(ofp, "general.route")),
    cruiseLevel,
    sid:         pick(ofp, "general.sid_ident"),
    star:        pick(ofp, "general.star_ident"),
    costIndex:   pick(ofp, "general.costindex"),
    zfw:         pick(ofp, "weights.est_zfw"),
    fuel:        pick(ofp, "fuel.plan_ramp"),
    pax:         pick(ofp, "general.passengers"),
    cargo:       pick(ofp, "weights.cargo"),
  };

  // Mirror SID into CRAFT route if CRAFT route isn't set yet (handled by caller).
  return patch;
}

// Fetch latest OFP. Pilot ID can be a numeric ID or username — SimBrief accepts both.
export async function fetchSimbrief(pilotId) {
  const id = String(pilotId || "").trim();
  if (!id) throw new Error("Enter your SimBrief Pilot ID or username first.");

  const url = `${ENDPOINT}?username=${encodeURIComponent(id)}&json=1`;
  let res;
  try {
    res = await fetch(url, { method: "GET", cache: "no-store" });
  } catch (e) {
    throw new Error("Network error — are you offline?");
  }
  if (!res.ok) {
    throw new Error(`SimBrief request failed (${res.status}).`);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("SimBrief returned an unexpected response.");
  }

  // SimBrief returns a `fetch.status` field; "Success" means OK.
  const status = pick(data, "fetch.status");
  if (status && !/success/i.test(status)) {
    throw new Error(status || "SimBrief could not find that pilot.");
  }
  // Some errors come back without fetch.status but with an error string.
  if (data && typeof data === "object" && data.error) {
    throw new Error(String(data.error));
  }

  return mapOfpToState(data);
}
