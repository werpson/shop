"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Shop = {
  shop_id: number;
  shop_name: string;
  password: string;
  image: string;
};

const LoginPage = () => {

  const [shops, setShops] = useState<Shop[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [login, setLogin] = useState<Shop | null>(null);
  const [loginModal, setLoginModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
          fetch("https://api.maproflow.com/shops",
            {
              method: "GET",
              credentials: "include",
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
              if (data) setShops(data);
              setLoading(false);
            })
            .catch((err) => {
              setError(err.message);
              setLoading(false);
            });
    }, []);

  if (loading) return <div>กำลังโหลดข้อมูล...</div>;

  const handleLogin = async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const shop = {
        shop_id: Number(formData.get("id")),
        password: formData.get("password"),
    }
    try {
      const response = await fetch("https://api.maproflow.com/shops/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shop),
        credentials: "include",
      });

      if (!response.ok) {
        // ไม่ต้องปิด modal แค่แสดง error
        setLoginModal(true);
        setError("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
        return;
      }

      setError(null); // ล้าง error ถ้าสำเร็จ
      setLoginModal(false);

      router.push("/user_login");
    } catch (err) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-blue-50 px-2 py-8">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-6 md:p-10">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-700 text-center mb-8">
          เลือกร้านเพื่อเข้าสู่ระบบ
        </h1>
        {/* ช่องค้นหาร้าน */}
        <div className="mb-6 flex justify-center">
          <input
            type="text"
            placeholder="ค้นหาร้าน..."
            className="w-full max-w-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {shops
            .filter(s => {
              const q = search.trim().toLowerCase();
              if (!q) return true;
              return s.shop_name.toLowerCase().includes(q);
            })
            .map((s) => (
              <div
                key={s.shop_id}
                onClick={() => { setLogin(s); setLoginModal(true); }}
                className="bg-blue-50 hover:bg-blue-100 p-6 rounded-xl cursor-pointer flex flex-col items-center shadow transition-colors border border-blue-100 hover:border-blue-300"
              >
                <img
                  src={`https://api.maproflow.com/uploads/shop/${s.image}`}
                  alt={s.shop_name}
                  className="w-24 h-24 object-cover mb-3 rounded-full border-2 border-blue-200 shadow"
                />
                <h3 className="text-lg md:text-xl font-semibold text-blue-800 text-center">
                  {s.shop_name}
                </h3>
              </div>
            ))}
        </div>
      </div>

      {loginModal && login && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <form
            onSubmit={handleLogin}
            className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-xs md:max-w-sm text-blue-900 border border-blue-100"
          >
            <h2 className="text-xl md:text-2xl mb-4 font-bold text-blue-700 text-center">
              เข้าสู่ระบบร้าน {login.shop_name}
            </h2>
            {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
            <input
              type="hidden"
              value={login.shop_id}
              name="id"
              required
            />
            <div className="mb-4">
              <label className="block text-base font-medium mb-2">รหัสผ่าน</label>
              <input
                type="password"
                defaultValue=""
                className="w-full p-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg"
                name="password"
                required
                placeholder="กรอกรหัสผ่าน"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-semibold transition mb-2 shadow"
            >
              เข้าสู่ระบบ
            </button>
            <button
              type="button"
              onClick={() => setLoginModal(false)}
              className="w-full bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg font-semibold transition shadow"
            >
              ปิดหน้าต่างนี้
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default LoginPage;