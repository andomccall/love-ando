---
layout: default
title: The Fully Deployed App Blueprint
description: When strangers need to find or download your idea themselves. The most work, and the one tier to confirm you truly need before you build it.
---

# The Fully Deployed App Blueprint

> The most powerful tier, and the one people reach for too early. Confirm you need it first.

A **fully deployed app** is software strangers can **find and get on their own**:
an app store listing, a searchable public product, a phone app with notifications.
It carries real infrastructure and a real distribution path. It is the right
answer when discovery is the whole point, and the wrong answer when it is not.

## This is you if

- People you have **never met** need to find or download it themselves.
- It needs to live where they already look: **an app store, search, a marketplace**.
- It likely needs **mobile, notifications, or scale** beyond a single hosted page.

Examples: a consumer mobile app, a public product with sign-ups from strangers, a
marketplace, anything whose success depends on being discovered.

## Confirm you actually need this

Most ideas that feel like "an app" are really a [web app](/blueprint-webapp) or an
[artifact](/blueprint-artifact) in disguise. Before you commit to the hardest path,
check:

- Do strangers truly need to **find** it, or will you **share it directly**? If
  you'll share it, you don't need this tier.
- Does it truly need to be **on a phone**, or does a desktop web app do the job?
- Is discovery the **point**, or a nice-to-have? If nice-to-have, start smaller
  and grow into this.

If you cleared all three, you're in the right place.

## What you'll need

- Claude Code to build it.
- A **distribution decision**: web-first (a PWA you can ship today) or native
  (App Store / Play Store, with their review and developer-account overhead).
- **Backend, database, and auth** that can handle strangers, not just you.
- A real **maintenance plan**. This tier is not set-and-forget.

## The build path

1. **Pick the distribution first.** Web-first (PWA) is faster and cheaper to
   start and covers most cases. Go native only when you truly need what native
   gives (app-store presence, deep device features).
2. **Prove the core loop as a web app.** Build the one thing people come for, with
   real data and auth, before touching store listings. This is your
   [web app blueprint](/blueprint-webapp) as phase one.
3. **Harden for strangers.** Accounts, limits, abuse handling, privacy. Different
   from a tool only you use.
4. **Wrap and distribute.** Turn the proven app into the shippable form (PWA
   install, or native shell) and walk the store or internal-deploy path.
5. **Plan upkeep before launch.** Updates, support, uptime. Decide who owns it.

## Drop this into Claude Code

```
You are my build guide. Help me build an app strangers can find and use.

CONCEPT: (one sentence)

Do this in order:
1. First, challenge me: ask 3 questions to confirm this really needs to be a
   fully deployed app and not a simpler web app or artifact. If simpler fits, say so.
2. If it holds, recommend web-first (PWA) vs native and explain the tradeoff for
   MY case specifically.
3. Then have me build the core loop as a hosted web app first: real data, real
   auth, one end-to-end flow.
4. Only after that works, lay out the distribution path (store or internal) and
   the maintenance plan.

Do not skip step 1. Start there now.
```

## Not sure this is the tier?

Run the [Blueprint survey](/blueprint) again, or start one tier down with a
[web app](/blueprint-webapp). Almost nobody regrets starting smaller.

---

This tier is where a human in the loop pays for itself. That is what my live cohort
is for: shipping the real thing without guessing. [Get on the list.](/join)
