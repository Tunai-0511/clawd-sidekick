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

**四個場景**：按橫條上的「場景」按鈕，或打 `/clawd scene beach` 就能切換。每個場景都有一樣的五個區域，所以 Clawd 們在哪裡的行為都一樣：

- **小屋**：書庫、工作室、機房、瞭望台、遊戲間
- **海灘**：遮陽傘、沙灘書桌、救生塔、燈塔觀景台、有沙堡的沙灘球場
- **太空站**：資料艙、實驗艙、反應爐、觀測窗、娛樂艙
- **森林營地**：帳篷、木桌、無線電小屋、樹屋、營火空地

![四個場景：小屋、黃昏的海灘、太空站、夜晚的森林營地](./docs/scenes.png)

**三隻戴毛帽的夥伴**（藍、綠、紫）：

- Claude 工作時打**排球**
- 閒著時每 90 秒換一個遊戲：**桌球加電玩**、**跳繩**、**疊積木**
- 晚上 11 點到早上 7 點蓋被子睡覺
- **每個子代理會借走一隻**：他放下遊戲，走到子代理正在用的那個房間，頭上冒泡泡寫著在做什麼，做完再回來玩。剩下的人數不夠時，會自動換成適合的遊戲。

![遊戲間：桌球加電玩、黃昏跳繩、疊積木、深夜睡覺](./docs/game-room.png)

**場景會反映真正發生的事**：不用看數字，看場景就知道現在的狀況。四個場景都有：

- **書庫＝Claude 的記憶**：context 用得越多，小屋書架上的書越滿（滿到堆在地上），太空站的資料水晶一顆顆亮起來，海灘和營地的書越疊越高。對話被壓縮時，Clawd 會捧著一疊書去整理，書架隨後跟著清空。
- **跑測試**：`npm test`、`pytest`、`go test`、`cargo test` 這類測試通過時 Clawd 歡呼，沒過時他冒冷汗。
- **Git**：commit 會蓋上紅色印章；push 或開 PR 時，他把一封封好的信寄出去；PR 合併時他歡呼。git 和 gh 做了什麼是 Claude Code 直接告訴 mod 的，不是從輸出猜的。
- **等你批准**：Clawd 舉起一塊寫著「?」的大牌子貼在玻璃上。
- **5 小時額度快用完時**（超過 80%），每隻 Clawd 都眼皮沉重，偶爾打個哈欠。

![四個場景裡的事件：小屋裡舉牌等你批准、營地裡蓋章 commit、海灘上把 push 寄出去、太空站壓縮時搬走資料；書架和水晶顯示 context 用了多少](./docs/moments-zh.png)

**季節、節日**：場景跟著你那邊的日曆變化，全世界都適用，不用連網。

- **季節**：照你當地的日期。春天樹上開花、花瓣飄落；秋天森林轉紅金色、落葉紛飛；冬天每隻 Clawd 都圍上圍巾。在南半球季節會自動顛倒：Clawd 看你電腦的時區（例如 `Australia/Sydney`、`America/Sao_Paulo`）判斷你在赤道哪一邊。
- **節日**：農曆新年掛紅燈籠，萬聖節擺南瓜、戴巫師帽，聖誕節放聖誕樹、戴聖誕帽。

![春天開花的森林營地、秋天轉紅金色的森林、黃昏海灘的萬聖節南瓜、聖誕夜的小屋（圍巾和聖誕帽）](./docs/seasons.png)

**滑鼠互動**：
- **桌面版**：移到 Clawd 身上，他會跳、冒愛心，說明會告訴你他在做什麼。移到布告欄會列出待辦，移到日曆會顯示截止日。每個場景的燈會亮，玩具也會打招呼：電玩機、沙堡裡探頭的小螃蟹、營火的火花。
- **終端機**：小屋下面那行會說明游標底下是什麼，點一下 Clawd 就是摸他。

系統開啟「減少動態效果」時，桌面版的場景會停在靜止畫面，雲和落葉也不會飄。

**Clawd 版 Thinking 列**：「Thinking…」那一列變成一隻小 Clawd。思考時冒點點，Claude 開始工作時他就坐到筆電前打字，旁邊的秒數每秒跳。

**今日戰報**：打 `/clawd recap`，或在 `/clawd` 面板按「今日戰報」，會出現一張今天的卡片，內容包括：
- 陪 Claude 工作了多久
- 回合、工具、改過的檔、指令、測試通過、commit、push、整理記憶的次數
- 時間花在哪些房間
- 這週每天的狀況，以及連續工作了幾天

同一台電腦上所有 session 和專案都會算進去。卡片設計成適合截圖分享的樣子。

![今日戰報：陪 Claude 工作了 3 小時 12 分、14 個回合、148 次工具、測試 6 次過 5 次、3 次 commit、各房間的時間、這週和連續 4 天](./docs/recap-zh.png)

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

### 自動更新

第三方 marketplace 預設不會自動更新，作者也沒辦法替你打開。請自己開一次：
1. 執行 `/plugin`
2. 進入 **Marketplaces**
3. 選 **clawd-sidekick**
4. 選 **Enable auto-update**

之後新版本會在背景下載，下次開 Claude Code 就是新版。沒開的話，想更新時執行 `claude plugin update clawd-sidekick@clawd-sidekick`。

## 指令

| 指令 | 用途 |
| --- | --- |
| `/clawd` | 打開面板：大 Clawd、完整待辦清單、所有截止日 |
| `/clawd recap` | 今日戰報：工作時間、各項數字、各房間的時間、這週、連續天數 |
| `/clawd scene house`、`beach`、`space`、`forest`、`next` | 讓 Clawd 們搬到別的場景 |
| `/clawd season winter`、`auto` | 手動指定季節，或跟著日期 |
| `/clawd holiday christmas`、`lunar`、`halloween`、`none`、`auto` | 手動指定節日佈置，或跟著日期 |
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
- **執行程式**：啟動時各跑一次 `date +%z` 和 `readlink /etc/localtime` 取得時區，用來判斷時間和南北半球。語言設成 `auto` 又沒有 `LANG` 時，在 macOS 上跑一次 `defaults read -g AppleLanguages`。
- **儲存**：待辦、截止日、場景、語言、被摸的次數，以及戰報用的每日數字，存在你電腦上這個 plugin 自己的儲存區。
- **環境變數**：讀取 `LANG`、`LC_ALL`、`LC_MESSAGES`、`TZ`。
- **網路：完全不連網。**

## 開發

```bash
claude --plugin-dir .          # 這個 session 載入這個資料夾，存檔就熱重載
claude plugin validate .
claude plugin test .
```

### 新增場景

一個場景就是 `hooks/themes.ts` 裡 `THEMES` 的一筆資料。它的型別 `ThemeArt` 規定每一項都必填：
- 場景本身的畫法和會動的部分
- 滑鼠移上去會亮的燈和會打招呼的玩具
- 天空和房間名稱的樣式
- `memory`：書庫那一區用來表示 context 用量的東西

少一項，型別檢查就不會過。測試「what happens shows in every scene」還會讓每個場景跑過所有記憶等級和所有事件（舉牌、蓋章、寄信、整理、歡呼、冒汗）。任何一個沒顯示出來，或 SVG 超過大小限制，測試就會失敗。

## 致謝

靈感來自 [ClawLibrary](https://github.com/shengyu-meng/ClawLibrary)。Clawd 是 Anthropic 的 Claude Code 吉祥物。這是非官方的粉絲作品，與 Anthropic 無關，也未經其背書。

MIT 授權。
