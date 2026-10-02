/*
 * projects.js: structure, metadata, and rail order. NO PROSE.
 *
 * The words live in index.html. That is the whole architecture, and it is what
 * makes the no-JS view work (SPEC.md section 3). If you are about to add a
 * sentence to this file, add it to index.html instead and reference it by id.
 *
 * Each entry here is keyed to a <section class="series" id="..."> in index.html.
 * viewer.js reads the prose out of that section's DOM. Slice text comes from
 * `article.slice > p[data-depth]`; changing depth means toggling the `hidden`
 * attribute, never rewriting text.
 *
 * Plain global assignment, no imports, no build step. Works from file://.
 *
 * SERIES ORDER is the `order` field, not array position. Sort on it. The
 * sequence below is intentionally not contiguous; do not renumber it to close
 * the gaps. Additional entries may be supplied at runtime by local.js, which is
 * optional and normally absent, so render with:
 *
 *   (window.SERIES).concat(window.SERIES_GATED || []).sort((a,b) => a.order - b.order)
 *
 * This file is deployed, so its COMMENTS are public. Keep notes here about how
 * the data works; anything about what is not in it belongs in SPEC.md, which is
 * not served.
 *
 * Every factual claim in index.html has a row in CLAIMS.md.
 */

/* ---------------------------------------------------------------------------
 * Identity. The rendered strings live in index.html <header>. What is here is
 * the machine-readable copy the viewer chrome needs.
 *
 * CREDENTIALS: "DNP, MSN, RN" at launch (after conferral 2026-08-10).
 * Add "FNP-C" ONLY after BOTH are verified:
 *   1. AANPCB certification (expected ~September 2026), AND
 *   2. Alabama APRN licensure.
 * Certification alone is not enough. Do not pre-date this. Changing it is two
 * edits: here, and the <span class="creds"> in index.html.
 * ------------------------------------------------------------------------- */

window.PROFILE = {
  name: "Perry Martin",
  credentials: "DNP, MSN, RN",

  // Public contact only. No phone, no mailing address. A field whose value is null is UNKNOWN:
  // the viewer must skip it entirely rather than render an empty or placeholder
  // link. LinkedIn stays null until Perry supplies the URL.
  contact: {
    email: "perry@martinapps.dev",
    github: "https://github.com/pmartin1915",
    linkedin: null,
  },

  // Linked downloads. Empty: the CV and resume are sent on request, not posted.
  documents: [],
};

/* ---------------------------------------------------------------------------
 * Slice label schemas. Each series picks one. These must match the <h3> text
 * of the four article.slice elements in that series' section, in order.
 * ------------------------------------------------------------------------- */

window.SCHEMAS = {
  build: ["The problem", "What I built", "How it works", "Where it stands", "Showcase"],
  scholarship: ["The question", "What I did", "Method", "Where it stands", "Showcase"],
};

/* ---------------------------------------------------------------------------
 * Depth control. The viewer's window/level knob, remapped to technical depth.
 *
 * FALLBACK RULE: only depth 2 is required, and it is the only one present in
 * the DOM without `hidden`. Depths 1 and 3 fall back to 2 when absent. The
 * control hides any position with no p[data-depth] anywhere in the current
 * series, and hides entirely on a series that has only depth 2.
 *
 * PERSISTENCE RULE: the stored value is the USER'S preference, not the series'.
 * When a reader on depth 3 moves to a depth-2-only series, render depth 2 and
 * hide the control, but DO NOT overwrite the stored value. Returning to a
 * series that has depth 3 must restore depth 3. Clamp on read, never on write.
 * Get this wrong and the first navigation past Burn Wizard silently pins every
 * reader to depth 2 for the rest of the visit.
 * ------------------------------------------------------------------------- */

window.DEPTHS = [
  { value: 1, label: "Overview", hint: "Plain language" },
  { value: 2, label: "Detail", hint: "Informed reader" },
  { value: 3, label: "Technical", hint: "Engineering detail" },
];

window.DEFAULT_DEPTH = 1;

/* ---------------------------------------------------------------------------
 * Series cleared for publication. `id` matches the section id in index.html.
 * `meta` duplicates the <dl class="meta"> so the viewer's metadata panel does
 * not have to parse it back out of the DOM.
 * ------------------------------------------------------------------------- */

window.SERIES = [
  {
    id: "scoping-review",
    order: 2,
    short: "OPG Scoping Review",
    schema: "scholarship",
    meta: {
      Role: "Sole author",
      Dates: "January 2026 to present",
      Method: "PRISMA-ScR",
      Status: "In revision for submission",
    },
  },
  {
    id: "burn-wizard",
    order: 3,
    short: "Burn Wizard",
    schema: "build",
    meta: {
      Role: "Sole developer",
      Dates: "2024 to present",
      Stack: "React, TypeScript, Vite, Tauri",
      Status: "Live on the App Store and web",
    },
  },
  {
    id: "boardbound",
    order: 5,
    short: "BoardBound",
    schema: "build",
    // No Dates: start year was inferred, not found in any artifact. CLAIMS row 11.
    meta: {
      Role: "Sole developer",
      Stack: "React Native, Expo, Supabase",
      Status: "Live on the App Store as BoardBound Prep",
    },
  },
  {
    id: "wilderness",
    order: 6,
    short: "Wilderness",
    schema: "build",
    meta: {
      Role: "Sole developer",
      Dates: "2024 to present",
      Stack: "React, TypeScript, Vite, Tauri",
      Status: "Live on the App Store",
    },
  },
  {
    id: "budget-dispatcher",
    order: 7,
    short: "budget-dispatcher",
    schema: "build",
    // No Dates (inferred) and no Source link: the repository is private.
    // CLAIMS rows 10 and 11.
    meta: {
      Role: "Author",
      Stack: "Node.js",
      Status: "In daily use; source private",
    },
  },
];
