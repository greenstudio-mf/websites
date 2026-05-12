let db = null;
let currentTableName = "";
let SQL = null;

// 初始化 SQL.js
const initSQL = async () => {
    SQL = await initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });
};

initSQL();

const dropZone = document.getElementById('drop_zone');
const fileInput = document.getElementById('file-input');
const appContent = document.getElementById('app-content');
const dropZoneElement = document.getElementById('drop-zone');
const tableGrid = document.getElementById('table-grid');
const tableCount = document.getElementById('table-count');
const previewSection = document.getElementById('preview-section');
const previewTitle = document.getElementById('preview-title');
const tableHead = document.getElementById('table-head');
const tableBody = document.getElementById('table-body');
const downloadAllBtn = document.getElementById('download-all');
const downloadSingleBtn = document.getElementById('download-single');
const resetBtn = document.getElementById('reset-btn');

// 檔案處理
const handleFile = async (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        try {
            if (!SQL) await initSQL();
            db = new SQL.Database(data);
            
            // 獲取所有資料表
            const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
            if (tables.length > 0) {
                renderTableList(tables[0].values.map(v => v[0]));
                showApp();
            } else {
                alert("資料庫中找不到資料表！");
            }
        } catch (err) {
            console.error(err);
            alert("讀取資料庫失敗： " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
};

// 顯示主程式介面
const showApp = () => {
    dropZoneElement.classList.add('hidden');
    appContent.classList.remove('hidden');
};

// 重新上傳
resetBtn.onclick = () => {
    appContent.classList.add('hidden');
    dropZoneElement.classList.remove('hidden');
    previewSection.classList.add('hidden');
    if (db) db.close();
    db = null;
};

// 渲染資料表列表
const renderTableList = (tables) => {
    tableGrid.innerHTML = '';
    const filteredTables = tables.filter(name => !name.startsWith('sqlite_'));
    tableCount.textContent = `共 ${filteredTables.length} 個資料表`;

    filteredTables.sort().forEach(name => {
        const item = document.createElement('div');
        item.className = 'table-item';
        item.innerHTML = `
            <span class="table-name" title="${name}">${name}</span>
            <button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;">預覽</button>
        `;
        item.onclick = () => previewTable(name);
        tableGrid.appendChild(item);
    });
};

// 預覽資料表
const previewTable = (tableName) => {
    currentTableName = tableName;
    previewSection.classList.remove('hidden');
    previewTitle.textContent = `預覽: ${tableName}`;
    
    // 使用雙引號包裹資料表名稱以處理點號
    const result = db.exec(`SELECT * FROM "${tableName}" LIMIT 100`);
    
    if (result.length > 0) {
        const { columns, values } = result[0];
        
        // Header
        tableHead.innerHTML = columns.map(col => `<th>${col}</th>`).join('');
        
        // Body
        tableBody.innerHTML = values.map(row => 
            `<tr>${row.map(cell => `<td>${cell !== null ? cell : ''}</td>`).join('')}</tr>`
        ).join('');

        // 捲動到預覽區域
        previewSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        tableHead.innerHTML = '<th>(無資料)</th>';
        tableBody.innerHTML = '';
    }
};

// 下載單一 CSV
downloadSingleBtn.onclick = () => {
    if (!currentTableName) return;
    const csvContent = tableToCSV(currentTableName);
    downloadBlob(csvContent, `${currentTableName}.csv`, 'text/csv;charset=utf-8-sig');
};

// 下載所有資料表 (ZIP)
downloadAllBtn.onclick = async () => {
    const zip = new JSZip();
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table';")[0].values
        .map(v => v[0])
        .filter(name => !name.startsWith('sqlite_'));

    downloadAllBtn.disabled = true;
    const originalText = downloadAllBtn.innerHTML;
    downloadAllBtn.innerHTML = '<span>⏳</span> 正在生成 ZIP...';

    for (const name of tables) {
        const csvContent = tableToCSV(name);
        zip.file(`${name}.csv`, csvContent);
    }

    const content = await zip.generateAsync({ type: "blob" });
    downloadBlob(content, "recipe_export.zip", "application/zip");
    
    downloadAllBtn.disabled = false;
    downloadAllBtn.innerHTML = originalText;
};

// 將資料表轉換為 CSV 字串
const tableToCSV = (tableName) => {
    const result = db.exec(`SELECT * FROM "${tableName}"`);
    if (result.length === 0) return "";

    const { columns, values } = result[0];
    
    // 處理特殊字元並加引號
    const escapeCSV = (val) => {
        if (val === null) return '';
        let str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            str = '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    };

    const header = columns.map(escapeCSV).join(',');
    const rows = values.map(row => row.map(escapeCSV).join(',')).join('\n');
    
    return "\ufeff" + header + '\n' + rows; // 添加 BOM 讓 Excel 正確顯示中文
};

// 觸發下載
const downloadBlob = (content, fileName, mimeType) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
};

// 拖放事件
dropZoneElement.onclick = () => fileInput.click();
fileInput.onchange = (e) => handleFile(e.target.files[0]);

dropZoneElement.ondragover = (e) => {
    e.preventDefault();
    dropZoneElement.classList.add('dragover');
};

dropZoneElement.ondragleave = () => {
    dropZoneElement.classList.remove('dragover');
};

dropZoneElement.ondrop = (e) => {
    e.preventDefault();
    dropZoneElement.classList.remove('dragover');
    handleFile(e.dataTransfer.files[0]);
};
