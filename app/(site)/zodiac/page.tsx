import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function ZodiacPage() {
  return (
    <Suspense>
      <GenericModulePage moduleId="zodiac" title="生肖运势" description="十二生肖本年运势" requiresProfile />
    </Suspense>
  );
}
