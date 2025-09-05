"use client";
import React, { useEffect, useState } from "react";
import BarcodeScannerModal from "./BarcodeScannerModal";

type Product = {
  id: number;
  name: string;
  detail: string;
  price: number;
  quantity: number;
  type: string;
  image: string; // เพิ่มฟิลด์สำหรับรูปภาพ
  status: string; // เพิ่มฟิลด์สำหรับสถานะ
  barcode?: string; // เพิ่มฟิลด์ barcode
};

// ฟังก์ชันสุ่มเลข 10 หลัก (0-9)
function randomDigits(length: number = 10) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

const ProductPage = () => {
  // ต้องอยู่ในนี้!
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeTarget, setBarcodeTarget] = useState<"create"|"edit"|null>(null);
  const [barcodeValue, setBarcodeValue] = useState<string>("");

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
  const [products, setProducts] = useState<Product[]>([]);
  const [searchName, setSearchName] = useState("");
  const [searchType, setSearchType] = useState("");
  const [sortPrice, setSortPrice] = useState(""); // "asc" | "desc" | ""
  const [searchStatus, setSearchStatus] = useState(""); // "" | "a" | "u"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  //const [createProduct, setCreateProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // State สำหรับ modal รายละเอียดสินค้า
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product|null>(null);
  // ฟังก์ชัน refresh ดึงข้อมูลใหม่
  const refreshProducts = () => {
    setLoading(true);
    fetch("https://api.maproflow.com/products",{
      credentials: "include",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return res.json();
        }
        return null;
      })
      .then((data) => {
        if (data) setProducts(data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };
  useEffect(() => {
    refreshProducts();
  }, []);

  if (loading) return <div>กำลังโหลดข้อมูล...</div>;
  if (error) return <div>เกิดข้อผิดพลาด: {error}</div>;

  // ฟิลเตอร์และเรียงข้อมูล
  let filteredProducts = products.filter(p =>
    (!searchName || p.name.toLowerCase().includes(searchName.toLowerCase())) &&
    (!searchType || p.type === searchType) &&
    (!searchStatus || p.status === searchStatus)
  );
  if (sortPrice === "asc") {
    filteredProducts = filteredProducts.slice().sort((a, b) => a.price - b.price);
  } else if (sortPrice === "desc") {
    filteredProducts = filteredProducts.slice().sort((a, b) => b.price - a.price);
  }

  // ฟังก์ชันสำหรับลบข้อมูล
  const Delete = async (id: number) => {
    if (loadingDelete) return;
    setLoadingDelete(true);
    const product_id = {
        id: deleteProduct?.id,
    }
    try {
      const res = await fetch(`https://api.maproflow.com/products`, {
        credentials: "include",
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(product_id),
      });
      if (!res.ok) throw new Error("Delete failed");
      setShowDeleteModal(false);
      setDeleteProduct(null);
      refreshProducts(); // รีเฟรชข้อมูลหลังลบ
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการลบข้อมูล: " + err.message);
    } finally {
      setLoadingDelete(false);
    }
  };

  // ฟังก์ชันสำหรับ submit ข้อมูลแก้ไข
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editProduct || loadingEdit) return;
    setLoadingEdit(true);
    const formData = new FormData(e.currentTarget);
    formData.append("id", String(editProduct.id));

    try {
      const res = await fetch(`https://api.maproflow.com/products`, {
        credentials: "include",
        method: "PUT",
        body: formData,
      });
      if (!res.ok) throw new Error("Update failed");
      setShowEditModal(false);
      setEditProduct(null);
      refreshProducts(); // รีเฟรชข้อมูลหลังแก้ไข
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล: " + err.message);
    } finally {
      setLoadingEdit(false);
    }
  };

  // ฟังก์ชันสำหรับ submit ข้อมูลสร้างสินค้าใหม่
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loadingCreate) return;
    setLoadingCreate(true);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch(`https://api.maproflow.com/products`, {
        credentials: "include",
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Create failed");
      setShowCreateModal(false);
      refreshProducts(); // รีเฟรชข้อมูลหลังสร้าง
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการสร้างสินค้า");
    } finally {
      setLoadingCreate(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-blue-50 py-8 px-2">
  <div className="w-full max-w-6xl bg-white rounded-2xl shadow-lg p-4 md:p-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-blue-700">รายการสินค้า</h1>
          <button onClick={() => setShowCreateModal(true)} className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-8 rounded-lg shadow transition-colors text-lg md:text-xl">
            เพิ่มสินค้า
          </button>
        </div>
        {/* ช่องค้นหาและเรียงลำดับ */}
  <div className="flex flex-wrap gap-4 mb-6 items-center">
          <input
            type="text"
            placeholder="ค้นหาชื่อสินค้า..."
            className="border px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-base md:text-lg w-full max-w-md shadow-sm"
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            style={{ minWidth: 220 }}
          />
          <select
            className="border px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-base md:text-lg shadow-sm"
            value={searchType}
            onChange={e => setSearchType(e.target.value)}
          >
            <option value="">ทุกประเภท</option>
            <option value="g">ทั่วไป</option>
            {/* เพิ่มประเภทอื่น ๆ ได้ที่นี่ */}
          </select>
          <select
            className="border px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-base md:text-lg shadow-sm"
            value={searchStatus}
            onChange={e => setSearchStatus(e.target.value)}
          >
            <option value="">ทุกสถานะ</option>
            <option value="a">ใช้งานอยู่</option>
            <option value="u">ยกเลิก</option>
          </select>
          <select
            className="border px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-base md:text-lg shadow-sm"
            value={sortPrice}
            onChange={e => setSortPrice(e.target.value)}
          >
            <option value="">เรียงตามราคา</option>
            <option value="asc">ราคาน้อย → มาก</option>
            <option value="desc">ราคามาก → น้อย</option>
          </select>
        </div>
        <div className="overflow-x-auto rounded-lg">
          <table className="min-w-[1000px] w-full divide-y divide-white-20 border rounded-lg text-sm md:text-base lg:text-lg bg-white">
            <thead>
              <tr className="bg-blue-50">
                <th className="px-2 py-3 text-center font-semibold w-12">ลำดับ</th>
                <th className="px-2 py-3 text-center font-semibold w-14">สถานะ</th>
                <th className="px-2 py-3 text-center font-semibold w-20">ประเภท</th>
                <th className="px-2 py-3 text-center font-semibold w-20">รูปสินค้า</th>
                <th className="px-2 py-3 text-left font-semibold w-48">ชื่อสินค้า</th>
                <th className="px-2 py-3 text-right font-semibold w-24">ราคา</th>
                <th className="px-2 py-3 text-right font-semibold w-20">จำนวน</th>
                <th className="px-2 py-3 text-center font-semibold w-24">แก้ไข</th>
                <th className="px-2 py-3 text-center font-semibold w-24">ยกเลิก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((p, idx) => (
                <tr
                  key={p.id}
                  className={
                    `transition-colors hover:bg-blue-100 text-base md:text-lg ${p.status === "u" ? "text-red-600" : ""}`
                  }
                  style={{ cursor: "pointer" }}
                  onClick={e => {
                    // ไม่ให้คลิกปุ่มแล้วเปิด modal รายละเอียด
                    if ((e.target as HTMLElement).tagName === "BUTTON") return;
                    setDetailProduct(p);
                    setShowDetailModal(true);
                  }}
                >
                  <td className="px-2 py-3 text-center w-12">{idx + 1}</td>
                  <td className="px-2 py-3 text-center w-14">
                    {/* ไฟสถานะ */}
                    <span
                      className={
                        p.status === "a"
                          ? "inline-block w-4 h-4 rounded-full bg-green-500 border border-green-700"
                          : "inline-block w-4 h-4 rounded-full bg-red-500 border border-red-700"
                      }
                      title={p.status === "a" ? "ใช้งานอยู่" : "ไม่ได้ใช้งาน"}
                    ></span>
                  </td>
                  <td className="px-2 py-3 text-center w-20">{type[p.type]}</td>
                  <td className="px-2 py-3 text-center w-20">
                    <img src={`https://api.maproflow.com/uploads/products/${p.image}`} alt={p.name} className="w-14 h-14 md:w-16 md:h-16 object-cover rounded" />
                  </td>
                  <td className="px-2 py-3 break-words font-medium w-48">{p.name}</td>
                  <td className="px-2 py-3 text-right w-24">{p.price} ฿</td>
                  <td className="px-2 py-3 text-right w-20">{p.quantity}</td>
                  <td className="px-2 py-3 text-center w-24">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setEditProduct(p);
                        setShowEditModal(true);
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-5 rounded-lg shadow transition-colors text-base md:text-lg"
                    >
                      แก้ไขข้อมูล
                    </button>
                  </td>
                  { (p.status === "a") ? (
                    <td className="px-2 py-3 text-center w-24">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setDeleteProduct(p);
                        setShowDeleteModal(true);
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-5 rounded-lg shadow transition-colors text-base md:text-lg"
                    >
                      ยกเลิกสินค้า
                    </button>
                  </td>
                  ) : (
                    <td></td>
                  )}
                </tr>
              ))}
      {/* Modal รายละเอียดสินค้า */}
      {showDetailModal && detailProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="max-w-lg max-h-[90vh] mx-auto my-10 bg-white rounded-lg overflow-y-auto p-4">
            <h2 className="text-lg font-bold mb-4 text-center">รายละเอียดสินค้า</h2>
            <div className="flex flex-col items-center gap-4">
              <img
                src={`https://api.maproflow.com/uploads/products/${detailProduct.image}`}
                alt={detailProduct.name}
                className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-cover rounded border"
              />
              <div className="w-full">
                <div className="mb-2"><span className="font-semibold">ชื่อสินค้า:</span> {detailProduct.name}</div>
                <div className="mb-2"><span className="font-semibold">ประเภท:</span> {type[detailProduct.type]}</div>
                <div className="mb-2"><span className="font-semibold">ราคา:</span> {detailProduct.price} ฿</div>
                <div className="mb-2"><span className="font-semibold">จำนวน:</span> {detailProduct.quantity}</div>
                <div className="mb-2"><span className="font-semibold">รายละเอียด:</span> {detailProduct.detail}</div>
                <div className="mb-2"><span className="font-semibold">สถานะ:</span> {detailProduct.status === "a" ? "ใช้งานอยู่" : "ไม่ได้ใช้งาน"}</div>
                {/* barcode แสดงใน modal รายละเอียด */}
                <div className="mb-2"><span className="font-semibold">Barcode:</span> {detailProduct.barcode || "-"}</div>
              </div>
            </div>
            <div className="text-center mt-4">
              <button
                onClick={() => { setShowDetailModal(false); setDetailProduct(null); }}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded shadow"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="max-w-lg max-h-[90vh] mx-auto my-10 bg-white rounded-lg overflow-y-auto p-4">
            <h2 className="text-lg font-bold mb-4">เพิ่มสินค้าใหม่</h2>
            <form
              onSubmit={handleCreate}
              encType="multipart/form-data"
            >
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Barcode</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      name="barcode"
                      value={barcodeValue}
                      onChange={e => setBarcodeValue(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="กรอกหรือสแกน barcode"
                    />
                    <button type="button" onClick={() => { setBarcodeValue(randomDigits(10)); }}
                      className="p-2 bg-gray-200 hover:bg-green-200 rounded-full border border-gray-300 flex items-center justify-center"
                      title="สุ่มเลข 10 หลัก">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-700">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <button type="button" onClick={() => { console.log('[ProductPage] barcode scan button clicked (create)'); setShowBarcodeModal(true); setBarcodeTarget("create"); }}
                      className="p-2 bg-gray-200 hover:bg-blue-200 rounded-full border border-gray-300 flex items-center justify-center"
                      title="สแกนบาร์โค้ด">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75V5.25A2.25 2.25 0 014.5 3h1.5m12 0h1.5a2.25 2.25 0 012.25 2.25v1.5m0 10.5v1.5A2.25 2.25 0 0119.5 21h-1.5m-12 0H4.5A2.25 2.25 0 012.25 19.5v-1.5M7.5 12h.008v.008H7.5V12zm3 0h.008v.008H10.5V12zm3 0h.008v.008H13.5V12zm3 0h.008v.008H16.5V12z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">ชื่อสินค้า</label>
                    <input
                    type="text"
                    name="name"
                    defaultValue=""
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ชื่อสินค้า"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">รายละเอียด</label>
                    <textarea
                    name="detail"
                    defaultValue=""
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="รายละเอียดสินค้า"
                    style={{ minHeight: "80px", maxHeight: "300px" }}
                    onInput={e => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height = target.scrollHeight + "px";
                    }}
                    ></textarea>
                </div>
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">ราคา</label>
                    <input
                      type="number"
                      name="price"
                      defaultValue=""
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ราคา (฿)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">จำนวน</label>
                    <input
                      type="number"
                      name="quantity"
                      defaultValue=""
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="จำนวน"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">ประเภทสินค้า</label>
                  <select name="type" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">เลือกประเภทสินค้า</option>
                    <option value="d">เครื่องดื่ม</option>
                    <option value="f">อาหาร</option>
                    <option value="p">ของใช้</option>
                    <option value="m">ยา, เวชภัณฑ์, อาหารเสริม</option>
                    <option value="s">อุปกรณ์สำนักงาน, เครื่องเขียน</option>
                    <option value="e">ของใช้ไฟฟ้า, ถ่าน</option>
                    <option value="a">บุหรี่, สุรา</option>
                    <option value="o">อื่นๆ</option>
                  </select>
                </div>
                <div className="mb-4 text-center">
                  <label className="block text-sm font-medium mb-2">รูปสินค้า</label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    className="w-full px-3 py-2 border rounded-lg"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImagePreview(URL.createObjectURL(file));
                      } else {
                        setImagePreview(null);
                      }
                    }}
                  />
                  {/* ตัวอย่างรูป: ถ้ามีรูปเดิมให้แสดง, ถ้าเลือกใหม่ให้แสดง preview */}
                  {imagePreview && (
                    <div className="flex justify-center">
                      <img
                        src={imagePreview}
                        alt="ตัวอย่างรูปสินค้า"
                        className="mt-3 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-cover rounded border max-w-full"
                        style={{ maxWidth: "100%", height: "auto" }}
                      />
                    </div>
                  )}
                </div>
                <div className="text-right mx-auto">
                    <button
                      type="submit"
                      className={`mx-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-3 rounded transition-colors duration-150 shadow-sm ${loadingCreate ? 'opacity-60 cursor-not-allowed' : ''}`}
                      disabled={loadingCreate}
                    >
                      {loadingCreate ? 'กำลังบันทึก...' : 'ยืนยัน'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {setShowCreateModal(false); setImagePreview(null);} }
                      className="mx-1 bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded transition-colors duration-150 shadow-sm"
                    >
                      ปิด
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && deleteProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
            <div className="max-w-lg max-h-[90vh] mx-auto my-10 bg-white rounded-lg overflow-y-auto p-4">
                <h2 className="text-lg text-red-500 font-bold mb-4 text-center">ยกเลิกสินค้า</h2>
                <h2 className="text-lg font-bold mb-4 text-center">{deleteProduct.name}</h2>
                <h2 className="text-lg font-bold mb-4 text-center">ใช่หรือไม่</h2>
                <div className="text-right mx-auto">
                    <button
                      onClick={() => Delete(deleteProduct.id)}
                      className={`mx-1 bg-green-500 hover:bg-green-600 text-white font-medium py-1 px-3 rounded transition-colors duration-150 shadow-sm ${loadingDelete ? 'opacity-60 cursor-not-allowed' : ''}`}
                      disabled={loadingDelete}
                    >
                      {loadingDelete ? 'กำลังลบ...' : 'ยืนยัน'}
                    </button>
                    <button
                    type="button"
                    onClick={() => { setShowDeleteModal(false); setDeleteProduct(null); }}
                    className="mx-1 bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded transition-colors duration-150 shadow-sm" >
                        ยกเลิก
                    </button>
                </div>
            </div>
        </div>
      )}
      {/* Modal Barcode Scanner */}
      {showBarcodeModal && (
        <BarcodeScannerModal
          onDetected={code => {
            setBarcodeValue(code);
            setShowBarcodeModal(false);
          }}
          onClose={() => {setShowBarcodeModal(false);}}
        />
      )}
      {showEditModal && editProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="max-w-lg max-h-[90vh] mx-auto my-10 bg-white rounded-lg overflow-y-auto p-4">
            <h2 className="text-lg font-bold mb-4">แก้ไขข้อมูล</h2>
            <form onSubmit={handleSubmit}>
                <div className="md4">
                  <label className="block text-sm font-medium mb-2">Barcode (ถ้ามี)</label>
                  <div>{editProduct.barcode}</div>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">ชื่อสินค้า</label>
                    <input
                    type="text"
                    name="name"
                    defaultValue={editProduct.name}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ชื่อสินค้า"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">รายละเอียด</label>
                    <textarea
                    name="detail"
                    defaultValue={editProduct.detail}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="รายละเอียดสินค้า"
                    style={{ minHeight: "80px", maxHeight: "300px" }}
                    onInput={e => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height = target.scrollHeight + "px";
                    }}
                    ></textarea>
                </div>
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">ราคา</label>
                    <input
                      type="number"
                      name="price"
                      defaultValue={editProduct.price}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ราคา (฿)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">จำนวน</label>
                    <input
                      type="number"
                      name="quantity"
                      defaultValue={editProduct ? editProduct.quantity : ""}
                      min={0}
                      step={1}
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="จำนวน"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">ประเภทสินค้า</label>
                  <select name="type" defaultValue={editProduct.type} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">เลือกประเภทสินค้า</option>
                    <option value="g">ทั่วไป</option>
                  </select>
                </div>
                <div className="mb-4 text-center">
                  <label className="block text-sm font-medium mb-2">รูปสินค้า</label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    className="w-full px-3 py-2 border rounded-lg"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImagePreview(URL.createObjectURL(file));
                      } else {
                        setImagePreview(null);
                      }
                    }}
                  />
                  {/* ตัวอย่างรูป: ถ้ามีรูปเดิมให้แสดง, ถ้าเลือกใหม่ให้แสดง preview */}
                  {(imagePreview || editProduct?.image) && (
                    <div className="flex justify-center">
                      <img
                        src={imagePreview || (editProduct?.image ? `https://api.maproflow.com/uploads/products/${editProduct.image}` : '')}
                        alt="ตัวอย่างรูปสินค้า"
                        className="mt-3 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-cover rounded border max-w-full"
                        style={{ maxWidth: "100%", height: "auto" }}
                      />
                    </div>
                  )}
                </div>
                <div className="text-right mx-auto">
                    <button
                      type="submit"
                      className={`mx-1 bg-green-500 hover:bg-green-600 text-white font-medium py-1 px-3 rounded transition-colors duration-150 shadow-sm ${loadingEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                      disabled={loadingEdit}
                    >
                      {loadingEdit ? 'กำลังบันทึก...' : 'ยืนยัน'}
                    </button>
                    <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditProduct(null);
                      setImagePreview(null); // reset รูป preview ด้วย
                    }}
                    className="mx-1 bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded transition-colors duration-150 shadow-sm" >
                        ปิด
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPage;
