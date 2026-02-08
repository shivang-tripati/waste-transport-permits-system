'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
      <div className="w-full max-w-2xl text-center space-y-12">
        {/* Animated 404 Text */}
        <div className="relative inline-block">
          <h1 className="text-[12rem] font-[1000] text-slate-100 leading-none select-none tracking-tighter">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-widest italic animate-bounce">
                Lost in <span className="text-primary">Transit</span>
            </h2>
          </div>
        </div>

        <div className="space-y-6 max-w-md mx-auto">
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Portal Link Broken</h3>
            <p className="text-slate-500 font-medium">
              The permit or portal resource you are looking for has been moved, archived, or deleted from the central registry.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link href="/" className="flex-1 max-w-[200px]">
              <Button className="w-full h-14 text-lg font-black bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all shadow-xl hover:scale-[1.05] active:scale-[0.95]">
                HOME
              </Button>
            </Link>
            <Link href="/verify" className="flex-1 max-w-[200px]">
              <Button variant="outline" className="w-full h-14 text-lg font-black bg-white border-2 border-slate-200 text-slate-600 rounded-2xl transition-all hover:bg-slate-50 hover:border-slate-300">
                VERIFY
              </Button>
            </Link>
          </div>
        </div>

        <footer className="pt-12">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/80 backdrop-blur-md rounded-full border border-slate-200 shadow-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    System Alert: Endpoint Not Resolved
                </span>
            </div>
        </footer>
      </div>
    </main>
  );
}
