import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PublicHeader />
      
      <main className="flex-grow">
        <div className="bg-blue-900 py-16 text-center text-white">
          <h1 className="text-4xl font-bold mb-4">About the System</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto px-4">
            Digitizing C&D Waste Management for a Cleaner, Smarter City
          </p>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
          
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed text-lg">
              The Transport Permit System is dedicated to modernizing the management of Construction & Demolition (C&D) waste. 
              By replacing paper-based processes with a secure, digital platform, we aim to increase transparency, 
              reduce illegal dumping, and ensure that waste reaches designated processing plants efficiently.
            </p>
          </section>

          <section className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-blue-600 mb-3">For Transporters</h3>
              <p className="text-gray-600">
                Easily generate permits online, track your trips, and get faster approvals. 
                No more challan, paperwork hurdles or physical visits to municipal offices.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold text-blue-600 mb-3">For Authorities</h3>
              <p className="text-gray-600">
                Real-time tracking of waste movement, instant verification via QR codes, prevent illegal dumping
                and comprehensive audit trails for better enforcement and planning.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Features</h2>
            <ul className="grid md:grid-cols-2 gap-4 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                Instant Digital Permits
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                QR Code Verification
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                Role-Based Access Control
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                Automated Weighbridge Integration
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                Photo Evidence Upload
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                Comprehensive Analytics
              </li>
            </ul>
          </section>
        </div>
      </main>

      {/* <PublicFooter /> */}
    </div>
  );
}
