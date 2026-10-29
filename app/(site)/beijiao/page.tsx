import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function Page() {
  return (
    <Suspense>
      <GenericModulePage moduleId="beijiao" title="杯筊" description="掷杯问事" fields={[{ name: "question", label: "所问事项" }]} />
    </Suspense>
  );
}
