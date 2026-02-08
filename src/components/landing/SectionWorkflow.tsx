const steps = [
  {
    title: "Waste Generation at Site",
    desc: "C&D waste is generated during construction or demolition activities.",
  },
  {
    title: "Waste Documentation",
    desc: "Waste details and photographic evidence are recorded digitally.",
  },
  {
    title: "Digital Permit Generation",
    desc: "A time-bound digital transport permit is issued for the vehicle.",
  },
  {
    title: "Transportation",
    desc: "Waste is transported via authorized vehicles and routes.",
  },
  {
    title: "Verification",
    desc: "Permit validity is verified using QR code or reference number.",
  },
  {
    title: "Delivery at Authorized Facility",
    desc: "Waste is received, recorded, and processed at the facility.",
  },
];

export default function SectionWorkflow() {
  return (
    <section className="bg-primary-light">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-xl font-semibold text-primary mb-8">
          End-to-End Waste Movement Workflow
        </h2>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="border-l-2 border-l-primary border-gray-300 pl-6 space-y-6">
            {steps.map((step, i) => (
              <div key={i}>
                <h4 className="font-medium text-gray-900">{step.title}</h4>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
          <div>
            {/* video to explain the workflow */}
            {/* <video src=""></video> */}
          </div>
        </div>
      </div>
    </section>
  );
}
