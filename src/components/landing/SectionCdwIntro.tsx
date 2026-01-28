export default function SectionCdwIntro() {
  return (
    <section className="bg-white">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-xl font-semibold text-[#6E2D5B] mb-4">
          What Is Construction & Demolition (C&D) Waste
        </h2>

        <p className="text-gray-700 mb-6">
          Construction and Demolition (C&D) waste refers to waste generated from
          construction, renovation, repair, and demolition activities of buildings,
          roads, and other infrastructure.
        </p>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700">
          <div>Concrete and cement debris</div>
          <div>Bricks and masonry</div>
          <div>Soil, sand, and aggregates</div>
          <div>Tiles and ceramics</div>
          <div>Wood and metal</div>
          <div>Mixed construction debris</div>
        </div>
      </div>
    </section>
  );
}
