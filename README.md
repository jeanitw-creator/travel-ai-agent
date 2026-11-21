# 山海之間｜台灣旅遊週報與行程配對

旅客從台灣旅遊週報進入偏好表單，依旅伴、日期、預算與旅行風格取得附理由的行程建議，也可自行複製諮詢摘要。第一版採 HTML、CSS、JavaScript 與靜態 JSON。

## 開啟網站

1. 保留專案的目錄結構，直接雙擊根目錄的 [index.html](index.html)。
2. 從週報選擇親子、情侶或熟齡入口，再填寫出發日期、同行人數、天數、旅遊風格與預算上限。
3. 展示模式可試用規則式配對。預算以新臺幣、全團全程總額計算。示範價格、行程及成行條件皆標示「模擬資料」。

正式模式目前等待旅行社提供已查核的方案及報價。諮詢摘要保留在本次操作中，由旅客自行複製。網站表單沒有聯絡資料欄位。

## 專案導覽

| 路徑 | 用途 |
| --- | --- |
| [index.html](index.html)、`website/`、`assets/` | 首頁、樣式、配對邏輯與圖像 |
| [週報](docs/weekly-report.md)、[研究來源](research/sources.md)、[研究 JSON](research/travel-data.json) | 旅遊素材與查核紀錄 |
| [CCI](docs/CCI.md)、[SIPOC](docs/SIPOC.md)、[PRD](docs/PRD.md) | 產品定位、分工流程與需求 |
| `data/mock/` | 模擬旅客偏好、方案及價格 |
| [AGENTS.md](AGENTS.md)、[每週交接紀錄](docs/weekly-handoff.md)、[網站驗收](qa/website-acceptance.md) | 每期交接、發布條件與測試結果 |
| [簡報大綱](docs/slides-outline.md)、[HTML 簡報](slides.html)、`video/` | 簡報原稿與影片企劃 |

## 更新資料與驗收

1. 依每週交接紀錄更新研究與週報，記錄研究編號、來源網址、台北查詢日期與待確認事項。發布前重新查核票價、營業時間、交通、活動及開放狀態。
2. 網站透過 HTTP 開啟時讀取 JSON。直接開啟本機檔案時讀取 `index.html` 中的 `offline-research` 與 `offline-demo`。更新 JSON 後，請同步替換兩份離線快照，並複驗兩種開啟方式。
3. 驗收親子、情侶、熟齡流程，以及預算邊界、零結果、過期與待確認資訊、複製備援與響應式版型。正式發布須依交接紀錄完成查核。

## 版本控制

提交網站原始碼、文件、研究、模擬資料與圖像素材。PPTX 與 MP4 成品保留在本機。帳密、API Key、`.env` 和客戶個資放在儲存庫外。提交前核對 `git status --short` 與 `git diff --cached --name-only`，推送前另核對遠端擁有者、儲存庫名稱與可見性。
