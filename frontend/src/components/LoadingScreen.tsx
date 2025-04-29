import React from "react";
import Image from "next/image";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50 z-50">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <Image
            src="/FieldX.png"
            alt="FieldX Logo"
            fill
            className="object-contain"
          />
        </div>
        <div className="mt-4">
          <div className="w-12 h-12 rounded-full border-4 border-t-[#0071BC] border-r-[#0071BC]/30 border-b-[#0071BC]/10 border-l-[#0071BC]/60 animate-spin mx-auto"></div>
        </div>
      </div>
    </div>
  );
}