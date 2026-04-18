import type { MetadataRoute } from "next";

import {
  AI_CRAWLER_USER_AGENTS,
  PRIVATE_APP_PATHS,
  PUBLIC_INDEXABLE_PATHS,
  SITE_URL,
} from "@/lib/seo/constants";

export default function robots(): MetadataRoute.Robots {
  const sharedRule = {
    allow: [...PUBLIC_INDEXABLE_PATHS],
    disallow: [...PRIVATE_APP_PATHS],
  };

  return {
    rules: [
      {
        userAgent: "*",
        ...sharedRule,
      },
      ...AI_CRAWLER_USER_AGENTS.map((userAgent) => ({
        userAgent,
        ...sharedRule,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
