"use client";

import React, { useState } from "react";

export default function OverlordClient() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate a network delay for the refresh
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-8 font-sans selection:bg-cyan-500/30">
      <div className="max-w-screen-2xl mx-auto space-y-8">
        
        {/* HEADER & CONTROLS */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span className="w-2 h-8 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.5)]"></span>
              Qexur Mission Control
              <span className="text-xs align-top px-2 py-0.5 mt-1 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 font-mono tracking-widest uppercase">
                Super Admin
              </span>
            </h1>
            <p className="text-slate-400 mt-1 pl-5">God Mode overview of system mechanics and financial diagnostics.</p>
          </div>

          <div className="flex items-center gap-4">
            <label htmlFor="timeframe" className="sr-only">Timeframe</label>
            <select 
              id="timeframe" 
              className="bg-slate-900 border border-slate-800 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-40 p-2.5 outline-none hover:border-slate-700 transition-colors cursor-pointer"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm font-medium transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
                isRefreshing ? "opacity-70 cursor-not-allowed" : "hover:border-cyan-500/50 text-cyan-400"
              }`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                className={isRefreshing ? "animate-spin text-slate-400" : ""}
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              {isRefreshing ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>
        </header>

        {/* KPI ROW */}
        <section className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 transition-opacity duration-500 ${isRefreshing ? "opacity-40" : "opacity-100"}`}>
          {/* KPI 1: MRR (Green Accent) */}
          <div className="bg-slate-900/40 backdrop-blur-sm border border-emerald-500/20 p-6 rounded-2xl hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all duration-300 group">
            <div className="flex justify-between items-start">
              <p className="text-slate-400 text-sm font-medium">Total MRR</p>
              <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mt-4">{isRefreshing ? "---" : "$14,250"}</h2>
            <p className="text-emerald-400 text-xs font-semibold mt-2 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              +12.5% active subs
            </p>
          </div>

          {/* KPI 2: Active Users (Cyan Accent) */}
          <div className="bg-slate-900/40 backdrop-blur-sm border border-cyan-500/20 p-6 rounded-2xl hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all duration-300 group">
            <div className="flex justify-between items-start">
              <p className="text-slate-400 text-sm font-medium">Active Users</p>
              <div className="p-2 bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mt-4">{isRefreshing ? "---" : "1,240"}</h2>
            <p className="text-cyan-400 text-xs font-semibold mt-2 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              +8.1% from last month
            </p>
          </div>

          {/* KPI 3: Churn Rate (Red Accent) */}
          <div className="bg-slate-900/40 backdrop-blur-sm border border-rose-500/20 p-6 rounded-2xl hover:border-rose-500/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.1)] transition-all duration-300 group">
            <div className="flex justify-between items-start">
              <p className="text-slate-400 text-sm font-medium">Churn Rate</p>
              <div className="p-2 bg-rose-500/10 rounded-lg group-hover:bg-rose-500/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mt-4">{isRefreshing ? "---" : "2.1%"}</h2>
            <p className="text-rose-400 text-xs font-semibold mt-2 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
              Caution: +0.4% MoM
            </p>
          </div>

          {/* KPI 4: API Token Spend (Purple Accent) */}
          <div className="bg-slate-900/40 backdrop-blur-sm border border-purple-500/20 p-6 rounded-2xl hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] transition-all duration-300 group">
            <div className="flex justify-between items-start">
              <p className="text-slate-400 text-sm font-medium">API Token Spend</p>
              <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mt-4">{isRefreshing ? "---" : "$420"}</h2>
            <p className="text-slate-400 text-xs font-semibold mt-2 flex items-center gap-1">
              Claude & MiniMax aggregate
            </p>
          </div>
        </section>

        {/* DATA VISUALIZATION GRID */}
        <section className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-opacity duration-500 ${isRefreshing ? "opacity-40" : "opacity-100"}`}>
          
          {/* Card 1: Line Chart Placeholder (User Activity) */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl flex flex-col hover:border-slate-700/80 transition-colors">
            <h3 className="text-lg font-semibold text-white mb-6">24h System Activity</h3>
            <div className="flex-1 min-h-[200px] border-b border-l border-slate-800/80 relative flex items-end">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-t from-cyan-500/10 to-transparent"></div>
              <svg className="w-full h-full absolute inset-0 text-cyan-500" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M0,100 L0,80 L20,60 L40,90 L60,40 L80,50 L100,20 L100,100 Z" fill="currentColor" fillOpacity="0.2"/>
                <path d="M0,80 L20,60 L40,90 L60,40 L80,50 L100,20" fill="none" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
          </div>

          {/* Card 2: Bar Chart Placeholder (API Spend: MiniMax vs Claude) */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl flex flex-col hover:border-slate-700/80 transition-colors">
            <h3 className="text-lg font-semibold text-white mb-6">Cost Center: MiniMax vs Claude Opus</h3>
            <div className="flex-1 min-h-[200px] flex items-end gap-4 sm:gap-8 justify-center border-b border-slate-800/80 pb-0">
               <div className="w-10 h-[60%] bg-purple-500/80 rounded-t-md relative group"><div className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">$210</div></div>
               <div className="w-10 h-[40%] bg-cyan-500/80 rounded-t-md relative group"><div className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">$140</div></div>
               <div className="w-10 h-[80%] bg-purple-500/80 rounded-t-md relative group"><div className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">$280</div></div>
               <div className="w-10 h-[30%] bg-cyan-500/80 rounded-t-md relative group"><div className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">$105</div></div>
            </div>
            <div className="flex justify-center gap-6 mt-4 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-2"><div className="w-3 h-3 bg-cyan-500 rounded-sm"></div> MiniMax</span>
              <span className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500 rounded-sm"></div> Claude Opus</span>
            </div>
          </div>

          {/* Card 3: Donut Chart Placeholder (Plan Mix) */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl flex flex-col hover:border-slate-700/80 transition-colors">
            <h3 className="text-lg font-semibold text-white mb-6">Plan Mix</h3>
            <div className="flex-1 min-h-[200px] flex items-center justify-center relative">
               <div className="w-44 h-44 rounded-full relative" style={{ background: "conic-gradient(#64748b 0% 20%, #06b6d4 20% 70%, #a855f7 70% 100%)" }}>
                 <div className="absolute inset-4 bg-slate-900/90 rounded-full"></div>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <span className="text-2xl font-bold text-white">100%</span>
                   <span className="text-xs text-slate-400">Allocated</span>
                 </div>
               </div>
            </div>
            <div className="flex justify-center gap-6 mt-4 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-500 rounded-sm shadow-[0_0_10px_rgba(100,116,139,0.5)]"></div> Free (20%)</span>
              <span className="flex items-center gap-2"><div className="w-3 h-3 bg-cyan-500 rounded-sm shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div> Core (50%)</span>
              <span className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500 rounded-sm shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div> Elite (30%)</span>
            </div>
          </div>

          {/* Card 4: Clean Table (Live Feed) */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-0 rounded-2xl flex flex-col hover:border-slate-700/80 transition-colors overflow-hidden">
            <div className="p-6 border-b border-slate-800/80">
              <h3 className="text-lg font-semibold text-white">Live Event Feed</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 bg-slate-950/50 border-b border-slate-800/80 uppercase">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-medium">User / Device</th>
                    <th scope="col" className="px-6 py-4 font-medium">Tier</th>
                    <th scope="col" className="px-6 py-4 font-medium">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  <tr className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">u***@gmail.com</div>
                      <div className="text-xs text-slate-500 mt-1">macOS • Chrome</div>
                    </td>
                    <td className="px-6 py-4"><span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs border border-purple-500/20">Elite</span></td>
                    <td className="px-6 py-4 text-slate-400 text-xs">Just now</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">a***@startup.io</div>
                      <div className="text-xs text-slate-500 mt-1">Windows 11 • Edge</div>
                    </td>
                    <td className="px-6 py-4"><span className="bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded text-xs border border-cyan-500/20">Core</span></td>
                    <td className="px-6 py-4 text-slate-400 text-xs">5 mins ago</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">m***@acmecorp.net</div>
                      <div className="text-xs text-slate-500 mt-1">iOS • Safari</div>
                    </td>
                    <td className="px-6 py-4"><span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs border border-slate-700">Free</span></td>
                    <td className="px-6 py-4 text-slate-400 text-xs">12 mins ago</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">d***@enterprise.org</div>
                      <div className="text-xs text-slate-500 mt-1">Linux • Firefox</div>
                    </td>
                    <td className="px-6 py-4"><span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs border border-purple-500/20">Elite</span></td>
                    <td className="px-6 py-4 text-slate-400 text-xs">1 hour ago</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </section>
      </div>
    </div>
  );
}