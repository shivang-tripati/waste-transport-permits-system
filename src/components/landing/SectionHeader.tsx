import GovHeroSlider from "./GovHeroSlider";

export default function SectionHeader() {
  return (

    <section className="bg-primary-light border-b border-border">

     {/* RIGHT: IMAGE SLIDER */}
        <GovHeroSlider />

      <div className="max-w-7xl mx-auto px-6 py-5">
        <h1 className="text-2xl md:text-3xl font-semibold text-primary">
          Digital Construction & Demolition Waste Transport Permit System
        </h1>

        <p className="mt-3 text-gray-700 max-w-4xl">
          A centralized digital platform for regulating, monitoring, and verifying
          the transportation of Construction & Demolition (C&D) waste within Gurugram.
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Implemented to ensure lawful disposal, environmental compliance,
          and end-to-end traceability of C&D waste.
        </p>

       
      </div>
    </section>
  );
}
