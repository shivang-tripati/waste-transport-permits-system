'use client';

import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PublicHeader />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          <div className="prose max-w-none text-gray-600 space-y-4 text-justify">
            <p className="text-sm">Last updated: {new Date().toLocaleDateString()}</p>
            
            <section className="mt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using the Digital C&D Waste Transport Permit System (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section className="mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Description of Service</h2>
              <p>
                The Service is a government-authorized digital platform designed to facilitate, monitor, and regulate the transportation and disposal of Construction & Demolition (C&D) waste within the jurisdiction of Gurugram.
              </p>
            </section>

            <section className="mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">3. User Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Users must provide accurate, current, and complete information during registration and permit applications.</li>
                <li>Users are responsible for maintaining the confidentiality of their account credentials.</li>
                <li>Transporters must strictly adhere to the routes and schedules approved in their permits.</li>
                <li>Waste generators must ensure that only authorized C&D waste is transported under the issued permits.</li>
              </ul>
            </section>

            <section className="mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Prohibited Activities</h2>
              <p>Users shall not:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Submit false or misleading information to obtain permits.</li>
                <li>Attempt to bypass or manipulate the digital tracking mechanisms.</li>
                <li>Use the Service for any unauthorized or illegal purpose.</li>
                <li>Interfere with or disrupt the integrity or performance of the Service.</li>
              </ul>
            </section>

            <section className="mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Enforcement and Penalties</h2>
              <p>
                The Municipal/Local Authority reserves the right to suspend or revoke permits and account access for violations of these terms. Legal action and penalties may be initiated as per the relevant waste management rules and local bylaws.
              </p>
            </section>

            <section className="mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Limitation of Liability</h2>
              <p>
                The platform is provided "as is". While every effort is made to ensure system availability and data accuracy, the Implementing Authority shall not be liable for any direct, indirect, or incidental damages resulting from the use or inability to use the Service.
              </p>
            </section>

            <section className="mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Modifications to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Significant changes will be notified through the platform. Continued use of the Service after modifications constitutes acceptance of the updated terms.
              </p>
            </section>

            <section className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 italic">
                For queries regarding these terms, please contact our support department through the contact page.
              </p>
            </section>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
