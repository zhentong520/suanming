import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function Page() {
  return (
    <Suspense>
      <GenericModulePage moduleId="qimen" title="奇门遁甲" description="奇门八门九星排盘" fields={[{ name: "question", label: "所问事项" }]} />
    </Suspense>
  );
}
