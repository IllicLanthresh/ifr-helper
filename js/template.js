// template.js — {{key}} token rendering with blank placeholders.
//
// Usage:
//   renderTemplate("{{callsign}}, cleared to {{arrIcao}}", state)
//     → HTML string with <span class="blank">_____</span> for empty fields.
//
// Supports {{key|fallback text}} to customize the blank label.

const TOKEN = /\{\{\s*([a-zA-Z0-9_]+)(?:\s*\|\s*([^}]*))?\s*\}\}/g;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderTemplate(str, state) {
  if (typeof str !== "string") return "";
  let out = "";
  let lastIndex = 0;
  let m;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(str)) !== null) {
    out += escapeHtml(str.slice(lastIndex, m.index));
    const key = m[1];
    const fallback = m[2] != null ? m[2].trim() : "";
    const raw = state[key];
    const value = raw == null ? "" : String(raw).trim();
    if (value) {
      out += `<span class="val">${escapeHtml(value)}</span>`;
    } else {
      const label = fallback || key.toUpperCase();
      out += `<span class="blank" data-key="${escapeHtml(key)}">${escapeHtml(label)}</span>`;
    }
    lastIndex = m.index + m[0].length;
  }
  out += escapeHtml(str.slice(lastIndex));
  return out;
}

// Pick the right phraseology variant for a call `.text` value.
// A call's text can be either a string (shared) or { icao, faa } object.
export function pickPhraseology(text, style) {
  if (typeof text === "string") return text;
  if (text && typeof text === "object") {
    return text[style] || text.icao || text.faa || "";
  }
  return "";
}
