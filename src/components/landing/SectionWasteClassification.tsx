import plantImg4 from "@/../public/image/3.jpeg"
import plantImg5 from "@/../public/image/4.jpeg"

import Image from "next/image";


export default function SectionWasteClassification() {
  return (
    <section className="bg-secondary">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-xl font-semibold text-primary mb-8">
          Classification of C&D Waste
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Segregated */}
          <div className="border  p-6 bg-white">
            <h3 className="font-semibold text-primary mb-2">
              Segregated Waste
            </h3>
            <p className="text-gray-700 mb-4">
              Waste that is separated at the source into individual material categories.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Higher recycling efficiency</li>
              <li>Faster processing at facility</li>
              <li>Reduced environmental impact</li>
            </ul>


              <div className="aspect-video bg-gray-200 flex items-center justify-center text-sm text-gray-500">
                <Image src={plantImg4} alt="Segregated Waste" width={500} height={500} className="w-full h-full object-cover" />
              </div>
              
          </div>

          {/* Unsegregated */}
          <div className="border border-gray-300 p-6 bg-white">
            <h3 className="font-semibold text-primary mb-2">
              Unsegregated Waste
            </h3>
            <p className="text-gray-700 mb-4">
              Mixed construction debris without separation at the source.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Requires secondary sorting</li>
              <li>Higher processing effort</li>
              <li>Lower recycling efficiency</li>
            </ul>

            <div className="aspect-video bg-gray-200 flex items-center justify-center text-sm text-gray-500">
                <Image src={plantImg5} alt="Unsegregated Waste" width={500} height={500} className="w-full h-full object-cover" />
              </div>
          </div>

        </div>
      </div>
    </section>
  );
}
