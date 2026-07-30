# 十頁分鏡 (Storyboard Pro)

一個專業的 AI 分鏡產生器，使用 Google Gemini 將腳本拆解為具有動態草圖、技術細節與導演批註的電影級分鏡腳本。

線上體驗：`https://<你的 GitHub 帳號>.github.io/storyline/`

## 功能特色

- **腳本智慧拆解**：輸入腳本、時代背景與導演要求，AI 會自動拆解為對應的分鏡列表（場景、台詞、景別、運鏡、燈光、導演筆記等）。
- **人物與時代一致性**：自動萃取人物外貌與時代背景設定，確保所有分鏡的視覺風格一致。
- **AI 草圖生成**：為每個鏡頭生成炭筆素描風格的電影分鏡草圖。
- **風格預設**：內建多種敘事/視覺風格（Mockumentary、賽博朋克、王家衛風格等）。
- **本機專案管理**：專案資料儲存於瀏覽器（IndexedDB），可儲存、載入多個分鏡專案。
- **匯出**：支援匯出為 ZIP 或列印/輸出 PDF。
- **深色/黃昏雙主題**。

## 技術架構

- [React 19](https://react.dev/) + TypeScript
- [Vite](https://vitejs.dev/) 建置工具
- [Tailwind CSS](https://tailwindcss.com/)（CDN）
- [Google Gemini API](https://ai.google.dev/) (`@google/genai`)
- 純前端靜態應用（無後端），資料存放於瀏覽器 IndexedDB / localStorage

```
.
├── App.tsx                  # 主應用程式
├── index.tsx                 # React 進入點
├── index.html
├── components/                # UI 元件
├── hooks/                     # 自訂 React hooks
├── services/                  # Gemini API 與儲存邏輯
├── types.ts
├── vite.config.ts
└── .github/workflows/deploy.yml  # GitHub Pages 自動部署
```

## 本機開發

**環境需求**：Node.js 20+

1. 安裝套件：
   ```bash
   npm install
   ```
2. 設定 Gemini API Key，於專案根目錄建立 `.env.local`：
   ```
   GEMINI_API_KEY=你的_Gemini_API_Key
   ```
   （或者不設定，改在應用程式內「系統設定」中輸入個人 API Key，會儲存在瀏覽器 localStorage，不會上傳。）
3. 啟動開發伺服器：
   ```bash
   npm run dev
   ```
4. 建置正式版本：
   ```bash
   npm run build
   ```
   輸出於 `dist/` 目錄，可用 `npm run preview` 本機預覽。

## 部署到 GitHub Pages

本專案已內建 GitHub Actions workflow（`.github/workflows/deploy.yml`），推送到 `main` 分支時會自動建置並部署到 GitHub Pages。

啟用步驟：

1. 進入 GitHub 專案的 **Settings → Pages**，將 **Build and deployment → Source** 設定為 **GitHub Actions**。
2. （選用）若希望部署站台內建預設 API Key，於 **Settings → Secrets and variables → Actions** 新增名為 `GEMINI_API_KEY` 的 secret。若不設定，使用者仍可在網站的「系統設定」中自行輸入個人 API Key 使用。
3. 推送至 `main` 分支後，於 **Actions** 分頁確認 workflow 執行成功，即可於 `https://<你的 GitHub 帳號>.github.io/storyline/` 存取。

> `vite.config.ts` 中的 `base: './'` 已設定為相對路徑，因此無論部署在 GitHub Pages 的哪一層子路徑下都能正確載入資源。

## 注意事項

- Gemini API Key 屬於敏感資訊：若透過 GitHub Actions secret 注入，該金鑰會被打包進前端靜態檔案中，任何存取該網站的人皆可能取得，僅建議用於個人/內部使用情境。公開分享的部署建議讓使用者各自於「系統設定」輸入自己的 API Key。
