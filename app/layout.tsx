// app/layout.tsx
import './globals.css';
import type { ReactNode } from 'react';

export const metadata = { title: 'Asset Manager' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        {children}
      </body>
    </html>
  );
}
