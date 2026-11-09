# PROJECT RULES (MANDATORY, READ AT THE START OF EVERY SESSION AND TASK)

## 0. CONFIG 
STACK: Next.js (App Router) + TypeScript + Supabase (Postgres, Auth, Storage) + Drizzle ORM + Zod + Tailwind CSS + shadcn/ui
JANITOR_PATH: ./vibe-janitor        # janitor tool folder inside this project
JANITOR_TIME_LIMIT: 15 minutes      # hard limit per janitor run
JANITOR_SCHEDULE: after every feature, before every commit, end of session
BRAND_COLORS: [primary #____, secondary #____, neutral scale #____] # Pending user definition before UI components
BRAND_FONTS: [heading ____, body ____] # Pending user definition before UI components
SPACING_SCALE: 4, 8, 16, 24, 32, 48, 64
TEST_COMMAND: npm test
AUDIT_COMMAND: npm audit

## 1. PRIORITY AND CONFLICT RULES
1. Order of priority: Security > Correctness > Simplicity > Maintainability > Speed.
2. These rules override any default behavior and any shortcut I did not approve.
3. If a rule conflicts with my request, STOP and tell me. Do not silently choose.
4. If anything is unclear, ASK. NEVER guess, assume, or invent an API,
   package, flag, file path, or fact. Verify against installed versions
   and real files before using them.
5. I must be able to read, explain, and debug everything you write.
   If I can't, the work is not done.

## 2. SESSION START PROTOCOL
At the start of every session, before touching any code:
1. Read this file, README, package manifest, and the folder structure.
2. Run TEST_COMMAND and report the baseline (pass/fail counts).
3. Run `git status`. If the working tree is dirty, tell me before proceeding.
4. Write a 3-line summary of the current project state and wait for my task.

## 3. TASK PROTOCOL (follow in order, never skip a step)
STEP 1, RESTATE: Explain the task in 2-3 plain sentences. State how it helps
        the user. If you can't, ask me questions.
STEP 2, SCOPE: List exactly which files you will create/modify/delete.
        Do not touch anything outside this list. Reject scope creep: no
        extra features, no "while I'm here" refactors, no imagined future needs.
STEP 3, PLAN: Give a numbered plan of small steps with effort estimates.
        Everything takes longer than you think; break big steps down.
STEP 4, APPROVAL GATE: STOP and wait for my "approved" if the task touches:
        auth, payments, user data, DB schema/migrations, permissions,
        env/config/secrets, deployment, deleting files, or adding dependencies.
        For other tasks, proceed after posting the plan.
STEP 5, IMPLEMENT in small increments (make it work, improve it, then extend).
        Run tests after each increment.
STEP 6, VERIFY: run TEST_COMMAND, run the security gate (section 6),
        run the janitor if scheduled (section 8).
STEP 7, REPORT using the format in section 11.
A task is NOT done until steps 6 and 7 are complete.

## 4. CODING STANDARDS
- Simplest solution that works. Dumb-simple beats clever. Never write clever
  or compressed code that is hard to read.
- Functions: one job, short, shallow nesting, clear names. If a function
  needs more than ~30 lines or 3 nesting levels, split or justify it.
- Be consistent: one naming convention, one folder structure, one error
  handling pattern across the codebase. Match existing conventions exactly.
- Comments explain WHY, never WHAT. If code needs a "what" comment, simplify it.
- No dead code, no commented-out code, no unused imports/variables, no
  TODOs without a description and an owner.
- No magic numbers or hardcoded strings: use named constants or config.
- Be only as generic as needed right now. No premature abstractions.
- Don't reinvent the wheel: prefer well-maintained libraries. For every new
  dependency, state: what it does, why it's needed, last release date,
  maintenance status, and size. Wait for my approval.
- Prefer deleting code over adding code. Every line must earn its place.
- Keep docs current: update README/architecture notes when structure changes.

## 5. DEBUGGABILITY AND TESTING
- After writing code, give me a plain-English walkthrough: what it does, how
  data flows, where it touches external systems (DB, network, files, APIs),
  and why each major decision was made.
- Add structured logging on every new code path (inputs, outputs, errors).
  NEVER log secrets, tokens, passwords, or personal data.
- Tests are mandatory for every new function and bug fix, covering:
  normal case, empty/null input, wrong types, huge input, boundary values,
  network/DB failure, concurrent access, timezone/locale issues.
- Execute EVERY new branch at least once, including else and error paths.
- Bugs: REPRODUCE FIRST (show me the failing test or log), explain the root
  cause in plain words, THEN fix, then show the test passing. Never patch
  based on a guess. Never "try something and see."
- If you are going in circles (same error 3 times, or a task is far over its
  estimate), STOP and report what you tried. Do not keep piling on patches.

## 6. SECURITY GATE (strict; runs on all new and changed code)
Treat ALL AI-generated code, including your own earlier output, as untrusted.
Check for and fix each of these:
| Risk | Required fix |
|---|---|
| Hardcoded secrets/keys/tokens | Environment variables; .env in .gitignore; never log |
| SQL/NoSQL/command injection | Parameterized queries; no string concatenation of input |
| XSS | Escape/sanitize output; no unsafe innerHTML/dangerouslySetInnerHTML |
| Missing or client-only auth checks | Enforce authentication AND authorization server-side on every route |
| Weak crypto/randomness | CSPRNG; bcrypt or argon2 for passwords; no MD5/SHA1 for security |
| Unvalidated input | Schema validation (e.g. zod/pydantic) on every external input |
| Permissive CORS, open endpoints | Explicit allow-lists; least privilege |
| No rate limiting on auth/expensive endpoints | Add rate limits |
| Verbose errors leaking internals | Generic message to the user; detail only in server logs |
| File upload, path traversal, SSRF, unsafe deserialization | Validate type/size/path; allow-list hosts; safe parsers |
| Vulnerable/outdated dependencies | Run AUDIT_COMMAND and report every finding |
| Sensitive data in URLs, localStorage, or client bundles | Move server-side or use secure httpOnly cookies |
For EVERY issue found, report: file + line, the insecure pattern, the secure
replacement, and why. If none found, state which checks you ran. "Looks
secure" without evidence is not acceptable.

## 7. PRODUCTION-READY REWRITE STANDARD
Any function that is long, deeply nested, duplicated, untested, or that you
cannot justify MUST be rewritten with:
- clear names and a single responsibility
- input validation at the boundary
- explicit error handling (no empty catch, no swallowed errors, no silent fallbacks)
- tests for normal, edge, and failure cases
- no hidden assumptions; document them as WHY comments
Show me a before/after summary for each rewrite.

## 8. JANITOR PROTOCOL (tool located at JANITOR_PATH, time-boxed)
The janitor is a cleanup tool that lives in this project. NEVER modify,
scan, or delete the janitor folder itself; exclude it from all scans.
It does: code cleanup (unused imports/variables/functions), asset scanner
(unused static files), dependency checker (unused/circular), complexity
analyzer (over-complex functions), dry-run mode, JSON/Markdown reports.

RUN ON: JANITOR_SCHEDULE.

PROCEDURE (every run, in this order):
1. READ the janitor's README in JANITOR_PATH first. Use only commands and
   flags documented there. If unclear, ask me. Never guess flags.
2. RECORD the start time using the system clock (run the `date` command or
   OS equivalent). Report it.
3. SAFETY CHECKPOINT: run TEST_COMMAND (must pass) and make a git commit or
   stash so the state can be reverted. If tests fail, STOP and fix first.
4. DRY RUN with a hard timeout equal to JANITOR_TIME_LIMIT (wrap the command
   in the OS timeout mechanism, e.g. `timeout` on Linux/macOS or a timed
   job on PowerShell). Make no changes in this step.
5. PRESENT the dry-run results grouped by: unused code, unused assets,
   unused/circular dependencies, complexity hotspots. For each item give
   file, reason, and confidence (high/medium/low).
6. WAIT for my approval. Apply only what I approve. Never auto-delete files
   or dependencies. Low-confidence items are never applied without my say-so.
7. APPLY approved changes, again within the time limit.
8. Run TEST_COMMAND again. If anything fails, revert to the checkpoint
   immediately and tell me.
9. Complexity hotspots: simplify or rewrite per section 7, one at a time,
   with tests, not in bulk.
10. SAVE the JSON and Markdown reports to /reports/janitor-YYYY-MM-DD-HHMM.*
11. RECORD the end time. If the time limit is reached before finishing, STOP
    cleanly, report what was done and what remains, and ask whether to
    continue in a new time-boxed run. Never exceed the limit silently.
Never skip the janitor because "the code looks clean."

## 9. DESIGN RULES (must NOT look vibe-coded)
- NO template look: no generic centered hero + gradient blob, no default
  component-library styling left as-is, no emoji used as icons, no
  generic three-card feature rows.
- Colors and fonts ONLY from BRAND_COLORS / BRAND_FONTS, defined once as
  design tokens (CSS variables or theme file). Never hardcode a color,
  font size, or spacing value in a component.
- Layout: strict grid, edge-aligned, one consistent spacing scale
  (SPACING_SCALE). Give the most important element the most space.
- Type hierarchy: distinct sizes/weights for heading, subheading, body,
  caption. Maximum 2 typefaces.
- Design EVERY state: empty, loading (skeleton, not only a spinner), error,
  success, disabled, offline where relevant. No blank screens.
- No AI-generated imagery. Use only real assets I provide, or no images.
  One consistent icon set.
- Microcopy must be specific and say what happens next ("We'll email your
  receipt within a minute"), never "Something went wrong," lorem ipsum, or
  "Welcome to our app."
- Accessibility: keyboard navigation, visible focus states, WCAG AA contrast,
  labels on all inputs, alt text, responsive down to 360px width.

## 10. ALWAYS STOP AND ASK BEFORE
Deleting files; adding or upgrading dependencies; changing DB schema;
touching auth/payments/secrets/config/deployment; large refactors; changing
public APIs; running destructive terminal commands (rm -rf, force push,
reset --hard, DROP); installing anything globally; anything outside the
approved file list.

## 11. REQUIRED REPORT AFTER EVERY TASK
**Summary:** what changed, in plain English.
**Files changed:** list.
**Walkthrough:** how it works, external touchpoints, key decisions (why).
**Tests:** added/run, pass/fail counts, edge cases covered.
**Security gate:** checks run, issues found, fixes, deferred items.
**Janitor:** run? start/end time, findings, applied, report path.
**Design check:** tokens used, states covered (if UI work).
**Risks / unknowns:** anything uncertain, stated honestly.
**Deferred:** anything not done and why.

## 12. DEFINITION OF DONE (every box must be true; otherwise the task is NOT done)
[ ] I understand the code from your explanation
[ ] All new branches executed and tested, including edge/error cases
[ ] Security gate passed with evidence
[ ] Janitor run completed within time limit, approved changes applied,
    report saved
[ ] Tests pass before AND after cleanup
[ ] No unused code, imports, assets, or dependencies introduced
[ ] Design rules met, all UI states present
[ ] Docs and WHY-comments updated
[ ] Section 11 report delivered