import type { MetadataRoute } from "next";

import { PUBLIC_INDEXABLE_PATHS, SITE_URL } from "@/lib/seo/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PUBLIC_INDEXABLE_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "monthly",
    priority: path === "/" ? 1 : 0.5,
  }));
}
