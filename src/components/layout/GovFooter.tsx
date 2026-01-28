import Link from "next/link";

export default function GovFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300 text-sm">
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        <div className="grid md:grid-cols-4 gap-8">
          
          {/* System Info */}
          <div>
            <h4 className="text-white font-semibold mb-3">
              Digital C&D Waste Transport Permit System
            </h4>
            <p className="text-gray-400 leading-relaxed">
              A government-authorized digital platform for monitoring and regulating
              the transportation and disposal of Construction & Demolition waste
              within Gurugram.
            </p>
          </div>

          {/* Authority */}
          <div>
            <h4 className="text-white font-semibold mb-3">
              Implementing Authority
            </h4>
            <ul className="space-y-2 text-gray-400">
              <li>Municipal / Local Authority</li>
              <li>Gurugram, Haryana</li>
              <li>India</li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-3">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/verify" className="hover:underline">
                  Verify Permit
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:underline">
                  User Login
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:underline">
                  About the System
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:underline">
                  Contact & Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-3">
              Legal & Policy
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy-policy" className="hover:underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:underline">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link href="/compliance" className="hover:underline">
                  Compliance & Governance
                </Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-gray-700 mt-10 pt-6 text-center text-gray-500">
          © {new Date().getFullYear()} Digital C&D Waste Transport Permit System.  
          All rights reserved.
        </div>
      </div>
    </footer>
  );
}
