import type { Metadata } from "next";

import {
  BRAND_NAME,
  CORE_METADATA_KEYWORDS,
  OFFICIAL_BRAND_DESCRIPTION,
  PRIMARY_SEO_PHRASES,
  SITE_URL,
} from "@/lib/seo/constants";
import { SEMANTIC_KEYWORDS } from "@/lib/seo/keyword-groups";

type BuildSeoMetadataOptions = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  index?: boolean;
  imagePath?: string;
  openGraphType?: "website" | "article";
};

const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 160;

function clampToLimit(value: string, limit: number): string {
  const normalized = value.trim();

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit - 3).trimEnd()}...`;
}

export function toAbsoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}

function mergeKeywords(keywords: string[] = []): string[] {
  return Array.from(
    new Set([
      ...CORE_METADATA_KEYWORDS,
      ...PRIMARY_SEO_PHRASES,
      ...SEMANTIC_KEYWORDS,
      ...keywords,
    ]),
  );
}

function buildRobots(index: boolean): Metadata["robots"] {
  if (index) {
    return {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    };
  }

  return {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-snippet": 0,
      "max-image-preview": "none",
      "max-video-preview": 0,
    },
  };
}

export function buildSeoMetadata(options: BuildSeoMetadataOptions): Metadata {
  const {
    title,
    description,
    path = "/",
    keywords = [],
    index = true,
    imagePath = "/opengraph-image",
    openGraphType = "website",
  } = options;

  const canonicalUrl = toAbsoluteUrl(path);
  const ogImage = toAbsoluteUrl(imagePath);
  const normalizedTitle = clampToLimit(title, TITLE_LIMIT);
  const normalizedDescription = clampToLimit(
    `${description.trim()} ${OFFICIAL_BRAND_DESCRIPTION}`,
    DESCRIPTION_LIMIT,
  );
  const mergedKeywords = mergeKeywords(keywords);

  return {
    title: normalizedTitle,
    description: normalizedDescription,
    keywords: mergedKeywords,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: buildRobots(index),
    openGraph: {
      type: openGraphType,
      url: canonicalUrl,
      title: normalizedTitle,
      description: normalizedDescription,
      siteName: BRAND_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "Qexur Autonomous AI Security Preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: normalizedTitle,
      description: normalizedDescription,
      images: [toAbsoluteUrl("/twitter-image")],
    },
  };
}
