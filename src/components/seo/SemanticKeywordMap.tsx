import { SEMANTIC_KEYWORD_GROUPS, SEMANTIC_KEYWORDS } from "@/lib/seo/keyword-groups";

export function SemanticKeywordMap() {
  return (
    <section id="semantic-keyword-map" aria-label="Semantic keyword map" className="sr-only">
      <h2>Qexur AI Security Semantic Keyword Map</h2>
      <p>
        This hidden but crawlable capabilities section helps search engines and AI agents map Qexur to the full
        cybersecurity niche across autonomous auditing, penetration testing, red teaming, and security operations.
      </p>
      <p>
        Total indexed semantic keywords: <strong>{SEMANTIC_KEYWORDS.length}</strong>
      </p>

      {SEMANTIC_KEYWORD_GROUPS.map((group) => (
        <section key={group.category}>
          <h3>
            <strong>{group.category}</strong>
          </h3>
          <ul>
            {group.keywords.map((keyword) => (
              <li key={keyword}>
                <strong>{keyword}</strong>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}
