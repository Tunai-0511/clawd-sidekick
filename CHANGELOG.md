# Changelog

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
