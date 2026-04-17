export type TermsSection = {
  id: string;
  title: string;
  body: string;
};

export const TERMS_SECTIONS: TermsSection[] = [
  {
    id: "acceptance-of-terms",
    title: "1. Acceptance of Terms",
    body: "By accessing Qexur, you agree to be bound by these Terms. If you do not agree, stop using the service immediately.",
  },
  {
    id: "legal-usage",
    title: "2. Legal Usage & Authorization (CRITICAL)",
    body: "You must only use Qexur on systems, domains, and applications that you OWN or have EXPLICIT WRITTEN PERMISSION to test.\n\nUnauthorized use of \"Live Attack\" or \"Auditor\" features on third-party assets is strictly prohibited and constitutes a violation of international cyber laws.\n\nDNS Verification: Qexur requires DNS TXT verification for \"Live Attack.\" Circumventing this is a breach of contract.",
  },
  {
    id: "as-is-service",
    title: "3. \"As-Is\" Service & No Warranty",
    body: "Qexur is provided \"AS IS\" and \"AS AVAILABLE.\" We do not guarantee that the service will be uninterrupted, bug-free, or 100% accurate.\n\nOur security reports are \"Proof of Concept\" only. We are NOT responsible for any undetected vulnerabilities.",
  },
  {
    id: "limitation-of-liability",
    title: "4. Limitation of Liability (The Shield)",
    body: "In NO event shall Qexur, its founder, or its team be liable for any damages (including, but not limited to, loss of data, loss of profit, business interruption, or system crashes) arising out of the use or inability to use our tools.\n\nUser assumes 100% responsibility for any consequences resulting from an \"Audit\" or \"Live Attack\" simulation.",
  },
  {
    id: "beta-status",
    title: "5. Beta Status",
    body: "You acknowledge that Qexur is currently in Beta. Features like \"Auto-Fix\" are experimental and may cause code regressions. Use them at your own risk in production environments.",
  },
  {
    id: "termination",
    title: "6. Termination",
    body: "We reserve the right to ban any user found using Qexur for malicious activities, \"DDoS\" beyond authorized stress testing, or illegal hacking.",
  },
  {
    id: "governing-law",
    title: "7. Governing Law",
    body: "These terms are governed by the laws of India. Any legal disputes shall be subject to the exclusive jurisdiction of the courts in Assam, India.",
  },
];
