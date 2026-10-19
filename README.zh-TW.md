# StoryLine

[English](README.md) | [繁體中文](README.zh-TW.md)

**StoryLine** 用 Google Gemini 把腳本轉成電影級分鏡卡：鏡頭拆解、炭筆草圖與導演批註。

![StoryLine：貼上腳本、選擇風格與比例後產生分鏡](docs/screenshot.png)

**線上體驗：** [https://poirotw66.github.io/storyline/](https://poirotw66.github.io/storyline/)

**技術棧：** React 19 · TypeScript · Vite · Tailwind CSS（CDN）· Google Gemini（`@google/genai`）· IndexedDB（專案存在瀏覽器本機）

---

## AI 如何運作

貼上腳本（可選時代背景與導演要求）。Gemini 回傳**結構化 JSON**，每個鏡頭欄位與介面一致，而非自由散文。

**腳本拆解。** 系統提示詞以資深分鏡畫師角色運作：完整覆蓋腳本內容，並為每個鏡頭產出場次、描述、台詞／旁白、景別、拍攝角度、運鏡、燈光、導演筆記，以及用於生圖的英文 `visual_prompt`。

**人物與時代一致性。** 繪圖前模型會先萃取：

- `historical_context`：時代建築、服裝、道具特徵（英文）
- `character_definitions`：主要人物外貌與服裝（英文）

這兩段會寫進每個鏡頭的 `visual_prompt`，生圖時再**額外注入**（`Historical Context` + `Character Definitions` + 鏡頭細節）。固定的炭筆／noir 草圖前綴維持跨鏡頭視覺風格一致。

**分析之後。** 確認生圖模型、畫面比例與並行數量後，鏡頭會並行繪製（預設並行 5）。可編輯欄位、單鏡重繪（版本紀錄）、以 IndexedDB 儲存專案、匯出 ZIP（Markdown + 圖片），或列印／輸出 PDF。

**風格預設**（Mockumentary、賽博朋克、王家衛等）會填入導演要求欄；其中一項會展開為較長的偽紀錄片簡報。

---

## 本機開發

需要 Node.js 20+。

```bash
npm install
```

可選：在專案根目錄建立 `.env.local`：

```
GEMINI_API_KEY=你的_金鑰
```

也可不設檔案，改在應用程式 **系統設定** 輸入 API Key（僅存於瀏覽器 `localStorage`）。

```bash
npm run dev      # 開發伺服器
npm run build    # 輸出至 dist/
npm run preview  # 預覽正式建置
```

---

## 部署

推送到 `main` 會執行 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 並部署到 GitHub Pages（Vite `base: './'`）。

1. **Settings → Pages → Source：** GitHub Actions  
2. 選用：Actions secret `GEMINI_API_KEY` 作為建置預設金鑰  
3. 線上網址：[https://poirotw66.github.io/storyline/](https://poirotw66.github.io/storyline/)

> 打包進靜態檔的金鑰，任何造訪者都可能取得。公開站建議讓使用者在「系統設定」自行輸入金鑰。

---

## 授權

[MIT](LICENSE) © 2026 poirotw66
