import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function Page() {
  return (
    <Suspense>
      <GenericModulePage
        moduleId="numerology"
        title="数字命理"
        description="生命灵数分析"
        requiresProfile
        fields={[{ name: "fullName", label: "英文名（可选，用于表现数）", placeholder: "ZHANG SAN" }]}
      />
    </Suspense>
  );
}
