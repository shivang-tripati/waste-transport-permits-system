import SectionHeader from '@/components/landing/SectionHeader';
import SectionCdwIntro from '@/components/landing/SectionCdwIntro';
import SectionWasteClassification from '@/components/landing/SectionWasteClassification';
import SectionWorkflow from '@/components/landing/SectionWorkflow';
import SectionPlant from '@/components/landing/SectionPlant';
import SectionProblem from '@/components/landing/SectionProblem';
import SectionPermit from "@/components/landing/SectionPermit";
import SectionVerification from "@/components/landing/SectionVerification";
import SectionCompliance from "@/components/landing/SectionCompliance";
import SectionAccess from "@/components/landing/SectionAccess";
import GovNavbar from '@/components/layout/GovNavbar';
import GovFooter from '@/components/layout/GovFooter';


export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      {/* Navigation */}

      <GovNavbar />
      <SectionHeader />
      <SectionProblem />
      <SectionCdwIntro />
      <SectionWasteClassification />
      <SectionWorkflow />
      <SectionPlant />
      <SectionPermit />
      <SectionVerification />
      <SectionCompliance />
      {/* <SectionAccess /> */}

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary">100%</div>
              <div className="text-gray-600 mt-1">Paperless Process</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">24/7</div>
              <div className="text-gray-600 mt-1">Online Verification</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">Real-time</div>
              <div className="text-gray-600 mt-1">Tracking & Updates</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">Secure</div>
              <div className="text-gray-600 mt-1">Audit Trail</div>
            </div>
          </div>
        </div>
      </section>

      <GovFooter />

      {/* <SectionFooter /> */}


      {/* Hero Section */}
      {/* <section className="relative pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Digital Transport Permit
            <span className="block text-emerald-400">For C&D Waste Management</span>
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Replace paper challans with digital permits. Track, verify, and manage 
            Construction & Demolition waste transport with complete transparency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/permit/new">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto">
                Create New Permit
              </Button>
            </Link>
            <Link href="/verify">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-900 w-full sm:w-auto">
                Permit Verification
              </Button>
            </Link>
          </div>
        </div> */}

      {/* Decorative elements */}
      {/* <div className="absolute top-1/2 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </section> */}

      {/* Features Section */}
      {/* <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Create Permit</h3>
              <p className="text-gray-600">
                Fill in waste details, upload evidence photos, and submit for approval digitally.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Approved</h3>
              <p className="text-gray-600">
                Receive digital approval with QR code. Valid permits are time-bound and verifiable.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Verify Anywhere</h3>
              <p className="text-gray-600">
                Officers scan QR or enter token for instant verification. No login required.
              </p>
            </div>
          </div>
        </div>
      </section> */}



      {/* CTA Section */}
      {/* <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to go digital?
          </h2>
          <p className="text-blue-100 mb-8">
            Join the modern waste transport management system. Register now and 
            create your first permit in minutes.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section> */}

      {/* Footer */}
      {/* <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-white font-semibold mb-4">Transport Permit System</h4>
              <p className="text-sm">
                Digital solution for C&D waste transport management. 
                Replacing paper with efficient digital permits.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/verify" className="hover:text-white">Permit Verification</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Users</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-white">Login</Link></li>
                <li><Link href="/register" className="hover:text-white">Register</Link></li>
                <li><Link href="/permit/new" className="hover:text-white">Create Permit</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-white">Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Transport Permit System. All rights reserved.</p>
          </div>
        </div>
      </footer> */}
    </div>
  );
}
