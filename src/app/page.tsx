import Link from "next/link";
import ContactForm from "@/components/site/ContactForm";

const SERVICES = [
  { title: "空間規劃設計", desc: "丈量、平面配置、3D 透視圖，把想法變成看得見的空間。" },
  { title: "統包工程施工", desc: "自有工班網絡與工程管理系統，進度、收款、費用全程透明。" },
  { title: "材料選配", desc: "實體材料樣品庫與線上型錄，現場比對不踩雷。" },
  { title: "售後保固", desc: "完工後仍持續追蹤保固事項，安心不是說說而已。" },
];

const PROCESS = [
  { step: "01", title: "洽談與丈量", desc: "了解需求與預算，現場丈量與拍照建檔。" },
  { step: "02", title: "設計提案", desc: "平面配置、3D 透視圖與材料板，逐步確認細節。" },
  { step: "03", title: "簽約與排程", desc: "合約明確載明範圍與收款期別，施工排程甘特圖同步。" },
  { step: "04", title: "施工與追蹤", desc: "工程管理系統即時更新進度、費用與追加減。" },
  { step: "05", title: "完工與保固", desc: "驗收交屋，保固期內問題隨時追蹤處理。" },
];

export default function HomePage() {
  return (
    <>
      <header className="border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-semibold tracking-wide">隱居設計 INTERIOR STUDIO</div>
          <nav className="hidden md:flex gap-8 text-sm text-slate-600">
            <a href="#services" className="hover:text-slate-900">服務項目</a>
            <a href="#process" className="hover:text-slate-900">服務流程</a>
            <a href="#contact" className="hover:text-slate-900">聯絡我們</a>
          </nav>
          <Link
            href="/login"
            className="text-sm border border-slate-300 rounded-md px-4 py-1.5 hover:border-slate-900 transition"
          >
            後台登入
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <p className="text-sm text-slate-500 tracking-widest mb-4">RESIDENTIAL & COMMERCIAL INTERIOR DESIGN</p>
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight max-w-2xl">
            從設計到完工，
            <br />
            我們把每個環節都做成看得見的進度。
          </h1>
          <p className="mt-6 text-slate-600 max-w-xl">
            隱居設計整合設計與統包工程團隊，用系統化的案件管理取代模糊的口頭承諾，
            讓每一筆收款、每一項費用、每一個工程進度都透明可查。
          </p>
          <div className="mt-8 flex gap-4">
            <a
              href="#contact"
              className="bg-slate-900 text-white rounded-md px-6 py-3 text-sm font-medium hover:bg-slate-800 transition"
            >
              預約免費諮詢
            </a>
            <a
              href="#process"
              className="border border-slate-300 rounded-md px-6 py-3 text-sm font-medium hover:border-slate-900 transition"
            >
              了解服務流程
            </a>
          </div>
        </section>

        <section id="services" className="bg-slate-50 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold mb-10">服務項目</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {SERVICES.map((s) => (
                <div key={s.title} className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="font-medium text-slate-900 mb-2">{s.title}</div>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="process" className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-semibold mb-10">服務流程</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {PROCESS.map((p) => (
                <div key={p.step}>
                  <div className="text-3xl font-semibold text-slate-200 mb-2">{p.step}</div>
                  <div className="font-medium text-slate-900 mb-1">{p.title}</div>
                  <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="bg-slate-50 py-20">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-2xl font-semibold mb-2">聯絡我們</h2>
            <p className="text-sm text-slate-500 mb-8">
              留下您的聯絡方式與需求，設計師將盡快與您聯繫安排諮詢。
            </p>
            <div className="bg-white rounded-xl border border-slate-200 p-8">
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-6 text-sm text-slate-400 flex justify-between">
          <span>© 2026 隱居設計 Interior Studio</span>
          <span>台北市大安區復興南路一段・02-1234-5678</span>
        </div>
      </footer>
    </>
  );
}
