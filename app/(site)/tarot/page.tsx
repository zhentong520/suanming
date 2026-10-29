import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function Page() {
  return (
    <Suspense>
      <GenericModulePage moduleId="tarot" title="塔罗占卜" description="塔罗牌阵" fields={[{ name: "question", label: "所问事项" }]} />
    </Suspense>
  );
}
