import type { Metadata } from "next";
import { Bebas_Neue, Space_Grotesk } from "next/font/google";

import { AppFooter } from "@/components/layout/AppFooter";
import { AI_FRIENDLY_FAQ } from "@/lib/seo/faq";
import {
  BRAND_ALTERNATE_NAMES,
  CORE_METADATA_KEYWORDS,
  OFFICIAL_BRAND_DESCRIPTION,
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

const organizationJsonLd = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Qexur",
  alternateName: BRAND_ALTERNATE_NAMES,
  url: SITE_URL,
  description:
    "Qexur is an AI-driven Cybersecurity Orchestrator focused on autonomous red-teaming, live attack simulation, and AI code audit workflows.",
  knowsAbout: [
    "Autonomous Red-Teaming",
    "Live Attack Simulation",
    "AI Code Audit",
    "Real-time Web Attack Simulation",
    "Pentesting AI Squad",
  ],
};

const softwareApplicationJsonLd = {
  "@type": "SoftwareApplication",
  "@id": `${SITE_URL}/#software`,
  name: "Qexur",
  alternateName: BRAND_ALTERNATE_NAMES,
  description:
    "Qexur is an AI-driven Cybersecurity Orchestrator that runs Autonomous Red-Teaming and Live Attack Simulation for developers and agencies.",
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  featureList: [
    "Autonomous Red-Teaming",
    "Live Attack Simulation",
    "Real-time Web Attack Simulation",
    "AI Code Audit",
    "Pentesting AI Squad",
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
    default: "Qexur | Autonomous AI Security",
    template: "%s",
  },
  description:
    `Autonomous AI Security with a Pentesting AI Squad, real-time web attack simulation, and AI code audit. ${OFFICIAL_BRAND_DESCRIPTION}`,
  keywords: Array.from(new Set([...CORE_METADATA_KEYWORDS, ...PRIMARY_SEO_PHRASES])),
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Qexur | Autonomous AI Security",
    description:
      `Autonomous AI Security with a Pentesting AI Squad, real-time web attack simulation, and AI code audit. ${OFFICIAL_BRAND_DESCRIPTION}`,
    siteName: "Qexur",
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Qexur Autonomous AI Security Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Qexur | Autonomous AI Security",
    description:
      `Autonomous AI Security with a Pentesting AI Squad, real-time web attack simulation, and AI code audit. ${OFFICIAL_BRAND_DESCRIPTION}`,
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
