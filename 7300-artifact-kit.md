# 7300 Artifact Kit

Build your own private 7300 journal as an app inside Claude, in a single message.
No account to create, no code to write, no server. Your writing lives on your
own device and never leaves it.

This is the **artifact tier** of 7300. If you want the pen-and-paper version,
start with [the 7300 method](/7300). If you want the full hosted app with sync
and voice, that is the third tier.

## What you get

A calm, one-screen journal that:

- Counts today as day X of 7300, so twenty years stays in view.
- Opens each entry pre-set to recap **yesterday**, so there is nothing to set up.
- Keeps the one metric that matters: how consistently you show up.
- Asks you one memory question after each entry, and never repeats it.
- Marks the milestones ahead (day 100, 1000, 7300) and the dates you will reach them.
- Stores everything in your browser, and lets you export it whenever you want.

It is private to you by default. Sharing the link would only hand someone a blank
copy on their own device, never your entries, because there is no server holding
them.

## How to use this kit

1. Open [Claude](https://claude.ai) (or Claude Code).
2. Copy the whole prompt in the next section.
3. Paste it into a new chat and send it.
4. When Claude gives you a published link, that is your journal. Bookmark it.

To keep your entries across devices, use the app's Export button and re-import,
or move up to the full hosted app. Browser storage is per-device by design.

## The build prompt

Copy everything inside this block.

```text
Build me a self-contained personal journal called "7300" and publish it with the
Artifact tool. Give me the link when done.

Concept: 7300 is the number of days in twenty years (20 x 365). This is a
twenty-year daily writing practice with writing as the anchor habit. Everything
runs client-side in one HTML file using localStorage. No backend, no login, no
external calls. My writing must never leave my browser.

Encode this method exactly:
- The entry is a recap of YESTERDAY, written today. I capture evidence of the day
  as it actually happened. I do not manufacture gratitude or affirmations.
  Meaning shows up on its own when I pay attention.
- Closure is the point: agree that yesterday is over, write it once, move on.
- The one tracked metric is consistency. Count entries made against days elapsed
  and show my rate. Let me mark a missed day honestly as a failed entry.

Onboarding:
- Ask for my start date (the day I made the commitment). Day 1 is that date.
- Show "You are on day X of 7300" and the projected end date twenty years out.
- Let me optionally change the total from 7300 so I can pick a different horizon.

Today screen:
- My current day number, large, with "of 7300" beneath it.
- A thin progress bar from day 1 to the end, with year marks.
- A preview of yesterday's entry.
- One clear button to begin today's entry.

Entry screen:
- Pre-fill a header with the weekday, date, location field, and entry number, with
  the word "yesterday" beneath it, so I start with zero friction.
- A large writing field. Offer optional voice dictation with the browser Web
  Speech API, and a typed fallback if speech is unavailable.
- Save the entry to localStorage.
- After saving, ask me ONE memory question to excavate my life. Rotate across
  domains: childhood, mother, father, grandparents, food and the senses, place
  and home, faith, loss, love, work and craft, money, identity, dreams, and the
  small specific details. Never repeat a question. Answering is optional.

Log screen: a reverse-chronological archive with day number, date, my recap, and
any answered question.

Milestones: mark days 1, 100, 250, 500, 1000, 1500, 2000, 2500, 3000, 5000, 7300.
Show which I have reached and project the dates of the ones ahead, with one short
line of encouragement at each.

Data ownership: localStorage only, plus an Export button that downloads all my
entries as a file so I own my data and can move it.

Design: minimal and calm, mobile-first, a single centered column, dark by
default, one accent color or a single soft gradient. Do not use em dashes in the
interface copy. Make it feel like solid ground, not a productivity dashboard.

Publish it as an Artifact, keep it private to me, and give me the link.
```

## Make it yours

Change any of these in the prompt before you send it, or ask Claude to adjust
after:

- **Your horizon.** 7300 is twenty years. Set a different total for a shorter run.
- **Your questions.** Ask Claude to generate a full question set personalized to
  your life, or to skip questions entirely and keep it a pure recap.
- **Your look.** Name your own colors and mood. The default is a dark, quiet
  screen with one gradient.
- **Your language.** Ask for the whole interface in another language.

## See also

- [The 7300 method](/7300): the analog practice this is built on.
- [7300, the full app](/7300-full-app): the hosted version with sync and voice.
- [Love, Ando](/): the root philosophy.
