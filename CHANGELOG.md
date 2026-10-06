# Changelog

## 0.14.3

- In the Desktop app, a folded step that is still running ("Checking the changelog…" with spinning dots) shows Clawd at his laptop in the dots' place, with what the step is doing and its clock. Opened, or once done, the row is the app's own again.

## 0.14.2

- Neutral examples throughout: the `/deadline` usage, hints, README and tests no longer use real dates and tasks.

## 0.14.1

- Every trophy now says what it asks, in a plain sentence with the next tier's target: the trophy pane has a line under each family ("Next (Silver): Work on 7 days in a row, for a party hat"), and the unlock toast says what was done. Some names read more plainly: All green, Pets, Marathon day (and in Chinese 測試全綠, 長回合, 工作馬拉松, 改檔, 工具呼叫, 摸摸 Clawd).

## 0.14.0

- **A life of their own.** The crew keeps its own day by your clock: a picnic lunch at noon (rice balls, lunch boxes, a checked cloth) and tea at three (cups, a teapot, cake), whatever Claude is up to. After fifty minutes of work without a five-minute break, Clawd stretches and a toast suggests you do too, then every ten minutes he stretches again.
- **Rare sights.** A few times a day, for a minute and a half, something turns up, the same in every session: a shooting star across a dark sky, or the scene's own visitor (a sparrow on the house's sill, a whale spouting off the beach, a UFO past the station's window, a deer peeking out at the camp). Each scene must have one (`ThemeArt.eggs`). Seeing them counts toward the new "Rare sights" trophies (78 now).
- **Make them yours.** `/clawd name` names the main Clawd or a crew member (tooltips, the folded band, the standing-by line and the recap card use it); `/clawd cap 1 red` changes a crew member's beanie (visitors from other sessions pick colours the crew isn't wearing); each project remembers its scene; `/clawd birthday 10/31` brings party hats for everyone and confetti over any scene on the day.

## 0.13.1

- The desktop's spinner row said the turn's state twice ("Working… 45s · thinking · Thinking"): the desktop names it after the row itself, so Clawd's line there is now the word and the clock.

## 0.13.0

- **No tokens at all.** Removed the to-dos Claude hands you: the notes a small model read off replies, `/todo`, the `autoTodo` and `todoModel` settings, and the "Your half" trophies (75 trophies now). It was the only thing that called a model; Clawd Sidekick now calls none.
- Commands answer in a toast instead of a transcript line, which stayed in the conversation for the model to read on every later turn. `/deadline` with no arguments opens the pane.
- The board pins the deadlines ahead, one note each, coloured by how near they are; its hover lists them.
- In the Desktop app, a tool's row in the conversation shows Clawd at his laptop while the tool runs, with its clock and its command or file; once done, the row is the engine's again.

## 0.12.0

- **Neighbors**: the other Claude Code sessions on the machine come to visit. Each session tells the others what it is up to through the plugin's store (its project, pose, words and whether it is working) when a turn starts or ends and every 15 seconds, and takes it back when it ends. Up to two busy neighbors walk in from the right to the room of what their Claude is doing, in caps of their own (red, yellow, teal, pink) with their project on the bubble, and walk out when they stop or fall quiet for 45 seconds. They never join the crew's games. The band lists the sessions next door.

## 0.11.0

- **Trophies**: 79 goals in 21 families, most in four tiers (bronze, silver, gold, legendary), from a first commit to a hundred days in a row, a million tool calls, a sixteen-hour day or a three-hour turn. Each family reached hangs a medal under the game room's bunting, in every scene. Rewards: nine hats for the main Clawd, three pals who walk the floor (a cat, an owl, a little crab), and a golden stamp and seal for commits and pushes. `/clawd trophies` lists them all with your progress; `/clawd hat` and `/clawd pal` choose. The days kept since 0.10.0 count from the start.
- The holiday hats are drawn from the same table as the new hats; a picked hat stays on over the holidays, an automatic one makes way for the Santa and witch hats.

## 0.10.2

- The spinner's line and the standing-by line stay in English whatever Clawd speaks, since they sit beside Claude Code's own words (`Working…`, `? for shortcuts`).

## 0.10.1

- Between turns, Clawd stands by on the hint line under the prompt: waving when it's your turn, standing by at the start, asleep late at night, with how long the last turn took and today's total. The desktop draws him beside the engine's own hint; the terminal keeps its line and adds a tail.

## 0.10.0

- **Clawd's day**: `/clawd recap`, or **Today** in the `/clawd` pane, shows a card of the day so far: time worked alongside Claude, turns, tool calls, files edited, commands, tests passed, commits, pushes, tidy-ups, the time by room, the week and the streak of days with work. It counts every session and project, one record per local date, and is drawn to be screenshotted and shared (an SVG card on the desktop, text and colour bars in the terminal).

## 0.9.1

- The spinner's working Clawd sits at a laptop, his arms taking turns at the keys, on the desktop and in the terminal. Thinking, he still thinks in dots.
- Removed the leftover poses of the band and the quiz, which nothing used anymore.

## 0.9.0

- **The scene acts out what really happens, in every scene.**
  - Claude's memory is the library: as the context fills, books fill the house's shelves, the station's data crystals light up, and a book pile grows on the beach and at the camp. Compacting, Clawd carries an armful of books off.
  - A passing test run gets a cheer, a failing one a sweat. A commit gets a red stamp; a push or a new pull request goes off as a sealed envelope; a merged pull request gets a cheer.
  - Waiting for your permission, Clawd holds a "?" sign up to the glass.
  - Past 80% of the five-hour window, the Clawds get heavy eyelids.
- Every scene must show all of this: `ThemeArt.memory` is required, and the tests run each scene through every memory level and every moment. See *Adding a scene* in the README.

## 0.8.1

- With a deadline under a day away, the desktop house was redrawn every minute and its loops started over. The scene's countdown now stops at the hour.
- Reduced motion in the system holds every loop on its first frame.
- The main Clawd's speech bubble no longer hides his Santa or witch hat.

## 0.8.0

- Removed real weather: the mod no longer goes online at all. The seasons and holidays stay, and the system time zone now turns the seasons over south of the equator without naming a city.

## 0.7.0

- Real weather on by default, from the city the system time zone is named after. (Removed in 0.8.0.)

## 0.6.0

- Seasons and holidays from the local date: spring petals, autumn leaves, winter scarves, Lunar New Year lanterns, Halloween pumpkins, a Christmas tree.

## 0.5.0

- Four scenes to switch between: the house, the beach, the space station and the forest camp.
- The `Thinking…` spinner becomes a Clawd.
- The desktop band no longer folds itself when narrow.

## 0.4.0

- First public release: the pixel house above the prompt, the crew and their games, hover tooltips, live usage figures, the to-dos Claude hands you, the deadline radar, English and 繁體中文.
