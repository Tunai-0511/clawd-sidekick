# Clawd 副駕（Clawd Sidekick）

**住在 Claude Code 輸入框上方的 Clawd 像素小屋。** Claude 在做什麼，Clawd 就走到對應的房間去做，他的夥伴們則在遊戲間玩。小屋下面是平常要看狀態列才知道的數字，還有一份 Claude 交代**你**去做的事。

[English](./README.md)

![Clawd 小屋：Clawd 走到工作室改檔案，藍帽子 Clawd 替子代理跑去瞭望台，另外兩隻在打排球](./docs/clawd-house-zh.gif)

## 功能

**小屋**：五個房間的剖面，靈感來自 [ClawLibrary（龍蝦圖書館）](https://github.com/shengyu-meng/ClawLibrary)。

| 房間 | Clawd 什麼時候去 |
| --- | --- |
| 書庫 | Claude 讀檔、搜尋檔案時 |
| 工作室 | 改檔、想事情時；牆上掛著你的待辦和最近的截止日 |
| 機房 | 跑指令時 |
| 瞭望台 | 上網查資料時（窗外跟著你當地的時間：白天、黃昏、星空） |
| 遊戲間 | 沒事的時候；夥伴們住這裡 |

**三隻戴毛帽的夥伴**（藍、綠、紫）：

- Claude 工作時打**排球**
- 閒著時每 90 秒換一個遊戲：**桌球加電玩**、**跳繩**、**疊積木**
- 晚上 11 點到早上 7 點蓋被子睡覺
- **每個子代理會借走一隻**：他放下遊戲，走到子代理正在用的那個房間，頭上冒泡泡寫著在做什麼，做完再回來玩。剩下的人數不夠時，會自動換成適合的遊戲。

![遊戲間：桌球加電玩、黃昏跳繩、疊積木、深夜睡覺](./docs/game-room.png)

**滑鼠互動**：
- **桌面版**：移到 Clawd 身上，他會跳、冒愛心，說明會告訴你他在做什麼。移到布告欄會列出待辦，移到日曆會顯示截止日，檯燈會亮，電玩會打招呼。
- **終端機**：小屋下面那行會說明游標底下是什麼，點一下 Clawd 就是摸他。

**即時數字**：模型、context 用量、5 小時和 7 天額度、花費、回合計時，以及這回合用了幾次工具、改了幾個檔、跑了幾個指令。超過 50% 變黃，超過 80% 變紅。

**人類那一半**：Claude 的回覆裡如果交代了只有你能做的事，像是建 API 金鑰、上傳檔案、報名，小模型會把它記到布告欄上。清單跨 session、跨專案都保留。按 □（或數字鍵 1–3）打勾，或用 `/todo` 管理。

**截止日雷達**：`/deadline add 12/24 Launch` 會在橫條和牆上日曆顯示倒數。剩不到 3 天 Clawd 會冒汗；剩不到 24 小時日曆會閃紅燈，他會慌張。

**中英切換**：預設跟著系統語言，隨時可以按橫條上的按鈕，或打 `/clawd lang zh|en|auto` 切換。

## 安裝

需要支援 mod 的 Claude Code：終端機 **v2.1.287 以上**，桌面 app 的 Code 分頁 **v2.1.286 以上**。我們在 2.1.288 上測試過。

```bash
claude plugin marketplace add Tunai-0511/clawd-sidekick
claude plugin install clawd-sidekick@clawd-sidekick
```

也可以在 session 裡直接安裝：

```
/plugin install clawd-sidekick --marketplace Tunai-0511/clawd-sidekick
```

裝好之後，在已開的 session 執行 `/reload-plugins`，或開一個新的 session。

## 指令

| 指令 | 用途 |
| --- | --- |
| `/clawd` | 打開面板：大 Clawd、完整待辦清單、所有截止日 |
| `/clawd hide`、`/clawd show` | 把橫條收成一行，或展開 |
| `/clawd lang zh`、`en`、`auto` | 切換語言（`auto` 跟著系統） |
| `/todo` | 列出待辦；也可以 `add 事情`、`done N`、`undo`、`rm N`、`clear` |
| `/deadline` | 列出截止日；也可以 `add 12/24 名稱`、`add 2027-03-01 09:00 名稱`、`add 明天 名稱`、`rm N` |

## 設定（`/config`）

| 設定 | 預設 | |
| --- | --- | --- |
| `autoTodo` | `true` | 自動記下 Claude 交代你的事 |
| `todoModel` | `haiku` | 讀回覆找待辦的模型 |
| `language` | `auto` | `auto`、`en` 或 `zh-TW` |

## 它在你電腦上做什麼

mod 是用你的權限在跑，所以這裡列出它碰到的所有東西（`claude plugin validate .` 列出的也一樣）：

- **模型呼叫**：只在回覆看起來有交代你做事時（例如「你需要…」「請上傳…」），用 `todoModel` 呼叫一次。除此之外不會呼叫模型。
- **執行程式**：啟動時跑一次 `date +%z` 取得時區。語言設成 `auto` 又沒有 `LANG` 時，在 macOS 上跑一次 `defaults read -g AppleLanguages`。
- **儲存**：待辦、截止日、語言和被摸的次數，存在你電腦上這個 plugin 自己的儲存區。
- **環境變數**：讀取 `LANG`、`LC_ALL`、`LC_MESSAGES`。
- **不連網。**

## 開發

```bash
claude --plugin-dir .          # 這個 session 載入這個資料夾，存檔就熱重載
claude plugin validate .
claude plugin test .
```

## 致謝

靈感來自 [ClawLibrary](https://github.com/shengyu-meng/ClawLibrary)。Clawd 是 Anthropic 的 Claude Code 吉祥物。這是非官方的粉絲作品，與 Anthropic 無關，也未經其背書。

MIT 授權。
