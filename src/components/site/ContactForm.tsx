"use client";

import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-green-800 text-sm">
        已收到您的諮詢，我們會盡快與您聯繫，謝謝！
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">姓名</label>
          <input
            name="name"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">聯絡電話</label>
          <input
            name="phone"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1">Email（選填）</label>
        <input
          name="email"
          type="email"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1">空間地址（選填）</label>
        <input
          name="address"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1">想諮詢的內容</label>
        <textarea
          name="message"
          rows={4}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className="bg-slate-900 text-white rounded-md px-6 py-2.5 text-sm font-medium hover:bg-slate-800 transition disabled:opacity-50"
      >
        {status === "sending" ? "送出中..." : "送出諮詢"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-600">送出失敗，請稍後再試或直接來電。</p>
      )}
    </form>
  );
}
