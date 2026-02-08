'use client';

import Link from 'next/link';
import { Button, Card, CardContent } from '@/components/ui';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
        <div className="bg-gradient-to-br from-rose-600 to-red-800 h-4 w-full" />
        <CardContent className="p-10 text-center space-y-8">
          <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M12 15v2m0 0v2m0-2h2m-2 0H10m11 3a9 9 0 11-18 0 9 9 0 0118 0zM12 5V3m0 2H9m3 0h3"
              />
            </svg>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic leading-none">
              Access <span className="text-rose-600">Denied</span>
            </h1>
            <p className="text-slate-500 font-medium text-lg">
              You do not have the necessary permissions to access this high-security portal.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left space-y-4">
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-slate-200 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black">1</div>
              <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">Contact your department administrator to request access.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-slate-200 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black">2</div>
              <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">Ensure you are logged in with the correct official credentials.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/" className="w-full">
              <Button className="w-full h-14 text-lg font-black bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]">
                Back to Command Center
              </Button>
            </Link>
          </div>

          <footer className="pt-4">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">
              Security Protocol Level 4 Active <br />
              Municipal Corporation Gurugram
            </p>
          </footer>
        </CardContent>
      </Card>
    </div>
  );
}
