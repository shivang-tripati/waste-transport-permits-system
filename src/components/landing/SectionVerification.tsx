export default function SectionVerification() {
  return (
    <section className="bg-secondary">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-xl font-semibold text-primary mb-8">
          Permit Verification & Transparency
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Authorities */}
          <div className="border border-gray-300 p-6 bg-white">
            <h3 className="font-semibold text-gray-900 mb-3">
              Verification for Enforcement Authorities
            </h3>

            <p className="text-gray-700 mb-4">
              Authorized officers can Permit Verification authenticity and validity
              in real time during transit or at checkpoints.
            </p>

            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Scan QR code using standard mobile devices</li>
              <li>Instant permit status visibility</li>
              <li>No system login required for basic verification</li>
            </ul>
          </div>

          {/* Public */}
          <div className="border border-gray-300 p-6 bg-white">
            <h3 className="font-semibold text-gray-900 mb-3">
              Public Permit Verification
            </h3>

            <p className="text-gray-700 mb-4">
              Members of the public can verify the validity of a transport permit
              using the permit reference number.
            </p>

            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Search using permit reference number</li>
              <li>View permit validity and status</li>
              <li>Improves transparency and accountability</li>
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
}
