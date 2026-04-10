// app.js — bootstrap: wires the header, tab nav, phase renderer, and footer nav.

import { PHASES } from "./phases.js";
import {
  getState, subscribe, setCurrentPhase, markPhaseComplete,
  getPhraseology, setPhraseology,
} from "./state.js";
import { renderPhase } from "./render.js";

const phaseContainer = document.getElementById("phaseContainer");
const tabNav         = document.getElementById("tabNav");
const headerData     = document.getElementById("headerData");
const footerBack     = document.getElementById("btnBack");
const footerNext     = document.getElementById("btnNext");
const footerLabel    = document.getElementById("footerPhaseLabel");
const phraseologyBtns = document.querySelectorAll(".phraseology-toggle__btn");

// ---------- Header ---------------------------------------------------------
function updateHeader() {
  const s = getState();
  const map = {
    callsign: s.callsign || "—",
    route: `${s.depIcao || "—"} → ${s.arrIcao || "—"}`,
    atis: s.atisLetter || s.arrAtisLetter || "—",
    qnh: s.depQnh || s.arrQnh || "—",
    pax: s.pax || "—",
  };
  for (const [k, v] of Object.entries(map)) {
    const node = headerData.querySelector(`[data-hdr="${k}"]`);
    if (node) node.textContent = v;
  }
}

// ---------- Tab nav --------------------------------------------------------
function buildTabs() {
  tabNav.innerHTML = "";
  PHASES.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tab";
    btn.dataset.phase = p.id;
    btn.innerHTML =
      `<span class="tab__index">${String(i + 1).padStart(2, "0")}</span>` +
      `<span class="tab__name">${p.name}</span>` +
      `<span class="tab__check" aria-hidden="true"></span>`;
    btn.addEventListener("click", () => setCurrentPhase(p.id));
    tabNav.appendChild(btn);
  });
}

function updateTabs() {
  const s = getState();
  const tabs = tabNav.querySelectorAll(".tab");
  tabs.forEach((t) => {
    const id = t.dataset.phase;
    t.classList.toggle("is-active", id === s.currentPhase);
    t.classList.toggle("is-complete", !!s.phaseStatus[id]);
    const check = t.querySelector(".tab__check");
    if (check) check.textContent = s.phaseStatus[id] ? "✓" : "";
  });
  // Scroll the active tab into view horizontally.
  const active = tabNav.querySelector(".tab.is-active");
  if (active && active.scrollIntoView) {
    active.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }
}

// ---------- Footer nav -----------------------------------------------------
function currentIndex() {
  const s = getState();
  return Math.max(0, PHASES.findIndex((p) => p.id === s.currentPhase));
}

function updateFooter() {
  const idx = currentIndex();
  footerBack.disabled = idx <= 0;
  footerNext.disabled = idx >= PHASES.length - 1;
  const phase = PHASES[idx];
  footerLabel.textContent = `${String(idx + 1).padStart(2, "0")} / ${String(PHASES.length).padStart(2, "0")}  ${phase.name}`;
}

footerBack.addEventListener("click", () => {
  const idx = currentIndex();
  if (idx > 0) setCurrentPhase(PHASES[idx - 1].id);
});

footerNext.addEventListener("click", () => {
  const idx = currentIndex();
  const cur = PHASES[idx];
  markPhaseComplete(cur.id, true);
  if (idx < PHASES.length - 1) setCurrentPhase(PHASES[idx + 1].id);
});

// ---------- Phraseology toggle --------------------------------------------
function updatePhraseologyButtons() {
  const p = getPhraseology();
  phraseologyBtns.forEach((b) => {
    b.classList.toggle("is-active", b.dataset.phraseology === p);
  });
}
phraseologyBtns.forEach((b) => {
  b.addEventListener("click", () => setPhraseology(b.dataset.phraseology));
});

// ---------- Render orchestration ------------------------------------------
function renderCurrentPhase() {
  const s = getState();
  renderPhase(phaseContainer, s.currentPhase, getPhraseology());
  // After re-rendering fields, make sure focus isn't lost in a visible way:
  // scroll phase container to top so the user sees the phase title.
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

// ---------- Subscribe to state changes ------------------------------------
subscribe((change) => {
  // Header data depends on many fields — update unconditionally.
  updateHeader();

  if (change.type === "currentPhase") {
    updateTabs();
    updateFooter();
    renderCurrentPhase();
    return;
  }
  if (change.type === "phaseStatus") {
    updateTabs();
    return;
  }
  if (change.type === "phraseology") {
    updatePhraseologyButtons();
    renderCurrentPhase();
    return;
  }
  if (change.type === "reset") {
    updateTabs();
    updateFooter();
    renderCurrentPhase();
    return;
  }
  if (change.type === "field" || change.type === "bulk") {
    // Field edits re-render the current phase so radio calls update live.
    // But we must NOT steal focus from the input the user is typing in.
    reRenderPreservingFocus();
  }
});

function reRenderPreservingFocus() {
  const active = document.activeElement;
  const activeId = active && active.id ? active.id : null;
  const selStart = active && "selectionStart" in active ? active.selectionStart : null;
  const selEnd   = active && "selectionEnd"   in active ? active.selectionEnd   : null;

  const scrollY = window.scrollY;

  renderPhase(phaseContainer, getState().currentPhase, getPhraseology());

  window.scrollTo({ top: scrollY, behavior: "auto" });

  if (activeId) {
    const next = document.getElementById(activeId);
    if (next) {
      next.focus({ preventScroll: true });
      if (selStart != null && selEnd != null && "setSelectionRange" in next) {
        try { next.setSelectionRange(selStart, selEnd); } catch {}
      }
    }
  }
}

// ---------- Init ----------------------------------------------------------
buildTabs();
updateHeader();
updateTabs();
updateFooter();
updatePhraseologyButtons();
renderCurrentPhase();
