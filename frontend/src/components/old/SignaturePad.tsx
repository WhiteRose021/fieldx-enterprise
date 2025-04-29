"use client";

import React, { useRef, useState } from "react";
import SignaturePad from "react-signature-canvas";
import { useRouter } from "next/navigation";

const SignatureComponent = ({ entityId }: { entityId: string }) => {
  const signatureRef = useRef<SignaturePad | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const clearSignature = () => {
    signatureRef.current?.clear();
  };

  const saveSignature = async () => {
    if (signatureRef.current?.isEmpty()) {
      alert("Please provide a signature before saving!");
      return;
    }

    const signatureData = signatureRef.current?.toDataURL();

    try {
      const response = await fetch("/api/saveSignature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ signature: signatureData, entityId }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Signature saved successfully!");
        setSaved(true);
        router.push(`/Dummy/${entityId}`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while saving the signature.");
    }
  };

  return (
    <div className="p-4 border rounded shadow-md bg-white">
      <h1 className="text-xl font-semibold mb-4">Draw Your Signature</h1>
      <div className="border rounded mb-4">
        <SignaturePad
          ref={signatureRef}
          penColor="black"
          canvasProps={{
            className: "w-full h-48 bg-gray-200",
          }}
        />
      </div>
      <div className="flex gap-4">
        <button
          onClick={saveSignature}
          className="bg-blue-500 text-white px-4 py-2 rounded shadow"
        >
          Save
        </button>
        <button
          onClick={clearSignature}
          className="bg-red-500 text-white px-4 py-2 rounded shadow"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default SignatureComponent;
