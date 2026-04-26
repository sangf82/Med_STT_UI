import type { ReactNode } from 'react';
import { Be_Vietnam_Pro, Newsreader } from 'next/font/google';

/** pen-stt-108 · H4.x / ERahL — title + body Vietnamese */
const p108Newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-p108-newsreader',
  display: 'swap',
});
const p108BeVietnam = Be_Vietnam_Pro({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-p108-be',
  display: 'swap',
});

export default function Pilot108RouteGroupLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${p108Newsreader.variable} ${p108BeVietnam.variable} min-h-screen bg-[#F8FAFC] text-[#020617] antialiased`}
    >
      {children}
    </div>
  );
}
