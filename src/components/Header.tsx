'use client';

import { Activity, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const isChat = pathname === '/chat';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 fade-down">
      <div
        className="mx-3 mt-3 rounded-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(189, 203, 246, 0.4)',
          boxShadow: '0 4px 24px rgba(30, 78, 216, 0.04)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1E4ED8] to-[#3B6FF0] flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#1E4ED8] to-[#3B6FF0] opacity-0 blur-lg group-hover:opacity-30 transition-opacity duration-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold tracking-tight text-[#111827] leading-tight">
                Kyron Medical
              </span>
              <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#939393] leading-tight">
                Voice AI
              </span>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-2">
            {!isChat && (
              <Link href="/chat">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white aurora-btn transition-shadow hover:shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98]">
                  <MessageSquare className="w-4 h-4" />
                  Start Chat
                </button>
              </Link>
            )}
            {isChat && (
              <Link
                href="/"
                className="text-sm text-[#939393] hover:text-[#111827] transition-colors px-4 py-2"
              >
                Back to Home
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
