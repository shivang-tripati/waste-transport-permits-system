'use client';

import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PublicHeader />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          <div className="prose max-w-none text-gray-600 space-y-4">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            <p>
              This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information
              when You use the Service and tells You about Your privacy rights and how the law protects You.
            </p>
            <h2 className="text-xl font-semibold text-gray-800 mt-6">Interpretation and Definitions</h2>
            <p>
              The words of which the initial letter is capitalized have meanings defined under the following conditions.
              The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
            </p>
            <h2 className="text-xl font-semibold text-gray-800 mt-6">Collecting and Using Your Personal Data</h2>
            <p>
              While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You.
            </p>
            {/* Add more placeholder content as needed */}
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
