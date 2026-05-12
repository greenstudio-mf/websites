# GitHub Pages 自動部署指南 (API 方案)

本文件記錄如何繞過本地 Git 環境複雜度，直接利用 GitHub REST API 實現網頁工具的快速部署。

## 1. 核心邏輯
傳統 `git clone` $\rightarrow$ `commit` $\rightarrow$ `push` 流程容易受分支名稱 (`main`/`master`)、認證快取、`.git` 狀態損壞影響。
**API 方案** 直接將檔案內容以 Base64 編碼發送至 GitHub 伺服器，等同於直接在網頁端編輯檔案，穩定性最高。

## 2. API 方案 vs 傳統 Git 方案比較

| 維度 | GitHub API (本方案) | 傳統 Git CLI |
| :--- | :--- | :--- |
| **速度** | 極快 (單檔秒傳) | 較慢 (需 Clone/Pull/Push) |
| **穩定性** | 極高 (無分支衝突問題) | 中 (易受 `merge conflict` 影響) |
| **單檔上限** | 20 MB | 100 MB (LFS 可更高) |
| **批量處理** | 慢 (一檔一次請求) | 快 (一次提交數千個檔案) |
| **設定複雜度**| 極低 (僅需 Token) | 高 (需設定 SSH/Credential/Branch) |

## 3. API 限制說明
使用 API 部署時需注意以下限制：
- **速率限制 (Rate Limits)**：認證請求每小時上限 5,000 次（對於網頁部署綽綽有餘）。
- **檔案大小**：單檔最大不得超過 20 MB。
- **傳輸格式**：內容必須經過 Base64 編碼。
- **提交方式**：每次請求僅能處理單一檔案。

## 4. 必要準備
### 認證設定
在 `~/.hermes/.env` 中儲存 Classic Token：
```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

### 權限要求
Token 必須具備 `repo` 權限（Full control of private repositories）。

## 5. 部署流程 (技術實作)


### A. 檔案編碼
GitHub API 要求檔案內容必須經過 **Base64 編碼**。
- **Python**: `base64.b64encode(content).decode('utf-8')`

### B. API 端點
使用 `PUT` 方法發送請求至：
`https://api.github.com/repos/{owner}/{repo}/contents/{path}`

### C. 請求標頭 (Headers)
- `Authorization`: `token <YOUR_TOKEN>`
- `Accept`: `application/vnd.github.v3+json`

### D. 請求內容 (JSON Body)
- `message`: Commit 訊息 (必填)
- `content`: Base64 編碼後的內容 (必填)
- `sha`: 如果是**更新**現有檔案，必須提供該檔案目前的 `sha` 值 (先透過 `GET` 請求獲取)。

## 4. 故障排除 (Troubleshooting)

| 錯誤現象 | 原因 | 解決方案 |
| :--- | :--- | :--- |
| `401 Unauthorized` | Token 錯誤或過期 | 檢查 `.env` 是否有空格/換行，重新產生 Token |
| `404 Not Found` | Repo 路徑錯誤或權限不足 | 確認 Repo 名稱正確且 Token 具有 `repo` 權限 |
| `409 Conflict` | 檔案已存在且未提供 `sha` | 先執行 `GET` 獲取檔案 `sha` $\rightarrow$ 將其放入 `PUT` 請求中 |
| `400 Bad Request` | JSON 格式錯誤或編碼問題 | 確保使用 `json=data` 而非 raw body，且內容為正確的 Base64 |

## 5. 快速部署指令 (Python 模板)
```python
import requests, base64

def deploy_to_github(token, repo, path, local_file):
    with open(local_file, 'rb') as f:
        content = base64.b64encode(f.read()).decode('utf-8')
    
    url = f'https://api.github.com/repos/{repo}/contents/{path}'
    headers = {'Authorization': f'token {token}'}
    data = {'message': 'Auto-deploy', 'content': content}
    
    # 處理更新 (Conflict)
    res = requests.put(url, headers=headers, json=data)
    if res.status_code == 409:
        sha = requests.get(url, headers=headers).json()['sha']
        data['sha'] = sha
        res = requests.put(url, headers=headers, json=data)
    return res.status_code
```

## 6. 進階配置：建立工具導覽首頁 (Landing Page)

為了避免用戶必須輸入長路徑 (如 /ups-calc/) 才能訪問工具，建議在根目錄建立 index.html 作為入口。

### 實作邏輯
1. 路徑設定：將檔案路徑設定為 path = 'index.html' (根目錄)。
2. 連結導向：在首頁中使用相對路徑連結至子工具，例如 <a href="/websites/ups-calc/">。
3. 部署方式：同樣使用 API 方案進行 PUT 推送。

### 導覽頁維護流程
每當新增一個子工具時，需同步更新根目錄的 index.html：
1. 獲取 index.html 的現有內容 $ightarrow$ 2. 在 HTML 中插入新的工具卡片 $ightarrow$ 3. 獲取 sha $ightarrow$ 4. 推送更新。

## 7. 未來新工具自動化流程

當您有新工具需求時（例如：「幫我做一個 PLC 位址轉換工具」），Hermes Agent 將執行以下標準化自動流程：

1. **工具開發與部署**：
   - 根據需求設計 HTML/CSS/JS。
   - 建立專屬子資料夾（例如 `/new-tool/index.html`）。
   - 使用 API 方案將檔案部署至 GitHub 倉庫。
   - **同步注入**：自動在工具頁面插入全域 Logo 與「返回首頁」按鈕。

2. **同步更新導覽首頁**：
   - 自動讀取根目錄 `index.html` 的內容。
   - 生成對應的新工具卡片（含圖標、描述與路徑）。
   - 將新卡片插入工具清單中並推送更新。

3. **同步更新專案文檔 (README)**：
   - **更新功能清單**：在 README 中新增該工具的目的與訪問路徑。
   - **更新結構圖**：同步更新 `Repository Architecture` 區塊，確保檔案目錄樹反映最新實況。

4. **即時上線**：
   - GitHub Pages 自動觸發部署。
   - 您只需刷新 [導覽首頁](https://greenstudio-mf.github.io/websites/) 即可立即使用新工具。