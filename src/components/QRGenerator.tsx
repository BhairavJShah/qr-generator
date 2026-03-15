"use client";

import React, { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { QRCodeSVG } from "qrcode.react";
import { UploadCloud, Link as LinkIcon, Download, Loader2, AlertCircle } from "lucide-react";

type Tab = "text" | "file";

export default function QRGenerator() {
  const [activeTab, setActiveTab] = useState<Tab>("text");
  const [textInput, setTextInput] = useState("");
  const [qrValue, setQrValue] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const qrRef = useRef<SVGSVGElement>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Check size limit (GitHub max file size is ~100MB, let's limit to 50MB for API safety)
    if (file.size > 50 * 1024 * 1024) {
      setError("File is too large. Maximum size is 50MB.");
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setQrValue(data.url);
      setTextInput(data.url); // Show the URL to the user
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
  });

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextInput(e.target.value);
    setQrValue(e.target.value);
  };

  const handleDownload = () => {
    if (!qrRef.current) return;
    
    // Get SVG data
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("base64");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const context = canvas.getContext("2d");
      if (context) {
        context.fillStyle = "#ffffff"; // White background
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0);
        
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = "qrcode.png";
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab("text")}
          className={`flex-1 py-3 flex items-center justify-center gap-2 font-medium transition-colors ${
            activeTab === "text"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <LinkIcon size={18} />
          Text or URL
        </button>
        <button
          onClick={() => setActiveTab("file")}
          className={`flex-1 py-3 flex items-center justify-center gap-2 font-medium transition-colors ${
            activeTab === "file"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <UploadCloud size={18} />
          File Upload
        </button>
      </div>

      {/* Input Area */}
      <div className="mb-8 min-h-[200px]">
        {activeTab === "text" ? (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Enter any text or website URL
            </label>
            <input
              type="text"
              value={textInput}
              onChange={handleTextChange}
              placeholder="https://example.com"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
            } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <input {...getInputProps()} />
            
            {isUploading ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-6">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-gray-600 font-medium">Uploading to GitHub...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4 py-6">
                <div className="p-4 bg-blue-100 rounded-full text-blue-600">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-gray-800 font-medium text-lg">
                    Drag & drop a file here
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    or click to browse from your computer
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* QR Code Result */}
      {qrValue && (
        <div className="bg-gray-50 p-6 rounded-xl border flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
            <QRCodeSVG
              id="qr-code-svg"
              value={qrValue}
              size={200}
              level={"H"}
              includeMargin={true}
              ref={qrRef}
            />
          </div>
          
          {activeTab === "file" && (
            <div className="w-full text-center mb-6">
              <p className="text-sm text-gray-500 mb-1">Generated Link:</p>
              <a 
                href={qrValue} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 text-sm break-all hover:underline"
              >
                {qrValue}
              </a>
            </div>
          )}

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Download size={18} />
            Download QR Code
          </button>
        </div>
      )}
    </div>
  );
}
