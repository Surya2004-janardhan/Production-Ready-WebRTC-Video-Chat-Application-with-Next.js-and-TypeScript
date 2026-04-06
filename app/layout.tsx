import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'WebRTC Video Chat',
  description: 'Production-ready multi-peer video chat built with Next.js, TypeScript, and WebRTC',
  keywords: ['webrtc', 'video chat', 'next.js', 'real-time'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
