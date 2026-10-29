import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function Page() {
  return (
    <Suspense>
      <GenericModulePage moduleId="yijing" title="周易占卜" description="易经起卦" fields={[{ name: "question", label: "所问事项" }]} />
    </Suspense>
  );
}
