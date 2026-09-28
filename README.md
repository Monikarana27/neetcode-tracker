# DSA Forge — GitHub Pages edition

A standalone Java DSA practice workspace. No build step, backend, account, API key, or runtime CDN dependencies.

## Publish on GitHub Pages

1. Extract this ZIP on your computer.
2. Create a GitHub repository, for example `dsa-forge`.
3. Upload the **contents** of the extracted folder to the repository root. `index.html` must be at the root, beside `css/`, `js/`, `data/`, `assets/`, and `.nojekyll`. Do not upload the ZIP itself as the website. Do not add an extra enclosing folder.
4. Commit the files to your `main` branch.
5. In the repository, open **Settings → Pages**. Under **Build and deployment**, select **Deploy from a branch**, then `main` and `/(root)`, and save.
6. Wait for GitHub's Pages deployment to finish, then open the URL shown there, normally `https://YOUR-USERNAME.github.io/dsa-forge/`.

All assets are relative and navigation uses `#today`, `#questions`, etc. The app works at a project subpath. Node, npm, and Java are only for optional development tests; visitors do not need them.

## First use

- Open setup, confirm your study timezone and start date, and set realistic daily minutes.
- The nominal schedule has exactly 90 inclusive dates. September 23, 2026 starts a plan ending December 21, 2026. All 150 core first attempts appear once by day 77. The last 13 days are reserved for revision and six final mocks.
- Start with Today: recall, foundation lesson where scheduled, due reviews, first attempts, reflection.
- Opening LeetCode does not mark work complete. Use **Log outcome** and save an insight. Independent, hinted, solution-followed, and unsuccessful attempts are distinct.
- Use the checkbox to open the outcome form. Unchecking corrects the displayed completion state while retaining history; Undo is available.
- Keep notes and Java code in the question dialog. Notes autosave after a short delay and have an explicit Save button. Conflicting drafts appear in Notebook.
- Review notes stay hidden until you enter recalled reasoning. A recognition check cannot earn a retained re-solve. Retained requires independent full solves on two distinct recorded dates.
- Java Lab includes 81 original teaching cards (33 Java-focused, 48 pattern cards), 34 standalone Java templates, personal flashcards, foundation lessons, and six step-through visualizations.
- Questions are grouped by 48 actual patterns, with search, topic/track/difficulty/status filters, bookmarks, estimates, premium labels, and exact supplied LeetCode links. Extensions are deliberate overrides in strict mode.
- Mocks hide local pattern/hint cues, label previously attempted questions, accept an optional custom LeetCode URL, and save a self-assessment rubric. A mock assessment does not claim the questions were solved: log each outcome separately afterward.
- Timers persist through refresh and keep running while you use LeetCode in another tab. Finish the session and confirm actual study minutes. Breaks do not count. Sessions spanning study midnight split proportionally across dates; manual corrections require a reason.

## Capacity and catch-up

Question estimates differ by difficulty. The plan reserves at least 25% of its estimated workload for review, recall, and notes, plus lighter weekly days. Some phases can exceed your daily capacity even when the whole 90-day total appears affordable. Roadmap shows each over-budget day rather than hiding it.

Catch-up creates a reviewable proposal within remaining capacity before day 78. Work that does not fit remains an explicit backlog, with no automatic deadline extension. Use a reduced commitment by applying the feasible subset, or edit available time. The complete question catalogue remains accessible. Plan and timezone edits retain history. A pause records the reason and does not award a study streak.

## Backups and device transfers

Use **Settings → Export full JSON** each week and before clearing browser data or moving to another device. Use **Import JSON** to preview and merge or replace. A backup of current state downloads before importing. Merge deduplicates event IDs, retains the current plan/settings, and preserves different note text as a conflict for you to resolve. Imported timers are reset to avoid duplicate time credit.

**Export notes** produces readable Markdown. The previous local snapshot is available under Recovery; download it before restoring it. Corrupt raw state is preserved rather than silently replaced. Do not commit personal exported backups to your public repository.

Progress is specific to this browser profile, host, and repository path. Each public visitor gets their own local data. Sync between browsers is optional and described below; there is no encryption, login, or LeetCode submission verification. Clearing site data may remove progress. Private browsing may discard it. Updating files at the same URL does not reset it.

## Optional cross-device sync (Supabase)

Each browser creates a random sync code (a UUIDv4) the first time it loads. Pasting the same code into another browser (**Settings → Sync across devices**) links them. There are no accounts.

**One-time setup:** open Supabase → SQL Editor, paste `supabase/sync.sql`, and run it. Then put your project URL and *anon/publishable* key in `js/sync-config.js`. That key is meant to be public and is safe to commit. **Never commit the `service_role` or any secret key.**

How it behaves:

- On page load the app quietly pulls the server copy for its code, merges it in, and pushes the result back if the server is missing anything. After a local save it pushes again about 2.5 seconds after the last edit. Sync only fills gaps: a record that already has content on a device is never overwritten by remote data. Note that this means an edit to an existing note or review on one device does not replace the older copy already on another device; **Sync now** uploads that device's version to the server, but devices that already hold the older copy keep theirs.
- Not synced (per device): running timers, unfinished mocks, plan/correction history, preserved conflicts, and "not started" corrections. Deleting a bookmark on one device does not remove it elsewhere.
- Security: the table has row-level security on with no policies, so the public key cannot read or list it. Access is only through `get_sync_payload(p_code)` and `upsert_sync_payload(p_code, p_payload)`, which each touch the single row for the code you pass. Codes must be random UUIDv4 values, payloads are capped at 3 MB, and the table at 2,000 rows. **The code is a bearer secret** (anyone holding it can read and change that progress) and data is stored unencrypted. Every visitor who sets up a plan on your public site creates a row in your project.

## Local preview

Do not double-click `index.html` and expect `file://` modules/fetch to work. From the extracted directory, run:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000/`. GitHub Pages uses HTTPS. Writes use Web Locks to serialize same-repository multi-tab changes; use a current browser supporting Web Locks in a secure context (HTTPS or localhost). Unsupported contexts report a save error rather than silently risking concurrent overwrites.

## Development tests

JavaScript tests (Node 20+; no npm install):

```sh
node --test tests/*.test.js
```

Java template compilation and boundary checks (JDK 17):

```sh
mkdir java-build
javac -d java-build tests/java/*.java
java -cp java-build TemplateBoundaryTests
```

If `javac` is not on PATH but the JDK compiler module exists:

```sh
java -m jdk.compiler/com.sun.tools.javac.Main -d java-build tests/java/*.java
```

See `TEST-REPORT.md` for what was actually executed and what remains unverified. `tests/browser-smoke.cjs` is an optional real-browser check requiring a separately installed Playwright development dependency and Chromium. Neither is a runtime dependency.

## Known limits

- Actual browser layout, mobile touch, focus trapping, and multi-tab behavior could not be verified in the build environment: its browser executable download failed. DOM-adapter tests are not a substitute for a real browser.
- Hints are original progressive **pattern learning cues**, not 180 complete problem-specific editorials or solutions. A family template may need significant adaptation for a particular problem.
- Source titles/URLs and premium classifications come from the supplied September 23, 2026 catalogue. Live accessibility of all 180 LeetCode pages was not rechecked. Premium access can change.
- The study plan is an estimate, not a guarantee of interview success. It focuses on DSA; it is not a replacement for projects, CS fundamentals, system design, or behavioral preparation.
- The device clock is trusted. Backward jumps trigger a warning; there is no server-verified clock or tamper-proof achievement system.
- The Java snippets run on LeetCode or your own JDK, not inside this page. The site is not an offline PWA and cannot send notifications while closed.
- This first release has schema version 1. Unknown future versions are rejected safely; no migrations from nonexistent earlier releases are claimed.
