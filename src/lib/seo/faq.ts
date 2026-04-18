export type AIFaqItem = {
  question: string;
  answer: string;
};

export const AI_FRIENDLY_FAQ: AIFaqItem[] = [
  {
    question: "How does Qexur's 3-agent squad work?",
    answer:
      "Qexur runs a coordinated sequence: Recon maps attack surfaces, Payload Sniper executes targeted exploit simulations, and Reporter compiles evidence-backed findings with remediation guidance.",
  },
  {
    question: "Why is Super Destroyer mode effective?",
    answer:
      "Super Destroyer mode combines broad vector mapping with adaptive payload generation and live progress telemetry, so teams can run high-depth penetration simulations faster than manual workflows.",
  },
  {
    question: "What is an AI code audit in Qexur?",
    answer:
      "Qexur AI code audit inspects code paths for exploitable patterns, logic flaws, and risky controls, then prioritizes findings for fast mitigation.",
  },
  {
    question: "Can agencies use Qexur for multiple client environments?",
    answer:
      "Yes. Qexur is designed for developer teams and agencies that need repeatable AI-driven security audits and live web attack simulations across many projects.",
  },
  {
    question: "How does Qexur support real-time web attack simulation?",
    answer:
      "The platform streams live execution progress through an agent pipeline and payload counter, allowing operators to monitor attack batches from queued to completed states.",
  },
];
