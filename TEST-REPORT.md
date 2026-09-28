# DSA Forge test report

Build verification: September 24, 2026. This report distinguishes executed checks from unverified browser behavior.

## Executed and passed

- **14 Node test cases**, including a DOM-adapter app workflow smoke test. Run with `node --test tests/*.test.js`.
- Catalogue: 180 unique canonical IDs and URLs, 150 core, 30 extensions, seven premium extensions, no premium core blockers, 48 primary patterns, and valid question/card/template cross-references.
- Curriculum content counts: 81 cards (33 Java, 48 pattern) and 34 Java templates.
- Planner: 90 inclusive dates, September 23 → December 21 fixture, all core first attempts once by day 77, no nominal first attempts in the final 13 days, six final mocks, easy-only opening week, review reserve at least 25%, correct daily overflow arithmetic, and explicit unresolved catch-up backlog when capacity is insufficient.
- Time logic: India midnight fixtures, negative-offset date, leap day, year rollover, spring/fall DST session lengths, and confirmed-session splitting across study midnight.
- Streaks: pending today, duplicate same-day events, gaps, saved-insight requirement, and review-only active days.
- Outcomes: assisted learning, independent solve, later retained re-solve, recognition-only exclusion, completion correction preserving attempts.
- Reviews: intervals, failed recall scheduling, one queue entry per question, review dates beyond the original deadline.
- Backups: schema-1 round trip, malformed/future/oversized rejection, unknown historical note ID preservation, event deduplication, conflicting note preservation, corrupted-data recovery guard, and simulated storage-quota failure without falsely changing saved state.
- Timer logic: timestamp-derived countdowns, refresh serialization, break exclusion, actual-time confirmation, correction reason requirements, and rejection of over-credit.
- Application smoke test with a **DOM adapter**, not Chromium: onboarding, saving a note, logging an independent outcome, bookmarking, rendering all nine routes, and refusing a duplicate active timer.
- All **34 standalone Java templates compiled** with the Java 17 compiler module. The included Java boundary runner passed its checks for complements, empty/duplicate lower bounds, windows, deque maxima, brackets, answer search, negative-only Kadane, impossible coin totals, LCS, palindromes, powers, substring search, overflow-safe median, Fenwick sums, DSU cycles, and staircase bases.
- JavaScript syntax checks passed. Runtime assets were served and fetched under the `/dsa-forge/` project subpath with successful HTTP responses.
- ZIP integrity and root-level `index.html`, `.nojekyll`, relative assets, bundled data, docs, and tests checked before delivery.

## Not verified in a real browser

Playwright was available as a development library, but its Chromium executable was absent. The browser download repeatedly returned an unusable archive. Therefore, **no successful real-browser run or visual screenshot inspection is claimed**.

Still unverified: desktop/mobile visual layout, actual dialog focus/Escape behavior, touch targets, screen readers, 200% text zoom, live midnight UI refresh, browser sleep/restart prompts, simultaneous real-tab note conflicts, native download/import interactions, and actual Pages publication. Web Locks and storage-event coordination are implemented, but real multi-tab runtime verification remains outstanding.

`tests/browser-smoke.cjs` is included for a follow-up Chromium check on a machine with Playwright installed. It is a development tool only. Serve the extracted site on port 8000, then run it. It will create desktop/mobile PNGs locally.

## Content and source limits

The 180 canonical LeetCode links and access labels come from the supplied catalogue; all were checked structurally, but live HTTP availability was not rechecked individually. Java templates are original educational building blocks, not a guarantee that unmodified code solves each linked problem. Inline card snippets are intentionally contextual, and were not all compiled independently. The app does not execute Java.

No interview success probabilities, fabricated study history, or automatic submission verification are included. Dates, time, effort, and outcomes remain local and self-reported.
