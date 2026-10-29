import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function Page() {
  return (
    <Suspense>
      <GenericModulePage moduleId="daliuren" title="大六壬" description="大六壬四课三传" fields={[{ name: "question", label: "所问事项" }]} />
    </Suspense>
  );
}
