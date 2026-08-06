---
layout: default
title: The Web App + Desktop Blueprint
description: When your idea needs to remember things or serve more than one person. Build it as a hosted web app with a small database. The lightest stack that works.
---

# The Web App + Desktop Blueprint

> The first tier where your idea lives somewhere and keeps running without you in the room.

A **web app** is a site people open in a browser that **remembers things**:
accounts, saved records, a database behind it. It runs on a desktop or a laptop
screen, it can serve a team, and you host it so it stays up. It is not an app-store
build. It is the practical middle: real software, minimal overhead.

## This is you if

- Your idea needs to **save data or support logins**.
- It serves **more than one person**: a team, an org, or a growing audience.
- People reach it through a **link you give them**, not an app store.
- You are willing to **host and lightly maintain** it, or have someone do that.

Examples: a client tracker, an internal dashboard, a booking tool, a small SaaS,
a members area, a CRM for a five-person team.

## What you'll need

- Claude Code to build it.
- A **frontend host** (free tiers exist) and a **database**. The lightest
  combination that works is a static or lightweight frontend plus a hosted
  database like Supabase, which gives you data, auth, and an API without standing
  up a server.
- A little ongoing attention: updates, the occasional fix, keeping the lights on.

## The build path

1. **List the nouns.** What does it store: users, records, items. Those become
   your database tables.
2. **List the verbs.** What can people do: create, view, edit, share. Those
   become your screens and actions.
3. **Start with data + auth.** Get sign-in and one saved record working before
   anything is pretty. If data flows, the rest is decoration.
4. **Build one screen at a time.** End to end, real data, before moving on.
5. **Deploy early.** Put it online while it is small so hosting is never a
   scary final step.
6. **Decide your maintenance line.** Who fixes it when it breaks, and how often
   it changes. Answer this before you launch, not after.

## Drop this into Claude Code

```
You are my build guide. Help me build a hosted web app with saved data.

CONCEPT: (one sentence)

Constraints:
- Recommend the SIMPLEST stack that works. Prefer a lightweight frontend plus a
  hosted database (for example Supabase) over anything heavier.
- Clean, desktop-friendly layout.

Do this in order:
1. Ask me up to 5 clarifying questions, one at a time, about who signs in, what
   gets saved, and the two or three core actions.
2. Then propose the data model (tables and fields) and the screen list, and wait
   for my okay.
3. Build sign-in and one saved record end to end first, then the rest one screen
   at a time. Deploy it early.

Assume I want to keep maintenance light. Start with step 1.
```

## When to level up

If **strangers need to discover or download it themselves**, on an app store, in
search, on a phone, you have crossed into a [full app](/blueprint-app). If it
turned out nobody needs saved data and it is really one screen, drop back to an
[artifact](/blueprint-artifact).

---

Building something real and want a human in the loop? That is exactly who my live
cohort is for. [Get on the list.](/join)
