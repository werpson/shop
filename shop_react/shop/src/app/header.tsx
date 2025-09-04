"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

const Header = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userLogined, setUserLogined] = useState(true)
  const [shopLogined, setShopLogined] = useState(true)
  const [permission, setPermission] = useState<{permission: string}>()
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter()
  const path = usePathname();
  const logoutUser = () => {
    fetch("https://api.maproflow.com/users/logout", {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (res.ok) {
          document.cookie = "token_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          //setUserLogined(false);
          router.push("/user_login")
          return null;
        }
      })
  };
  const logoutShop = () => {
    fetch("https://api.maproflow.com/shops/logout", {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (res.ok) {
          document.cookie = "token_shop=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          // setShopLogined(false);
          router.push("/login")
          return null;
        }
      })
  };
      useEffect(() => {
      fetch("https://api.maproflow.com/jwt_shop/check", {
        credentials: "include",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then(async (res) => {
        if (!res.ok) {
          setShopLogined(false);
          router.push("/login");
          return null;
        } else {
          setShopLogined(true);
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return res.json();
          }
          return null;
        }
      })
      .then((data) => {
        if (data) setPermission(data)
      })
      if (shopLogined == true){
      fetch("https://api.maproflow.com/jwt_user/check", {
        credentials: "include",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then(async (res) => {
          if (!res.ok) {
            setUserLogined(false);
            router.push("/user_login");
            return null;
          } else {
            setUserLogined(true);
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              return res.json();
            }
            return null;
          }
        })
        .then((data) => {
          if (data) setPermission(data)
        })
      }
      }, [path, router]);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerData, setRegisterData] = useState({ name: "", email: "", password: "" });
  const [registerError, setRegisterError] = useState("");
  const registerShop = () => {
    setShowRegisterModal(true);
  };
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };
  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterError("");
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      // เพิ่มข้อมูล text ที่ไม่ได้มาจาก input type=file
      formData.set("name", registerData.name);
      formData.set("password", registerData.password);
      const res = await fetch("https://api.maproflow.com/shops", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("เกิดข้อผิดพลาดในการลงทะเบียน");
  setShowRegisterModal(false);
  setRegisterData({ name: "", email: "", password: "" });
  setTimeout(() => { window.location.reload(); }, 100);
    } catch (err: any) {
      setRegisterError(err.message || "เกิดข้อผิดพลาด");
    }
  };
  return (
    <>
      <header className="w-full bg-blue-600 text-white shadow-md sticky top-0 z-50">
        <nav className="container mx-auto flex flex-wrap items-center justify-between py-3 px-4">
          <div className="text-2xl font-bold flex-1">
            <Link href="/" className="hover:text-blue-100 transition-colors">ShopApp</Link>
          </div>
          {/* Hamburger button */}
          <button
            className="md:hidden flex items-center px-3 py-2 border rounded text-white border-blue-200"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="fill-current h-6 w-6" viewBox="0 0 20 20">
              <path d="M0 3h20v2H0zM0 9h20v2H0zM0 15h20v2H0z" />
            </svg>
          </button>
          {/* Menu */}
          <div className={`w-full md:flex md:items-center md:w-auto ${menuOpen ? "block" : "hidden"} md:block`}>
            {userLogined ? (
              <div className="flex flex-col md:flex-row gap-2 md:gap-6 text-base md:text-lg mt-3 md:mt-0">
                <Link href="/" className="hover:text-blue-300 transition-colors">หน้าแรก</Link>
                <Link href="/product_history" className="hover:text-blue-300 transition-colors">รายงานสินค้า</Link>
                <Link href="/product" className="hover:text-blue-300 transition-colors">ข้อมูลสินค้า</Link>
                {(permission?.permission !== "e" ) && (
                  <Link href="/user" className="hover:text-blue-300 transition-colors">ข้อมูลผู้ใช้งาน</Link>
                )}
                <button onClick={() => logoutUser()} className="bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded transition-colors duration-150 shadow-sm">
                  ออกจากระบบ
                </button>
              </div>
            ) : shopLogined ? (
              <div className="flex flex-col md:flex-row gap-2 md:gap-6 text-base md:text-lg mt-3 md:mt-0">
                <button onClick={() => logoutShop()} className="bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded transition-colors duration-150 shadow-sm">
                  ออกจากระบบร้านค้า
                </button>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-2 md:gap-6 text-base md:text-lg mt-3 md:mt-0">
                <button onClick={registerShop} className="bg-white-500 hover:bg-white-600 text-blue font-medium py-1 px-3 rounded transition-colors duration-150 shadow-sm">
                  ลงทะเบียนร้านค้า
                </button>
              </div>
            )}
          </div>
        </nav>
        {showRegisterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-blue-700 text-center">ลงทะเบียนร้านค้า</h2>
              <form onSubmit={handleRegisterSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-800">ชื่อร้านค้า</label>
                  <input type="text" name="name" value={registerData.name} onChange={handleRegisterChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-100" placeholder="ชื่อร้านค้า" required />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-800">รหัสผ่าน</label>
                  <input type="password" name="password" value={registerData.password} onChange={handleRegisterChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-100" placeholder="Password" required />
                </div>
                <div className="mb-4 text-center">
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
                {registerError && <div className="text-red-500 mb-2 text-center">{registerError}</div>}
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" onClick={() => setShowRegisterModal(false)} className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded-lg">ปิด</button>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-semibold shadow">ยืนยัน</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
