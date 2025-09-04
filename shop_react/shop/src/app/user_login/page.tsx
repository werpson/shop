"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  password: string;
  username: string;
  first_name: string;
  last_name: string;
};

const UserLoginPage = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [login, setLogin] = useState<User | null>(null);
  const [loginModal, setLoginModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
  fetch("https://api.maproflow.com/users", {
    method: "GET",
    credentials: "include",
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
        const data = await res.json();
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          setUsers([]); // ไม่ต้อง setError
        }
      } else {
        setUsers([]);
      }
      setLoading(false);
    })
    .catch((err) => {
      setUsers([]); // ไม่ต้อง setError
      setLoading(false);
    });
}, []);

const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const id = Number(formData.get("id"));
  const password = formData.get("password") as string;
  try {
    const response = await fetch("https://api.maproflow.com/users/login", {
      method: "POST",
      body: JSON.stringify({ id, password }),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      setError("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
      return;
    }

  setError(null);
  setLoginModal(false);
  router.push("/");
  // refresh หน้าใหม่หลัง login สำเร็จ
  } catch (err) {
    setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
  }
};

  if (loading) return <div>กำลังโหลดข้อมูล...</div>;

// ไม่ต้องเช็ค error && users.length === 0 อีก

return (
  <div className="flex items-start justify-center min-h-screen pt-8">
    <div className="w-full max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-bold text-blue-700 text-center mb-8">
        เลือกผู้ใช้งานเพื่อเข้าสู่ระบบ
      </h1>
      {/* ช่องค้นหา */}
      <div className="mb-6 flex justify-center">
        <input
          type="text"
          placeholder="ค้นหาชื่อผู้ใช้งาน..."
          className="w-full max-w-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {users
          .filter(u => {
            const q = search.trim().toLowerCase();
            if (!q) return true;
            return (
              u.first_name.toLowerCase().includes(q) ||
              u.last_name.toLowerCase().includes(q) ||
              u.username.toLowerCase().includes(q)
            );
          })
          .map((u) => (
            <div key={u.id} onClick={() => { setLogin(u); setLoginModal(true); }} className="flex flex-col items-center cursor-pointer bg-white p-6 rounded-xl shadow border border-gray-200">
              {/* สามารถใส่รูป user ได้ ถ้ามี */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill="#e3f2fd"/>
                <path stroke="#2196f3" strokeWidth="2" strokeLinecap="round" d="M4 20c0-4 8-4 8-4s8 0 8 4"/>
              </svg>
              <div className="text-blue-800 font-semibold text-lg text-center">{u.first_name} {u.last_name}</div>
            </div>
          ))}
        <div
          className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow border border-gray-200 cursor-pointer"
          onClick={() => setShowCreateModal(true)}
        >
          {/* ไอคอน + */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="#e3f2fd"/>
            <path stroke="#2196f3" strokeWidth="2" strokeLinecap="round" d="M12 8v8M8 12h8"/>
          </svg>
          <div className="text-blue-700 font-semibold text-lg text-center">เพิ่มข้อมูลผู้ใช้งาน</div>
        </div>
      </div>

      {/* Modal สำหรับสร้างผู้ใช้งานใหม่ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-start justify-center z-50 pt-8">
          <div className="rounded-lg p-6 w-full max-w-md shadow-lg bg-white">
            <h2 className="text-lg font-bold mb-4 text-center">เพิ่มข้อมูลผู้ใช้งาน</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                try {
                  const response = await fetch("https://api.maproflow.com/users", {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                  });
                  setShowCreateModal(false);
                  setTimeout(() => { window.location.reload(); }, 100);
                } catch (err: any) {
                  alert(err.message || "เกิดข้อผิดพลาด");
                }
              }}
            >
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">ชื่อผู้ใช้งาน</label>
                <input type="text" name="username" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">รหัสผ่าน</label>
                <input type="password" name="password" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">ชื่อจริง</label>
                <input type="text" name="first_name" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">นามสกุล</label>
                <input type="text" name="last_name" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">สิทธิ์การใช้งาน</label>
                <select name="permission" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option value="">เลือกสิทธิ์</option>
                  <option value="m">ผู้จัดการ</option>
                  <option value="e">พนักงาน</option>
                </select>
              </div>
              {/* <div className="mb-4 text-center">
                  <label className="block text-sm font-medium mb-2 text-gray-800">รูป</label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-gray-100"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImagePreview(URL.createObjectURL(file));
                      } else {
                        setImagePreview(null);
                      }
                    }}
              />
              </div> */}
              <div className="text-right">
                <button
                  type="submit"
                  className="mx-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-3 rounded transition-colors duration-150 shadow-sm"
                >
                  ยืนยัน
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="mx-1 bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded transition-colors duration-150 shadow-sm"
                >
                  ปิด
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ...modal login code... */}
      {loginModal && login && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <form onSubmit={handleLogin} className="bg-white p-6 rounded text-black">
            <h2 className="text-2xl mb-4">เข้าสู่ระบบพนักงาน {login.username}</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="mb-4">
              <input
                type="hidden"
                value={login.id}
                className="w-full p-2 border border-gray-300 rounded"
                name="id"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">รหัสผ่าน</label>
              <input
                type="password"
                defaultValue=""
                className="w-full p-2 border border-gray-300 rounded"
                name="password"
                required
              />
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
              เข้าสู่ระบบ
            </button>
            <button
              type="button"
              onClick={() => setLoginModal(false)}
              className="w-full mt-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded font-semibold transition"
            >
              ปิดหน้าต่างนี้
            </button>
          </form>
        </div>
      )}
    </div>
  </div>
);
}

export default UserLoginPage;