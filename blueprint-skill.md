---
layout: default
title: The Routine / Skill Blueprint
description: When your idea is a process you repeat, not an app. Build it as a reusable Claude routine you run on demand. No hosting, no database, nothing to maintain.
---

# The Routine / Skill Blueprint

> The cheapest thing you can build, and the one most people skip straight past.

A **routine** (or skill) is a repeatable process you run inside Claude. You are
not building software that lives somewhere. You are writing down the steps once,
in plain language, so Claude does the same job the same way every time you ask.

## This is you if

- The thing you want is a **task you repeat**, not a product people open.
- It is mostly **for you** (or a couple of people you can hand instructions to).
- Nothing needs to be **saved between runs**: each time starts fresh.
- You do not need a screen, a login, or a link to share.

Examples: turning raw notes into a weekly summary, drafting outreach from a
template, prepping a content slate, running the same research pass every Monday.

## What you'll need

- Claude (the app, or Claude Code if you want it to touch files).
- 20 minutes to describe the process clearly, once.
- That is the whole list. No accounts, no hosting, no cost.

## The build path

1. **Write the job in plain English.** What goes in, what comes out, and the
   steps in between. If you can explain it to a new hire, you can build it.
2. **Turn the steps into instructions.** Number them. Be specific about format,
   tone, and what "done" looks like.
3. **Run it once and watch.** Give Claude a real input. Note every place it
   guessed wrong.
4. **Tighten.** Add the missing rules where it guessed. Two or three passes and
   it holds.
5. **Save it.** Keep the instructions in a file (or a Claude Code skill) so you
   paste one line next time instead of re-explaining.

## Drop this into Claude Code

```
You are my build guide. Help me turn a repeatable task into a reusable routine.

THE TASK: (describe what you do, in one or two sentences)

Do this in order:
1. Ask me up to 5 clarifying questions, one at a time, about the inputs,
   the output format, and the edge cases.
2. Then write the routine as clear numbered instructions I can re-run.
3. Run it once on a sample I give you, then tighten it based on what missed.

Keep it simple enough that I can run it myself every time. Start with step 1.
```

## When to level up

The moment you need to **save results between runs**, hand it to **other people
who won't read instructions**, or give it a **screen**, you have outgrown a
routine. That is the signal to move up to an [artifact](/blueprint-artifact) or a
[web app](/blueprint-webapp).

---

Want a human in the loop while you build? I run a live cohort for people shipping
their first thing. [Get on the list.](/join)
