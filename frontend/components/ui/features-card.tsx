'use client';

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Zap,
  TrendingUp,
  Users,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Globe,
  GitBranch,
  Terminal,
  MousePointerClick,
  Lightbulb,
  Cpu,
  Layers,
  Lock,
  Rocket,
  BarChart3,
} from "lucide-react";

export const Component = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const features = [
    {
      id: 0,
      title: "Vernacular Voice AI",
      desc: "Sub-second speech comprehension across 6+ Indian languages",
      icon: Zap,
      stat: "0.2s latency",
    },
    {
      id: 1,
      title: "Deterministic SQL",
      desc: "Instant read-only query generation with zero hallucination",
      icon: Cpu,
      stat: "100% accurate",
    },
    {
      id: 2,
      title: "Cloud & SQLite Sync",
      desc: "Supabase cloud ledger with offline-first local SQLite resilience",
      icon: Globe,
      stat: "Dual sync",
    },
    {
      id: 3,
      title: "Human Verification",
      desc: "Step 2 review card verifies numbers before committing to ledger",
      icon: ShieldCheck,
      stat: "Zero errors",
    },
  ];

  const metrics = [
    { label: "Voice Recognition Accuracy", value: "99.4%", unit: "%", trend: "+14%" },
    { label: "Average Query Latency", value: "240", unit: "ms", trend: "-38%" },
    { label: "Vernacular Word Conversion", value: "100%", unit: "%", trend: "+25%" },
    { label: "Supabase Ledger Sync", value: "99.99%", unit: "%", trend: "+0.01%" },
  ];

  const integrations = [
    { name: "Tamil (தமிழ்)", abbr: "🇮🇳" },
    { name: "Hindi (हिंदी)", abbr: "🇮🇳" },
    { name: "Telugu (తెలుగు)", abbr: "🇮🇳" },
    { name: "Kannada (ಕನ್ನಡ)", abbr: "🇮🇳" },
    { name: "Gujarati (ગુજરાતી)", abbr: "🇮🇳" },
    { name: "English (India)", abbr: "🇮🇳" },
  ];

  const codeExample = `// Voice Command in Tamil:
"முருகன் ஸ்டோர்ஸ் ஐந்து ஆயிரம் ரூபாய் ஆர்டர்"

// Converted & Verified Output:
{
  "client": "முருகன் ஸ்டோர்ஸ் (Murugan Stores)",
  "amount": 5000.0,
  "action": "order",
  "storage": "Supabase Cloud"
}
// ✓ Committed to Ledger in 0.3s`;

  const stats = [
    { label: "Supported Indian Languages", value: "6+", icon: Globe },
    { label: "Real-time Verification", value: "100%", icon: ShieldCheck },
    { label: "Ledger Uptime", value: "99.99%", icon: Sparkles },
    { label: "Response Speed", value: "0.2s", icon: Zap },
  ];

  const activeFeature = features[activeTab];

  return (
    <section className="w-full bg-slate-950 py-20 px-4 md:px-8 text-white font-sans antialiased overflow-hidden rounded-3xl border border-slate-800 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col gap-14">
        
        {/* Hero Header */}
        <div className="flex flex-col gap-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-800/60 w-fit text-blue-300">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold tracking-wider">
              Bharat's Modern Business Intelligence & Field CRM
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            Run Daily Shops & Enterprise Retail at Voice Speed
          </h2>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl leading-relaxed">
            Speak orders, expenses, and queries naturally in your mother tongue. Instant deterministic calculations, verified numbers, and printable PDF statements.
          </p>
        </div>

        {/* Main Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-auto md:auto-rows-[280px]">
          
          {/* Large Hero Card - Interactive Features */}
          <div className="md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:border-blue-600/50 shadow-lg">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-lg bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs font-semibold">
                <Lightbulb className="w-3.5 h-3.5 text-blue-400" />
                Intelligent Architecture
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 text-white">Core Capabilities</h3>
              <p className="text-xs text-slate-400">
                Click any card to inspect how IndicBI processes vernacular speech
              </p>
            </div>

            {/* Feature Selector Grid */}
            <div className="grid grid-cols-2 gap-3 relative z-10">
              {features.map((feature) => {
                const Icon = feature.icon;
                const isActive = activeTab === feature.id;
                return (
                  <button
                    key={feature.id}
                    onClick={() => setActiveTab(feature.id)}
                    className={cn(
                      "group/card relative overflow-hidden rounded-2xl p-3.5 border transition-all duration-300 flex flex-col text-left",
                      isActive
                        ? "bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/10"
                        : "bg-slate-800/60 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 mb-2 transition-colors",
                        isActive ? "text-blue-400" : "text-slate-400"
                      )}
                    />
                    <span className="text-xs font-bold text-white">{feature.title}</span>
                    <span className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {feature.stat}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Content Area */}
            <div className="relative z-10 mt-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-blue-400 mb-0.5">Active Feature Details:</p>
                <p className="text-base font-bold text-white">{activeFeature.title}</p>
                <p className="text-xs text-slate-300 mt-1">{activeFeature.desc}</p>
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-2">
                {activeFeature.stat}
              </div>
            </div>
          </div>

          {/* Metrics Card */}
          <div className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 p-5 flex flex-col justify-between transition-all duration-300 hover:border-slate-700 shadow-lg">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-900/40 border border-blue-800/60 rounded-xl">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold uppercase">
                  Verified
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mb-0.5">Performance SLAs</h3>
              <p className="text-[11px] text-slate-400 mb-3">Real-time ledger speeds</p>

              <div className="space-y-1.5">
                {metrics.map((metric, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedMetric(idx)}
                    className={cn(
                      "w-full text-left p-2 rounded-xl transition-all duration-200 border",
                      selectedMetric === idx
                        ? "bg-slate-800 border-blue-500/80 text-white"
                        : "bg-slate-950/50 border-slate-800/80 hover:border-slate-700 text-slate-300"
                    )}
                  >
                    <p className="text-[10px] text-slate-400">{metric.label}</p>
                    <div className="flex items-baseline justify-between mt-0.5">
                      <span className="text-xs font-bold text-white">{metric.value}</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        {metric.trend}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Integrations Card */}
          <div className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 p-5 flex flex-col justify-between transition-all duration-300 hover:border-slate-700 shadow-lg">
            <div className="relative z-10">
              <div className="p-2 bg-indigo-900/40 border border-indigo-800/60 rounded-xl w-fit mb-3">
                <Globe className="w-4 h-4 text-indigo-400" />
              </div>
              <h3 className="text-sm font-bold text-white mb-0.5">Indic Languages</h3>
              <p className="text-[11px] text-slate-400 mb-3">Multi-script speech recognition</p>

              <div className="grid grid-cols-2 gap-1.5">
                {integrations.map((int, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-blue-500/50 transition-all flex items-center gap-1.5"
                  >
                    <span className="text-xs">{int.abbr}</span>
                    <p className="text-[10px] text-slate-300 font-medium truncate">{int.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Terminal / Live Flow Demo Card */}
          <div className="md:col-span-2 group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 p-6 flex flex-col justify-between transition-all duration-300 hover:border-slate-700 shadow-lg">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-emerald-900/40 border border-emerald-800/60 rounded-xl">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Live Vernacular Entity Extraction</h3>
                  <span className="text-[10px] text-slate-400">Deterministic calculation from word numerals</span>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] leading-relaxed overflow-auto max-h-36">
                {codeExample.split("\n").map((line, idx) => (
                  <div key={idx} className="flex gap-2.5">
                    <span className="text-slate-600 select-none w-4 text-right text-[10px]">{idx + 1}</span>
                    <span
                      className={cn(
                        line.includes("//")
                          ? "text-emerald-400 font-semibold"
                          : line.includes("✓")
                          ? "text-blue-400 font-bold"
                          : line.includes("client") || line.includes("amount")
                          ? "text-amber-300"
                          : "text-slate-300"
                      )}
                    >
                      {line}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-all duration-300 hover:border-slate-700"
              >
                <Icon className="w-4 h-4 text-blue-400 mb-2.5 relative z-10" />
                <p className="text-[11px] text-slate-400 relative z-10 font-medium">{stat.label}</p>
                <p className="text-xl font-bold text-white mt-0.5 relative z-10">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Component;
