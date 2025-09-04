
import React, { useRef, useEffect, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from '@zxing/browser';


export default function BarcodeScannerModal({ onDetected, onClose }: { onDetected: (code: string) => void, onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const stopCamera = useCallback(() => {
    const codeReader = codeReaderRef.current;
    if (codeReader) {
      (codeReader as any).reset && (codeReader as any).reset();
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  // เปิดกล้องครั้งเดียวตอน mount
  useEffect(() => {
    let stream: MediaStream | null = null;
    let mounted = true;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current && mounted) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e) {
        setError("ไม่สามารถเปิดกล้องได้: " + (e && typeof e === "object" && "message" in e ? (e as { message: string }).message : e));
        setScanning(false);
      }
    })();
    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);


  // ฟังก์ชันสแกน barcode แบบ real-time (callback ทุกเฟรม)
  const scanBarcode = useCallback(() => {
    setError(null);
    setScanning(true);
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;
    let detected = false;
    // ตั้ง timeout ถ้าไม่เจอ barcode ภายใน 10 วินาที
    const tid = setTimeout(() => {
      setError('ไม่พบบาร์โค้ด กรุณาลองใหม่');
      setScanning(false);
      (codeReader as any).reset && (codeReader as any).reset();
    }, 10000);
    setTimeoutId(tid);
    codeReader.decodeFromVideoElement(videoRef.current!, (result, err) => {
      if (result && !detected) {
        detected = true;
        clearTimeout(tid);
        setTimeoutId(null);
        (codeReader as any).reset && (codeReader as any).reset();
        onDetected(result.getText());
        onClose();
      }
      // ไม่ต้อง setError ทุกเฟรม
    });
    return () => { detected = true; (codeReader as any).reset && (codeReader as any).reset(); };
  }, [onDetected, onClose]);

  // เริ่มสแกนทันทีเมื่อ mount
  useEffect(() => {
    scanBarcode();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-4 shadow-lg flex flex-col items-center">
        <video ref={videoRef} style={{ width: 480, height: 360, background: '#000', borderRadius: 8 }} />
        <div className="mt-2">นำบาร์โค้ดไปหน้ากล้องเพื่อสแกน</div>
        {error && <div className="mt-2 text-red-600 font-semibold">{error}</div>}
        <div className="flex gap-2 mt-4">
          <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => { scanBarcode(); }}>ลองใหม่</button>
          <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={() => { stopCamera(); onClose(); }}>ปิด</button>
        </div>
      </div>
    </div>
  );
}
