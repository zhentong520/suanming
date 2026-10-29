import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function Page() {
  return (
    <Suspense>
      <GenericModulePage moduleId="liuyao" title="六爻占卜" description="铜钱起卦" fields={[{ name: "question", label: "所问事项" }]} />
    </Suspense>
  );
}
