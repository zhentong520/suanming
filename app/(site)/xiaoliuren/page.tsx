import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function Page() {
  return (
    <Suspense>
      <GenericModulePage moduleId="xiaoliuren" title="小六壬" description="小六壬速断" fields={[{ name: "question", label: "所问事项" }]} />
    </Suspense>
  );
}
