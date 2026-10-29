import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function Page() {
  return (
    <Suspense>
      <GenericModulePage
        moduleId="bazi-resolve"
        title="四柱反查"
        description="由四柱反推出生时间"
        fields={[{ name: "pillars", label: "四柱", required: true, placeholder: "甲子-乙丑-丙寅-丁卯" }]}
      />
    </Suspense>
  );
}
