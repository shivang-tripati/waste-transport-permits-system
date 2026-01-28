import Link from 'next/link';
import { Button } from '@/components/ui';

export function PublicHeader() {
  return (
    <nav className="bg-primary border-b border-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-white">Malba Free Gurugram</span>
              {/* <span className="ml-2 text-sm text-blue-200 hidden sm:inline">Transport Permit System</span> */}
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/about" className="text-blue-100 hover:text-white transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-blue-100 hover:text-white transition-colors">
              Contact
            </Link>
            <Link href="/verify" className="text-blue-100 hover:text-white transition-colors">
              Verify Permit
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm" className="border-white text-white hover:bg-white hover:text-blue-900">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                Register
              </Button>
            </Link>
          </div>
          
          {/* Mobile menu button could go here */}
        </div>
      </div>
    </nav>
  );
}
