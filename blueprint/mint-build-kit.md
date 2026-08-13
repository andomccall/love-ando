# Mint, Build Blueprint

> A portable build kit. Copy this whole file into Claude Code (or claude.ai) as your
> first message, in an empty folder, and it will help you rebuild Mint from scratch.
> It builds the way we build: in stages, on a knowledge graph and an agent graph, and
> it STOPS for your confirmation before anything ships. You are the one who pushes.

Companion to the visual walkthrough (screens, flow, architecture): the Mint Product
Dossier. Full source repo: `git@github.com:andomccall/mint-app.git` (private, access
on request). Shared in the open, the loveando.org way: push real things into the
world and show exactly how they are made.

---

## How to use this

1. Open Claude Code in an empty folder.
2. Paste this entire file as your first message.
3. Claude scaffolds the project, then builds in stages. At the end of each stage it
   shows you a diff and the exact command, and waits. Nothing reaches GitHub, prod,
   or Stripe until you say go.

---

## What you are building

Mint is a training platform, a lead marketplace, and the system of record for the
setter/closer sales model used by insurance agencies. Setters (SDRs) generate and
work leads; closers (AEs) take the warm transfer and close. It is white-label
multi-tenant, so each agency runs a branded, data-isolated instance.

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Supabase (Postgres + RLS,
Auth, Storage), Stripe (live), LiveKit (audio floor), Vercel. No SMS by decision;
notifications are in-app + web push.

---

## Create these logins first (before we scaffold)

Claude will not create accounts or type your passwords and keys. That is yours to do,
and it is the first gate. Sign up for these, then paste the keys into your local env
file when Claude asks for them. Start every paid service in TEST mode.

- **GitHub**, the repo and pull requests. github.com
- **Supabase**, Postgres, Auth, and Storage. Create one project. supabase.com
- **Vercel**, hosting and per-PR previews. Connect it to your GitHub. vercel.com
- **Stripe**, billing. Create the account but STAY IN TEST MODE until the billing
  rail is reviewed and you flip it live yourself. stripe.com
- **LiveKit** (optional at first), the voice floor. Without it the board shows an
  offline pill and everything else still works. livekit.io
- Later, only if you want CRM call ingest: **GoHighLevel** plus your dialer. Add
  these after the core app runs.

You keep every secret. Claude reads keys only from your local env file, never asks
you to paste a password or key into the chat, and never creates an account on your
behalf. When a step needs a login or a payment method, Claude stops and hands it to
you.

---

## The method: the Work Graph (two graphs, one loop)

Everything runs on two graphs. One maps **what you know**, the other maps **how work
moves**. Every time work moves, it reads from the knowledge graph and writes back to
it, so the next run starts smarter. That loop is the whole point.

### Knowledge graph (what you know), write it down as you go
Keep a short living record so no lesson is relearned cold:
- **The product**: what each screen and flow is for.
- **The decisions**: why you chose a thing, so you do not relitigate it.
- **The gotchas**: anything you paid for once (a migration ordering trap, a
  live-key surprise). Write it the moment it bites.
- **The board** (`STATUS.md`): what is moving now, what is stuck, what needs you.

### Agent graph (how work moves): frame, research, critique, decide, design, ship
Each unit of work passes through these stages. Not every task needs all six, but the
shape holds: understand it, look before you build, have someone check it, decide,
make it, ship it behind the gate below.

---

## The agent roster (the roles to run)

Start lean and add roles only as the work demands:
- **goals**: turns ranked goals into a sequenced plan and names who owns each task.
  Plans, does not build.
- **build**: implements on a branch and opens a pull request. Never merges, never
  performs an irreversible action itself.
- **review**: checks correctness, regressions, and data exposure before merge.
  Reviews and reports, does not merge.
- **db** (add when you touch the schema): proposes and dry-runs migrations, never
  applies to prod itself. Tightest gate.
- **security** (add for the isolation surfaces): read-only review of any code that
  could bypass tenant isolation.

Read-only reviewers are the structural safety: they advise, they cannot act.

---

## The ship pipeline, and the one rule

Every piece of work sits on a four-stage pipeline. Always name the stage.

1. **Branch (local)**: committed on this machine only.
2. **Push (to GitHub)**: uploaded, backed up, still a side branch.
3. **Merge to main**: a pull request proposes the merge; approving it merges to main.
4. **Deploy (live)**: the production build goes out to users.

**THE GATE (this is the part that matters).** The AI never performs an irreversible
or outward action on its own. That includes: **pushing to GitHub, merging to main,
applying a migration to production, moving money or writing to Stripe, sending to a
live customer or agent list, flipping a live integration or rotating keys, and
deploying.** For any of these it produces the exact command or diff, explains the
effect in plain language, and STOPS. You review and you run it. Confirmation is
per-action: approving one push does not pre-approve the next.

If Claude is ever unsure whether something is irreversible, it treats it as
irreversible and asks.

---

## Build order (each stage builds on a branch, then stops at the gate)

Work top to bottom. After each stage: Claude shows the diff, you push or merge.

1. **Scaffold.** Next.js 16 app, a Supabase project, email/password auth, the app
   shell and nav. Confirm before the first push.
2. **The spine and isolation.** The `agents` table that everything hangs off, Row
   Level Security, and `SECURITY DEFINER` helpers (`current_agent_id()`,
   `current_agency_id()`, `is_admin()`) with RESTRICTIVE per-tenant policies. This is
   radioactive (see guardrails); route it through the db and security roles, and
   apply migrations only with your explicit go.
3. **The marketplace.** Lead intake, an AI scan that scores and posts a lead, the
   "cooking" market, a batting order that puts the next closer on deck, and an atomic
   claim (one owner per lead).
4. **The floor dock.** A persistent right-side dock: cooking leads, team chat with a
   bot teammate, and a LiveKit voice board where closers go live on a warm transfer.
5. **The numbers.** A daily tracker (contacts, field intake, warm transfers, closes),
   a check-in board, and leaderboards. A warm transfer counts on completion, not on a
   closer merely reserving the lead.
6. **Admin.** Agents and levels, carriers and products, comp schedules, override
   rules, lead-pool buy-ins.
7. **The billing rail (LIVE money, extra care).** A prepaid token wallet that meters
   the one billable event, a completed field intake. This writes to live Stripe, so
   it gets its own confirmation every time, and a finance review before it goes live.
8. **Sandbox.** Isolated practice leads so new hires train without ever touching the
   real marketplace, numbers, or money.

---

## Guardrails (the radioactive surfaces)

- **Tenant isolation is the worst-case failure.** Three things bypass RLS:
  `SECURITY DEFINER` functions, table-owner views, and the service-role client. Any
  change touching them must state, in plain language, its effect on isolation. When
  in doubt, stop.
- **Stripe is live.** Every write moves real money. It is always behind the gate.
- **PII.** Mint stores health info, medications, financials, and date of birth, and
  deliberately does NOT store SSN or banking. Keep it that way.

---

## Want the person who built it?

This blueprint is one build from Love, Ando: real products pushed into the world,
with the method shown openly. If it helps you build yours, that is the point.

- Read the newsletter and follow the builds: **loveando.org**
- Come to the monthly fireside chat (open Q&A): linked from loveando.org

Take the blueprint. Build the thing.
