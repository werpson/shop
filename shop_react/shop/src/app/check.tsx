"use client";
import { useEffect } from "react";
import { usePathname,useRouter } from "next/navigation";
import { promises } from "dns";

const Check = ({children}: {children: React.ReactNode}) => {
//   const router = useRouter();
//   const path = usePathname();
//     useEffect(() => {
//         fetch("http://localhost:8081/jwt_shop/check", {
//     credentials: "include",
//     method: "GET",
//     headers: {
//       "Content-Type": "application/json",
//     },
//   })
//     .then((res) => {
//       if (!res.ok) {
//         throw new Error("Not authenticated");
//       }
//       return res.json();
//     })
//     .then((data) => {
//       if (data.status !== "ok") {
//         router.push("/login");
//       }
//       return Promise.reject();
//     })
//     fetch("http://localhost:8081/jwt_user/check", {
//       credentials: "include",
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//       },
//     })
//       .then((res) => {
//         if (!res.ok) {
//           router.push("/user_login");
//         }
//         return res.json();
//       })
//       .then((data) => {
//         if (data.status !== "ok") {
//           router.push("/user_login");
//         }
//         return Promise.reject();
//       })
//     }, [path]);

//   return <>
//     {children}
//     </>
}

export default Check;