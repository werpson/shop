import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./header";
import Footer from "./footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "maproflow",
  description: "เว็บจัดการคลังสินค้า",
  icons: {
    icon: "/OF5Suxfq-removebg-preview.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        {/* <Check> */}
        <Header/>
        <div className="flex-1 container mx-auto px-4 w-full">
          {children}
        </div>
        <Footer/>
        {/* </Check> */}
      </body>
    </html>
  );
}
