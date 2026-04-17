"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardHeaderAccountControl } from "@/components/dashboard/DashboardHeaderAccountControl";

type ConsoleSection = "dashboard" | "settings" | "billing";

type ConsoleShellProps = {
  active: ConsoleSection;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

// Simple, modern SVG icons for the sidebar
const NavIcons: Record<string, React.ReactNode> = {
  dashboard: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  settings: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  billing: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect width="20" height="14" x="2" y="5" rx="2"/>
      <line x1="2" x2="22" y1="10" y2="10"/>
    </svg>
  ),
};

const NAV_ITEMS: Array<{ key: ConsoleSection; label: string; href: string }> = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard" },
  { key: "settings", label: "Settings", href: "/settings" },
  { key: "billing", label: "Billing", href: "/billing" },
];

export function ConsoleShell({ active, title, subtitle, children }: ConsoleShellProps) {
  // Collapsed by default, opens on hover
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0B1221] text-slate-200 overflow-hidden">
      
      {/* Top Header - Merged styling, no hamburger */}
      <header className="h-[60px] border-b border-slate-800/80 flex items-center justify-between bg-[#121A2F] sm:bg-[#0B1221] shrink-0 w-full shadow-md z-20">
        
        <div className="flex items-center h-full">
          {/* Integrated Logo box - flows naturally */}
          <div className="flex items-center px-6 gap-3 shrink-0">
            <div className="w-8 h-8 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold font-display text-lg">
              Q
            </div>
            <span className="font-sans text-xl font-semibold tracking-wide text-white">Qexur</span>
          </div>
        </div>

        {/* Right side options: Input, Notification, Session Control */}
        <div className="flex items-center gap-4 sm:gap-5 px-4 sm:px-6">
          <Link
            href="/dashboard/how-it-works"
            className="hidden sm:flex items-center text-sm font-medium px-3 py-1.5 rounded-[4px] border border-[#00E5FF]/30 text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            How it Works
          </Link>
          
          <button className="text-slate-400 hover:text-[#00E5FF] transition-colors p-1" aria-label="Notifications">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
          </button>

          <button className="text-slate-400 hover:text-[#00E5FF] transition-colors p-1" aria-label="Help">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/>
            </svg>
          </button>

          <div className="flex items-center sm:pl-2">
            <DashboardHeaderAccountControl />
          </div>
        </div>
      </header>

      {/* Lower Area Frame */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* Hover-expandable Sidebar Layered over Content (absolute layout) */}
        <aside 
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
          className={[
            "absolute left-0 top-0 bottom-0 border-r border-slate-800 bg-[#121A2F] flex flex-col shrink-0 transition-all duration-300 ease-in-out z-50",
            expanded ? "w-[256px] shadow-2xl" : "w-[68px]"
          ].join(" ")}
        >
          <nav className="flex-1 overflow-y-auto py-6 px-3" aria-label="Sidebar Menu">
            <ul className="space-y-1.5 overflow-hidden">
              {NAV_ITEMS.map((item) => {
                const isActive = item.key === active;

                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      title={!expanded ? item.label : undefined}
                      className={[
                        "flex items-center gap-3 py-2.5 transition-colors text-[15px] whitespace-nowrap overflow-hidden h-[44px]",
                        isActive
                          ? "bg-cyan-500/10 text-[#00E5FF] font-medium rounded-lg border border-cyan-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg",
                        expanded ? "px-3" : "px-0 w-[44px] justify-center mx-auto"
                      ].join(" ")}
                    >
                      {NavIcons[item.key]}
                      <span className={[
                        "transition-opacity duration-200",
                        expanded ? "opacity-100" : "opacity-0 invisible w-0"
                      ].join(" ")}>
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main Interface Content - padded to keep clear of collapsed menubar */}
        <main className="flex-1 overflow-auto bg-[#0B1221] pl-[68px]">
          <div className="max-w-[1400px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            
            <div className="space-y-1">
              <h1 className="text-[28px] font-bold tracking-tight text-white">{title}</h1>
              {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
            </div>
            
            <div className="pt-2">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

