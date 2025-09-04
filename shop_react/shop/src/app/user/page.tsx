"use client";
import React, { useEffect, useState } from "react";

// ...existing code...
type User = {
  id: number;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  permission: string;
  status: string;
};

const UserPage = () => {
  const permission: { [key: string]: string } = {
      'a': 'ผู้ดูแลระบบ',
      'm': 'ผู้จัดการ',
      'e': 'พนักงาน',
    };
    const status: { [key: string]: string } = {
      'a': 'ยังใช้งาน',
      'u': 'ไม่ได้ใช้งาน'
    };
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  // loading state for modal actions
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  // สำหรับ modal รายละเอียด
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  // ช่องค้นหา
  const [searchName, setSearchName] = useState("");
  const [searchStatus, setSearchStatus] = useState(""); // "" | "a" | "u"
  const [searchPermission, setSearchPermission] = useState("");

    useEffect(() => {
        fetch("https://api.maproflow.com/users",
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
            if (data) setUsers(data || []);
            setLoading(false);
          })
          .catch((err) => {
            setError(err.message);
            setLoading(false);
          });
      }, []);
    
      if (loading) return <div>กำลังโหลดข้อมูล...</div>;
      if (error) return <div>เกิดข้อผิดพลาด: {error}</div>;
      // ฟิลเตอร์ข้อมูล
      let filteredUsers = users.filter(u =>
        (!searchName || `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchName.toLowerCase())) &&
        (!searchStatus || u.status === searchStatus) &&
        (!searchPermission || u.permission === searchPermission)
      );
      if (loading) return <div>กำลังโหลดข้อมูล...</div>;
      if (error) return <div>เกิดข้อผิดพลาด: {error}</div>;
      if (filteredUsers.length === 0) {
        return <div className="p-4 text-center text-gray-400">NO DATA</div>;
      }


      // ฟังก์ชันเพิ่มผู้ใช้งานใหม่
      const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (loadingCreate) return;
        setLoadingCreate(true);
        const formData = new FormData(e.currentTarget);
        const newUser = {
          username: formData.get("username") as string,
          password: formData.get("password") as string,
          first_name: formData.get("first_name") as string,
          last_name: formData.get("last_name") as string,
          permission: formData.get("permission") as string,
          status: formData.get("status") as string,
        };
        try {
            const response = await fetch("https://api.maproflow.com/users", {
              credentials: "include",  
              method: "POST",
                headers: {
                "Content-Type": "application/json",
                },
                body: JSON.stringify(newUser),
            });
            if (!response.ok) throw new Error("Failed to create user");
            const createdUser = await response.json();
            setUsers([...users, createdUser]);
            setShowCreateModal(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
          setLoadingCreate(false);
        }
      };
    
    // ฟังก์ชันแก้ไขผู้ใช้งาน
    const handleEditUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (loadingEdit) return;
        setLoadingEdit(true);
        const formData = new FormData(e.currentTarget);
        const updatedUser = {
          id: editUser?.id,
          username: formData.get("username") as string,
          password: formData.get("password") as string,
          first_name: formData.get("first_name") as string,
          last_name: formData.get("last_name") as string,
          permission: formData.get("permission") as string,
          status: formData.get("status") as string,
        };
        try {
            const response = await fetch(`https://api.maproflow.com/users`, {
              credentials: "include",  
              method: "PUT",
                headers: {
                "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedUser),
            });
            if (!response.ok) throw new Error("Failed to update user");
            const updated = await response.json();
            setUsers(users.map((u) => (u.id === updated.id ? updated : u)));
            setShowEditModal(false);
            setEditUser(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
          setLoadingEdit(false);
        }
      };

    // ฟังก์ชันลบผู้ใช้งาน
    const handleDeleteUser = async (id: any) => {
        if (!deleteUser || loadingDelete) return;
        setLoadingDelete(true);
        const userID = {
            id: Number(deleteUser.id)
        }
        try {   
            const response = await fetch(`https://api.maproflow.com/users`,
            {
              credentials: "include",      
              method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userID),
            });
            if (!response.ok) throw new Error("Failed to delete user");
            setUsers(users.map(u =>
              u.id === deleteUser.id ? { ...u, status: "inactive" } : u
            ));
            setShowDeleteModal(false);
            setDeleteUser(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
          setLoadingDelete(false);
        }
      };


    return <div className="min-h-screen flex flex-col items-center justify-start bg-blue-50 py-8 px-2">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-lg p-4 md:p-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-blue-700">รายชื่อผู้ใช้งาน</h1>
          <button onClick={() => setShowCreateModal(true)} className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-8 rounded-lg shadow transition-colors text-lg md:text-xl">
            เพิ่มผู้ใช้งานใหม่
          </button>
        </div>
        {/* ช่องค้นหา */}
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <input
            type="text"
            placeholder="ค้นหาชื่อ..."
            className="border px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-base md:text-lg w-full max-w-md shadow-sm"
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            style={{ minWidth: 220 }}
          />
          <select
            className="border px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-base md:text-lg shadow-sm"
            value={searchPermission}
            onChange={e => setSearchPermission(e.target.value)}
          >
            <option value="">ทุกสิทธิ์</option>
            <option value="m">ผู้จัดการ</option>
            <option value="e">พนักงาน</option>
          </select>
          <select
            className="border px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-base md:text-lg shadow-sm"
            value={searchStatus}
            onChange={e => setSearchStatus(e.target.value)}
          >
            <option value="">ทุกสถานะ</option>
            <option value="a">ยังใช้งาน</option>
            <option value="u">ไม่ได้ใช้งาน</option>
          </select>
        </div>
        <div className="overflow-x-auto rounded-lg">
          <table className="min-w-[900px] w-full divide-y divide-white-20 border rounded-lg text-sm md:text-base lg:text-lg bg-white">
            <thead>
              <tr className="bg-blue-50">
                <th className="px-2 py-3 text-center font-semibold w-12">ลำดับ</th>
                <th className="px-2 py-3 text-center font-semibold w-14">สถานะ</th>
                <th className="px-2 py-3 text-center font-semibold w-24">สิทธิ์</th>
                <th className="px-2 py-3 text-left font-semibold w-48">ชื่อ-สกุล</th>
                <th className="px-2 py-3 text-center font-semibold w-24">แก้ไข</th>
                <th className="px-2 py-3 text-center font-semibold w-24">ยกเลิก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((u, idx) => (
                <tr
                  key={u.id}
                  className={`transition-colors hover:bg-blue-100 text-base md:text-lg ${u.status === "u" ? "text-red-600" : ""}`}
                  style={{ cursor: "pointer" }}
                  onClick={e => {
                    if ((e.target as HTMLElement).tagName === "BUTTON") return;
                    setDetailUser(u);
                    setShowDetailModal(true);
                  }}
                >
                  <td className="px-2 py-3 text-center w-12">{idx + 1}</td>
                  <td className="px-2 py-3 text-center w-14">
                    <span
                      className={
                        u.status === "a"
                          ? "inline-block w-4 h-4 rounded-full bg-green-500 border border-green-700"
                          : "inline-block w-4 h-4 rounded-full bg-red-500 border border-red-700"
                      }
                      title={u.status === "a" ? "ยังใช้งาน" : "ไม่ได้ใช้งาน"}
                    ></span>
                  </td>
                  <td className="px-2 py-3 text-center w-24">{permission[u.permission]}</td>
                  <td className="px-2 py-3 break-words font-medium w-48">{u.first_name} {u.last_name}</td>
                  <td className="px-2 py-3 text-center w-24">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setEditUser(u);
                        setShowEditModal(true);
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-5 rounded-lg shadow transition-colors text-base md:text-lg"
                    >
                      แก้ไขข้อมูล
                    </button>
                  </td>
                  <td className="px-2 py-3 text-center w-24">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setDeleteUser(u);
                        setShowDeleteModal(true);
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-5 rounded-lg shadow transition-colors text-base md:text-lg"
                    >
                      ยกเลิกผู้ใช้งาน
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal รายละเอียดผู้ใช้งาน */}
      {showDetailModal && detailUser && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="max-w-lg max-h-[90vh] mx-auto my-10 bg-white rounded-lg overflow-y-auto p-4">
            <h2 className="text-lg font-bold mb-4 text-center">รายละเอียดผู้ใช้งาน</h2>
            <div className="flex flex-col items-center gap-4">
              <div className="w-full">
                <div className="mb-2"><span className="font-semibold">ชื่อ:</span> {detailUser.first_name}</div>
                <div className="mb-2"><span className="font-semibold">นามสกุล:</span> {detailUser.last_name}</div>
                <div className="mb-2"><span className="font-semibold">Username:</span> {detailUser.username}</div>
                <div className="mb-2"><span className="font-semibold">สิทธิ์:</span> {permission[detailUser.permission]}</div>
                <div className="mb-2"><span className="font-semibold">สถานะ:</span> {detailUser.status === "a" ? "ยังใช้งาน" : "ไม่ได้ใช้งาน"}</div>
              </div>
            </div>
            <div className="text-center mt-4">
              <button
                onClick={() => { setShowDetailModal(false); setDetailUser(null); }}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded shadow"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="max-w-lg max-h-[90vh] mx-auto my-10 bg-white rounded-lg overflow-y-auto p-4">
            <h2 className="text-lg font-bold mb-4">เพิ่มผู้ใช้งานใหม่</h2>
            <form onSubmit={handleCreateUser}>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="hidden" name="status" value="a" />
                <div>
                  <label className="block text-sm font-medium mb-2">ชื่อ</label>
                  <input type="text" name="first_name" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ชื่อ" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">นามสกุล</label>
                  <input type="text" name="last_name" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="นามสกุล" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Username</label>
                <input type="text" name="username" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Username" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Password</label>
                <input type="password" name="password" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Password" />
              </div>
                <div>
                  <label className="block text-sm font-medium mb-2">สิทธิ์การใช้งาน</label>
                  <select name="permission" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">เลือกสิทธิ์</option>
                    <option value="m">ผู้จัดการ</option>
                    <option value="e">พนักงาน</option>
                  </select>
                </div>
              <div className="mt-5 text-right mx-auto">
                <button
                  type="submit"
                  className={`mx-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-3 rounded transition-colors duration-150 shadow-sm ${loadingCreate ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={loadingCreate}
                >
                  {loadingCreate ? 'กำลังบันทึก...' : 'ยืนยัน'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="mx-1 bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded transition-colors duration-150 shadow-sm"
                  disabled={loadingCreate}
                >
                  ปิด
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && deleteUser && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="max-w-lg max-h-[90vh] mx-auto my-10 bg-white rounded-lg overflow-y-auto p-4">
            <h2 className="text-lg font-bold mb-4 text-center">ลบข้อมูลผู้ใช้งาน</h2>
            <h2 className="text-lg font-bold mb-4 text-center">{deleteUser.first_name} {deleteUser.last_name}</h2>
            <h2 className="text-lg font-bold mb-4 text-center">ใช่หรือไม่</h2>
            <div className="mt-5 text-right mx-auto">
              <button
                onClick={() => handleDeleteUser(deleteUser.id)}
                className={`mx-1 bg-green-500 hover:bg-green-600 text-white font-medium py-1 px-3 rounded transition-colors duration-150 shadow-sm ${loadingDelete ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={loadingDelete}
              >
                {loadingDelete ? 'กำลังลบ...' : 'ยืนยัน'}
              </button>
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setDeleteUser(null); }}
                className="mx-1 bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded transition-colors duration-150 shadow-sm"
                disabled={loadingDelete}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editUser && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="max-w-lg max-h-[90vh] mx-auto my-10 bg-white rounded-lg overflow-y-auto p-4">
            <h2 className="text-lg font-bold mb-4">แก้ไขข้อมูลผู้ใช้งาน</h2>
            <form onSubmit={handleEditUser}>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">ชื่อ</label>
                  <input type="text" name="first_name" defaultValue={editUser.first_name} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ชื่อ" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">นามสกุล</label>
                  <input type="text" name="last_name" defaultValue={editUser.last_name} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="นามสกุล" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Username</label>
                <input type="text" name="username" defaultValue={editUser.username} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Username" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Password</label>
                <input type="password" name="password" defaultValue={editUser.password} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Password" />
              </div>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">สิทธิ์การใช้งาน</label>
                  <select name="permission" defaultValue={editUser.permission} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">เลือกสิทธิ์</option>
                    <option value="m">ผู้จัดการ</option>
                    <option value="e">พนักงาน</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">สถานะ</label>
                  <select name="status" defaultValue={editUser.status} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="a">Active</option>
                    <option value="u">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="mt-5 text-right mx-auto">
                <button
                  type="submit"
                  className={`mx-1 bg-green-500 hover:bg-green-600 text-white font-medium py-1 px-3 rounded transition-colors duration-150 shadow-sm ${loadingEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={loadingEdit}
                >
                  {loadingEdit ? 'กำลังบันทึก...' : 'ยืนยัน'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditUser(null); }}
                  className="mx-1 bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded transition-colors duration-150 shadow-sm"
                  disabled={loadingEdit}
                >
                  ปิด
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
}

export default UserPage;