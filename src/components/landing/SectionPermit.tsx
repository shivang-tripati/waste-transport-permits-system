export default function SectionPermit() {
  return (
    <section className="bg-white">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-xl font-semibold text-primary mb-6">
          Digital Transport Permit System
        </h2>

        <p className="text-gray-700 leading-relaxed mb-4">
          The Digital Transport Permit System replaces traditional paper-based challans
          with a secure, verifiable, and tamper-resistant electronic permit mechanism.
        </p>

        <p className="text-gray-700 leading-relaxed mb-6">
          Each permit is generated for a specific waste movement and is linked to
          defined parameters to prevent misuse or duplication.
        </p>

        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Unique permit number for every waste movement</li>
          <li>Vehicle-specific and waste-type-specific permits</li>
          <li>Time-bound validity to prevent reuse</li>
          <li>QR code embedded for instant verification</li>
        </ul>
      </div>
    </section>
  );
}
