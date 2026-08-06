---
layout: default
title: The Artifact Blueprint
description: When your idea is a self-contained tool people open and use. Build it as a single web file. No hosting, no backend, no bills. Share it as a link.
---

# The Artifact Blueprint

> One file. No server. No monthly bill. The most underrated way to ship.

An **artifact** is a single, self-contained web page: all the HTML, styling, and
logic live in one file. It runs by opening the file or pasting it into a Claude
artifact. No hosting to set up, no database, nothing to keep alive.

## This is you if

- Your idea is a **tool people open and use**, not a process you run.
- It **doesn't need to remember anything** between visits.
- You can **share it directly** with the people who need it (a link, a file).
- You want something visual and interactive without running a company to keep it up.

Examples: a calculator, a quiz, a generator, a one-page tracker, an interactive
checklist, a pricing tool, a small game, a visual explainer.

## What you'll need

- Claude (Claude Code, or the artifacts feature in the Claude app).
- Somewhere free to put the file when you're ready to share: your site, a gist,
  or just send the file itself.
- No accounts, no server, no recurring cost.

## The build path

1. **Name the one job.** An artifact does one thing well. Write that one sentence.
2. **Sketch the screen.** What does a person see first, what do they do, what do
   they get back.
3. **Build it in one file.** Have Claude generate a single HTML file with the
   styling and logic inline. Open it. Try it.
4. **Refine live.** Change a thing, reload, look. Artifacts are fast to iterate
   because there is nothing to deploy.
5. **Ship the link.** Drop the file on your site or hand it over. Done.

## Drop this into Claude Code

```
You are my build guide. Help me build a single self-contained HTML artifact.

CONCEPT: (one sentence: the one job this tool does)

Rules:
- One file. Inline CSS and JS. No backend, no external services, no build step.
- It must work by opening the file directly in a browser.

Do this in order:
1. Ask me up to 5 clarifying questions, one at a time, about what the user sees,
   what they input, and what they get back.
2. Then give me the full single-file artifact.
3. Help me refine it based on what I see when I open it.

Keep it as simple as possible while still doing the job. Start with step 1.
```

## When to level up

The day it needs to **save data**, support **logins**, or serve **many people at
once**, an artifact is not enough. Move up to a [web app](/blueprint-webapp). If
strangers need to **find or download it** on their own, look at a
[full app](/blueprint-app). If it turned out to be a process you repeat, drop back
to a [routine](/blueprint-skill).

---

Want a human in the loop while you build? I run a live cohort for people shipping
their first thing. [Get on the list.](/join)
