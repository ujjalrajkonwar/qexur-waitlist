import type { Metadata } from "next";
import { Bebas_Neue, Space_Grotesk } from "next/font/google";

import { AppFooter } from "@/components/layout/AppFooter";
import { AI_FRIENDLY_FAQ } from "@/lib/seo/faq";
import {
  BRAND_ALTERNATE_NAMES,
  BRAND_SAME_AS_LINKS,
  CORE_METADATA_KEYWORDS,
  PRIMARY_SEO_PHRASES,
  SITE_URL,
} from "@/lib/seo/constants";

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

const GLOBAL_TITLE = "Qexur | Autonomous AI Security Orchestrator";
const GLOBAL_DESCRIPTION =
  "Qexur is an autonomous AI cybersecurity engine. It deploys a 3-agent squad (Recon, Sniper, Reporter) for real-time penetration testing, code audits, and stress simulations.";

const organizationJsonLd = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Qexur",
  alternateName: BRAND_ALTERNATE_NAMES,
  sameAs: BRAND_SAME_AS_LINKS,
  url: SITE_URL,
  description: GLOBAL_DESCRIPTION,
  knowsAbout: [
    "AI Cybersecurity",
    "Autonomous Pentesting",
    "Red-Teaming AI",
    "Real-time Security Simulation",
    "Autonomous Vulnerability Discovery",
    "Automated Exploit Generation",
    "AI Code Audit",
  ],
};

const softwareApplicationJsonLd = {
  "@type": "SoftwareApplication",
  "@id": `${SITE_URL}/#software`,
  name: "Qexur",
  alternateName: BRAND_ALTERNATE_NAMES,
  description: GLOBAL_DESCRIPTION,
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  featureList: [
    "AI Cybersecurity",
    "Autonomous Pentesting",
    "Red-Teaming AI",
    "Real-time Security Simulation",
    "Autonomous Vulnerability Discovery",
    "Automated Exploit Generation",
    "3-agent squad (Recon, Sniper, Reporter)",
    "AI Code Audit",
  ],
  provider: {
    "@id": `${SITE_URL}/#organization`,
  },
};

const faqPageJsonLd = {
  "@type": "FAQPage",
  "@id": `${SITE_URL}/#faq`,
  mainEntity: AI_FRIENDLY_FAQ.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

const aiSeoGraphJsonLd = {
  "@context": "https://schema.org",
  "@graph": [organizationJsonLd, softwareApplicationJsonLd, faqPageJsonLd],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: GLOBAL_TITLE,
    template: "%s",
  },
  description: GLOBAL_DESCRIPTION,
  keywords: Array.from(new Set([...CORE_METADATA_KEYWORDS, ...PRIMARY_SEO_PHRASES])),
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: GLOBAL_TITLE,
    description: GLOBAL_DESCRIPTION,
    siteName: "Qexur",
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Qexur Autonomous AI Security Orchestrator Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: GLOBAL_TITLE,
    description: GLOBAL_DESCRIPTION,
    images: [`${SITE_URL}/twitter-image`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
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
          id="qexur-ai-seo-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(aiSeoGraphJsonLd) }}
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
