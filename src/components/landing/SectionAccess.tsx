import Link from "next/link";

export default function SectionAccess() {
  return (
    <section className="bg-primary-light border-b border-border">
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          System Access
        </h2>

        <p className="text-gray-700 mb-8">
          Authorized users may access the system using the options below.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/register"
            className="px-6 py-2 border border-gray-400 text-gray-900 hover:bg-gray-100"
          >
            Register
          </Link>

          <Link
            href="/login"
            className="px-6 py-2 border border-gray-400 text-gray-900 hover:bg-gray-100"
          >
            Login
          </Link>

          <Link
            href="/compliance/verify"
            className="px-6 py-2 border border-gray-400 text-gray-900 hover:bg-gray-100"
          >
            Verify Permit
          </Link>
        </div>
      </div>
    </section>
  );
}
