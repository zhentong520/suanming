import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function Page() {
  return (
    <Suspense>
      <GenericModulePage moduleId="taiyi" title="太乙神数" description="太乙神数推演" fields={[{ name: "question", label: "所问事项" }]} />
    </Suspense>
  );
}
