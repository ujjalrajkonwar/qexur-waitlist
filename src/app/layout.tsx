import type { Metadata } from "next";
import { Bebas_Neue, Space_Grotesk } from "next/font/google";

import { AppFooter } from "@/components/layout/AppFooter";

import "./globals.css";

const display = Bebas_Neue({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
});

const sans = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const SECURITY_KEYWORDS = [
  "AI Code Auditor",
  "Vibe Security",
  "SaaS Pentesting",
  "Agentic Logic Scan",
  "AI security platform",
  "agentic security",
  "automated code audit",
  "code vulnerability scanner",
  "secure code analysis",
  "static application security testing",
  "SAST automation",
  "runtime risk detection",
  "real-time threat filtering",
  "LLM security auditing",
  "AI-powered pentesting",
  "SaaS security scanner",
  "API security testing",
  "web application pentest",
  "codebase risk scoring",
  "secure SDLC",
  "DevSecOps automation",
  "supply chain security scan",
  "dependency vulnerability detection",
  "zero-day exposure analysis",
  "threat modeling AI",
  "logic flaw detection",
  "business logic security",
  "prompt injection defense",
  "auth flow security review",
  "session security analysis",
  "input validation audit",
  "injection vulnerability detection",
  "XSS detection",
  "SQL injection detection",
  "SSRF detection",
  "RCE detection",
  "IDOR detection",
  "privilege escalation analysis",
  "security report generation",
  "manual patch guidance",
  "agentic code reasoning",
  "self-correcting AI audit",
  "hallucination-resistant security AI",
  "continuous security monitoring",
  "beta security testing",
  "cloud security posture",
  "multi-tenant SaaS security",
  "API abuse detection",
  "code quality and security",
  "cyber resilience tooling",
  "offensive security simulation",
  "defensive security intelligence",
  "vulnerability prioritization",
  "risk-based remediation",
  "secure release validation",
  "real-time decision engine",
  "predictive security AI",
  "automated remediation guidance",
  "software application security",
  "enterprise security automation",
];

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Qexur",
  description: "AI that predicts, filters, and executes decisions in real-time.",
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web",
  url: "https://qexur.me",
};

export const metadata: Metadata = {
  title: "Qexur | AI Security",
  description:
    "Brutalist security workflows powered by next-gen reasoning models for Web Auditor, App Auditor, and Destroyer.",
  keywords: SECURITY_KEYWORDS,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="min-h-full bg-[var(--qx-bg)] text-[var(--qx-text)]">
        <script
          id="qexur-software-application-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
        />
        <div className="relative min-h-screen overflow-x-hidden pb-20">
          <div className="qx-grid-bg pointer-events-none absolute inset-0 -z-20" />
          <div className="qx-radial pointer-events-none absolute inset-0 -z-10" />

          <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>

          <AppFooter />
        </div>
      </body>
    </html>
  );
}
