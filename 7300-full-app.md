# 7300, The Full App

The third tier of 7300: the hosted app I run for myself, with real accounts, sync
across devices, a companion who remembers, voice in and voice back, and generative
image artifacts pulled from your entries. This page is how it is built, so you can
build your own.

If you want the simpler versions first, see [the 7300 method](/7300) for pen and
paper, or the [7300 Artifact Kit](/7300-artifact-kit) to build a private local
one inside Claude in a single message.

## What the full app adds

The artifact tier keeps everything on one device with no account. The full app
trades that simplicity for four things:

- **Sync.** Real accounts, so your journal follows you across every device.
- **A companion.** Panny asks one question after each entry and remembers your
  answers, building a picture of your life over years.
- **Voice both ways.** You speak your entry, and Panny speaks back.
- **Memory artifacts.** Details you mention get quietly turned into archived
  images, tagged and shot like objects sealed in an evidence bag.

## The stack

Each layer does one job. You can swap any piece for an equivalent.

| Layer            | Tool                                    | Job                                         |
| ---------------- | --------------------------------------- | ------------------------------------------- |
| App and hosting  | Next.js on Vercel                       | The site itself, deployed and served        |
| Data and sign-in | Supabase                                | Accounts and login codes, database, audio storage |
| Companion        | Anthropic Claude                        | Panny's questions and memory extraction     |
| Panny's voice    | Fish Audio                              | Text to speech in one consistent voice      |
| Your voice       | Web Speech API                          | Live dictation in the browser, no cost      |
| Memory artifacts | Google AI Studio, Gemini Flash image    | The sealed-bag images (the nano banana model) |

## How the pieces fit

The daily loop is short, and most of the intelligence runs after you are done
writing so nothing makes you wait:

1. You open the app, see your day number out of 7300, and speak your recap of
   yesterday. The browser transcribes it live with the Web Speech API.
2. The entry and its audio save to Supabase.
3. Claude reads the entry, picks one question you have never been asked, and pulls
   out any people, places, and details worth keeping.
4. Any strong sensory detail becomes an image prompt. Gemini Flash image renders
   it as an archived artifact, which surfaces days or weeks later so it feels
   found, not generated.
5. At milestone days, the app opens a longer recording, a capsule for the person
   who will someday be where you are now.

## Build your own

You need an account and an API key from each provider above. Google AI Studio is
where you get the Gemini key and can test the image model before wiring it in.
Start from the artifact tier for the shape of the daily loop, then add Supabase
for accounts, Claude for the companion, and Fish Audio and Gemini for voice and
images.

If you would rather have one built for you or your business, I take that on.
[Book time](https://calendar.app.google/zjzZKdWrkvW3jZVk7).

## See also

- [The 7300 method](/7300): the analog practice underneath all of this.
- [7300 Artifact Kit](/7300-artifact-kit): build a private local version in Claude.
- [Love, Ando](/): the root philosophy.
