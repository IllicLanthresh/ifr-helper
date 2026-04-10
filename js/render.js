// render.js — renders a phase (fields, CRAFT layout, radio calls, tips) into the DOM.

import { PHASES, CRAFT_LETTERS } from "./phases.js";
import {
  getState, setField, setFields, setPilotId, getPilotId, resetFlight,
} from "./state.js";
import { renderTemplate, pickPhraseology } from "./template.js";
import { fetchSimbrief } from "./simbrief.js";

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else {
      node.setAttribute(k, v === true ? "" : String(v));
    }
  }
  const kids = Array.isArray(children) ? children : [children];
  for (const c of kids) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

// ----- Field renderer ----------------------------------------------------
function renderField(field) {
  const state = getState();
  const isTextarea = field.type === "textarea";
  const input = el(isTextarea ? "textarea" : "input", {
    class: isTextarea ? "field__textarea" : "field__input",
    id: `f-${field.id}`,
    placeholder: field.placeholder || "",
    autocapitalize: field.autocapitalize || "characters",
    autocomplete: "off",
    autocorrect: "off",
    spellcheck: "false",
  });
  if (!isTextarea) input.type = "text";
  input.value = state[field.id] || "";

  input.addEventListener("input", (e) => {
    setField(field.id, e.target.value);
  });

  const wrap = el("div", { class: "field" + (field.wide ? " field--wide" : "") }, [
    el("label", { class: "field__label", for: `f-${field.id}` }, field.label),
    input,
  ]);
  return wrap;
}

// ----- Regular (non-CRAFT) fields grid -----------------------------------
function renderFields(fields) {
  if (!fields || !fields.length) return null;
  return el("section", { class: "section" }, [
    el("h2", { class: "section__title" }, "Flight data"),
    el("div", { class: "fields" }, fields.map(renderField)),
  ]);
}

// ----- CRAFT layout ------------------------------------------------------
function renderCraft(fields) {
  // Build a map id → field def for row lookup
  const byId = {};
  for (const f of fields) byId[f.id] = f;

  const rows = CRAFT_LETTERS.map(({ letter, fieldId }) => {
    const f = byId[fieldId];
    if (!f) return null;
    return el("div", { class: "craft-row" }, [
      el("div", { class: "craft-letter", "data-letter": letter }, letter),
      renderField(f),
    ]);
  }).filter(Boolean);

  return el("section", { class: "section" }, [
    el("h2", { class: "section__title" }, "CRAFT clearance"),
    el("div", { class: "craft" }, rows),
  ]);
}

// ----- Radio calls + tips (shared by all phases) -------------------------
function renderCalls(calls, phraseology) {
  if (!calls || !calls.length) return null;
  const state = getState();

  const blocks = calls.map((c) => {
    const tmpl = pickPhraseology(c.text, phraseology);
    const html = renderTemplate(tmpl, state);
    const tag = c.type === "you" ? "YOU SAY" : "ATC SAYS";
    return el("div", { class: `call call--${c.type}` }, [
      el("div", { class: "call__header" }, [
        el("span", { class: "call__tag" }, tag),
        c.label ? el("span", { class: "call__label" }, c.label) : null,
      ]),
      el("p", { class: "call__text", html }),
    ]);
  });

  return el("section", { class: "section" }, [
    el("h2", { class: "section__title" }, "Radio calls"),
    el("div", { class: "calls" }, blocks),
  ]);
}

function renderTips(tips) {
  if (!tips || !tips.length) return null;
  return el("section", { class: "section" }, [
    el("h2", { class: "section__title" }, "Tips"),
    el("div", { class: "tips" }, tips.map((t) => el("div", { class: "tip" }, t))),
  ]);
}

// ----- Setup phase SimBrief block + reset --------------------------------
function renderSetupBlock() {
  const wrap = el("section", { class: "section" }, [
    el("h2", { class: "section__title" }, "SimBrief import"),
  ]);

  const input = el("input", {
    type: "text",
    class: "field__input",
    id: "pilotIdInput",
    placeholder: "Pilot ID or username",
    autocomplete: "off",
    autocorrect: "off",
    autocapitalize: "off",
    spellcheck: "false",
  });
  input.value = getPilotId();
  input.addEventListener("input", (e) => setPilotId(e.target.value.trim()));

  const status = el("div", { class: "simbrief__status", id: "simbriefStatus" }, "");

  const fetchBtn = el("button", { type: "button", class: "btn btn--primary" }, "Fetch OFP");
  fetchBtn.addEventListener("click", async () => {
    const id = input.value.trim();
    setPilotId(id);
    status.className = "simbrief__status is-loading";
    status.textContent = "Fetching latest OFP…";
    fetchBtn.disabled = true;
    try {
      const patch = await fetchSimbrief(id);
      // Auto-fill CRAFT route from SID if CRAFT route is currently blank.
      const state = getState();
      if (!state.craftRoute && patch.sid) patch.craftRoute = patch.sid;
      if (!state.craftClearanceLimit && patch.arrIcao) patch.craftClearanceLimit = patch.arrIcao;
      setFields(patch);
      status.className = "simbrief__status is-ok";
      status.textContent = `Loaded: ${patch.callsign || "—"}  ${patch.depIcao || "—"} → ${patch.arrIcao || "—"}`;
    } catch (err) {
      status.className = "simbrief__status is-error";
      status.textContent = err.message || "SimBrief fetch failed.";
    } finally {
      fetchBtn.disabled = false;
    }
  });

  wrap.appendChild(el("div", { class: "simbrief" }, [
    el("div", { class: "simbrief__row" }, [
      el("div", { class: "field" }, [
        el("label", { class: "field__label", for: "pilotIdInput" }, "SimBrief Pilot ID / username"),
        input,
      ]),
      fetchBtn,
    ]),
    status,
  ]));

  const resetBtn = el("button", { type: "button", class: "btn btn--danger" }, "Reset / New Flight");
  resetBtn.addEventListener("click", () => {
    if (confirm("Clear all flight data? Your SimBrief Pilot ID will be kept.")) {
      resetFlight();
    }
  });
  wrap.appendChild(el("div", { class: "actions-row" }, [resetBtn]));

  return wrap;
}

// ----- Top-level phase renderer ------------------------------------------
export function renderPhase(container, phaseId, phraseology) {
  const phase = PHASES.find((p) => p.id === phaseId) || PHASES[0];
  container.innerHTML = "";

  container.appendChild(el("header", { class: "phase-header" }, [
    el("h1", { class: "phase-header__name" }, phase.name),
    phase.subtitle ? el("p", { class: "phase-header__subtitle" }, phase.subtitle) : null,
  ]));

  if (phase.custom === "setup") {
    container.appendChild(renderSetupBlock());
  }

  const fieldsSection = phase.layout === "craft"
    ? renderCraft(phase.fields)
    : renderFields(phase.fields);
  if (fieldsSection) container.appendChild(fieldsSection);

  const callsSection = renderCalls(phase.calls, phraseology);
  if (callsSection) container.appendChild(callsSection);

  const tipsSection = renderTips(phase.tips);
  if (tipsSection) container.appendChild(tipsSection);
}
