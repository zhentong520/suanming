import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

export default function Page() {
  return (
    <Suspense>
      <GenericModulePage moduleId="bazi-dayun" title="大运流年" description="十年大运与流年" requiresProfile />
    </Suspense>
  );
}
