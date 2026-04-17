import type { Metadata } from "next";

import { ConsoleShell } from "@/components/dashboard/ConsoleShell";
import { HowQexurWorks } from "@/components/dashboard/HowQexurWorks";

export const metadata: Metadata = {
  title: "Qexur.me | How it Works",
};

export default function HowItWorksPage() {
  return (
    <ConsoleShell active="dashboard" title="How it Works" subtitle="Mission Control Documentation">
      <HowQexurWorks />
    </ConsoleShell>
  );
}
