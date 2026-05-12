

## 6. 進階配置：建立工具導覽首頁 (Landing Page)

為了避免用戶必須輸入長路徑 (如 /ups-calc/) 才能訪問工具，建議在根目錄建立 index.html 作為入口。

### 實作邏輯
1. 路徑設定：將檔案路徑設定為 path = 'index.html' (根目錄)。
2. 連結導向：在首頁中使用相對路徑連結至子工具，例如 <a href="/websites/ups-calc/">。
3. 部署方式：同樣使用 API 方案進行 PUT 推送。

### 導覽頁維護流程
每當新增一個子工具時，需同步更新根目錄的 index.html：
1. 獲取 index.html 的現有內容 $\rightarrow$ 2. 在 HTML 中插入新的工具卡片 $\rightarrow$ 3. 獲取 sha $\rightarrow$ 4. 推送更新。
