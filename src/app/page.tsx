import QRGenerator from "@/components/QRGenerator";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dynamic QR Generator</h1>
          <p className="text-gray-500">
            Convert any text, link, or file into a QR code instantly. Files are stored securely in your GitHub repository.
          </p>
        </div>
        
        <QRGenerator />
        
      </div>
    </main>
  );
}
