import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function Page() {
  return (
    <Suspense>
      <GenericModulePage
        moduleId="meihua"
        title="梅花易数"
        description="时间数字起卦 · 体用生克 · 外应心法"
        fields={[{ name: "question", label: "所问事项" }]}
      />
    </Suspense>
  );
}
