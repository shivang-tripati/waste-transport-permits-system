import plantImg8 from '@/../public/image/7.jpeg';
import Image from "next/image";


export default function SectionProblem() {
  return (
    <section className="bg-secondary">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          {/* Text */}
          <div>
            <h2 className="text-2xl font-bold text-primary py-2 mb-4">
              Why This System Is Required
            </h2>

            <p className="text-gray-700 leading-relaxed">
              Unregulated disposal of Construction and Demolition (C&D) waste
              poses serious environmental, infrastructural, and public health
              challenges in urban regions.
            </p>

            <ul className="mt-4 list-disc list-inside text-gray-700 space-y-2">
              <li>Lack of real-time verification of waste transport</li>
              <li>Manual paper challans prone to misuse</li>
              <li>No traceability from source to disposal site</li>
              <li>Limited enforcement and audit capability</li>
            </ul>
          </div>

          {/* Image */}
          <div className="border rounded overflow-hidden bg-white">
            <div className="aspect-video bg-gray-200 flex items-center justify-center text-sm text-gray-500">
              <Image src={plantImg8} alt="Plant Image" className="w-full h-full object-cover" />    
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
