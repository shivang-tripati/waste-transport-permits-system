import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

import { QueryProvider } from '@/lib/query';
import { AuthProvider } from '@/hooks/use-auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Digital C&D Waste Transport Permit System | Gurugram',
  description:
    'Government-authorized digital system for regulation, monitoring, and verification of Construction and Demolition (C&D) waste transport within Gurugram.',
  keywords: [
    'C&D waste management',
    'construction demolition waste',
    'digital transport permit',
    'municipal waste system',
    'Gurugram malba management',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-white text-gray-900 antialiased`}
      >
        <QueryProvider>
          <AuthProvider>     
              {children}
          </AuthProvider>
        </QueryProvider>
          <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
