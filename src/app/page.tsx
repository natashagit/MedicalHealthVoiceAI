'use client';

import { Calendar, Mic, ShieldCheck, ArrowRight, Stethoscope, Heart, Brain } from 'lucide-react';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';

const features = [
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'AI matches you with the right specialist and finds available times that work for your schedule.',
    gradient: 'from-blue-500/20 to-cyan-500/10',
    iconColor: '#60a5fa',
  },
  {
    icon: Mic,
    title: 'Voice AI',
    description: 'Switch from chat to a phone call anytime. Our AI continues the conversation seamlessly with full context.',
    gradient: 'from-teal-500/20 to-emerald-500/10',
    iconColor: '#14b8a6',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Private',
    description: 'HIPAA-compliant infrastructure ensures your health information stays protected at every step.',
    gradient: 'from-indigo-500/20 to-purple-500/10',
    iconColor: '#818cf8',
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-[calc(100vh-88px)] flex flex-col">
      {/* Floating decorative elements */}
      <div className="absolute top-20 right-[15%] w-16 h-16 opacity-[0.04] animate-float-slow">
        <Stethoscope className="w-full h-full text-blue-400" />
      </div>
      <div className="absolute top-[40%] left-[8%] w-12 h-12 opacity-[0.04] animate-float-slow-reverse">
        <Heart className="w-full h-full text-teal-400" />
      </div>
      <div className="absolute bottom-[25%] right-[10%] w-14 h-14 opacity-[0.04] animate-float-slow">
        <Brain className="w-full h-full text-indigo-400" />
      </div>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto">
        {/* Badge */}
        <div className="fade-up" style={{ animationDelay: '0s' }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.15)' }}
          >
            <div className="w-2 h-2 rounded-full bg-[#14b8a6] online-dot" />
            <span className="text-xs font-medium tracking-wide text-[#94a3b8]">
              AI ASSISTANT ONLINE
            </span>
          </div>
        </div>

        {/* Heading */}
        <h1
          className="fade-up text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          style={{ animationDelay: '0.15s' }}
        >
          <span className="text-white">Your </span>
          <span className="bg-gradient-to-r from-[#3b82f6] via-[#60a5fa] to-[#14b8a6] bg-clip-text text-transparent">
            AI-Powered
          </span>
          <br />
          <span className="text-white">Healthcare Assistant</span>
        </h1>

        {/* Subtitle */}
        <p
          className="fade-up text-lg sm:text-xl text-[#94a3b8] max-w-2xl mb-10 leading-relaxed font-light"
          style={{ animationDelay: '0.3s' }}
        >
          Schedule appointments, check prescriptions, and get office information —
          all through an intelligent conversation. Switch to voice anytime.
        </p>

        {/* CTA */}
        <div className="fade-up" style={{ animationDelay: '0.45s' }}>
          <Link href="/chat">
            <button className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-semibold text-white aurora-btn transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] active:scale-[0.97]">
              Start a Conversation
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </Link>
        </div>

        {/* Trust badges */}
        <div
          className="fade-up flex items-center gap-6 mt-8 text-xs text-[#64748b]"
          style={{ animationDelay: '0.6s' }}
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> HIPAA Compliant
          </span>
          <span className="w-1 h-1 rounded-full bg-[#334155]" />
          <span>24/7 Available</span>
          <span className="w-1 h-1 rounded-full bg-[#334155]" />
          <span>No Wait Times</span>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 pb-20 pt-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="fade-up"
              style={{ animationDelay: `${0.75 + i * 0.15}s` }}
            >
              <GlassCard
                iridescent
                className="p-7 h-full hover:-translate-y-1 transition-transform duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5`}
                  style={{ border: '1px solid rgba(255, 255, 255, 0.06)' }}
                >
                  <feature.icon
                    className="w-6 h-6"
                    style={{ color: feature.iconColor }}
                    strokeWidth={1.5}
                  />
                </div>

                <h3 className="text-lg font-semibold text-white mb-2.5 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#94a3b8] leading-relaxed font-light">
                  {feature.description}
                </p>
              </GlassCard>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
