import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function BaziPage() {
  return (
    <Suspense>
      <GenericModulePage
        moduleId="bazi"
        title="八字排盘"
        description="四柱八字、五行十神，含事业财运感情健康详析"
        requiresProfile
      />
    </Suspense>
  );
}
