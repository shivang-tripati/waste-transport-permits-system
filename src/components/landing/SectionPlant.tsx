import Image from "next/image";
import plantImg from "@/../public/image/7.jpeg"
import plantImg2 from "@/../public/image/8.jpeg"
import plantImg3 from "@/../public/image/3.jpeg"
import plantImg4 from "@/../public/image/4.jpeg"
import plantImg5 from "@/../public/image/5.jpeg"
import plantImg6 from "@/../public/image/6.jpeg"
// import plantImg7 from "@/../public/image/7.jpeg"

const plantImages = [
  {img: plantImg, label: "Facility Entrance"},
  {img: plantImg2, label: "Waste Segregation Area"},
  {img: plantImg3, label: "Processing Machinery"},
  {img: plantImg4, label: "Material Storage Zone"},
  {img: plantImg5, label: "Weighbridge Area"},
  {img: plantImg6, label: "Operational Yard"}
];

export default function SectionPlant() {
  return (
    <section className="bg-secondary">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-xl font-semibold text-primary mb-8">
          Authorized C&D Waste Processing Facility
        </h2>

        <p className="text-gray-700 mb-8 max-w-4xl">
          All permitted Construction & Demolition waste is delivered exclusively
          to authorized processing facilities equipped for segregation, recycling,
          and environmentally safe disposal.
        </p>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {plantImages.map((item, i) => (
            <div key={i} className="border-2 border-[#6E2D5B] p-2 bg-white">
              <div className="aspect-video bg-gray-200 flex items-center justify-center text-sm text-gray-500">
                <Image src={item.img} alt={item.label} width={500} height={500} className="w-full h-full object-cover" />
              </div>
              <p className="text-sm text-gray-600 p-2">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
