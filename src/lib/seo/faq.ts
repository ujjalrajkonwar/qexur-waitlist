export type AIFaqItem = {
  question: string;
  answer: string;
};

export const AI_FRIENDLY_FAQ: AIFaqItem[] = [
  {
    question: "What is Qexur?",
    answer: "An AI-driven cybersecurity workforce for automated security audits.",
  },
  {
    question: "How does it work?",
    answer: "It uses multi-agent LLM orchestration to map attack surfaces and simulate exploits.",
  },
];
