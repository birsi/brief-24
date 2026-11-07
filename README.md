# 🎄 The Letter of December 24th ✉️

> *Twenty-four doors, twenty-four riddles, one letter that arrives just in time for Christmas Eve.* ❄️

A web app for the 2026 Advent calendar puzzle. Vite, React, TypeScript, no backend. Deployed on Vercel. 🎁

## 🕯️ Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # checks that all 24 answers open their days
npm run build        # production build into dist/
```

Dev mode locally: `http://localhost:5173/?dev`, then `/dev`.

## 🚀 Deploying to Vercel

1. Import the repo into Vercel (framework: Vite, settings come from `vercel.json`).
2. Deploy. Dev mode: `https://<your-domain>/?dev`, then `/dev`.

Keep the repo **private** 🤫: `content/solutions.json` contains every solution.

## 💾 Answers and progress

- Answers, continuations, stamps and hints are plain JSON in the bundle (`src/generated/days.json`). There is no encryption; anyone who opens the dev tools can read them.
- Answers are compared normalized: case, umlauts and spaces don't matter.
- Progress lives in the device's `localStorage`. If Larissa switches devices, use "Solve" in dev mode to set the days retroactively.

## 🗓️ Unlocking

Day N opens on December N, 2026 at 0:00 Vienna time (`GAME_YEAR` in `src/game/store.tsx`). Hints become available after 3, 8 and 15 minutes (`HINT_MINUTES`). In dev mode they are available immediately.

## ✍️ Changing the texts

The texts come from the Claude doc "Der Brief vom 24. Dezember – Texte".

1. Export the doc as Markdown and save it as `content/texts.md`.
2. Run `npm run content` (this also runs automatically on `dev`/`build`).

Taken per day: title, date line, "App – Erzählung" (plain paragraphs only, up to the first bold label), "App – Fortsetzung" (all plain paragraphs) and the three hints. Questions, puzzle widgets and special texts live in `src/game/config.ts`; answers and stamps in `content/solutions.json`.

The notebook's "Figuren" section comes from `content/figures.json`. `open` notes appear once their day is opened, `solve` notes only after the day's answer. `npm test` checks that every note ends up in `src/generated/days.json`. In dev mode, `/dev` → "Figuren prüfen" shows all notes up to a chosen day.

## 🖼️ Media

Everything goes under `public/media/`. If a file is missing, the app shows a placeholder; if audio is missing, the browser voice reads the text aloud. That way everything can be tested before the images and ElevenLabs recordings are ready. 🔔

```
public/media/day-01/narration.jpg       Narration image (3:2, also .webp or .png)
public/media/day-01/resolution.jpg      Resolution image
public/media/day-02/resolution.mp4      Resolution video (days 2, 12, 20, 22, 24), muted, looping
public/media/day-01/narration.mp3       Narration read aloud
public/media/day-01/continuation.mp3    Continuation read aloud
```

### 🎙️ Audio with ElevenLabs

`narration.mp3` and `continuation.mp3` for every day are generated from `content/texts.md`:

1. Put your key and voice into `.env` (gitignored). The voice ID is under *Voices → ⋯ → Copy voice ID*:
   ```
   ELEVENLABS_API_KEY=sk_...
   ELEVENLABS_VOICE_ID=...
   # optional, default eleven_multilingual_v2
   ELEVENLABS_MODEL=eleven_multilingual_v2
   ```
2. `npm run tts -- --dry-run` shows which files would be generated and how many characters (= credits) that costs.
3. `npm run tts` generates them. Try one day first: `npm run tts -- --day 2`.

`content/audio-manifest.json` remembers which text and voice each file was made from. After editing `texts.md`, `npm run tts` regenerates only the changed files. Files that were not made by the script (e.g. hand-made recordings) are left alone unless you pass `--force`. Model, seed and voice settings are in `content/tts-settings.json`:

| Setting | Value | Meaning |
|---|---|---|
| `model` | `eleven_multilingual_v2` | ElevenLabs model (`ELEVENLABS_MODEL` in `.env` overrides it) |
| `seed` | `24` | Same text + settings → same reading. Change it for a different take |
| `stability` | `0.55` | Lower = more expressive, higher = steadier (API default 0.5) |
| `similarity_boost` | `0.8` | How closely it sticks to the voice (default 0.75) |
| `style` | `0.15` | Exaggerates the speaker's style (default 0) |
| `use_speaker_boost` | `true` | Extra closeness to the speaker (default true) |
| `speed` | `0.95` | Below 1 = slower (default 1.0) |

Changing any of them regenerates all script-made files on the next `npm run tts`.

`pronunciations` in the same file replaces words only in the text sent to ElevenLabs; the app keeps showing the original. It turns "Fanny" into "Fanni", so the name is said with a German "a", and spells numbers out ("1926" → "neunzehnhundertsechsundzwanzig"). Changing an entry regenerates only the files that contain it.

The day-5 alibi statements have one voice per character: `content/character-voices.json`, generated with `npm run tts:voices`.

Additional audio:

| File | Content |
|---|---|
| `day-05/voice-1.mp3` … `voice-6.mp3` | The six alibis: Constanze, Hartl, Jonas, Frau Lenz, Mira, Bruno |
| `day-16/sentence-1.mp3` … `sentence-4.mp3` | Jonas' four sentences at the Heuriger |
| `day-19/record.mp3` | The gramophone record of 1926: "Trau nicht dem, der dir zuerst hilft." (with crackle) |
| `day-08/photo-1.jpg` … `photo-6.jpg` | Optional: photos in Frau Lenz's album (photo 4 = girl with dog) |

Generated in the browser, no file needed: the Fraktur table in the notebook (UnifrakturMaguntia, from day 9), bell strikes (day 3), the clockwork's morse ticking (day 22). 🕰️

The image prompts for all days are written to `content/image-prompts.txt` after `npm run content`.

## 🎅 QR codes for the cards

```bash
npm run qr -- https://<your-domain>
```

Generates `qr/day-01.svg` … `day-24.svg` and PNGs (gold #8A6A2F, transparent background) linking to `/day/1` … `/day/24`.

## 🎄 Structure

```
content/            Texts (doc export), solutions, image prompts
scripts/            Build content, QR codes, answer test
src/game/           Configuration, content, game state
src/screens/        Calendar, Day, Delivered, Notebook, Dev mode
src/puzzles/        Puzzle components (Safe, Album, Footprints, Differences, Flashlight …)
src/components/     Snow, garland, audio, media, stamps
```

Frohe Weihnachten! 🌟
