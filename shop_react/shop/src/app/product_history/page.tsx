"use client";
import { Timestamp } from "next/dist/server/lib/cache-handlers/types";
import React, { useEffect, useState } from "react";

// ฟังก์ชันแปลงวันที่ (รับ ISO string) -> 'dd/MM/yyyy HH:mm:ss'
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

type MethodType = 'c' | 'u' | 'd';

type ProductHistoryType = {
    id: number;
    product_id: number;
    method: MethodType;
    by: number;
    date: Timestamp;
    old_name: string;
    old_detail: string;
    old_quantity: number;
    old_price: number;
    old_type: string;
    old_image: string;
    new_name: string;
    new_detail: string;
    new_quantity: number;
    new_price: number;
    new_type: string;
    new_image: string;
    old_status?: string;
    new_status?: string;
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

type User = {
    id: number;
    first_name: string;
    last_name: string;
}

const ProductHistory = () => {

    const type: { [key: string]: string } = {
        'd': 'เครื่องดื่ม',
        'f': 'อาหาร',
        'p': 'ของใช้ส่วนตัว',
        'm': 'ยา, เวชภัณฑ์, อาหารเสริม',
        's': 'อุปกรณ์สำนักงาน, เครื่องเขียน',
        'e': 'ของใช้ไฟฟ้า, ถ่าน',
        'a': 'บุหรี่, สุรา',
        'o': 'อื่นๆ',
        'g': 'ทั่วไป', // เผื่อกรณีเก่า
    };

    const CRUD = {
        'c': 'เพิ่ม',
        'u': 'แก้ไข',
        'd': 'ยกเลิก',
    }
    const [product_history, setProduct_history] = useState<ProductHistoryType[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState<ProductHistoryType | null>(null);
    const [searchName, setSearchName] = useState("");

    useEffect(() => {
        fetch("https://api.maproflow.com/product_history",
            {
                credentials: "include",
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        )
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
                setProduct_history(data.product_histories || []);
                setProducts(data.products || []);
                setUsers(data.users || []);
            }
            setLoading(false);
        })
        .catch((err) => {
            setError(err.message);
        })
    }, []);

    const openDetailModal = (history: ProductHistoryType) => {
        setSelectedHistory(history);
        setShowDetailModal(true);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedHistory(null);
    };

    if (error) return <div>เกิดข้อผิดพลาด: {error}</div>;
    if (loading) return <div>กำลังโหลดข้อมูล...</div>;


    // filter product_history ตามชื่อสินค้า
    const filteredHistory = product_history.filter((p_h) => {
        if (!searchName) return true;
        const product = products.find(p => p.id === p_h.product_id);
        return product && product.name.toLowerCase().includes(searchName.toLowerCase());
    });

                return (
                        <div className="min-h-screen flex flex-col items-center justify-start bg-blue-50 py-8 px-2">
                                <div className="w-full flex justify-end mb-4 max-w-6xl">
                                    <a href="/report_inventory_pdf">
                                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow">
                                            ดูรายงานคลังสินค้า (PDF)
                                        </button>
                                    </a>
                                </div>
                <div className="w-full max-w-6xl bg-white rounded-2xl shadow-lg p-4 md:p-10">
                    <h1 className="text-3xl md:text-4xl font-bold mb-8 text-blue-700 text-center">รายงานสินค้า</h1>
                    <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อสินค้า..."
                            className="border px-5 py-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg md:text-xl w-full max-w-lg shadow-sm"
                            value={searchName}
                            onChange={e => setSearchName(e.target.value)}
                            style={{ minWidth: 300 }}
                        />
                    </div>
                    <div className="overflow-x-auto py-5">
                        <table className="min-w-[1000px] w-full divide-y divide-white-20 border rounded-lg text-base md:text-lg lg:text-xl bg-white">
                        <thead>
                            <tr className="bg-blue-50">
                                <th className="px-4 py-3 text-center font-semibold w-12">ลำดับ</th>
                                <th className="px-4 py-3 text-center font-semibold w-40">ชื่อสินค้า</th>
                                <th className="px-4 py-3 text-center font-semibold w-20">การเปลี่ยนแปลง</th>
                                <th className="px-4 py-3 text-center font-semibold w-32">ผู้เปลี่ยนแปลง</th>
                                <th className="px-4 py-3 text-center font-semibold w-40">วันเวลา</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredHistory.map((p_h, idx) => {
                                const user = users.find(u => u.id === p_h.by);
                                const product = products.find(p => p.id === p_h.product_id);
                                let rowColor = "";
                                if (p_h.method === "c") rowColor = "text-green-600";
                                else if (p_h.method === "u") rowColor = "text-blue-600";
                                else if (p_h.method === "d") rowColor = "text-red-600";
                                return (
                                    <tr
                                      key={p_h.id}
                                      className={`transition-colors hover:bg-blue-100 text-lg md:text-xl ${rowColor}`}
                                      style={{ cursor: "pointer" }}
                                      onClick={() => openDetailModal(p_h)}
                                    >
                                        <td className="px-4 py-3 text-center w-12">{idx + 1}</td>
                                        <td className="px-4 py-3 text-center font-medium w-40">{product ? product.name : "ไม่พบสินค้า"}</td>
                                        <td className="px-4 py-3 text-center w-20">{CRUD[p_h.method]}</td>
                                        <td className="px-4 py-3 text-center w-32">{user?.first_name} {user?.last_name}</td>
                                        <td className="px-4 py-3 text-center w-40">{formatDate(new Date(p_h.date).toISOString())}น.</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        </table>
                    </div>
                </div>
                                {showDetailModal && selectedHistory && (
                                    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
                                        <div className="max-w-lg max-h-[90vh] mx-auto my-10 bg-white rounded-lg overflow-y-auto p-4">
                                            <h2 className="text-lg font-bold mb-4 text-center">รายละเอียดประวัติสินค้า</h2>
                                            <div className="flex flex-col items-center gap-4">
                                                {selectedHistory.method === "c" ? (
                                                    <>
                                                        {selectedHistory.new_image && (
                                                            <img
                                                                src={`https://api.maproflow.com/uploads/products/${selectedHistory.new_image}`}
                                                                alt={selectedHistory.new_name}
                                                                className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-cover rounded border"
                                                            />
                                                        )}
                                                        <div className="w-full">
                                                            <div className="mb-2"><span className="font-semibold">ชื่อสินค้า:</span> {selectedHistory.new_name}</div>
                                                            <div className="mb-2"><span className="font-semibold">ประเภท:</span> {type[selectedHistory.new_type]}</div>
                                                            <div className="mb-2"><span className="font-semibold">ราคา:</span> {selectedHistory.new_price} ฿</div>
                                                            <div className="mb-2"><span className="font-semibold">จำนวน:</span> {selectedHistory.new_quantity}</div>
                                                            <div className="mb-2"><span className="font-semibold">รายละเอียด:</span> {selectedHistory.new_detail}</div>
                                                            <div className="mb-2 text-green-600"><span className="font-semibold">ประเภทการเปลี่ยนแปลง:</span> {CRUD[selectedHistory.method]}</div>
                                                            <div className="mb-2"><span className="font-semibold">วันเวลา:</span> {formatDate(new Date(selectedHistory.date).toISOString())}น.</div>
                                                        </div>
                                                    </>
                                                ) : selectedHistory.method === "d" ? (
                                                    <>
                                                        {selectedHistory.new_image && (
                                                            <img
                                                                src={`https://api.maproflow.com/uploads/products/${selectedHistory.new_image}`}
                                                                alt={selectedHistory.new_name}
                                                                className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-cover rounded border"
                                                            />
                                                        )}
                                                        <div className="w-full">
                                                            <div className="mb-2"><span className="font-semibold">ชื่อสินค้า:</span> {selectedHistory.new_name}</div>
                                                            <div className="mb-2"><span className="font-semibold">ประเภท:</span> {type[selectedHistory.new_type]}</div>
                                                            <div className="mb-2"><span className="font-semibold">ราคา:</span> {selectedHistory.new_price} ฿</div>
                                                            <div className="mb-2"><span className="font-semibold">จำนวน:</span> {selectedHistory.new_quantity}</div>
                                                            <div className="mb-2"><span className="font-semibold">รายละเอียด:</span> {selectedHistory.new_detail}</div>
                                                            <div className="mb-2 text-red-600"><span className="font-semibold">ประเภทการเปลี่ยนแปลง:</span> {CRUD[selectedHistory.method]}</div>
                                                            <div className="mb-2"><span className="font-semibold">วันเวลา:</span> {formatDate(new Date(selectedHistory.date).toISOString())}น.</div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                                        <div>
                                                            <div className="font-semibold mb-1 text-blue-700 text-xl text-center">ข้อมูลเดิม</div>
                                                            {selectedHistory.old_image && (
                                                                <div className="flex justify-center">
                                                                    <img src={`https://api.maproflow.com/uploads/products/${selectedHistory.old_image}`} alt="old" className="w-24 h-24 object-cover rounded border mt-2" />
                                                                </div>
                                                            )}
                                                            <div><span className="font-semibold">ชื่อ:</span> {selectedHistory.old_name}</div>
                                                            <div><span className="font-semibold">ประเภท:</span> {selectedHistory.old_type}</div>
                                                            <div><span className="font-semibold">ราคา:</span> {selectedHistory.old_price}</div>
                                                            <div><span className="font-semibold">จำนวน:</span> {selectedHistory.old_quantity}</div>
                                                            <div><span className="font-semibold">รายละเอียด:</span> {selectedHistory.old_detail}</div>
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold mb-1 text-green-700 text-xl text-center">ข้อมูลใหม่</div>
                                                            {selectedHistory.new_image && (
                                                                <div className="flex justify-center">
                                                                    <img src={`https://api.maproflow.com/uploads/products/${selectedHistory.new_image}`} alt="new" className="w-24 h-24 object-cover rounded border mt-2" />
                                                                </div>
                                                            )}
                                                            <div><span className="font-semibold">ชื่อ:</span> {selectedHistory.new_name}</div>
                                                            <div><span className="font-semibold">ประเภท:</span> {type[selectedHistory.new_type]}</div>
                                                            <div><span className="font-semibold">ราคา:</span> {selectedHistory.new_price}</div>
                                                            <div><span className="font-semibold">จำนวน:</span> {selectedHistory.new_quantity}</div>
                                                            <div><span className="font-semibold">รายละเอียด:</span> {selectedHistory.new_detail}</div>
                                                        </div>
                                                        <div className="col-span-2 mt-4">
                                                            <div className="mb-2 text-blue-600"><span className="font-semibold">ประเภทการเปลี่ยนแปลง:</span> {CRUD[selectedHistory.method]}</div>
                                                            <div className="mb-2"><span className="font-semibold">วันเวลา:</span> {formatDate(new Date(selectedHistory.date).toISOString())}น.</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-center mt-4">
                                                <button
                                                    onClick={closeDetailModal}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded shadow"
                                                >
                                                    ปิด
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
            </div>
        );
}

export default ProductHistory;