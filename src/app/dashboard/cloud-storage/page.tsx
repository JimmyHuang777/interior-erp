export default function CloudStoragePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">☁️ 雲端資料庫</h1>
      <p className="text-sm text-slate-500 mb-6">Google Drive 連線・公司舊案件資訊庫・瀏覽搜尋・選擇性匯入</p>

      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
        <div className="text-slate-400 text-sm">
          此模組尚未串接 Google Drive API（依需求先略過）。
          <br />
          之後接入時，這裡會顯示已連結帳號、可瀏覽的資料夾樹，以及選擇性匯入到案件的功能。
        </div>
      </div>
    </div>
  );
}
