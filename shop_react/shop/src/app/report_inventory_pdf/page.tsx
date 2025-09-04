"use client";
import React, { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.maproflow.com";

export default function ReportInventoryPDFPage() {
  const [period, setPeriod] = useState("month");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState(("0" + (new Date().getMonth() + 1)).slice(-2));
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const buildPdfUrl = () => {
    let url = `${API_URL}/report/inventory/pdf?period=${period}&year=${year}`;
    if (period === "month") url += `&month=${month}`;
    return url;
  };

  const handleViewPDF = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setPdfUrl(buildPdfUrl());
    setLoading(false);
  };

  // trigger reload preview ทุกครั้งที่เปลี่ยนข้อมูล
  React.useEffect(() => {
    handleViewPDF();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, year, month]);

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 24, background: "#fff", borderRadius: 8 }}>
      <h2>รายงานคลังสินค้า (PDF)</h2>
      <form onSubmit={handleViewPDF} style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label>
            ประเภท:
            <select value={period} onChange={e => setPeriod(e.target.value)} style={{ marginLeft: 8, marginRight: 16 }}>
              <option value="month">รายเดือน</option>
              <option value="year">รายปี</option>
            </select>
          </label>
          <label>
            ปี:
            <input type="number" value={year} onChange={e => setYear(e.target.value)} style={{ width: 80, marginLeft: 8, marginRight: 16 }} />
          </label>
          {period === "month" && (
            <label>
              เดือน:
              <input type="number" min="1" max="12" value={parseInt(month)} onChange={e => setMonth(("0" + e.target.value).slice(-2))} style={{ width: 60, marginLeft: 8 }} />
            </label>
          )}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" style={{ marginLeft: 0 }} disabled={loading}>{loading ? "กำลังโหลด..." : "สร้าง/ดูตัวอย่าง PDF"}</button>
        </div>
      </form>
      {pdfUrl && (
        <iframe src={pdfUrl} width="100%" height="600px" style={{ border: "1px solid #ccc" }} title="PDF Preview" />
      )}
    </div>
  );
}
