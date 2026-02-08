import Link from "next/link";

export default function GovNavbar() {
  return (
    <header className="w-full border-b border-gray-300 bg-white">
      
      {/* Authority Strip */}
<div className="bg-primary text-white text-sm">
  <div className="max-w-7xl mx-auto px-6 py-2 flex justify-between">
    <span>Malba Free Gurugram (MFG)</span>
    <span>Government / Municipal Authority – Gurugram</span>
    <span>Construction & Demolition Waste Management</span>
  </div>
</div>


      {/* System Title */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Digital C&D Waste Transport Permit System
            </h1>
            <p className="text-sm text-gray-600">
              Malba Free Gurugram (MFG)
            </p>
          </div>

          {/* Utility Links */}
          <nav className="flex flex-wrap gap-6 text-sm text-primary text-center font-semibold">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <Link href="/compliance/verify" className="hover:underline">
              Verify Permit
            </Link>
            <Link href="/about" className="hover:underline">
              About
            </Link>
            <Link href="/contact" className="hover:underline">
              Contact
            </Link>
            <Link href="/login" className="hover:underline">
              Login
            </Link>
          </nav>

        </div>
      </div>
    </header>
  );
}
