'use client';

import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';

export default function CompliancePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PublicHeader />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Compliance</h1>
          <div className="prose max-w-none text-gray-600 space-y-4">
            <p>
              We are committed to maintaining the highest standards of compliance with all applicable laws and regulations regarding waste management and transportation.
            </p>
            <h2 className="text-xl font-semibold text-gray-800 mt-6">Regulatory Framework</h2>
            <p>
              Our operations adhere to the Construction and Demolition Waste Management Rules, 2016, and other relevant environmental guidelines issued by the Central Pollution Control Board (CPCB) and relevant State authorities.
            </p>
            <h2 className="text-xl font-semibold text-gray-800 mt-6">User Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Ensure accurate declaration of waste type and quantity.</li>
              <li>Transport waste only to designated processing facilities.</li>
              <li>Carry valid transport permits during transit.</li>
              <li>Adhere to safety standards during loading and unloading.</li>
            </ul>
             <h2 className="text-xl font-semibold text-gray-800 mt-6">Enforcement</h2>
            <p>
              Non-compliance with these regulations may result in penalties, permit cancellation, and legal action as prescribed by law.
            </p>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
