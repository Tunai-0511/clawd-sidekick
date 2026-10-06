# Clawd Sidekick

**A pixel house for Clawd above your Claude Code prompt.** Clawd walks to the room of whatever Claude is doing, while his crew plays in the game room. Under the house you get the figures you'd normally check the status line for, and a list of things Claude handed **you** to do.

[繁體中文說明](./README.zh-TW.md)

![Clawd's house: Clawd walks to the workshop to edit a file, a blue-capped Clawd runs to the lookout for a subagent, two others play volleyball](./docs/clawd-house-en.gif)

## What you get

**The house.** It's a cross-section of five rooms, inspired by [ClawLibrary](https://github.com/shengyu-meng/ClawLibrary)'s pixel archive for OpenClaw:

| Room | Clawd goes there when Claude… |
| --- | --- |
| Library | reads or searches files |
| Workshop | edits files or thinks; your to-dos and the next deadline hang on the wall |
| Server room | runs a command |
| Lookout | searches or fetches the web (the window follows your local time: day, dusk, starry night) |
| Game room | is idle: the crew lives here |

**The crew.** Three Clawds in blue, green and purple beanies:

- play **volleyball** while Claude works
- take turns at **ping-pong + arcade**, **jump rope** and a **block tower** while it waits (a new game every 90 s)
- sleep under blankets from 11 pm to 7 am
- **lend a player to every subagent**: one puts the game down, walks to the room of the subagent's tool calls with a speech bubble, and comes back when it's done. The others switch to a game that fits who's left.

![The game room: ping-pong and arcade, jump rope at dusk, a block tower, everyone asleep at night](./docs/game-room.png)

**Hover everything.** In the Desktop app, a Clawd under the pointer hops and shows hearts, and his tooltip says what he's doing. The board lists your to-dos, the calendar names the deadline, the lamp switches on and the arcade says hi. In the terminal, the line under the house tells you what's under the pointer, and a click pets that Clawd.

**Live figures** under the house: model, context fill, 5-hour and 7-day plan usage, session cost, the turn timer, and this turn's tool calls, edits and commands. Each turns yellow past 50% and red past 80%.

**The human's half.** When a reply hands you something only you can do, such as creating an API key, uploading a file or signing up for something, a small model notes it on the board. The list carries across sessions and projects. You tick items off with □ (or the keys 1–3), or use `/todo`.

**Deadline radar.** `/deadline add 12/24 Launch` puts a countdown on the band and the wall calendar. With under 3 days left Clawd sweats; under 24 hours the calendar flashes red and he panics.

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

## Commands

| Command | What it does |
| --- | --- |
| `/clawd` | Open the Clawd Sidekick pane: big Clawd, your full to-do list, all deadlines |
| `/clawd hide` · `/clawd show` | Fold the band to one line, or unfold it |
| `/clawd lang en` · `zh` · `auto` | Switch language (`auto` follows the system) |
| `/todo` | List your to-dos; also `add <text>`, `done N`, `undo`, `rm N`, `clear` |
| `/deadline` | List deadlines; also `add 12/24 Name`, `add 2027-03-01 09:00 Name`, `add tomorrow Name`, `rm N` |

## Settings

These are in `/config`, under the plugin:

| Setting | Default | |
| --- | --- | --- |
| `autoTodo` | `true` | Note the to-dos Claude hands you |
| `todoModel` | `haiku` | Model that reads a reply for to-dos |
| `language` | `auto` | `auto`, `en` or `zh-TW` |

## What it does on your machine

A mod runs with your permissions, so here is everything this one reaches (`claude plugin validate .` lists the same):

- **Model calls**: only after a turn whose reply looks like it hands you something ("you'll need to…", "please upload…"), one short call to `todoModel`. Nothing else calls a model.
- **Processes**: `date +%z` once at start, for your time zone; `defaults read -g AppleLanguages` once, on macOS, when the language is `auto` and no `LANG` is set.
- **Storage**: your to-dos, deadlines, language and pet count, in the plugin's own store on your machine.
- **Environment**: reads `LANG`, `LC_ALL` and `LC_MESSAGES`.
- **No network.**

## How it works

- `hooks/scene.ts` draws the house procedurally: 256 × 28 pixels, the crew's places in each game, and what the pointer finds.
- **Desktop app**: `hooks/scene-svg.ts` turns it into one interactive SVG. The static house is drawn once. Each moving part loops as a SMIL flipbook of only the pixels that change. Walking is `animateTransform`, and hovering is CSS `:hover` and `<title>`. `color-scheme: light dark` on the root keeps the frame transparent on any theme.
- **Terminal**: `hooks/scene-client.tsx` is a `Client` surface module with its own frame clock. It draws two pixels per cell with `▀`, and its camera follows Clawd across a crop of up to 150 columns.
- `hooks/i18n.ts` holds every string in both languages.

## Develop

```bash
claude --plugin-dir .          # load this folder for one session; edits hot-reload
claude plugin validate .
claude plugin test .
```

Type declarations for your Claude Code build appear in `.claude-plugin/types/` the first time the folder loads. After that, `npx -p typescript tsc -p .` type-checks the mod.

## Credits

Inspired by [ClawLibrary](https://github.com/shengyu-meng/ClawLibrary). Clawd is Anthropic's Claude Code mascot; this is an unofficial fan project, not affiliated with or endorsed by Anthropic.

MIT License.
