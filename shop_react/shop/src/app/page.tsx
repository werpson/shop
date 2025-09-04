"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useRef, useEffect, useState } from "react";

type ProductHistory = {
  id: string;
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  date: string;
  total_out: number;
  total_in: number;
  first_date: string;
  last_date: string;
};

type Product = {
  id: number;
  name: string;
  detail: string;
  price: number;
  quantity: number;
  type: string;
  image: string;
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const months = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

import Link from "next/link";

const HomePage = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const [productsHistoryTopIn, setProductsHistoryTopIn] = useState<ProductHistory[]>([]);
  const [productsTopIn, setProductsTopIn] = useState<Product[]>([]);
  const [productsHistoryTopOut, setProductsHistoryTopOut] = useState<ProductHistory[]>([]);
  const [productsTopOut, setProductsTopOut] = useState<Product[]>([]);

  // dropdown state
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  // สร้าง set ปี/เดือนที่มีข้อมูลจริงจาก first_date/last_date
  const yearSet = new Set<number>();
  const yearMonthMap: Record<number, Set<number>> = {};
  [...productsHistoryTopIn, ...productsHistoryTopOut].forEach((h: any) => {
    [h.first_date, h.last_date].forEach((dstr: string) => {
      if (dstr) {
        const d = new Date(dstr);
        if (!isNaN(d.getTime())) {
          yearSet.add(d.getFullYear());
          if (!yearMonthMap[d.getFullYear()]) yearMonthMap[d.getFullYear()] = new Set();
          yearMonthMap[d.getFullYear()].add(d.getMonth());
        }
      }
    });
  });
  const yearsArr = Array.from(yearSet).sort((a, b) => a - b);

  // default เป็นปี/เดือนล่าสุดที่มีข้อมูล
  const [selectedYear, setSelectedYear] = useState<number | undefined>(
    yearsArr.length ? yearsArr[yearsArr.length - 1] : undefined
  );
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(
    yearsArr.length && yearMonthMap[yearsArr[yearsArr.length - 1]]
      ? Math.max(...Array.from(yearMonthMap[yearsArr[yearsArr.length - 1]]))
      : undefined
  );

  useEffect(() => {
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 100);
  }, []);

  function getMaxY(a: number[], b: number[]) {
    return Math.max(
      ...a.filter((v) => typeof v === "number"),
      ...b.filter((v) => typeof v === "number")
    );
  }

  function getQueryParams() {
    // ถ้าเลือก 'ทั้งหมด' ให้ส่ง month=0&year=0
    if (selectedMonth === undefined || selectedYear === undefined || selectedMonth === null || selectedYear === null) return "?month=0&year=0";
    if (selectedMonth === -1 || selectedYear === -1) return "?month=0&year=0";
    // ปรับ selectedMonth/selectedYear เป็นเวลาไทย (UTC+7) ก่อนส่ง
    // แต่จริง ๆ แล้ว selectedMonth/selectedYear มาจาก dropdown ที่แปลงแล้ว
    // ดังนั้นควรส่ง month=selectedMonth+1, year=selectedYear ตามที่แสดงใน dropdown (ซึ่งเป็นเดือน/ปีไทย)
    return `?month=${Number(selectedMonth) + 1}&year=${selectedYear}`;
  }

  // ดึงข้อมูลใหม่เมื่อเลือกเดือน/ปี
  useEffect(() => {
    const params = getQueryParams();
    fetch(`https://api.maproflow.com/product_history/top_in${params}`, {
      credentials: "include",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Not authenticated");
        }
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return res.json();
        }
        return null;
      })
      .then((data) => {
        if (data) {
          setProductsHistoryTopIn(data.product_histories || []);
          setProductsTopIn(data.products || []);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    const params = getQueryParams();
    fetch(`https://api.maproflow.com/product_history/top_out${params}`, {
      credentials: "include",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Not authenticated");
        }
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return res.json();
        }
        return null;
      })
      .then((data) => {
        if (data) {
          setProductsHistoryTopOut(data.product_histories || []);
          setProductsTopOut(data.products || []);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, [selectedMonth, selectedYear]);

  // ถ้าเลือกสินค้า: map id → name แล้ว filter product_history ด้วย name
  const filteredTopIn = selectedProduct
    ? productsTopIn.filter((p) => p.id === Number(selectedProduct))
    : productsTopIn;
  const filteredTopOut = selectedProduct
    ? productsTopOut.filter((p) => p.id === Number(selectedProduct))
    : productsTopOut;
  const filteredHistoryTopIn = selectedProduct
    ? productsHistoryTopIn.filter((p) => p.product_id === Number(selectedProduct))
    : productsHistoryTopIn;
  const filteredHistoryTopOut = selectedProduct
    ? productsHistoryTopOut.filter((p) => p.product_id === Number(selectedProduct))
    : productsHistoryTopOut;

  const topInLabels = filteredTopIn.map((p) => p.name).slice(0, 5);
  const topInData = filteredHistoryTopIn.map((p) => p.total_in).slice(0, 5);
  const topOutLabels = filteredTopOut.map((p) => p.name).slice(0, 5);
  const topOutData = filteredHistoryTopOut.map((p) => p.total_out).slice(0, 5);

  const maxY = getMaxY(topInData, topOutData) || 10;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
        text: "",
      },
    },
    scales: {
      x: {
        stacked: false,
      },
      y: {
        beginAtZero: true,
        stacked: false,
        max: maxY,
      },
    },
  };

  const barColors = [
    "#2196f3", // ฟ้า
    "#43a047", // เขียว
    "#ff9800", // ส้ม
    "#ab47bc", // ม่วง
    "#f44336", // แดง
    "#00bcd4", // ฟ้าอ่อน
    "#ffd600", // เหลือง
  ];

  // Chart Top In: แต่ละ bar เป็น 1 dataset เพื่อให้ legend แสดงชื่อสินค้า
  const chartTopIn = {
    labels: ["จำนวน"],
    datasets: topInLabels.map((name, idx) => ({
      label: name,
      data: [topInData[idx]],
      backgroundColor: barColors[idx % barColors.length],
      borderRadius: 6,
      barPercentage: 0.6,
    })),
  };
  // Chart Top Out: เช่นเดียวกัน
  const chartTopOut = {
    labels: ["จำนวน"],
    datasets: topOutLabels.map((name, idx) => ({
      label: name,
      data: [topOutData[idx]],
      backgroundColor: barColors[idx % barColors.length],
      borderRadius: 6,
      barPercentage: 0.6,
    })),
  };

  const totalIn = productsHistoryTopIn.reduce((sum, p) => sum + (typeof p.total_in === 'number' ? p.total_in : 0), 0);
  const totalOut = productsHistoryTopOut.reduce((sum, p) => sum + (typeof p.total_out === 'number' ? p.total_out : 0), 0);
  const totalStock = productsTopIn.reduce((sum, p) => sum + (typeof p.quantity === 'number' ? p.quantity : 0), 0);

  return (
    <div className="w-full min-h-[250px] flex flex-col items-center justify-center p-4">
      <div className="w-full flex justify-end mb-4">
        <Link href="/report_inventory_pdf">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow">
            ดูรายงานคลังสินค้า (PDF)
          </button>
        </Link>
      </div>
      {/* Filter dropdowns */}
      <div className="flex flex-wrap gap-4 w-full mb-6 items-center">
        <div>
          <label className="mr-2 font-medium">สินค้า:</label>
          <select
            className="border rounded px-2 py-1"
            value={selectedProduct}
            onChange={e => setSelectedProduct(e.target.value)}
          >
            <option value="">ทั้งหมด</option>
            {productsTopIn.concat(productsTopOut)
              .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
              .map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
          </select>
        </div>
        <div>
          <label className="mr-2 font-medium">เดือน:</label>
          <select
            className="border rounded px-2 py-1"
            value={selectedMonth === undefined ? "" : selectedMonth}
            onChange={e => setSelectedMonth(e.target.value === "" ? undefined : Number(e.target.value))}
          >
            <option value="">ทั้งหมด</option>
            {selectedYear !== undefined && yearMonthMap[selectedYear]
              ? Array.from(yearMonthMap[selectedYear])
                  .filter(idx => {
                    // ต้องมีข้อมูลในเดือนนี้จริง ๆ (เช็คทั้ง first_date และ last_date)
                    function getThaiYearMonth(dateStr: string) {
                      if (!dateStr) return { year: NaN, month: NaN };
                      const d = new Date(dateStr);
                      // ปรับเป็นเวลาไทย (UTC+7)
                      const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
                      const th = new Date(utc + 7 * 60 * 60 * 1000);
                      return { year: th.getFullYear(), month: th.getMonth() };
                    }
                    const hasIn = productsHistoryTopIn.some(h => {
                      const d1 = getThaiYearMonth(h.first_date);
                      const d2 = getThaiYearMonth(h.last_date);
                      return (
                        (d1.year === selectedYear && d1.month === idx) ||
                        (d2.year === selectedYear && d2.month === idx)
                      );
                    });
                    const hasOut = productsHistoryTopOut.some(h => {
                      const d1 = getThaiYearMonth(h.first_date);
                      const d2 = getThaiYearMonth(h.last_date);
                      return (
                        (d1.year === selectedYear && d1.month === idx) ||
                        (d2.year === selectedYear && d2.month === idx)
                      );
                    });
                    return hasIn || hasOut;
                  })
                  .sort((a, b) => a - b)
                  .map(idx => (
                    <option key={idx} value={idx}>{months[idx]}</option>
                  ))
              : null}
          </select>
        </div>
        <div>
          <label className="mr-2 font-medium">ปี:</label>
          <select
            className="border rounded px-2 py-1"
            value={selectedYear === undefined ? "" : selectedYear}
            onChange={e => setSelectedYear(e.target.value === "" ? undefined : Number(e.target.value))}
          >
            <option value="">ทั้งหมด</option>
            {yearsArr.length
              ? yearsArr.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))
              : null}
          </select>
        </div>
        {yearsArr.length === 0 && (
          <div className="text-red-500 font-medium">ไม่มีข้อมูลเดือน/ปีให้เลือก</div>
        )}
      </div>
      {/* Cards summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full mb-8">
        <div className="rounded-xl shadow-lg p-6 bg-gradient-to-br from-cyan-400 to-blue-500 text-white flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📦</span>
            <span className="font-bold text-lg">สินค้าเข้าทั้งหมด</span>
          </div>
          <div className="text-3xl font-bold">{totalIn.toLocaleString()}</div>
        </div>
        <div className="rounded-xl shadow-lg p-6 bg-gradient-to-br from-green-400 to-teal-400 text-white flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🚚</span>
            <span className="font-bold text-lg">สินค้าออกทั้งหมด</span>
          </div>
          <div className="text-3xl font-bold">{totalOut.toLocaleString()}</div>
        </div>
        <div className="rounded-xl shadow-lg p-6 bg-gradient-to-br from-pink-400 to-purple-400 text-white flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🏪</span>
            <span className="font-bold text-lg">สินค้าคงเหลือในคลัง</span>
          </div>
          <div className="text-3xl font-bold">{totalStock.toLocaleString()}</div>
        </div>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-6">
        <div className="bg-white rounded-lg shadow p-4 w-full">
          <h2 className="text-lg font-bold mb-2">5 อันดับ สินค้าเข้า (จำนวน)</h2>
          <div className="relative w-full h-[40vw] min-h-[200px] max-h-[400px]">
            <Bar options={chartOptions} data={chartTopIn} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 w-full">
          <h2 className="text-lg font-bold mb-2">5 อันดับ สินค้าออก (จำนวน)</h2>
          <div className="relative w-full h-[40vw] min-h-[200px] max-h-[400px]">
            <Bar options={chartOptions} data={chartTopOut} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;