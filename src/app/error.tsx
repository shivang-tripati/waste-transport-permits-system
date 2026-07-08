'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
  console.error('Unhandled Runtime Error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-rose-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border-2 border-rose-100 rounded-[3rem] shadow-2xl p-10 text-center space-y-8 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-rose-600 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-xl rotate-12 transition-transform hover:rotate-0">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            System <span className="text-rose-600">Glitch</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg leading-snug">
            The neural grid encountered an unexpected anomaly during data processing.
          </p>
        </div>

        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-left font-mono text-xs text-rose-800 break-all overflow-hidden max-h-32">
          <p className="font-bold mb-1 uppercase tracking-widest text-[10px] text-slate-400">Error Digest</p>
          {error.digest || error.message || 'RUNTIME_EXCEPTION_0x88'}
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => reset()}
            className="w-full h-16 text-xl font-black bg-rose-600 hover:bg-rose-700 text-white rounded-2xl transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            REBOOT SESSION
          </Button>
          <Button
            variant="ghost"
            onClick={() => window.location.href = '/'}
            className="w-full h-12 font-bold text-slate-500 hover:text-slate-800"
          >
            Emergency Exit (Home)
          </Button>
        </div>

        <footer className="pt-4">
            <p className="text-[10px] font-black text-rose-200 uppercase tracking-widest leading-relaxed">
              Kernal Panic Handled <br />
              MCG Digital Infrastructure
            </p>
        </footer>
      </div>
    </main>
  );
}
