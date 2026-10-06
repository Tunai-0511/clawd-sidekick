# Clawd Sidekick

**A pixel house for Clawd above your Claude Code prompt.** Clawd walks to the room of whatever Claude is doing, while his crew plays in the game room. Under the house you get the figures you'd normally check the status line for. **It costs you no tokens**: Clawd never calls a model and puts nothing into your conversation.

[繁體中文說明](./README.zh-TW.md)

![Clawd's house: Clawd walks to the workshop to edit a file, a blue-capped Clawd runs to the lookout for a subagent, two others play volleyball](./docs/clawd-house-en.gif)

## What you get

**The house.** It's a cross-section of five rooms, inspired by [ClawLibrary](https://github.com/shengyu-meng/ClawLibrary)'s pixel archive for OpenClaw:

| Room | Clawd goes there when Claude… |
| --- | --- |
| Library | reads or searches files |
| Workshop | edits files or thinks; your deadlines hang on the board and the calendar |
| Server room | runs a command |
| Lookout | searches or fetches the web (the window follows your local time: day, dusk, starry night) |
| Game room | is idle: the crew lives here |

**Four scenes.** Switch them with the **Scene** button on the band, or with `/clawd scene beach`. Every scene keeps the same five zones, so Clawd and the crew behave the same anywhere:

- **House**: library, workshop, server room, lookout, game room
- **Beach**: umbrella, beach desk, lifeguard tower, lighthouse view, beach court with a sandcastle
- **Space station**: archive pod, lab, reactor, observatory, rec deck
- **Forest camp**: tent, log desk, radio hut, treehouse, campfire

![The four scenes: the house, the beach at dusk, the space station, the forest camp at night](./docs/scenes.png)

**The crew.** Three Clawds in blue, green and purple beanies:

- play **volleyball** while Claude works
- take turns at **ping-pong + arcade**, **jump rope** and a **block tower** while it waits (a new game every 90 s)
- sleep under blankets from 11 pm to 7 am
- **lend a player to every subagent**: one puts the game down, walks to the room of the subagent's tool calls with a speech bubble, and comes back when it's done. The others switch to a game that fits who's left.

![The game room: ping-pong and arcade, jump rope at dusk, a block tower, everyone asleep at night](./docs/game-room.png)

**The scene shows what's really happening.** You can read the session from the scene alone, in every scene:

- **Claude's memory is the library.** As the context fills, books fill the house's shelves (and pile up on the floor), the station's data crystals light up one by one, and the book pile grows on the beach and at the camp. When the conversation is compacted, Clawd carries an armful of books off and the shelves empty out.
- **Test runs**: when `npm test`, `pytest`, `go test`, `cargo test` or the like passes, Clawd cheers; when it fails, he sweats.
- **Git**: a commit gets a red stamp, and a push or a new pull request goes off as a sealed envelope. A merged pull request gets a cheer. Claude Code tells the mod what git and gh did, so nothing is guessed from the output.
- **Waiting for your permission**: Clawd holds a big "?" sign up to the glass.
- **Late in the five-hour window** (past 80%), every Clawd gets heavy eyelids and yawns now and then.

![The moments in four scenes: Clawd holds up a "?" sign for your OK in the house, stamps a commit at the camp, sends a push off as an envelope on the beach, and carries the station's data off while compacting; the shelves and crystals show how full the context is](./docs/moments-en.png)

**A life of their own.** The crew keeps its own day by your clock: a picnic lunch at noon and tea at three, even while Claude works. After fifty minutes of work without a break, Clawd stretches and nudges you to do the same. Now and then (a few times a day) a rare sight turns up for a minute and a half: a shooting star across a dark sky, a sparrow on the house's window sill, a whale spouting off the beach, a UFO past the space station's window, a deer peeking out at the camp. Seeing them counts toward a trophy.

![The crew's picnic lunch and afternoon tea, the whale, the UFO and the deer, and a birthday with party hats and confetti](./docs/daily-life.png)

**Make them yours.** `/clawd name Pip` names the main Clawd, and `/clawd name 1 Juniper` a crew member; `/clawd cap 1 red` gives them a beanie of your colour. Each project remembers the scene you last chose for it. `/clawd birthday 10/31` puts everyone in party hats, with confetti, on your birthday.

**A git safety net.** The band shows the project's branch, how far it is ahead of or behind its upstream, and how many files aren't committed; the figure turns yellow after half an hour of uncommitted work and red after two hours or twenty files. When Claude's edits have sat uncommitted for an hour, Clawd stamps a "Time to commit" between turns, with a word on how many files and unpushed commits are waiting.

**What this session changed.** `/clawd changes` (or **Changes** in the `/clawd` pane) lists every file Claude edited or wrote this session, with the lines it added and removed and a dot on this turn's, and the commands it ran with ✓ or ✗. Handy before you commit.

**Clawd in the conversation.** In the Desktop app, a tool's row shows Clawd at his laptop while it runs; once done, a small Clawd (pleased, or worried if it failed) sits by what it did, with an arrow of his own that opens the command and the first lines of its output.

**Neighbors.** Running Claude Code in more than one terminal or window? The other sessions' Clawds come to visit. Up to two busy neighbors walk in from the right to the room of whatever their Claude is doing, in caps of their own and with their project on their bubble, and walk back out when they stop or their session ends. The band lists the sessions next door. They talk through the plugin's own store on your machine; nothing leaves it.

**Trophies.** 78 goals in 21 families, most in four tiers, from a first commit to a hundred days in a row, a million tool calls or a three-hour turn. Every family you reach hangs a medal under the game room's bunting. Some bring the main Clawd a hat (a party hat, a crown, a halo, a wizard hat…), a pal who walks the floor (a cat, an owl, a little crab), or a golden stamp and seal for your commits and pushes. `/clawd trophies` shows where you stand on each; `/clawd hat` and `/clawd pal` choose what he wears and who walks with him. The days you already worked count from the start.

![The medals under the bunting, a crowned Clawd and his cat, in all four scenes](./docs/trophies.png)

<details>
<summary>Every trophy</summary>

| Trophy | For | Bronze | Silver | Gold | Legendary |
| --- | --- | --- | --- | --- | --- |
| Streak | Days in a row with work | 3 d | 7 d + party hat | 30 d + crown | 100 d + cat |
| Days at work | Days with work, in all | 10 d | 50 d | 200 d | 365 d + halo |
| Commits | Commits | 1 | 100 | 1,000 + golden stamp | 5,000 |
| Pushes | Pushes | 1 | 50 | 500 + golden seal | 2,000 |
| Tests passed | Test runs passed | 1 | 100 | 1,000 + mortarboard | 10,000 |
| All green | Test runs passed in a row, with no failure between | 5 | 25 | 100 | 500 |
| Tool calls | Tool calls | 1,000 | 10,000 | 100,000 + headphones | 1,000,000 |
| Files edited | Files edited | 100 | 1,000 | 10,000 | 50,000 |
| Tidy-ups | Times the conversation was compacted | 1 | 10 | 50 + wizard hat | 200 |
| Subagents sent | Subagents sent out | 10 | 100 | 1,000 + captain's cap | 5,000 |
| Night owl | Turns begun between midnight and 5 a.m. | 1 | 25 | 100 + owl | 500 |
| Early bird | Turns begun between 5 and 7 a.m. | 1 | 25 | 100 + flower | 300 |
| Marathon day | Most work in a single day | 4 h | 8 h | 12 h | 16 h |
| Long haul | Longest single turn | 10 min | 30 min | 60 min | 180 min |
| Busiest day | Most tool calls in one day | 300 | 1,000 | 3,000 | 10,000 |
| Pets | Times you petted Clawd | 10 | 100 | 1,000 + little crab | 10,000 |
| PRs merged | Pull requests merged | 1 | 25 | 100 | 500 |
| Globetrotter | Scenes lived in | — | 4 + explorer's hat | — | — |
| Holiday shift | Holidays worked through (Lunar New Year, Halloween, Christmas) | 1 | 2 | 3 | — |
| Rare sights | Rare sights seen (a shooting star, each scene’s visitor) | 1 | 3 | 5 | — |
| Comeback | Passing a test run after three or more failures in a row | 1 | 10 | 50 | — |

</details>

**Seasons and holidays.** The scenes follow the calendar wherever you are, with no network:

- **Seasons**, from your local date: blossoms and drifting petals in spring, a red-and-gold forest and falling leaves in autumn, scarves on every Clawd in winter. South of the equator the seasons turn over: your system time zone (`Australia/Sydney`, `America/Sao_Paulo`) tells Clawd which side you're on.
- **Holidays**: lanterns for Lunar New Year, pumpkins and a witch's hat for Halloween, a tree and a Santa hat for Christmas.

![Spring blossoms in the forest camp, its autumn reds and golds, Halloween pumpkins on the beach at dusk, Christmas night in the house with scarves and a Santa hat](./docs/seasons.png)

**Light and air.** In the Desktop app every room is lit by its own lamps and screens: soft pools of light, a glow on each screen, the day coming in at the window, the warm cast of dusk, rooms gone dim after dark with their lamps still on, and a soft shadow under every Clawd. The air moves too: dust drifting in the house's window light, stars twinkling past the station's window, glints on the sea, fireflies at the camp after sundown.

**Hover and switch.** In the Desktop app, a room under the pointer lights up and shows a card: what the room is for and what it holds right now (Claude's memory in the library, your deadlines on the board, git in the server room, the view outside, the medals in the game room), with the light switch. One switch puts out the whole place: every room goes dim, the screens go dark and the lamps stop glowing, in every scene and every session. The band has the switch too (the terminal's way to it), and `/clawd lights off` works from the keyboard. A Clawd under the pointer gets hearts and a card saying what he's doing, with a pat.

With reduced motion turned on in your system settings, the Desktop scene holds still: no loops, no drifting clouds, leaves or motes, no flicker.

**In the terminal** the house fills up to 256 columns (narrower, the view follows Clawd), and every cell is painted with its own background, so no terminal's line spacing shows through as stripes. Rooms switched off, and the house after dark, are tinted dim there too.

<img src="docs/compacting.gif" alt="While the conversation is compacted, Clawd stomps a pile of pages into a bundle" width="310" align="right">

**A Clawd spinner.** The `Thinking…` line becomes a small Clawd who thinks in dots, then sits down at a laptop and types away while Claude works, beside a clock that counts every second. While the conversation is compacted he stomps a pile of pages down into a neat bundle. In the Desktop app, a tool's row in the conversation shows him at the laptop too while the tool runs. Between turns he stands by on the hint line under the prompt: waving when it's your turn, asleep late at night, with how long the last reply took and today's total. These two lines stay in English in either language, beside Claude Code's own words.

**Clawd's day.** `/clawd recap` (or **Today** in the `/clawd` pane) shows a card of the day so far: how long Clawd worked alongside Claude, turns, tool calls, files edited, commands, tests passed, commits, pushes and tidy-ups, where the day went room by room, the week, and your streak of days in a row. It counts every session and project on the machine, and it's made to be screenshotted and shared.

![Clawd's day: 3 h 12 min with Claude, 14 turns, 148 tool calls, 5 of 6 tests passed, 3 commits, the time by room, the week, and a 4-day streak](./docs/recap-en.png)

**Live figures** under the house: model, context fill, 5-hour and 7-day plan usage, session cost, and your latest message: how long Claude has been on it (or took on the last one), and the tool calls, edits and commands it made there. Each turns yellow past 50% and red past 80%, and past 70% a plan window says when it starts over. Folded, the band keeps one line of it: what Clawd is doing, the context, the 5-hour window, this reply, git and the next deadline.

**Plan limits.** At 80%, 95% and 100% of your 5-hour or 7-day window, Clawd tells you once (a toast, and on his bubble): how much is gone and when it starts over, and nearly out with work uncommitted, to commit first. Once a window, however many sessions you have open.

**This session's summary.** `/clawd summary` (or **Summary** in the `/clawd` pane) shows a card of the session so far: how long Clawd worked alongside Claude, replies, tool calls, the files changed with their +/− lines, commands (and how many failed), tests, commits, pushes, cost, and the files changed most. When the session ends you get it in a toast, and the next session in the same project opens with it.

**Deadline radar.** `/deadline add 12/24 Launch` puts a countdown on the band and the wall calendar, and pins a note on the board, coloured by how near it is. With under 3 days left Clawd sweats; under 24 hours the calendar flashes red and he panics.

**English and 繁體中文.** It follows your system language. Switch any time with the button on the band or `/clawd lang en|zh|auto`.

## Install

You need Claude Code with mods: **v2.1.287+** in the terminal, or **v2.1.286+** in the Desktop app's Code tab. Tested on 2.1.288.

```bash
claude plugin marketplace add Tunai-0511/clawd-sidekick
claude plugin install clawd-sidekick@clawd-sidekick
```

Or from inside a session:

```
/plugin install clawd-sidekick --marketplace Tunai-0511/clawd-sidekick
```

Run `/reload-plugins` in an open session, or start a new one.

### Get updates automatically

Third-party marketplaces don't auto-update by default, and a marketplace can't switch that on for you. Turn it on once: run `/plugin`, open **Marketplaces**, choose **clawd-sidekick**, and select **Enable auto-update**. New versions then download in the background and load the next time you start Claude Code. Without it, run `claude plugin update clawd-sidekick@clawd-sidekick` when you want the latest.

## Commands

| Command | What it does |
| --- | --- |
| `/clawd` | Open the Clawd Sidekick pane: big Clawd, all your deadlines, Today and Trophies |
| `/clawd changes` | Every file Claude changed this session (+/− lines) and every command it ran (✓/✗) |
| `/clawd recap` | Today's card: time worked, the figures, the rooms, the week and your streak |
| `/clawd summary` | This session's card: time worked, replies, files changed, commands, commits, cost |
| `/clawd lights off` · `on` | Put every light out, or back on (`off library` and the like switch one room) |
| `/clawd trophies` | Every trophy family: your tier, your progress, what the next tier brings |
| `/clawd hat <name>` · `auto` · `none` | Put on a hat you've earned (`auto`: the finest) |
| `/clawd pal <name>` · `auto` · `none` | Choose the pal who walks the floor |
| `/clawd name <name>` · `name 1 <name>` · `name reset` | Name the main Clawd or a crew member (1–3) |
| `/clawd cap 1 red` | Give a crew member (1–3) a beanie: blue, green, purple, red, yellow, teal or pink |
| `/clawd birthday 10/31` · `off` | Party hats and confetti on your birthday |
| `/clawd scene house` · `beach` · `space` · `forest` · `next` | Move the Clawds to another scene |
| `/clawd season winter` · `auto` | Set the season by hand, or follow the date |
| `/clawd holiday christmas` · `lunar` · `halloween` · `none` · `auto` | Set the decorations by hand, or follow the date |
| `/clawd hide` · `/clawd show` | Fold the band to one line, or unfold it |
| `/clawd lang en` · `zh` · `auto` | Switch language (`auto` follows the system) |
| `/deadline` | List deadlines; also `add 12/24 Name`, `add 2027-03-01 09:00 Name`, `add tomorrow Name`, `rm N` |

## Settings

These are in `/config`, under the plugin:

| Setting | Default | |
| --- | --- | --- |
| `language` | `auto` | `auto`, `en` or `zh-TW` |

## What it does on your machine

A mod runs with your permissions, so here is everything this one reaches (`claude plugin validate .` lists the same):

- **Model calls and tokens: none.** Clawd never calls a model, never adds to the system prompt or to a tool's result, and its commands answer in a toast rather than in the conversation, so nothing it says is read by the model. Running a `/clawd` or `/deadline` command leaves only its own one-line record, as any slash command does.
- **Processes**: `date +%z` and `readlink /etc/localtime` once at start, for your time zone and which way the seasons run; `defaults read -g AppleLanguages` once, on macOS, when the language is `auto` and no `LANG` is set; and in the project's folder, every 30 seconds and after Claude edits or runs something, `git status --porcelain -b` and `git log -1 --format=%ct`, read-only, for the git safety net.
- **Storage**: your deadlines, scene, language, pet count, the names, caps and birthday you set, each project's scene, each day's figures for the recap, the running totals for the trophies, which rooms' lights are off, which plan-limit warnings were given (by window), each project's last session summary (shown once, then removed), and each open session's word to its neighbors (its project and what it's doing, removed when it ends), in the plugin's own store on your machine. Data that features since removed left there is deleted when a session starts.
- **Environment**: reads `LANG`, `LC_ALL`, `LC_MESSAGES` and `TZ`.
- **Network: none.**

## How it works

- `hooks/themes.ts` draws the four scenes procedurally on a 256 × 28 canvas (`hooks/pixels.ts`). `hooks/scene.ts` adds the Clawds, the crew's places in each game, and what the pointer finds.
- **Desktop app**: `hooks/scene-svg.ts` turns it into one SVG, drawn as an image so a new drawing replaces the last without a blink. The still scene is drawn once. Each of the scene's moving parts loops as a SMIL flipbook of only the pixels that change, and the game being played is a layer of its own, so their periods never multiply. Walking is `animateTransform`. Over the pixels goes the light (`hooks/light.ts`): per room, a dim veil masked by radial pools around its lights, a blur for their glow, and gradients for depth. What the pointer finds is the band's own: unseen strips over each room and Clawd that, hovered, show a native card and an image of what lights up. `color-scheme: light dark` on the root keeps the frame transparent on any theme. When the system asks for reduced motion, every loop holds its first frame and nothing drifts.
- **Terminal**: `hooks/raster.ts` draws the house as a `Raster`, two pixels a cell, each cell carrying its own background, up to 256 columns; the band repaints it in place every tick with `$.ui.blit`.
- `hooks/decor.ts` adds the holidays and the falling petals and leaves; `hooks/seasons.ts` works out the season and the holiday; `hooks/events.ts` turns a finished command into a moment (a test run, a commit, a push, a pull request).
- `hooks/i18n.ts` holds every string in both languages.

## Develop

```bash
claude --plugin-dir .          # load this folder for one session; edits hot-reload
claude plugin validate .
claude plugin test .
```

Type declarations for your Claude Code build appear in `.claude-plugin/types/` the first time the folder loads. After that, `npx -p typescript tsc -p .` type-checks the mod.

### Adding a scene

A scene is one entry in `THEMES` (`hooks/themes.ts`), and its type, `ThemeArt`, makes every part required: the drawing, its moving parts, the light and the toy that answer the pointer, the sky, the signs, `memory` (the thing in the library zone that shows how full the context is), and `glows`, `isIndoor` and `hasDaylight` (what gives off light in each room, and how the scene dims). Leave one out and the mod doesn't type-check. Then the tests in *what happens shows in every scene* run your scene through every memory level and every moment (asking, stamping, sending, tidying, cheering, sweating), and fail if any of them doesn't show or the SVG outgrows its limit.

## Credits

Inspired by [ClawLibrary](https://github.com/shengyu-meng/ClawLibrary). Clawd is Anthropic's Claude Code mascot; this is an unofficial fan project, not affiliated with or endorsed by Anthropic.

MIT License.
