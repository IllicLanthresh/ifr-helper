# IFR Radio Companion

A dark-themed, iPad-friendly step-by-step radio-call assistant for IFR airliner
flights in Microsoft Flight Simulator with VATSIM / BeyondATC. It walks you
through every phase from cold & dark to shutdown, pulls your flight plan from
SimBrief, and generates the exact "YOU SAY / ATC SAYS" blocks you need using
whatever data you've entered.

Designed to sit next to the Fenix A320 EFB and Navigraph Charts on an iPad.

## Features

- **SimBrief import** — paste your Pilot ID (or username) and the latest OFP
  auto-fills callsign, aircraft, DEP/ARR, route, cruise level, SID/STAR, ZFW,
  fuel, pax, cargo, and cost index. Pilot ID is remembered between sessions.
- **12 sequential phases** — Setup → ATIS → Clearance (CRAFT) → Pushback →
  Taxi → Tower → Departure → En Route → Arrival → Approach → Landing → Ground.
- **Dynamic radio calls** — every call template substitutes the data you've
  entered; missing fields show as red underlined blanks so you can see at a
  glance what's still unfilled.
- **ICAO / FAA toggle** — defaults to ICAO phraseology, flip to FAA wording for
  transatlantic flights into the US. The toggle is in the header bar.
- **Dedicated CRAFT layout** — big colour-coded C-R-A-F-T letters next to each
  field on the Clearance phase.
- **Flight state persistence** — everything is saved to `localStorage`, so
  reloading the page (or bumping the browser) never loses your data. Use
  **Reset / New Flight** on the Setup phase to clear it.
- **Tab nav with completion marks** — completed phases show a green check;
  hitting **Next** auto-marks the current phase complete and advances.
- **iPad-first UI** — dark cockpit palette, monospace fields, 48 px+ touch
  targets, no iOS focus-zoom, sticky header + footer.

## Running locally

It's a static site — no build step, no dependencies.

```sh
python3 -m http.server 8000
# then open http://localhost:8000/
```

## Hosting on GitHub Pages

Deployment is automated via GitHub Actions — every push to `master` publishes
the site to GitHub Pages.

**One-time Pages setup** (repo owner does this once):

1. Push to `master` (or merge the feature branch). The `Deploy to GitHub Pages`
   workflow in `.github/workflows/deploy.yml` will run.
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub
   Actions**.
3. After the first successful run, the site is live at
   `https://<owner>.github.io/ifr-helper/`.

Subsequent pushes to `master` redeploy automatically.

## File layout

```
index.html                  Single-page shell
css/style.css               Dark aviation theme
js/
  app.js                    Bootstrap: header, tabs, footer, render orchestration
  state.js                  Flight state + localStorage persistence + pub/sub
  template.js               {{key}} token rendering with blank placeholders
  simbrief.js               SimBrief API fetch + OFP → state mapping
  phases.js                 Declarative phase definitions (fields, calls, tips)
  render.js                 Phase renderer (fields, CRAFT, calls, tips, Setup block)
.github/workflows/deploy.yml  GitHub Pages deploy workflow
```

The 12 phases — their input fields, radio call templates, and tips — all live
in `js/phases.js`. Tweak wording or add new calls there without touching any
other file.

## Disclaimer

This is a training / situational-awareness aid for **flight simulation only**.
Do not use it for real-world operations.
